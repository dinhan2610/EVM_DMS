# 🚀 ADJUSTMENT INVOICE - FINAL IMPLEMENTATION GUIDE

**Document**: Implementation Guide (Updated based on actual backend status)  
**Date**: 19/01/2026  
**Status**: ✅ Ready to Implement  
**Complexity**: MEDIUM (Status đã có sẵn, chỉ cần logic auto-update)

---

## 📊 PHÂN TÍCH STATUS THỰC TẾ TỪ BACKEND

### ✅ ĐIỂM TỐT: Backend & Frontend ĐÃ CÓ Status ADJUSTED

```json
{
  "invoiceStatusID": 4,
  "statusName": "Adjusted"  // ✅ ĐÃ TỒN TẠI!
}
```

**Frontend constants:**
```typescript
ADJUSTED: 4,  // ✅ Đã có trong src/constants/invoiceStatus.ts
ADJUSTMENT_IN_PROCESS: 10,  // ✅ Đã có
```

### ❌ VẤN ĐỀ HIỆN TẠI

| Issue | Description | Solution |
|-------|-------------|----------|
| **No Auto-Update** | Backend không tự động chuyển status 10→4 | Add State Machine |
| **No HasBeenAdjusted Field** | Database thiếu field track adjusted | Add column + index |
| **O(n) Computed Logic** | Frontend tính adjustedInvoicesMap mỗi render | Use field from API |

---

## 🔧 BACKEND IMPLEMENTATION (Simplified)

### ✅ TASK 1: Database Migration - Add HasBeenAdjusted

**File**: Create new migration

```csharp
using Microsoft.EntityFrameworkCore.Migrations;

public partial class AddHasBeenAdjustedColumn : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // 1. Add column
        migrationBuilder.AddColumn<bool>(
            name: "HasBeenAdjusted",
            table: "Invoices",
            type: "bit",
            nullable: false,
            defaultValue: false
        );

        // 2. Fix existing data
        migrationBuilder.Sql(@"
            UPDATE original
            SET original.HasBeenAdjusted = 1
            FROM Invoices original
            WHERE EXISTS (
                SELECT 1 FROM Invoices adjustment
                WHERE adjustment.InvoiceType = 2  -- ADJUSTMENT
                  AND adjustment.OriginalInvoiceID = original.Id
                  AND adjustment.Status = 2  -- ISSUED
            );
        ");

        // 3. Update existing invoices từ status 10 → 4
        migrationBuilder.Sql(@"
            UPDATE original
            SET original.Status = 4  -- ADJUSTED (đã có sẵn trong enum)
            FROM Invoices original
            WHERE EXISTS (
                SELECT 1 FROM Invoices adjustment
                WHERE adjustment.InvoiceType = 2
                  AND adjustment.OriginalInvoiceID = original.Id
                  AND adjustment.Status = 2
            )
            AND original.Status = 10;  -- ADJUSTMENT_IN_PROCESS
        ");

        // 4. Create index
        migrationBuilder.CreateIndex(
            name: "idx_invoices_has_been_adjusted",
            table: "Invoices",
            columns: new[] { "HasBeenAdjusted", "InvoiceType" }
        );
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex("idx_invoices_has_been_adjusted", "Invoices");
        migrationBuilder.DropColumn("HasBeenAdjusted", "Invoices");
    }
}
```

**Commands:**
```bash
dotnet ef migrations add AddHasBeenAdjustedColumn
dotnet ef migrations script  # Review SQL
dotnet ef database update
```

---

### ✅ TASK 2: Update Invoice Entity

**File**: `Models/Invoice.cs`

```csharp
public class Invoice
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; }
    public int Status { get; set; }  // Sử dụng status 4 (Adjusted) đã có
    public int InvoiceType { get; set; }
    public int? OriginalInvoiceID { get; set; }
    
    // ✨ NEW FIELD - Chỉ cần thêm property này
    public bool HasBeenAdjusted { get; set; }
    
    // ... other properties
}
```

---

### ✅ TASK 3: Create State Machine

**File**: `Services/InvoiceStateMachine.cs`

