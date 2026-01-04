# InvoiceManagement Actions Menu - Optimization Summary

## 🎯 Mục tiêu: Đồng bộ UI/UX với InvoiceApproval

### ✅ Changes Applied:

## 1. **Interface Update**

```typescript
// OLD
interface InvoiceActionsMenuProps {
  invoice: Invoice
  onSendForApproval: (id: string) => void
  onSign: (id: string, invoiceNumber: string) => void
  onIssue: (id: string, invoiceNumber: string) => void
  onResendToTax: (id: string, invoiceNumber: string) => void
  isSending: boolean
}

// NEW - Added onCancel like InvoiceApproval
interface InvoiceActionsMenuProps {
  invoice: Invoice
  onSendForApproval: (id: string) => void
  onSign: (id: string, invoiceNumber: string) => void
  onIssue: (id: string, invoiceNumber: string) => void
  onResendToTax: (id: string, invoiceNumber: string) => void
  onCancel: (id: string, invoiceNumber: string) => void  // ✅ NEW
  isSending: boolean
}
```

## 2. **Remove `navigate` - Use Link Component**

```typescript
// OLD
const InvoiceActionsMenu = ({ ... }) => {
  const navigate = useNavigate()  // ❌ Remove this
  // ...
}

// NEW - Like InvoiceApproval
const InvoiceActionsMenu = ({ ... }) => {
  // No navigate needed - use Link component
}
```

## 3. **Menu Items Order - Match InvoiceApproval**

```typescript
const menuItems = [
  // 🔵 PRIMARY ACTIONS
  {
    label: 'Xem chi tiết',
    icon: <VisibilityOutlinedIcon />,
    enabled: true,
    isLink: true,  // ✅ NEW - Use Link component
    linkTo: `/invoices/${invoice.id}`,
    color: 'primary.main',
  },
  {
    label: 'Chỉnh sửa',
    icon: <EditOutlinedIcon />,
    enabled: isDraft,
    color: 'primary.main',
  },
  {
    label: 'Gửi duyệt',  // Only in Management, not in Approval
    icon: <SendIcon />,
    enabled: isDraft && !isSending,
    color: 'success.main',
  },
  {
    label: 'Ký số',
    icon: <DrawIcon />,
    enabled: canSign,
    color: 'secondary.main',
    tooltip: 'Ký chữ ký số điện tử vào hóa đơn',
  },
  {
    label: '🚀 Phát hành',
    icon: <SendIcon />,
    enabled: canIssue,
    color: 'success.main',
    tooltip: 'Cấp số hóa đơn và gửi lên Cơ quan Thuế',
  },
  
  { divider: true },
  
  // 🟢 UTILITY ACTIONS
  {
    label: 'Gửi email',
    icon: <EmailIcon />,
    enabled: true,
    color: 'info.main',
  },
  {
    label: 'In hóa đơn',
    icon: <PrintIcon />,
    enabled: true,
    color: 'text.primary',
  },
  {
    label: 'Tải xuống',
    icon: <DownloadIcon />,
    enabled: true,
    color: 'text.primary',
  },
  
  { divider: true },
  
  // 🟡 SPECIAL ACTIONS
  {
    label: 'Gửi lại CQT',  // Only in Management
    icon: <RestoreIcon />,
    enabled: (isSigned || isIssued) && hasTaxError,
    color: 'warning.main',
  },
  {
    label: 'Tạo HĐ điều chỉnh',
    icon: <FindReplaceIcon />,
    enabled: isIssued,
    color: 'warning.main',
  },
  {
    label: 'Tạo HĐ thay thế',
    icon: <RestoreIcon />,
    enabled: isIssued,
    color: 'warning.main',
  },
  
  // 🔴 DESTRUCTIVE ACTIONS
  {
    label: 'Hủy',  // ✅ NEW - Added from InvoiceApproval
    icon: <CancelIcon />,
    enabled: canCancel,  // ✅ NEW
    color: 'error.main',
  },
  {
    label: 'Xóa',  // Keep in Management only
    icon: <DeleteOutlineIcon />,
    enabled: isDraft,
    color: 'error.main',
  },
]
```

## 4. **Add `canCancel` Logic**

```typescript
// ✅ NEW - From InvoiceApproval
const canCancel = isPendingApproval || isPendingSign // Có thể hủy khi Chờ duyệt HOẶC Chờ ký
```

## 5. **Link Component Support**

```typescript
// ✅ NEW - Support Link navigation like InvoiceApproval
{menuItems.map((item, index) => {
  if ('divider' in item) {
    return <Divider key={`divider-${index}`} sx={{ my: 1 }} />
  }

  // Nếu là link item
  if ('isLink' in item && item.isLink) {
    return (
      <MenuItem
        key={item.label}
        component={Link}  // ✅ Use react-router Link
        to={item.linkTo || '#'}
        disabled={!item.enabled}
        sx={{...}}  // Same styling as InvoiceApproval
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText primary={item.label} />
      </MenuItem>
    )
  }

  return <MenuItem>...</MenuItem>  // Regular menu item
})}
```

## 6. **Handler Updates in Main Component**

