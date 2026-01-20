# Payment API Integration - Implementation Guide

## 📋 Overview

This document describes the integration of new Payment API endpoints into the Debt Management system.

## 🎯 API Endpoints

### 1. Create Payment (POST /api/Payment)
**Purpose**: Create a new payment record for an invoice

**Request Body**:
```json
{
  "invoiceId": 123,
  "amount": 5000000,
  "paymentMethod": "BankTransfer",
  "transactionCode": "TXN123456",
  "note": "Payment for invoice #INV-2025-001",
  "paymentDate": "2025-01-10T10:30:00Z",
  "userId": 45
}
```

**Response**:
```json
{
  "paymentID": 789,
  "invoiceID": 123,
  "amountPaid": 5000000,
  "remainingAmount": 2000000,  // ✅ NEW - Remaining amount after this payment
  "paymentMethod": "BankTransfer",
  "transactionCode": "TXN123456",
  "note": "Payment for invoice #INV-2025-001",
  "paymentDate": "2025-01-10T10:30:00Z",
  "createdBy": 45,
  "invoice": {
    "invoiceNumber": 12345,
    "customerName": "Công ty ABC",
    "totalAmount": 7000000,
    "paidAmount": 5000000,
    "remainingAmount": 2000000,
    "paymentStatus": "PartiallyPaid"
  },
  "user": {
    "userId": 45,
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com"
  }
}
```

**Field Mapping**:
- `paymentID` → `id`
- `amountPaid` → `amount`
- `createdBy` → `userId`
- ✅ **New**: `remainingAmount` field shows remaining debt after payment

---

### 2. Get Payments (GET /api/Payment)
**Purpose**: Get paginated list of all payments with filters

**Query Parameters**:
- `InvoiceId` (optional): Filter by invoice ID
- `CustomerId` (optional): Filter by customer ID
- `PageIndex` (optional): Page number (default: 1)
- `PageSize` (optional): Items per page (default: 10)
- `SortBy` (optional): Sort field
- `SortOrder` (optional): "asc" or "desc"

**Response Structure** (NEW):
```json
{
  "items": [
    {
      "paymentID": 789,
      "invoiceID": 123,
      "amountPaid": 5000000,
      "remainingAmount": 2000000,
      "paymentMethod": "BankTransfer",
      "transactionCode": "TXN123456",
      "note": "Payment note",
      "paymentDate": "2025-01-10T10:30:00Z",
      "createdBy": 45,
      "invoice": { ... },
      "user": { ... }
    }
  ],
  "pageIndex": 1,
  "totalPages": 5,
  "totalCount": 47,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

**Key Changes**:
- ✅ Response now uses `items[]` array (not `data[]`)
- ✅ Includes `remainingAmount` field in each payment record
- ✅ Standard pagination structure: `pageIndex`, `totalPages`, `totalCount`, `hasPreviousPage`, `hasNextPage`

---

### 3. Get Monthly Debt Report (GET /api/Payment/monthly-debt)
**Purpose**: Get comprehensive monthly debt report for a customer

**Query Parameters**:
- `month` (required): Month number (1-12)
- `year` (required): Year (e.g., 2025, 2026)
- `customerId` (required): Customer ID

**Example Request**:
```
GET /api/Payment/monthly-debt?month=1&year=2026&customerId=12
```

**Response Structure** (Result Pattern):
```json
{
  "value": {
    "summary": {
      "totalReceivable": 50000000,   // Total amount to receive
      "totalPaid": 30000000,          // Total amount paid
      "totalRemaining": 20000000,     // Total remaining debt
      "totalOverdue": 5000000         // Total overdue amount
    },
    "invoices": {
      "items": [
        {
          "invoiceId": 123,
          "invoiceDate": "2025-01-05T00:00:00Z",
          "dueDate": "2025-01-20T00:00:00Z",
          "customerName": "Công ty ABC",
          "totalAmount": 10000000,
          "paidAmount": 6000000,
          "remainingAmount": 4000000,
          "overdueAmount": 4000000,      // Amount overdue (if past dueDate)
          "status": "PartiallyPaid"
        }
      ],
      "pageIndex": 1,
      "totalPages": 3,
      "totalCount": 25,
      "hasPreviousPage": false,
      "hasNextPage": true
    }
  },
  "valueOrDefault": { ... },           // Fallback value
  "isFailed": false,
  "isSuccess": true,
  "reasons": [],
  "errors": [],
  "successes": []
}
```

**Benefits**:
- ✅ Single API call returns both summary statistics and invoice details
- ✅ Summary provides quick overview: totalReceivable, totalPaid, totalRemaining, totalOverdue
- ✅ Nested pagination for invoice list
- ✅ Includes overdue amount calculation per invoice
- ✅ Result pattern wrapper for better error handling

---

## 🔧 Implementation in paymentService.ts

### Updated Type Definitions

```typescript
// Backend response structure
interface BackendPaymentResponse {
  paymentID: number
  invoiceID: number
  amountPaid: number
  remainingAmount: number        // ✅ NEW
  paymentMethod: string
  transactionCode: string | null
  note: string | null
  paymentDate: string
  createdBy: number
  invoice?: {
    invoiceNumber: number
    customerName: string
    totalAmount: number
    paidAmount: number
    remainingAmount: number
    paymentStatus: string
  }
  user?: {
    userId: number
    fullName: string
    email: string
  }
}