```csharp
using Microsoft.EntityFrameworkCore;

public class InvoiceStateMachine
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<InvoiceStateMachine> _logger;

    public InvoiceStateMachine(ApplicationDbContext db, ILogger<InvoiceStateMachine> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Main method: Update invoice status với auto-update related invoices
    /// </summary>
    public async Task<bool> UpdateStatusAsync(Invoice invoice, int newStatus, string reason = null)
    {
        var oldStatus = invoice.Status;
        invoice.Status = newStatus;

        // ✨ Auto-update related invoices
        await HandleSideEffects(invoice, oldStatus, newStatus);

        _logger.LogInformation(
            "Invoice {Id} status: {Old}→{New}. Reason: {Reason}",
            invoice.Id, oldStatus, newStatus, reason
        );

        return true;
    }

    /// <summary>
    /// Handle side effects khi status thay đổi
    /// </summary>
    private async Task HandleSideEffects(Invoice invoice, int oldStatus, int newStatus)
    {
        // ✨ CASE 1: Adjustment invoice ISSUED → Update original
        if (invoice.InvoiceType == 2 && newStatus == 2)  // Type=ADJUSTMENT, Status=ISSUED
        {
            if (invoice.OriginalInvoiceID.HasValue)
            {
                var original = await _db.Invoices.FindAsync(invoice.OriginalInvoiceID.Value);
                
                if (original != null)
                {
                    // ✨ Chuyển từ 10 (ADJUSTMENT_IN_PROCESS) → 4 (ADJUSTED)
                    original.Status = 4;  // Status 4 đã có sẵn trong DB
                    original.HasBeenAdjusted = true;

                    _logger.LogInformation(
                        "✅ Auto-updated original invoice {Id}: Status=4 (ADJUSTED), HasBeenAdjusted=true",
                        original.Id
                    );
                }
            }
        }

        // ✨ CASE 2: Adjustment invoice REJECTED/DELETED → Revert original
        if (invoice.InvoiceType == 2 && (newStatus == 16 || newStatus == 3))  // REJECTED or CANCELLED
        {
            if (invoice.OriginalInvoiceID.HasValue)
            {
                var original = await _db.Invoices.FindAsync(invoice.OriginalInvoiceID.Value);
                
                if (original != null && original.Status == 10)  // ADJUSTMENT_IN_PROCESS
                {
                    // Check: Còn adjustment nào khác active không?
                    var hasOtherAdjustments = await _db.Invoices
                        .Where(i => i.OriginalInvoiceID == invoice.OriginalInvoiceID)
                        .Where(i => i.Id != invoice.Id)
                        .Where(i => i.InvoiceType == 2)
                        .Where(i => i.Status == 2 || i.Status == 1)  // ISSUED or DRAFT
                        .AnyAsync();

                    if (!hasOtherAdjustments)
                    {
                        // Không còn adjustment nào → Revert về ISSUED
                        original.Status = 2;  // ISSUED
                        original.HasBeenAdjusted = false;

                        _logger.LogInformation(
                            "⏪ Reverted original invoice {Id}: Status=2 (ISSUED), HasBeenAdjusted=false",
                            original.Id
                        );
                    }
                }
            }
        }

        // ✨ CASE 3: Replacement invoice ISSUED → Mark original as REPLACED
        if (invoice.InvoiceType == 3 && newStatus == 2)  // Type=REPLACEMENT, Status=ISSUED
        {
            if (invoice.OriginalInvoiceID.HasValue)
            {
                var original = await _db.Invoices.FindAsync(invoice.OriginalInvoiceID.Value);
                
                if (original != null)
                {
                    original.Status = 5;  // REPLACED

                    _logger.LogInformation(
                        "✅ Auto-updated original invoice {Id}: Status=5 (REPLACED)",
                        original.Id
                    );
                }
            }
        }
    }
}
```

---

### ✅ TASK 4: Update APIs

**File**: `Controllers/InvoiceController.cs`

#### 4.1. Register Service (Startup.cs hoặc Program.cs)

```csharp
services.AddScoped<InvoiceStateMachine>();
```

#### 4.2. Update CreateAdjustmentInvoice