```typescript
// In InvoiceManagement main component

// ✅ NEW - Add handleCancelInvoice handler
const handleCancelInvoice = async (id: string, invoiceNumber: string) => {
  if (!confirm(`Bạn có chắc muốn hủy hóa đơn ${invoiceNumber}?`)) {
    return
  }
  
  try {
    // Call API to cancel invoice - change status to CANCELLED
    await invoiceService.cancelInvoice(parseInt(id))
    
    setSnackbar({
      open: true,
      message: `Đã hủy hóa đơn ${invoiceNumber}`,
      severity: 'success',
    })
    
    await loadInvoices()
  } catch (err) {
    setSnackbar({
      open: true,
      message: err instanceof Error ? err.message : 'Không thể hủy hóa đơn',
      severity: 'error',
    })
  }
}

// Update InvoiceActionsMenu call
<InvoiceActionsMenu
  invoice={row}
  onSendForApproval={handleSendForApproval}
  onSign={handleOpenSignDialog}
  onIssue={handleIssueInvoice}
  onResendToTax={handleResendToTax}
  onCancel={handleCancelInvoice}  // ✅ NEW
  isSending={isSending}
/>
```

---

## 📊 Comparison Table

| Feature | InvoiceApproval | InvoiceManagement OLD | InvoiceManagement NEW |
|---------|----------------|----------------------|----------------------|
| Link navigation | ✅ `<Link>` | ❌ `navigate()` | ✅ `<Link>` |
| "Duyệt" button | ✅ Yes | ❌ No | ❌ No (correct) |
| "Từ chối" button | ✅ Yes | ❌ No | ❌ No (correct) |
| "Gửi duyệt" button | ❌ No | ✅ Yes | ✅ Yes (correct) |
| "Hủy" button | ✅ Yes | ❌ No | ✅ Yes |
| "Xóa" button | ❌ No | ✅ Yes | ✅ Yes (keep) |
| "Gửi lại CQT" | ❌ No | ✅ Yes | ✅ Yes (keep) |
| Menu order | Optimized | Random | ✅ Match Approval |
| Styling | Modern | Modern | ✅ Identical |

---

## 🎨 UI Benefits

1. ✅ **Consistency** - Both pages use same Link navigation pattern
2. ✅ **User Experience** - Same menu order & styling = less confusion
3. ✅ **Maintainability** - Similar code structure = easier to maintain
4. ✅ **Accessibility** - Link component better for screen readers

---

## 🔧 Code to Apply

### Step 1: Update Interface

Find line ~118 in `InvoiceManagement.tsx` and add `onCancel`:

```diff
interface InvoiceActionsMenuProps {
  invoice: Invoice
  onSendForApproval: (id: string) => void
  onSign: (id: string, invoiceNumber: string) => void
  onIssue: (id: string, invoiceNumber: string) => void
  onResendToTax: (id: string, invoiceNumber: string) => void
+ onCancel: (id: string, invoiceNumber: string) => void
  isSending: boolean
}
```

### Step 2: Update Component Signature

Line ~127:

```diff
-const InvoiceActionsMenu = ({ invoice, onSendForApproval, onSign, onIssue, onResendToTax, isSending }: InvoiceActionsMenuProps) => {
+const InvoiceActionsMenu = ({ invoice, onSendForApproval, onSign, onIssue, onResendToTax, onCancel, isSending }: InvoiceActionsMenuProps) => {
-  const navigate = useNavigate()
   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
```

### Step 3: Add canCancel Logic

Line ~170 (after canIssue):

```diff
const canSign = (isPendingSign || isApproved) && !hasInvoiceNumber
const canIssue = (isSignedPendingIssue || isSigned) && hasInvoiceNumber
+const canCancel = isPendingApproval || isPendingSign
```

### Step 4: Update menuItems

Replace entire menuItems array (lines ~179-318) with the new one from above.

### Step 5: Add Link Support in Rendering

Replace the map function (~365-411) with the new version that supports `isLink`.

### Step 6: Add Handler in Main Component

After line ~700 (after other handlers):

```typescript
// Handler hủy hóa đơn
const handleCancelInvoice = async (id: string, invoiceNumber: string) => {
  if (!confirm(`Bạn có chắc muốn hủy hóa đơn ${invoiceNumber}?`)) {
    return
  }
  
  try {
    await invoiceService.cancelInvoice(parseInt(id))
    
    setSnackbar({
      open: true,
      message: `Đã hủy hóa đơn ${invoiceNumber}`,
      severity: 'success',
    })
    
    await loadInvoices()
  } catch (err) {
    setSnackbar({
      open: true,
      message: err instanceof Error ? err.message : 'Không thể hủy hóa đơn',
      severity: 'error',
    })
  }
}
```

### Step 7: Update InvoiceActionsMenu Call

Find line ~960 and add `onCancel`:

```diff
<InvoiceActionsMenu
  invoice={row}
  onSendForApproval={handleSendForApproval}
  onSign={handleOpenSignDialog}
  onIssue={handleIssueInvoice}
  onResendToTax={handleResendToTax}
+ onCancel={handleCancelInvoice}
  isSending={isSending}
/>
```

---

## ✅ Final Result

InvoiceManagement menu now has:
- ✅ Same UI/UX as InvoiceApproval
- ✅ Link navigation (faster, better UX)
- ✅ Consistent menu order
- ✅ "Hủy" button for pending invoices
- ✅ All original features (Gửi duyệt, Gửi lại CQT, Xóa)
- ❌ No "Duyệt/Từ chối" (only in Approval page)

**Differences preserved:**
- Gửi duyệt (Management only)
- Gửi lại CQT (Management only)  
- Xóa (Management only)
- Duyệt/Từ chối (Approval only)
