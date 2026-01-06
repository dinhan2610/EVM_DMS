# 🚀 BACKEND DEBT MANAGEMENT - TỐI ƯU CHUYÊN NGHIỆP ĐẦY ĐỦ

> **Phân tích và hướng dẫn tối ưu backend API cho hệ thống quản lý công nợ**
> 
> **Ngày tạo**: 25/12/2025  
> **Trạng thái**: Ready for Implementation

---

## 📋 MỤC LỤC

1. [Tổng quan tình trạng hiện tại](#1-tổng-quan-tình-trạng-hiện-tại)
2. [Pagination & Performance](#2-pagination--performance)
3. [Filtering & Search](#3-filtering--search)
4. [Caching Strategy](#4-caching-strategy)
5. [Database Indexing](#5-database-indexing)
6. [Query Optimization](#6-query-optimization)
7. [Error Handling & Validation](#7-error-handling--validation)
8. [Rate Limiting](#8-rate-limiting)
9. [Logging & Monitoring](#9-logging--monitoring)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. TỔNG QUAN TÌNH TRẠNG HIỆN TẠI

### ❌ Các vấn đề hiện tại

#### A. Performance Issues
```typescript
// ❌ HIỆN TẠI - Frontend đang làm như này:
const response = await debtService.getCustomerDebtDetail(
  customerId,
  { PageSize: 1000, PageIndex: 1 }  // ⚠️ Fetch 1000 records mỗi lần!
);
```

**Rủi ro:**
- Với 1000 invoices → Response size ~500KB - 1MB
- Slow query (2-5 giây với database lớn)
- Memory overhead trên server
- Bad user experience (loading lâu)

#### B. No Server-Side Pagination
```csharp
// ❌ Backend hiện tại không có pagination cho detail API
[HttpGet("{customerId}/debt-detail")]
public async Task<IActionResult> GetCustomerDebtDetail(int customerId)
{
    // Trả về toàn bộ invoices và payments
    // Không có limit, không có pagination
    var result = await _service.GetAllDataAsync(customerId);
    return Ok(result);
}
```

#### C. No Caching
- Mỗi lần user click vào customer → Fetch lại toàn bộ data
- Không cache data summary
- Không có cache invalidation strategy

#### D. Missing Database Indexes
- Query chậm khi có nhiều invoices
- Full table scan cho payment status filter
- No index cho customer + date range queries

---

## 2. PAGINATION & PERFORMANCE

### 🎯 Mục tiêu
- Giảm response size từ ~1MB xuống ~50KB
- Giảm query time từ 2-5s xuống <500ms
- Support infinite scroll hoặc classic pagination

### 📝 Implementation

#### A. Backend - Update Controller

**File**: `Controllers/CustomerController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace EIMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerService _customerService;
        private readonly ILogger<CustomerController> _logger;

        public CustomerController(
            ICustomerService customerService,
            ILogger<CustomerController> logger)
        {
            _customerService = customerService;
            _logger = logger;
        }

        /// <summary>
        /// Get detailed debt information for a specific customer with pagination
        /// </summary>
        /// <param name="customerId">Customer ID</param>
        /// <param name="invoicePageIndex">Invoice page index (starts from 1)</param>
        /// <param name="invoicePageSize">Invoice page size (max 100)</param>
        /// <param name="paymentPageIndex">Payment page index (starts from 1)</param>
        /// <param name="paymentPageSize">Payment page size (max 100)</param>
        /// <param name="sortBy">Sort field: invoiceDate, amount, dueDate</param>
        /// <param name="sortOrder">Sort order: asc, desc</param>
        [HttpGet("{customerId}/debt-detail")]
        [ProducesResponseType(typeof(CustomerDebtDetailResponse), 200)]
        [ProducesResponseType(typeof(ErrorResponse), 404)]
        [ProducesResponseType(typeof(ErrorResponse), 500)]
        public async Task<IActionResult> GetCustomerDebtDetail(
            int customerId,
            [FromQuery] int invoicePageIndex = 1,
            [FromQuery] int invoicePageSize = 10,
            [FromQuery] int paymentPageIndex = 1,
            [FromQuery] int paymentPageSize = 10,
            [FromQuery] string sortBy = "invoiceDate",
            [FromQuery] string sortOrder = "desc")
        {
            try
            {
                // Validate customer exists
                if (!await _customerService.ExistsAsync(customerId))
                {
                    return NotFound(new ErrorResponse
                    {
                        Error = "CUSTOMER_NOT_FOUND",
                        Message = $"Customer with ID {customerId} does not exist"
                    });
                }

                // Validate and normalize pagination parameters
                invoicePageIndex = Math.Max(1, invoicePageIndex);
                invoicePageSize = Math.Clamp(invoicePageSize, 1, 100);
                paymentPageIndex = Math.Max(1, paymentPageIndex);
                paymentPageSize = Math.Clamp(paymentPageSize, 1, 100);

                // Validate sort parameters
                var validSortFields = new[] { "invoiceDate", "amount", "dueDate", "invoiceNumber" };
                if (!validSortFields.Contains(sortBy.ToLower()))
                {
                    sortBy = "invoiceDate";
                }

                var validSortOrders = new[] { "asc", "desc" };
                if (!validSortOrders.Contains(sortOrder.ToLower()))
                {
                    sortOrder = "desc";
                }

                _logger.LogInformation(
                    "Fetching debt detail for customer {CustomerId}, " +
                    "Invoice Page: {InvoicePageIndex}/{InvoicePageSize}, " +
                    "Payment Page: {PaymentPageIndex}/{PaymentPageSize}, " +
                    "Sort: {SortBy} {SortOrder}",
                    customerId, invoicePageIndex, invoicePageSize,
                    paymentPageIndex, paymentPageSize, sortBy, sortOrder);

                var stopwatch = System.Diagnostics.Stopwatch.StartNew();

                // Fetch data with pagination
                var result = await _customerService.GetCustomerDebtDetailAsync(
                    customerId,
                    invoicePageIndex,
                    invoicePageSize,
                    paymentPageIndex,
                    paymentPageSize,
                    sortBy,
                    sortOrder);

                stopwatch.Stop();

                // Log performance warning if slow
                if (stopwatch.ElapsedMilliseconds > 1000)
                {
                    _logger.LogWarning(
                        "Slow query for customer {CustomerId}: {ElapsedMs}ms",
                        customerId, stopwatch.ElapsedMilliseconds);
                }
                else
                {
                    _logger.LogInformation(
                        "Debt detail fetched in {ElapsedMs}ms",
                        stopwatch.ElapsedMilliseconds);
                }

                // Build paginated response
                var response = new CustomerDebtDetailResponse
                {
                    Customer = result.Customer,
                    Summary = result.Summary,
                    UnpaidInvoices = new PaginatedData<UnpaidInvoiceDto>
                    {
                        Items = result.UnpaidInvoices,
                        PageIndex = invoicePageIndex,
                        PageSize = invoicePageSize,
                        TotalCount = result.TotalUnpaidInvoiceCount,
                        TotalPages = (int)Math.Ceiling(result.TotalUnpaidInvoiceCount / (double)invoicePageSize),
                        HasPreviousPage = invoicePageIndex > 1,
                        HasNextPage = invoicePageIndex < (int)Math.Ceiling(result.TotalUnpaidInvoiceCount / (double)invoicePageSize)
                    },
                    PaymentHistory = new PaginatedData<PaymentHistoryDto>
                    {
                        Items = result.PaymentHistory,
                        PageIndex = paymentPageIndex,
                        PageSize = paymentPageSize,
                        TotalCount = result.TotalPaymentCount,
                        TotalPages = (int)Math.Ceiling(result.TotalPaymentCount / (double)paymentPageSize),
                        HasPreviousPage = paymentPageIndex > 1,
                        HasNextPage = paymentPageIndex < (int)Math.Ceiling(result.TotalPaymentCount / (double)paymentPageSize)
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching debt detail for customer {CustomerId}", customerId);
                return StatusCode(500, new ErrorResponse
                {
                    Error = "INTERNAL_ERROR",
                    Message = "An error occurred while fetching debt details"
                });
            }
        }
    }

    // Response DTOs
    public class CustomerDebtDetailResponse
    {
        public CustomerDto Customer { get; set; }
        public DebtSummaryDto Summary { get; set; }
        public PaginatedData<UnpaidInvoiceDto> UnpaidInvoices { get; set; }
        public PaginatedData<PaymentHistoryDto> PaymentHistory { get; set; }
    }

    public class PaginatedData<T>
    {
        public List<T> Items { get; set; }
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasPreviousPage { get; set; }
        public bool HasNextPage { get; set; }
    }

    public class ErrorResponse
    {
        public string Error { get; set; }
        public string Message { get; set; }
    }
}
```

#### B. Backend - Service Layer

**File**: `Services/CustomerService.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

public interface ICustomerService
{
    Task<bool> ExistsAsync(int customerId);
    Task<CustomerDebtDetailResult> GetCustomerDebtDetailAsync(
        int customerId,
        int invoicePageIndex,
        int invoicePageSize,
        int paymentPageIndex,
        int paymentPageSize,
        string sortBy,
        string sortOrder);
}

public class CustomerService : ICustomerService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CustomerService> _logger;

    public CustomerService(
        ApplicationDbContext context,
        ILogger<CustomerService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> ExistsAsync(int customerId)
    {
        return await _context.Customers
            .AnyAsync(c => c.CustomerId == customerId);
    }

    public async Task<CustomerDebtDetailResult> GetCustomerDebtDetailAsync(
        int customerId,
        int invoicePageIndex,
        int invoicePageSize,
        int paymentPageIndex,
        int paymentPageSize,
        string sortBy,
        string sortOrder)
    {
        var result = new CustomerDebtDetailResult();

        // 1. Get customer info (cached separately)
        result.Customer = await _context.Customers
            .Where(c => c.CustomerId == customerId)
            .Select(c => new CustomerDto
            {
                CustomerId = c.CustomerId,
                CustomerName = c.Name,
                TaxCode = c.TaxCode,
                Email = c.Email,
                Phone = c.Phone,
                Address = c.Address
            })
            .FirstOrDefaultAsync();

        // 2. Get debt summary
        var invoices = _context.Invoices
            .Where(i => i.CustomerId == customerId && i.Status == "ISSUED");

        result.Summary = new DebtSummaryDto
        {
            TotalDebt = await invoices.SumAsync(i => i.RemainingAmount ?? 0),
            OverdueDebt = await invoices
                .Where(i => i.DueDate < DateTime.UtcNow && i.PaymentStatus != "Paid")
                .SumAsync(i => i.RemainingAmount ?? 0),
            TotalPaid = await invoices.SumAsync(i => i.PaidAmount ?? 0),
            InvoiceCount = await invoices.CountAsync(),
            UnpaidInvoiceCount = await invoices
                .Where(i => i.PaymentStatus != "Paid")
                .CountAsync(),
            LastPaymentDate = await _context.Payments
                .Where(p => p.Invoice.CustomerId == customerId)
                .OrderByDescending(p => p.PaymentDate)
                .Select(p => (DateTime?)p.PaymentDate)
                .FirstOrDefaultAsync()
        };

        // 3. Get unpaid invoices with pagination
        var unpaidQuery = _context.Invoices
            .Where(i => i.CustomerId == customerId &&
                       i.Status == "ISSUED" &&
                       i.PaymentStatus != "Paid")
            .Select(i => new UnpaidInvoiceDto
            {
                InvoiceId = i.InvoiceId,
                InvoiceNumber = i.InvoiceNumber,
                InvoiceDate = i.InvoiceDate,
                DueDate = i.DueDate,
                TotalAmount = i.TotalAmount,
                PaidAmount = i.PaidAmount ?? 0,
                RemainingAmount = i.RemainingAmount ?? i.TotalAmount,
                PaymentStatus = i.PaymentStatus ?? "Unpaid",
                Description = i.Description,
                IsOverdue = i.DueDate < DateTime.UtcNow && i.PaymentStatus != "Paid"
            });

        // Apply sorting
        unpaidQuery = sortBy.ToLower() switch
        {
            "amount" => sortOrder.ToLower() == "asc"
                ? unpaidQuery.OrderBy(i => i.TotalAmount)
                : unpaidQuery.OrderByDescending(i => i.TotalAmount),
            "duedate" => sortOrder.ToLower() == "asc"
                ? unpaidQuery.OrderBy(i => i.DueDate)
                : unpaidQuery.OrderByDescending(i => i.DueDate),
            "invoicenumber" => sortOrder.ToLower() == "asc"
                ? unpaidQuery.OrderBy(i => i.InvoiceNumber)
                : unpaidQuery.OrderByDescending(i => i.InvoiceNumber),
            _ => sortOrder.ToLower() == "asc"
                ? unpaidQuery.OrderBy(i => i.InvoiceDate)
                : unpaidQuery.OrderByDescending(i => i.InvoiceDate)
        };

        // Get total count before pagination
        result.TotalUnpaidInvoiceCount = await unpaidQuery.CountAsync();

        // Apply pagination
        result.UnpaidInvoices = await unpaidQuery
            .Skip((invoicePageIndex - 1) * invoicePageSize)
            .Take(invoicePageSize)
            .ToListAsync();

        // 4. Get payment history with pagination
        var paymentQuery = _context.Payments
            .Where(p => p.Invoice.CustomerId == customerId)
            .Include(p => p.Invoice)
            .Include(p => p.User)
            .Select(p => new PaymentHistoryDto
            {
                PaymentId = p.PaymentId,
                InvoiceId = p.InvoiceId,
                InvoiceNumber = p.Invoice.InvoiceNumber,
                Amount = p.Amount,
                PaymentMethod = p.PaymentMethod,
                TransactionCode = p.TransactionCode,
                Note = p.Note,
                PaymentDate = p.PaymentDate,
                UserId = p.UserId,
                UserName = p.User.FullName
            });

        // Sort payments by date (newest first)
        paymentQuery = sortOrder.ToLower() == "asc"
            ? paymentQuery.OrderBy(p => p.PaymentDate)
            : paymentQuery.OrderByDescending(p => p.PaymentDate);

        // Get total count
        result.TotalPaymentCount = await paymentQuery.CountAsync();

        // Apply pagination
        result.PaymentHistory = await paymentQuery
            .Skip((paymentPageIndex - 1) * paymentPageSize)
            .Take(paymentPageSize)
            .ToListAsync();

        return result;
    }
}

public class CustomerDebtDetailResult
{
    public CustomerDto Customer { get; set; }
    public DebtSummaryDto Summary { get; set; }
    public List<UnpaidInvoiceDto> UnpaidInvoices { get; set; }
    public int TotalUnpaidInvoiceCount { get; set; }
    public List<PaymentHistoryDto> PaymentHistory { get; set; }
    public int TotalPaymentCount { get; set; }
}
```

#### C. Frontend - Update Service

**File**: `src/services/debtService.ts`

```typescript
// Update interface to support pagination
export interface CustomerDebtDetailResponse {
  customer: {
    customerId: number;
    customerName: string;
    taxCode: string;
    email: string;
    phone: string;
    address: string;
  };
  summary: {
    totalDebt: number;
    overdueDebt: number;
    totalPaid: number;
    invoiceCount: number;
    unpaidInvoiceCount: number;
    lastPaymentDate: string | null;
  };
  unpaidInvoices: {
    items: Array<{
      invoiceId: number;
      invoiceNumber: string;
      invoiceDate: string;
      dueDate: string;
      totalAmount: number;
      paidAmount: number;
      remainingAmount: number;
      paymentStatus: 'Unpaid' | 'PartiallyPaid' | 'Paid' | 'Overdue';
      description: string;
      isOverdue: boolean;
    }>;
    pageIndex: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  paymentHistory: {
    items: Array<{
      paymentId: number;
      invoiceId: number;
      invoiceNumber: string;
      amount: number;
      paymentMethod: string;
      transactionCode: string | null;
      note: string;
      paymentDate: string;
      userId: number;
      userName: string;
    }>;
    pageIndex: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export interface DebtDetailQueryParams {
  invoicePageIndex?: number;
  invoicePageSize?: number;
  paymentPageIndex?: number;
  paymentPageSize?: number;
  sortBy?: 'invoiceDate' | 'amount' | 'dueDate' | 'invoiceNumber';
  sortOrder?: 'asc' | 'desc';
}

export const getCustomerDebtDetail = async (
  customerId: number,
  params?: DebtDetailQueryParams
): Promise<CustomerDebtDetailResponse> => {
  try {
    const queryParams = {
      invoicePageIndex: params?.invoicePageIndex || 1,
      invoicePageSize: params?.invoicePageSize || 10,
      paymentPageIndex: params?.paymentPageIndex || 1,
      paymentPageSize: params?.paymentPageSize || 10,
      sortBy: params?.sortBy || 'invoiceDate',
      sortOrder: params?.sortOrder || 'desc',
    };

    console.log('[getCustomerDebtDetail] Fetching with params:', queryParams);

    const response = await axios.get<CustomerDebtDetailResponse>(
      `/api/Customer/${customerId}/debt-detail`,
      {
        params: queryParams,
        headers: getAuthHeaders(),
      }
    );

    console.log('[getCustomerDebtDetail] Success:', response.data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'getCustomerDebtDetail');
  }
};
```

#### D. Frontend - Update Component

**File**: `src/page/DebtManagement.tsx`

```typescript
// Update state to support separate pagination for invoices and payments
const [invoicePaginationModel, setInvoicePaginationModel] = useState({
  page: 0,
  pageSize: 10,
});

const [paymentPaginationModel, setPaymentPaginationModel] = useState({
  page: 0,
  pageSize: 10,
});

// Update fetch function
const fetchCustomerDebtDetail = async (customerId: number) => {
  try {
    setLoading(true);
    const response = await debtService.getCustomerDebtDetail(
      customerId,
      {
        invoicePageIndex: invoicePaginationModel.page + 1, // DataGrid uses 0-based, API uses 1-based
        invoicePageSize: invoicePaginationModel.pageSize,
        paymentPageIndex: paymentPaginationModel.page + 1,
        paymentPageSize: paymentPaginationModel.pageSize,
        sortBy: 'invoiceDate',
        sortOrder: 'desc',
      }
    );

    setSelectedCustomerDetail(response);
    
    // Update with paginated data
    setUnpaidInvoices(response.unpaidInvoices.items);
    setPaymentHistory(response.paymentHistory.items);
    
  } catch (error) {
    console.error('Error fetching customer debt detail:', error);
    setSnackbar({
      open: true,
      message: 'Không thể tải chi tiết công nợ',
      severity: 'error',
    });
  } finally {
    setLoading(false);
  }
};

// Update DataGrid with server-side pagination
<DataGrid
  rows={unpaidInvoices}
  columns={invoiceColumns}
  paginationMode="server" // ✅ Server-side pagination
  rowCount={selectedCustomerDetail?.unpaidInvoices.totalCount || 0}
  paginationModel={invoicePaginationModel}
  onPaginationModelChange={(newModel) => {
    setInvoicePaginationModel(newModel);
    // Fetch new page
    if (selectedCustomer) {
      fetchCustomerDebtDetail(selectedCustomer.customerId);
    }
  }}
  pageSizeOptions={[5, 10, 25, 50]}
  loading={loading}
/>
```

---

## 3. FILTERING & SEARCH

### 📝 Backend Implementation

```csharp
[HttpGet("{customerId}/debt-detail")]
public async Task<IActionResult> GetCustomerDebtDetail(
    int customerId,
    [FromQuery] int invoicePageIndex = 1,
    [FromQuery] int invoicePageSize = 10,
    [FromQuery] string? searchInvoiceNumber = null,
    [FromQuery] DateTime? fromDate = null,
    [FromQuery] DateTime? toDate = null,
    [FromQuery] string? paymentStatus = null, // "Unpaid", "PartiallyPaid", "Paid"
    [FromQuery] bool? isOverdue = null,
    [FromQuery] decimal? minAmount = null,
    [FromQuery] decimal? maxAmount = null)
{
    // Build query with filters
    var query = _context.Invoices
        .Where(i => i.CustomerId == customerId && i.Status == "ISSUED");

    // Apply filters
    if (!string.IsNullOrEmpty(searchInvoiceNumber))
    {
        query = query.Where(i => i.InvoiceNumber.Contains(searchInvoiceNumber));
    }

    if (fromDate.HasValue)
    {
        query = query.Where(i => i.InvoiceDate >= fromDate.Value);
    }

    if (toDate.HasValue)
    {
        query = query.Where(i => i.InvoiceDate <= toDate.Value);
    }

    if (!string.IsNullOrEmpty(paymentStatus))
    {
        query = query.Where(i => i.PaymentStatus == paymentStatus);
    }

    if (isOverdue.HasValue && isOverdue.Value)
    {
        query = query.Where(i => i.DueDate < DateTime.UtcNow && 
                                i.PaymentStatus != "Paid");
    }

    if (minAmount.HasValue)
    {
        query = query.Where(i => i.TotalAmount >= minAmount.Value);
    }

    if (maxAmount.HasValue)
    {
        query = query.Where(i => i.TotalAmount <= maxAmount.Value);
    }

    // Continue with pagination...
}
```

### 📝 Frontend Implementation

```typescript
// Add filter state
const [filters, setFilters] = useState({
  searchInvoiceNumber: '',
  fromDate: null,
  toDate: null,
  paymentStatus: '',
  isOverdue: false,
});

// Update fetch with filters
const response = await debtService.getCustomerDebtDetail(
  customerId,
  {
    ...paginationParams,
    ...filters, // Spread filters
  }
);
```

---

## 4. CACHING STRATEGY

### A. Memory Cache (Server-Side)

**File**: `Services/CustomerService.cs`

```csharp
using Microsoft.Extensions.Caching.Memory;

public class CustomerService : ICustomerService
{
    private readonly IMemoryCache _cache;
    private readonly ApplicationDbContext _context;

    public CustomerService(IMemoryCache cache, ApplicationDbContext context)
    {
        _cache = cache;
        _context = context;
    }

    public async Task<DebtSummaryDto> GetDebtSummaryAsync(int customerId)
    {
        var cacheKey = $"debt_summary_{customerId}";

        if (!_cache.TryGetValue(cacheKey, out DebtSummaryDto summary))
        {
            // Fetch from database
            summary = await CalculateDebtSummaryAsync(customerId);

            // Cache for 5 minutes
            var cacheOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(5))
                .SetSlidingExpiration(TimeSpan.FromMinutes(2));

            _cache.Set(cacheKey, summary, cacheOptions);
        }

        return summary;
    }

    // Invalidate cache when payment is created
    public async Task CreatePaymentAsync(Payment payment)
    {
        await _context.Payments.AddAsync(payment);
        await _context.SaveChangesAsync();

        // Clear cache
        var customerId = payment.Invoice.CustomerId;
        _cache.Remove($"debt_summary_{customerId}");
    }
}
```

### B. Response Cache (HTTP Level)

```csharp
// Startup.cs or Program.cs
builder.Services.AddResponseCaching();

app.UseResponseCaching();

// Controller
[HttpGet("debt-summary")]
[ResponseCache(Duration = 60, VaryByQueryKeys = new[] { "PageIndex", "PageSize" })]
public async Task<IActionResult> GetDebtSummary(...)
{
    // ...
}
```

### C. Frontend Cache (React Query recommended)

```typescript
// Install: npm install @tanstack/react-query

import { useQuery } from '@tanstack/react-query';

function DebtManagement() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customerDebt', selectedCustomer?.customerId],
    queryFn: () => debtService.getCustomerDebtDetail(selectedCustomer!.customerId),
    enabled: !!selectedCustomer,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Invalidate cache when payment is created
  const { mutate: createPayment } = useMutation({
    mutationFn: paymentService.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries(['customerDebt']);
    },
  });
}
```

---

## 5. DATABASE INDEXING

### 📝 SQL Script

**File**: `Database/Migrations/AddDebtIndexes.sql`

```sql
-- ============================================
-- DEBT MANAGEMENT - PERFORMANCE INDEXES
-- ============================================

-- 1. Index cho payment status filter
-- Covers: WHERE PaymentStatus = 'Unpaid'
CREATE INDEX IDX_Invoice_PaymentStatus 
ON Invoices(PaymentStatus) 
INCLUDE (CustomerId, InvoiceDate, TotalAmount, PaidAmount, RemainingAmount);

-- 2. Index cho customer debt queries
-- Covers: WHERE CustomerId = X AND PaymentStatus = Y ORDER BY InvoiceDate DESC
CREATE INDEX IDX_Invoice_Customer_Status_Date 
ON Invoices(CustomerId, PaymentStatus, InvoiceDate DESC)
INCLUDE (InvoiceNumber, TotalAmount, PaidAmount, RemainingAmount, DueDate);

-- 3. Index cho overdue invoices
-- Covers: WHERE DueDate < NOW() AND PaymentStatus IN ('Unpaid', 'PartiallyPaid')
CREATE INDEX IDX_Invoice_DueDate_Status 
ON Invoices(DueDate, PaymentStatus) 
INCLUDE (CustomerId, InvoiceNumber, TotalAmount, RemainingAmount)
WHERE PaymentStatus IN ('Unpaid', 'PartiallyPaid');

-- 4. Index cho payment history by customer
-- Covers: JOIN Payments ON Invoice WHERE Invoice.CustomerId = X ORDER BY PaymentDate DESC
CREATE INDEX IDX_Payment_Customer_Date 
ON Payments(InvoiceId, PaymentDate DESC)
INCLUDE (Amount, PaymentMethod, TransactionCode, Note, UserId);

-- 5. Composite index cho search by invoice number
-- Covers: WHERE CustomerId = X AND InvoiceNumber LIKE 'C24%'
CREATE INDEX IDX_Invoice_Number_Customer 
ON Invoices(InvoiceNumber, CustomerId)
INCLUDE (InvoiceDate, TotalAmount, PaymentStatus);

-- 6. Index cho invoice status và customer
-- Covers: WHERE CustomerId = X AND Status = 'ISSUED'
CREATE INDEX IDX_Invoice_Status_Customer
ON Invoices(Status, CustomerId)
INCLUDE (InvoiceNumber, InvoiceDate, TotalAmount, PaymentStatus);

-- 7. Foreign key index (nếu chưa có)
CREATE INDEX IF NOT EXISTS IDX_Invoice_CustomerId 
ON Invoices(CustomerId);

CREATE INDEX IF NOT EXISTS IDX_Payment_InvoiceId 
ON Payments(InvoiceId);

CREATE INDEX IF NOT EXISTS IDX_Payment_UserId 
ON Payments(UserId);

-- ============================================
-- VERIFY INDEXES
-- ============================================

-- Check created indexes
SELECT 
    i.name AS IndexName,
    t.name AS TableName,
    COL_NAME(ic.object_id, ic.column_id) AS ColumnName,
    ic.is_included_column AS IsIncluded
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE i.name LIKE 'IDX_%'
ORDER BY t.name, i.name, ic.key_ordinal;

-- Analyze index usage (after running for a while)
SELECT 
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    s.user_seeks,
    s.user_scans,
    s.user_lookups,
    s.user_updates,
    s.last_user_seek,
    s.last_user_scan
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE OBJECT_NAME(s.object_id) IN ('Invoices', 'Payments')
ORDER BY s.user_seeks + s.user_scans + s.user_lookups DESC;
```

---

## 6. QUERY OPTIMIZATION

### ❌ Bad Practice - N+1 Query Problem

```csharp
// DON'T DO THIS
public async Task<List<InvoiceDto>> GetInvoices(int customerId)
{
    var invoices = await _context.Invoices
        .Where(i => i.CustomerId == customerId)
        .ToListAsync(); // 1 query
    
    foreach (var invoice in invoices)
    {
        // N queries (1 for each invoice)
        invoice.Customer = await _context.Customers.FindAsync(invoice.CustomerId);
        invoice.Payments = await _context.Payments
            .Where(p => p.InvoiceId == invoice.InvoiceId)
            .ToListAsync();
    }
    
    return invoices;
}
```

### ✅ Good Practice - Optimized Query

```csharp
// DO THIS
public async Task<List<InvoiceDto>> GetInvoices(int customerId)
{
    return await _context.Invoices
        .Where(i => i.CustomerId == customerId && i.Status == "ISSUED")
        .Include(i => i.Customer) // ✅ Eager loading - 1 JOIN
        .Include(i => i.Payments) // ✅ Eager loading - 1 JOIN
            .ThenInclude(p => p.User) // ✅ Nested include
        .Select(i => new InvoiceDto // ✅ Project only needed fields
        {
            InvoiceId = i.InvoiceId,
            InvoiceNumber = i.InvoiceNumber,
            InvoiceDate = i.InvoiceDate,
            TotalAmount = i.TotalAmount,
            PaidAmount = i.PaidAmount,
            RemainingAmount = i.RemainingAmount,
            PaymentStatus = i.PaymentStatus,
            CustomerName = i.Customer.Name,
            PaymentCount = i.Payments.Count,
            LastPaymentDate = i.Payments
                .OrderByDescending(p => p.PaymentDate)
                .Select(p => (DateTime?)p.PaymentDate)
                .FirstOrDefault()
        })
        .OrderByDescending(i => i.InvoiceDate) // ✅ Sort at database level
        .AsSplitQuery() // ✅ Avoid cartesian explosion for multiple includes
        .ToListAsync();
}
```

### 🎯 Query Performance Tips

1. **Use AsNoTracking()** for read-only queries:
```csharp
.AsNoTracking() // Faster for read-only operations
```

2. **Use AsSplitQuery()** when multiple Includes:
```csharp
.AsSplitQuery() // Prevents cartesian explosion
```

3. **Project early with Select()**:
```csharp
.Select(i => new InvoiceDto { ... }) // Only select needed columns
```

4. **Filter before Include**:
```csharp
.Where(i => i.Status == "ISSUED") // Filter first
.Include(i => i.Customer) // Then include
```

5. **Use IndexOf or Contains for IN queries**:
```csharp
var statuses = new[] { "Unpaid", "PartiallyPaid" };
.Where(i => statuses.Contains(i.PaymentStatus))
```

---

## 7. ERROR HANDLING & VALIDATION

### A. Consistent Error Response Format

```csharp
// Models/ErrorResponse.cs
public class ErrorResponse
{
    public string Error { get; set; }          // Error code: CUSTOMER_NOT_FOUND
    public string Message { get; set; }        // User-friendly message
    public Dictionary<string, string[]>? Errors { get; set; } // Validation errors
    public string? TraceId { get; set; }       // For debugging
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

// Usage in Controller
catch (NotFoundException ex)
{
    return NotFound(new ErrorResponse
    {
        Error = "CUSTOMER_NOT_FOUND",
        Message = ex.Message,
        TraceId = HttpContext.TraceIdentifier
    });
}

catch (ValidationException ex)
{
    return BadRequest(new ErrorResponse
    {
        Error = "VALIDATION_ERROR",
        Message = "One or more validation errors occurred",
        Errors = ex.Errors,
        TraceId = HttpContext.TraceIdentifier
    });
}

catch (Exception ex)
{
    _logger.LogError(ex, "Unexpected error in GetCustomerDebtDetail");
    return StatusCode(500, new ErrorResponse
    {
        Error = "INTERNAL_ERROR",
        Message = "An unexpected error occurred",
        TraceId = HttpContext.TraceIdentifier
    });
}
```

### B. Input Validation

```csharp
// Use FluentValidation
public class DebtDetailQueryValidator : AbstractValidator<DebtDetailQuery>
{
    public DebtDetailQueryValidator()
    {
        RuleFor(x => x.CustomerId)
            .GreaterThan(0)
            .WithMessage("Customer ID must be greater than 0");

        RuleFor(x => x.PageIndex)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page index must be at least 1");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("Page size must be between 1 and 100");

        RuleFor(x => x.SortBy)
            .Must(x => new[] { "invoiceDate", "amount", "dueDate" }.Contains(x))
            .When(x => !string.IsNullOrEmpty(x.SortBy))
            .WithMessage("Invalid sort field");

        RuleFor(x => x.FromDate)
            .LessThanOrEqualTo(x => x.ToDate)
            .When(x => x.FromDate.HasValue && x.ToDate.HasValue)
            .WithMessage("From date must be before to date");
    }
}
```

---

## 8. RATE LIMITING

### Implementation

```csharp
// Program.cs
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Add rate limiting
builder.Services.AddRateLimiter(options =>
{
    // Global rate limiter
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var username = context.User.Identity?.Name ?? "anonymous";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: username,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            });
    });

    // Specific policy for debt APIs
    options.AddFixedWindowLimiter("debt-api", options =>
    {
        options.PermitLimit = 50;
        options.Window = TimeSpan.FromMinutes(1);
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.QueueLimit = 2;
    });

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(new ErrorResponse
        {
            Error = "RATE_LIMIT_EXCEEDED",
            Message = "Too many requests. Please try again later.",
        }, cancellationToken);
    };
});

var app = builder.Build();

app.UseRateLimiter();

// Controller
[EnableRateLimiting("debt-api")]
[HttpGet("{customerId}/debt-detail")]
public async Task<IActionResult> GetCustomerDebtDetail(...)
{
    // ...
}
```

---

## 9. LOGGING & MONITORING

### A. Structured Logging

```csharp
public class CustomerService
{
    private readonly ILogger<CustomerService> _logger;

    public async Task<CustomerDebtDetailResult> GetCustomerDebtDetailAsync(...)
    {
        using var scope = _logger.BeginScope(new Dictionary<string, object>
        {
            ["CustomerId"] = customerId,
            ["InvoicePageIndex"] = invoicePageIndex,
            ["InvoicePageSize"] = invoicePageSize
        });

        var stopwatch = Stopwatch.StartNew();

        _logger.LogInformation(
            "Starting debt detail fetch for customer {CustomerId}",
            customerId);

        try
        {
            var result = await FetchDataAsync(...);

            stopwatch.Stop();

            // Log metrics
            _logger.LogInformation(
                "Debt detail fetched successfully. " +
                "InvoiceCount: {InvoiceCount}, " +
                "PaymentCount: {PaymentCount}, " +
                "ElapsedMs: {ElapsedMs}",
                result.UnpaidInvoices.Count,
                result.PaymentHistory.Count,
                stopwatch.ElapsedMilliseconds);

            // Alert on slow queries
            if (stopwatch.ElapsedMilliseconds > 1000)
            {
                _logger.LogWarning(
                    "Slow query detected for customer {CustomerId}: {ElapsedMs}ms",
                    customerId,
                    stopwatch.ElapsedMilliseconds);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error fetching debt detail for customer {CustomerId}",
                customerId);
            throw;
        }
    }
}
```

### B. Application Insights (Azure)

```csharp
// Add telemetry
public class CustomerService
{
    private readonly TelemetryClient _telemetry;

    public async Task<CustomerDebtDetailResult> GetCustomerDebtDetailAsync(...)
    {
        using var operation = _telemetry.StartOperation<RequestTelemetry>("GetCustomerDebtDetail");
        operation.Telemetry.Properties["CustomerId"] = customerId.ToString();

        var stopwatch = Stopwatch.StartNew();

        try
        {
            var result = await FetchDataAsync(...);

            stopwatch.Stop();

            // Track metrics
            _telemetry.TrackMetric("DebtDetailFetchTime", stopwatch.ElapsedMilliseconds);
            _telemetry.TrackMetric("InvoiceCount", result.UnpaidInvoices.Count);

            operation.Telemetry.Success = true;
            return result;
        }
        catch (Exception ex)
        {
            operation.Telemetry.Success = false;
            _telemetry.TrackException(ex);
            throw;
        }
    }
}
```

### C. Health Checks

```csharp
// Program.cs
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>()
    .AddCheck("debt-api", () =>
    {
        // Check if debt API is responding
        return HealthCheckResult.Healthy("Debt API is healthy");
    });

app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready");
app.MapHealthChecks("/health/live");
```

---

## 10. IMPLEMENTATION CHECKLIST

### 📋 Phase 1: Performance & Scalability (1-2 days)

- [ ] **Database Indexing**
  - [ ] Create `IDX_Invoice_PaymentStatus` index
  - [ ] Create `IDX_Invoice_Customer_Status_Date` index
  - [ ] Create `IDX_Invoice_DueDate_Status` index
  - [ ] Create `IDX_Payment_Customer_Date` index
  - [ ] Create `IDX_Invoice_Number_Customer` index
  - [ ] Verify indexes are being used (check execution plans)

- [ ] **Server-Side Pagination**
  - [ ] Update `GetCustomerDebtDetail` endpoint with pagination params
  - [ ] Implement pagination in Service layer
  - [ ] Return `PaginatedData<T>` with totalCount, totalPages, etc.
  - [ ] Limit max pageSize to 100
  - [ ] Test with large datasets (1000+ invoices)

- [ ] **Query Optimization**
  - [ ] Use `Include()` for eager loading
  - [ ] Use `Select()` for projection
  - [ ] Use `AsNoTracking()` for read-only queries
  - [ ] Use `AsSplitQuery()` for multiple includes
  - [ ] Remove N+1 query problems
  - [ ] Sort at database level (`OrderBy` before `ToListAsync`)

### 📋 Phase 2: Features & Usability (1 day)

- [ ] **Filtering**
  - [ ] Add `searchInvoiceNumber` parameter
  - [ ] Add `fromDate` and `toDate` parameters
  - [ ] Add `paymentStatus` filter
  - [ ] Add `isOverdue` filter
  - [ ] Add `minAmount` and `maxAmount` filters
  - [ ] Test filter combinations

- [ ] **Sorting**
  - [ ] Support sortBy: invoiceDate, amount, dueDate, invoiceNumber
  - [ ] Support sortOrder: asc, desc
  - [ ] Validate sort parameters
  - [ ] Test sorting with pagination

- [ ] **Caching**
  - [ ] Implement Memory Cache for debt summary
  - [ ] Add cache expiration (5 minutes)
  - [ ] Implement cache invalidation on payment creation
  - [ ] Add Response Cache headers
  - [ ] Consider Redis for distributed caching (optional)

### 📋 Phase 3: Security & Reliability (0.5 day)

- [ ] **Error Handling**
  - [ ] Create consistent `ErrorResponse` model
  - [ ] Implement custom exceptions (NotFoundException, etc.)
  - [ ] Add try-catch with proper logging
  - [ ] Return appropriate HTTP status codes
  - [ ] Include TraceId for debugging

- [ ] **Input Validation**
  - [ ] Validate customerId exists
  - [ ] Validate pagination parameters (pageSize <= 100)
  - [ ] Validate sort parameters
  - [ ] Validate date ranges
  - [ ] Use FluentValidation (optional)

- [ ] **Rate Limiting**
  - [ ] Add rate limiter configuration (100 req/min)
  - [ ] Create specific policy for debt APIs (50 req/min)
  - [ ] Test rate limit responses (429 status)
  - [ ] Add retry-after header

### 📋 Phase 4: Monitoring & Observability (0.5 day)

- [ ] **Logging**
  - [ ] Add structured logging with scopes
  - [ ] Log request parameters
  - [ ] Log execution time
  - [ ] Log result metrics (count, size)
  - [ ] Alert on slow queries (>1000ms)

- [ ] **Metrics**
  - [ ] Track API response times
  - [ ] Track query counts
  - [ ] Track error rates
  - [ ] Track cache hit/miss ratios
  - [ ] Setup Application Insights (Azure)

- [ ] **Health Checks**
  - [ ] Add `/health` endpoint
  - [ ] Check database connectivity
  - [ ] Check cache availability
  - [ ] Add readiness and liveness probes

### 📋 Phase 5: Frontend Integration (1 day)

- [ ] **Update Services**
  - [ ] Update `CustomerDebtDetailResponse` interface
  - [ ] Add `PaginatedData<T>` interface
  - [ ] Update `getCustomerDebtDetail` to accept pagination params
  - [ ] Add filter parameters to API calls
  - [ ] Handle new error response format

- [ ] **Update Components**
  - [ ] Add separate pagination state for invoices and payments
  - [ ] Change DataGrid to `paginationMode="server"`
  - [ ] Implement pagination handlers
  - [ ] Remove frontend sorting (use server-side)
  - [ ] Add filter UI components
  - [ ] Show loading states during fetch
  - [ ] Handle error responses with snackbars

- [ ] **Caching (Optional)**
  - [ ] Install React Query
  - [ ] Wrap component with QueryClientProvider
  - [ ] Use `useQuery` for data fetching
  - [ ] Implement cache invalidation on mutations

### 📋 Testing & Deployment

- [ ] **Testing**
  - [ ] Unit tests for Service layer
  - [ ] Integration tests for API endpoints
  - [ ] Performance tests with large datasets
  - [ ] Load testing (100+ concurrent users)
  - [ ] Test pagination edge cases (first/last page)
  - [ ] Test filter combinations
  - [ ] Test cache invalidation

- [ ] **Documentation**
  - [ ] Update Swagger/OpenAPI docs
  - [ ] Document all query parameters
  - [ ] Add example requests/responses
  - [ ] Document error codes
  - [ ] Update README with deployment notes

- [ ] **Deployment**
  - [ ] Run database migration (indexes)
  - [ ] Deploy backend changes
  - [ ] Deploy frontend changes
  - [ ] Verify health checks
  - [ ] Monitor logs and metrics
  - [ ] Test in production with real data

---

## 📊 EXPECTED RESULTS

### Before Optimization
- Response time: **2-5 seconds**
- Response size: **500KB - 1MB**
- Database queries: **10+ queries** (N+1 problem)
- Memory usage: **High** (loading all data)
- Scalability: **Poor** (crashes with 1000+ invoices)

### After Optimization
- Response time: **< 500ms**
- Response size: **50KB** (10 items per page)
- Database queries: **2-3 queries** (optimized joins)
- Memory usage: **Low** (pagination)
- Scalability: **Good** (handles 10,000+ invoices)

---

## 🚀 PRIORITY RECOMMENDATIONS

**Must Have (Week 1):**
1. ✅ Database indexing
2. ✅ Server-side pagination
3. ✅ Query optimization

**Should Have (Week 2):**
4. ✅ Filtering & sorting
5. ✅ Error handling
6. ✅ Caching

**Nice to Have (Week 3):**
7. ✅ Rate limiting
8. ✅ Logging & monitoring
9. ✅ React Query integration

---

## 📞 SUPPORT

Nếu cần hỗ trợ implementation, chuẩn bị:
1. Backend stack version (.NET 6/7/8?)
2. Database type (SQL Server/PostgreSQL?)
3. Current API response format
4. Performance requirements (concurrent users, response time SLA)

---

**Document Version**: 1.0  
**Last Updated**: 25/12/2025  
**Author**: GitHub Copilot  
**Status**: ✅ Ready for Implementation