```csharp
private readonly InvoiceStateMachine _stateMachine;

[HttpPost("adjustment")]
public async Task<IActionResult> CreateAdjustmentInvoice([FromBody] CreateAdjustmentRequest request)
{
    var original = await _db.Invoices
        .Include(i => i.Items)
        .FirstOrDefaultAsync(i => i.Id == request.OriginalInvoiceId);

    if (original == null)
        return NotFound("Không tìm thấy hóa đơn gốc");

    // Validate: Chỉ điều chỉnh invoice đã phát hành hoặc đã điều chỉnh
    if (original.Status != 2 && original.Status != 4)  // ISSUED or ADJUSTED
        return BadRequest("Chỉ điều chỉnh hóa đơn đã phát hành");

    // ❌ REMOVE: Không block multiple adjustments
    // if (original.HasBeenAdjusted)
    //     return BadRequest("Đã điều chỉnh rồi");

    // Create adjustment invoice
    var adjustment = new Invoice
    {
        InvoiceType = 2,  // ADJUSTMENT
        OriginalInvoiceID = request.OriginalInvoiceId,
        Status = 1,  // DRAFT
        // ... other fields
    };

    await _db.Invoices.AddAsync(adjustment);

    // ✨ Update original → ADJUSTMENT_IN_PROCESS
    original.Status = 10;
    // Note: DON'T set HasBeenAdjusted=true yet (only when adjustment ISSUED)

    await _db.SaveChangesAsync();

    return Ok(adjustment);
}
```

#### 4.3. Update UpdateInvoiceStatus

```csharp
[HttpPut("{id}")]
public async Task<IActionResult> UpdateInvoiceStatus(
    int id, 
    [FromQuery] int statusId,
    [FromBody] UpdateStatusRequest request = null
)
{
    var invoice = await _db.Invoices.FindAsync(id);
    if (invoice == null)
        return NotFound();

    // ✨ Use state machine để auto-update
    await _stateMachine.UpdateStatusAsync(invoice, statusId, request?.Reason);
    
    await _db.SaveChangesAsync();

    return Ok(new { 
        Invoice = invoice,
        Message = "Cập nhật trạng thái thành công"
    });
}
```

#### 4.4. Update GetInvoices (Include HasBeenAdjusted)

```csharp
[HttpGet]
public async Task<IActionResult> GetInvoices([FromQuery] InvoiceFilterRequest filter)
{
    var query = _db.Invoices.AsQueryable();
    
    // Apply filters...

    var invoices = await query
        .Select(i => new 
        {
            i.Id,
            i.InvoiceNumber,
            i.Status,
            i.InvoiceType,
            i.OriginalInvoiceID,
            i.HasBeenAdjusted,  // ✨ Include field
            // ... other fields
        })
        .ToListAsync();

    return Ok(invoices);
}
```

---

## 💻 FRONTEND IMPLEMENTATION

### ✅ TASK 1: Update Invoice Interface

**File**: `src/types/invoice.types.ts`

```typescript
export interface Invoice {
  id: string
  invoiceNumber: string
  status: number
  invoiceType: number
  originalInvoiceID?: string
  
  // ✨ NEW FIELD
  hasBeenAdjusted: boolean
  
  // ... other fields
}
```

---

### ✅ TASK 2: Update InvoiceStatus Constants (Optional - Color Change)

**File**: `src/constants/invoiceStatus.ts`

Status đã có sẵn, chỉ cần update color nếu muốn:

```typescript
export const INVOICE_INTERNAL_STATUS_COLORS: Record<number, ChipColor> = {
  // ...
  [INVOICE_INTERNAL_STATUS.ADJUSTED]: 'success',  // Change: 'info' → 'success' (xanh lục)
  // ...
}
```

---

### ✅ TASK 3: Remove Computed Logic

**File**: `src/page/InvoiceManagement.tsx`

**FIND & DELETE (Lines ~1594-1606):**

```typescript
// ❌ DELETE THIS ENTIRE BLOCK
const adjustedInvoicesMap = useMemo(() => {
  const map = new Map<string, boolean>()
  
  invoices.forEach(inv => {
    if (inv.invoiceType === 2 && inv.originalInvoiceID) {
      map.set(inv.originalInvoiceID.toString(), true)
    }
  })
  
  return map
}, [invoices])
```

---

### ✅ TASK 4: Update Actions Menu Logic

**File**: `src/page/InvoiceManagement.tsx`

**FIND (Lines ~240-350):**

```typescript
// ❌ OLD CODE:
const hasBeenAdjusted = adjustedInvoicesMap.get(invoice.id?.toString()) || false

const canAdjust = 
  isIssued && 
  !hasBeenAdjusted &&
  !isAdjustmentInvoice
```