// Frontend response format
interface PaymentResponse {
  id: number
  invoiceId: number
  amount: number
  remainingAmount?: number       // ✅ NEW
  paymentMethod: string
  transactionCode?: string
  note?: string
  paymentDate: string
  userId: number
  createdAt: string
  invoice?: { ... }
  user?: { ... }
}

// New paginated response structure
interface BackendPaginatedPaymentResponse {
  items: BackendPaymentResponse[]  // ✅ Changed from 'data' to 'items'
  pageIndex: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

// Monthly debt report types
interface MonthlyDebtInvoice {
  invoiceId: number
  invoiceDate: string
  dueDate: string
  customerName: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  overdueAmount: number
  status: string
}

interface MonthlyDebtSummary {
  totalReceivable: number
  totalPaid: number
  totalRemaining: number
  totalOverdue: number
}

interface MonthlyDebtData {
  summary: MonthlyDebtSummary
  invoices: {
    items: MonthlyDebtInvoice[]
    pageIndex: number
    totalPages: number
    totalCount: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
}

interface MonthlyDebtResponse {
  value: MonthlyDebtData
  valueOrDefault: MonthlyDebtData
  isFailed: boolean
  isSuccess: boolean
  reasons: string[]
  errors: string[]
  successes: string[]
}
```

### Updated Functions

#### 1. createPayment() - Updated
```typescript
export const createPayment = async (paymentData: PaymentRequest): Promise<PaymentResponse> => {
  // ... API call ...
  
  // ✅ NEW: Include remainingAmount in transformation
  const transformedResponse: PaymentResponse = {
    id: backendData.paymentID,
    invoiceId: backendData.invoiceID,
    amount: backendData.amountPaid,
    remainingAmount: backendData.remainingAmount,  // ✅ NEW
    paymentMethod: backendData.paymentMethod,
    transactionCode: backendData.transactionCode || undefined,
    note: backendData.note || undefined,
    paymentDate: backendData.paymentDate,
    userId: backendData.createdBy,
    createdAt: backendData.paymentDate,
    invoice: backendData.invoice ? { ... } : undefined,
    user: backendData.user
  }
  
  return transformedResponse
}
```

#### 2. getPayments() - Updated
```typescript
export const getPayments = async (params?: PaymentQueryParams): Promise<PaginatedPaymentResponse> => {
  // ✅ NEW: Use BackendPaginatedPaymentResponse type
  const response = await axios.get<BackendPaginatedPaymentResponse>(...)
  
  // ✅ NEW: Transform items[] array and map field names
  const transformedPayments: PaymentResponse[] = response.data.items.map(backendPayment => ({
    id: backendPayment.paymentID,
    invoiceId: backendPayment.invoiceID,
    amount: backendPayment.amountPaid,
    remainingAmount: backendPayment.remainingAmount,  // ✅ NEW
    paymentMethod: backendPayment.paymentMethod,
    // ... other fields ...
  }))
  
  // ✅ NEW: Return paginated structure
  return {
    data: transformedPayments,
    pageIndex: response.data.pageIndex,
    totalPages: response.data.totalPages,
    totalCount: response.data.totalCount,
    hasPreviousPage: response.data.hasPreviousPage,
    hasNextPage: response.data.hasNextPage,
  }
}
```

#### 3. getMonthlyDebt() - NEW Function
```typescript
export const getMonthlyDebt = async (
  month: number,
  year: number,
  customerId: number
): Promise<MonthlyDebtData> => {
  const response = await axios.get<MonthlyDebtResponse>(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT.GET_MONTHLY_DEBT}`,
    {
      headers: getAuthHeaders(),
      params: { month, year, customerId },
      timeout: API_CONFIG.TIMEOUT,
    }
  )
  
  // ✅ Handle Result pattern wrapper - use value or valueOrDefault
  const monthlyDebtData = response.data.value || response.data.valueOrDefault
  
  // ✅ Check if operation failed
  if (response.data.isFailed) {
    const errorMessage = response.data.errors?.join(', ') || 'Failed to retrieve monthly debt data'
    throw new Error(errorMessage)
  }
  
  return monthlyDebtData
}
```

---

## 🎨 UI Integration in DebtManagement.tsx

### Current Implementation
The DebtManagement page currently uses:
- `debtService.getCustomerDebtSummary()` - Get list of customers with debt
- `debtService.getCustomerDebtDetail()` - Get invoice and payment details for selected customer

### Recommended Migration Strategy

#### Option 1: Keep Current Structure (Low Impact)
Continue using `debtService` for main data, use new Payment API only for:
- ✅ Creating new payments with `paymentService.createPayment()`
- ✅ Show `remainingAmount` feedback immediately after payment creation
- ✅ Use pagination improvements in payment history

**Benefits**:
- Minimal code changes
- Backward compatible
- Gradual migration

#### Option 2: Use Monthly Debt API (High Performance)
Replace `debtService.getCustomerDebtDetail()` with `paymentService.getMonthlyDebt()`:

```typescript
// Instead of:
const response = await debtService.getCustomerDebtDetail(customerId, { ... })

// Use:
const monthlyDebt = await paymentService.getMonthlyDebt(
  currentMonth,
  currentYear,
  customerId
)

// Display summary statistics
<StatCard 
  label="Tổng phải thu"
  value={formatCurrency(monthlyDebt.summary.totalReceivable)}
/>
<StatCard 
  label="Đã thanh toán"
  value={formatCurrency(monthlyDebt.summary.totalPaid)}
  color="success"
/>
<StatCard 
  label="Còn nợ"
  value={formatCurrency(monthlyDebt.summary.totalRemaining)}
  color="warning"
/>
<StatCard 
  label="Quá hạn"
  value={formatCurrency(monthlyDebt.summary.totalOverdue)}
  color="error"
/>

// Display invoice list
setInvoices(monthlyDebt.invoices.items)
```

**Benefits**:
- ✅ Single API call instead of multiple calls
- ✅ Better performance (reduced network overhead)
- ✅ Summary statistics for dashboard cards
- ✅ Overdue amount per invoice
- ✅ Consistent pagination structure

---

## 🚀 Implementation Checklist

### Phase 1: Service Layer (✅ COMPLETED)
- [x] Add type definitions to `paymentService.ts`
- [x] Update `createPayment()` to handle `remainingAmount`
- [x] Update `getPayments()` to handle new pagination structure
- [x] Add `getMonthlyDebt()` function
- [x] Add `GET_MONTHLY_DEBT` endpoint to `api.config.ts`
- [x] Update service exports

### Phase 2: UI Integration (🔄 PENDING)
- [ ] Update payment creation flow in DebtManagement.tsx
- [ ] Display `remainingAmount` after payment creation
- [ ] Update payment history table with new pagination
- [ ] Test payment creation with different amounts
- [ ] Test pagination with new structure

### Phase 3: Monthly Debt Enhancement (📋 OPTIONAL)
- [ ] Add date picker for month/year selection
- [ ] Implement summary statistics cards
- [ ] Replace `debtService.getCustomerDebtDetail()` with `getMonthlyDebt()`
- [ ] Update invoice table to show overdue amounts
- [ ] Add filter by month/year
- [ ] Test monthly debt report

---

## 🧪 Testing Scenarios

### Test 1: Create Payment
1. Navigate to Debt Management page
2. Select a customer with unpaid invoices
3. Click "Thanh Toán" button
4. Enter payment amount (less than total)
5. Submit payment
6. **Expected**: Success message with remaining amount displayed
7. **Verify**: Invoice list updates with new payment status

### Test 2: Payment History Pagination
1. Navigate to "Lịch Sử Thanh Toán" tab
2. **Expected**: See paginated payment list
3. Click "Next Page"
4. **Verify**: New page loads correctly
5. **Verify**: Page indicators show correct values

### Test 3: Monthly Debt Report
1. Add month/year picker to UI
2. Select month and year
3. Select a customer
4. **Expected**: See summary cards with statistics
5. **Expected**: See invoice list filtered by month
6. **Verify**: Summary totals match invoice details

### Test 4: Full Payment
1. Create payment with amount = total remaining
2. **Expected**: `remainingAmount` should be 0
3. **Expected**: Invoice status changes to "Paid"
4. **Verify**: Invoice removed from unpaid list

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ DebtManagement.tsx (UI Component)                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌───────────────┐      ┌──────────────────┐           │
│  │ Customer List │      │ Invoice List      │           │
│  │ (Summary)     │  →   │ (Detail)          │           │
│  └───────────────┘      └──────────────────┘           │
│         ↓                        ↓                       │
│  ┌─────────────────────────────────────────┐           │
│  │ Payment Modal                            │           │
│  │ - Amount input                           │           │
│  │ - Payment method                         │           │
│  │ - Transaction code                       │           │
│  │ - Note                                   │           │
│  └─────────────────────────────────────────┘           │
│                        ↓                                 │
└────────────────────────┼─────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ paymentService.ts (Service Layer)                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  createPayment(data)                                     │
│  ↓                                                        │
│  POST /api/Payment                                       │
│  ↓                                                        │
│  Transform Response                                      │
│  ↓                                                        │
│  Return { id, amount, remainingAmount, ... }            │
│                                                           │
│  getMonthlyDebt(month, year, customerId)                │
│  ↓                                                        │
│  GET /api/Payment/monthly-debt?...                      │
│  ↓                                                        │
│  Extract value from Result pattern                      │
│  ↓                                                        │
│  Return { summary, invoices }                           │
│                                                           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Backend API (.NET Core)                                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  PaymentController                                       │
│  - POST /api/Payment                                     │
│  - GET /api/Payment                                      │
│  - GET /api/Payment/monthly-debt                        │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Key Points to Remember

1. **Field Mapping**: Backend uses `paymentID`, `amountPaid`, `createdBy` - Frontend uses `id`, `amount`, `userId`

2. **Pagination Structure**: New API uses `items[]` array (not `data[]`)

3. **Result Pattern**: Monthly debt endpoint wraps response in Result pattern - use `value` or `valueOrDefault`

4. **Remaining Amount**: New `remainingAmount` field provides immediate feedback after payment creation

5. **Monthly Report**: Single API call returns both summary statistics and invoice list - more efficient than multiple calls

6. **Error Handling**: Always check `isFailed` flag in monthly debt response before using data

7. **Optional Fields**: Handle `null` values from backend - transform to `undefined` for TypeScript

---

## 📚 Related Files

- `/src/services/paymentService.ts` - Payment API service implementation
- `/src/config/api.config.ts` - API endpoint configuration
- `/src/page/DebtManagement.tsx` - Debt management UI component
- `/src/types/debt.types.ts` - Type definitions for debt/payment entities
- `/docs/PAYMENT_API_INTEGRATION.md` - This documentation file

---

## 🎯 Next Steps

1. ✅ **Service layer updated** - All API functions implemented
2. 🔄 **Test API integration** - Verify payment creation and monthly report
3. 📋 **Update UI** - Integrate new API into DebtManagement page
4. 🚀 **Deploy** - Test in production environment
5. 📊 **Monitor** - Track API performance and user feedback

---

**Last Updated**: January 2025  
**Status**: Service Layer Complete, UI Integration Pending