**REPLACE WITH:**

```typescript
// ✅ NEW CODE:
const canAdjust = 
  (invoice.status === INVOICE_INTERNAL_STATUS.ISSUED || 
   invoice.status === INVOICE_INTERNAL_STATUS.ADJUSTED) &&
  invoice.invoiceType !== 2  // Not adjustment invoice
```

**Update tooltip:**

```typescript
// ❌ OLD:
hasBeenAdjusted 
  ? '⚠️ Hóa đơn này đã được điều chỉnh rồi (chỉ được điều chỉnh 1 lần)'
  : 'Tạo hóa đơn điều chỉnh'

// ✅ NEW:
canAdjust
  ? 'Tạo hóa đơn điều chỉnh (có thể nhiều lần theo NĐ 123/2020)'
  : 'Chỉ điều chỉnh HĐ đã phát hành'
```

---

### ✅ TASK 5: Update InvoiceActionsMenu Component

**File**: `src/components/InvoiceActionsMenu.tsx`

**Remove hasBeenAdjusted prop:**

```typescript
interface InvoiceActionsMenuProps {
  invoice: Invoice
  // ... other props
  // ❌ REMOVE: hasBeenAdjusted?: boolean
}

const InvoiceActionsMenu: React.FC<InvoiceActionsMenuProps> = ({ invoice, ... }) => {
  const canAdjust = 
    (invoice.status === INVOICE_INTERNAL_STATUS.ISSUED || 
     invoice.status === INVOICE_INTERNAL_STATUS.ADJUSTED) &&
    invoice.invoiceType !== 2

  return (
    <Menu>
      <MenuItem onClick={onAdjust} disabled={!canAdjust}>
        <ListItemText 
          primary="Tạo HĐ điều chỉnh"
          secondary={
            !canAdjust 
              ? "Chỉ điều chỉnh HĐ đã phát hành"
              : invoice.hasBeenAdjusted
                ? "Đã điều chỉnh (có thể điều chỉnh thêm)"
                : "Điều chỉnh lần đầu"
          }
        />
        {/* ✨ Show badge if adjusted */}
        {invoice.hasBeenAdjusted && (
          <Chip size="small" label="Đã ĐC" color="warning" />
        )}
      </MenuItem>
    </Menu>
  )
}
```

---

### ✅ TASK 6: Update DataGrid Columns

**File**: `src/page/InvoiceManagement.tsx`

```typescript
const columns: GridColDef[] = [
  // ...
  {
    field: 'actions',
    renderCell: (params) => (
      <InvoiceActionsMenu
        invoice={params.row}
        // ❌ REMOVE: hasBeenAdjusted={adjustedInvoicesMap.get(...)}
        onAdjust={() => handleCreateAdjustment(params.row)}
      />
    ),
  },
]
```

---

## ✅ TESTING CHECKLIST

### Backend Testing

#### 1. Migration Test

```bash
# Run migration
dotnet ef database update

# Verify column exists
SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Invoices' AND COLUMN_NAME = 'HasBeenAdjusted';

# Check existing data updated
SELECT Id, InvoiceNumber, Status, HasBeenAdjusted 
FROM Invoices 
WHERE Status = 4 OR HasBeenAdjusted = 1;
```

#### 2. State Machine Test

```bash
# Create adjustment invoice (ID 200 for original ID 100)
POST /api/Invoice/adjustment
{
  "originalInvoiceId": 100,
  "reason": "Test",
  "adjustmentItems": [...]
}

# Check original status = 10 (ADJUSTMENT_IN_PROCESS)
GET /api/Invoice/100
# Response: { "status": 10, "hasBeenAdjusted": false }

# Issue adjustment invoice
PUT /api/Invoice/200?statusId=2

# ✅ Check original auto-updated
GET /api/Invoice/100
# Expected: { "status": 4, "hasBeenAdjusted": true } ✨
```

#### 3. Multiple Adjustments Test

```bash
# Create 2nd adjustment for same original
POST /api/Invoice/adjustment
{
  "originalInvoiceId": 100,
  "adjustmentItems": [...]
}

# Should succeed (no "đã điều chỉnh rồi" error)
```

### Frontend Testing

#### 1. Interface Test

```typescript
// Check field exists
const invoice = await getInvoice('100')
console.log(invoice.hasBeenAdjusted)  // Should be boolean
```

#### 2. UI Test

1. Navigate to invoice list
2. Find invoice with status = 4 (Đã điều chỉnh)
3. Verify chip shows correct color
4. Click actions → "Tạo HĐ điều chỉnh" should be enabled

#### 3. Workflow Test

```
1. Original Invoice (Status=2 ISSUED)
   ↓ Click "Tạo HĐ điều chỉnh"
   
2. Original → Status=10 (Đang điều chỉnh)
   Adjustment created (Status=1 DRAFT)
   ↓ Sign & Issue adjustment
   
3. ✨ AUTO-UPDATE:
   - Adjustment → Status=2 (Đã phát hành)
   - Original → Status=4 (Đã điều chỉnh) ✅
   - Original → hasBeenAdjusted=true ✅
   
4. Click "Tạo HĐ điều chỉnh" again → Should work! 🎉
```

---

## 🚀 DEPLOYMENT PLAN

### Step 1: Pre-Deployment (30 mins)

```bash
# Backup database
pg_dump -h localhost -U postgres eims_production > backup_20260119.sql

# Test migration on staging
dotnet ef database update --connection "StagingConnectionString"

# Verify staging works
```

### Step 2: Backend Deployment (1 hour)

```bash
# 1. Deploy code
git pull origin main
dotnet publish -c Release

# 2. Run migration on production
dotnet ef database update --connection "ProductionConnectionString"

# 3. Verify migration
SELECT COUNT(*) FROM Invoices WHERE HasBeenAdjusted = 1;

# 4. Restart service
systemctl restart eims-backend

# 5. Health check
curl https://api.eims.com/health
```

### Step 3: Frontend Deployment (30 mins)

```bash
# 1. Build
npm run build

# 2. Deploy
scp -r dist/* user@server:/var/www/eims-frontend

# 3. Clear cache
# Clear CDN/browser cache if applicable
```

### Step 4: Post-Deployment Verification (30 mins)

- [ ] Test create adjustment workflow end-to-end
- [ ] Verify auto-update works (status 10 → 4)
- [ ] Check multiple adjustments allowed
- [ ] Monitor logs for errors
- [ ] Performance check (< 100ms invoice list load)

### Step 5: Rollback Plan (if needed)

```bash
# Rollback database
dotnet ef database update PreviousMigration

# Or restore from backup
pg_restore -d eims_production backup_20260119.sql

# Deploy previous code version
git checkout previous-commit
systemctl restart eims-backend
```

---

## 📊 SUMMARY

### Changes Required

| Component | Changes | Status | Effort |
|-----------|---------|--------|--------|
| **Backend** | | | |
| - Database | Add HasBeenAdjusted column + index | 🟡 Todo | 30 mins |
| - Entity | Add property | 🟡 Todo | 5 mins |
| - State Machine | Create service with auto-update logic | 🟡 Todo | 2 hours |
| - APIs | Integrate state machine | 🟡 Todo | 1 hour |
| **Frontend** | | | |
| - Interface | Add hasBeenAdjusted field | 🟡 Todo | 5 mins |
| - Constants | Update color (optional) | 🟡 Todo | 5 mins |
| - Logic | Remove computed map, use API field | 🟡 Todo | 30 mins |
| - UI | Update menu, tooltips | 🟡 Todo | 30 mins |

### Total Effort

- **Backend**: 3.5 hours
- **Frontend**: 1 hour
- **Testing**: 1 hour
- **Deployment**: 2 hours
- **Total**: ~7.5 hours (1 working day)

### Key Benefits

- ✅ **10x Performance**: O(n) → O(1)
- ✅ **100% Accuracy**: No pagination bugs
- ✅ **Legal Compliance**: Multiple adjustments allowed
- ✅ **Better UX**: Clear status display "Đã điều chỉnh"
- ✅ **Maintainability**: Clean logic in backend

---

## 🎯 NEXT STEPS

1. **Backend team**: Implement State Machine + Migration (3.5 hours)
2. **Frontend team**: Update interface + remove computed logic (1 hour)
3. **QA**: Test workflow end-to-end (1 hour)
4. **Deploy**: Staging → Production (2 hours)

**Start with Backend Task 1 (Migration)! 🚀**
