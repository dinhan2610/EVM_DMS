# 📊 BACKEND API REQUIREMENTS - SALES DASHBOARD

**Document Version:** 1.0  
**Date:** 16/01/2026  
**Last Updated:** 17/01/2026  
**Author:** Frontend Team  
**For:** Backend Development Team

---

## ⚠️ TRẠNG THÁI HIỆN TẠI - ĐANG TẠM HOÃN

> **⏸️ SALES DASHBOARD - CHƯA HOÀN CHỈNH**
> 
> **Lý do:** Role Sale và các chức năng liên quan chưa hoàn thiện đầy đủ
> 
> **Kế hoạch:**
> - ✅ Document API requirements đã hoàn tất (sẵn sàng cho backend)
> - ⏳ Đợi frontend hoàn thiện role Sale và business logic
> - 🎯 Khi role Sale hoàn chỉnh → Yêu cầu backend implement theo document này
>
> **Trạng thái API:**
> - ✅ Backend đã thêm các fields mới: `lastMonthRevenue`, `revenueGrowthPercentage`, `newCustomersThisMonth`, `targetRevenue`, `commissionRate`
> - ✅ Backend đã thêm arrays: `salesTrend[]`, `debtWatchlist[]`, `recentSales[]`
> - ⚠️ Các arrays đang empty → **Cần sample data khi ready để implement**
>
> **Action Items (Khi sẵn sàng):**
> 1. Frontend thông báo role Sale đã hoàn chỉnh
> 2. Backend implement đầy đủ theo document này
> 3. Backend cung cấp sample data để test
> 4. Frontend integrate real API
>
> 📅 **Timeline:** TBD (Chờ role Sale hoàn thiện)

---

## 📑 MỤC LỤC

1. [Tổng quan](#1-tổng-quan)
2. [Hiện trạng API](#2-hiện-trạng-api)
3. [Frontend Dashboard Requirements](#3-frontend-dashboard-requirements)
4. [API Gap Analysis](#4-api-gap-analysis)
5. [Yêu cầu Backend](#5-yêu-cầu-backend)
6. [API Response mong muốn](#6-api-response-mong-muốn)

---

## 1. TỔNG QUAN

### 1.1. Endpoint hiện tại
```
GET /api/Dashboard/sales
```

### 1.2. Response hiện tại
```json
{
  "totalInvoicesGenerated": 0,
  "totalRevenue": 0,
  "totalCollected": 0,
  "totalDebt": 0,
  "thisMonthRevenue": 0,
  "thisMonthInvoiceCount": 0,
  "paidCount": 0,
  "unpaidCount": 0,
  "overdueCount": 0,
  "recentSales": []
}
```

### 1.3. Đánh giá chung
- ⚠️ **API quá đơn giản:** Chỉ có số liệu tổng hợp cơ bản
- ❌ **Thiếu nhiều dữ liệu quan trọng:** Không đủ để hiển thị dashboard đầy đủ
- ❌ **Không có chi tiết:** Thiếu breakdown theo tháng, khách hàng, hoa hồng
- ⚠️ **Empty data:** Response mẫu đều là 0, khó test

---

## 2. HIỆN TRẠNG API

### 2.1. API Response Fields

| Field | Type | Mô tả | Frontend dùng? |
|-------|------|-------|----------------|
| `totalInvoicesGenerated` | number | Tổng hóa đơn (all time?) | ⚠️ Không rõ scope |
| `totalRevenue` | number | Tổng doanh thu (all time?) | ⚠️ Không rõ scope |
| `totalCollected` | number | Tổng đã thu | ⚠️ Không rõ scope |
| `totalDebt` | number | Tổng nợ | ⚠️ Không rõ scope |
| `thisMonthRevenue` | number | Doanh thu tháng này | ✅ CẦN |
| `thisMonthInvoiceCount` | number | Số HĐ tháng này | ✅ CẦN |
| `paidCount` | number | Số HĐ đã thanh toán | ⚠️ Scope? |
| `unpaidCount` | number | Số HĐ chưa thanh toán | ⚠️ Scope? |
| `overdueCount` | number | Số HĐ quá hạn | ✅ CẦN |
| `recentSales` | array | Hóa đơn gần đây | ✅ CẦN (thiếu chi tiết) |

### 2.2. Vấn đề scope không rõ ràng

**Vấn đề:**
- `totalRevenue` là all time hay của Sale này?
- `paidCount` là all time hay tháng này?
- Không có filter theo timeframe

**Yêu cầu:**
- **Sale Dashboard phải filter theo SaleID** (chỉ hiển thị dữ liệu của Sale đang login)
- Cần phân biệt rõ: **This Month** vs **All Time** vs **Last Month**

---

## 3. FRONTEND DASHBOARD REQUIREMENTS

### 3.1. Components Frontend đang có

```typescript
// SaleDashboard.tsx hiển thị:
1. SalesKPIs (4 cards)          // ❌ API không đủ
2. TargetProgressChart          // ❌ API không có
3. SalesTrendChart (6 months)   // ❌ API không có
4. DebtWatchlist               // ❌ API không có
5. MyRecentInvoices            // ⚠️ API có nhưng thiếu chi tiết
```

### 3.2. Data Requirements

#### **A. Sales KPIs (4 Cards)**

Frontend cần:
```typescript
interface SalesKPI {
  currentRevenue: number         // ✅ API có: thisMonthRevenue
  lastMonthRevenue: number       // ❌ API THIẾU
  estimatedCommission: number    // ❌ API THIẾU (hoặc FE tính)
  commissionRate: number         // ❌ API THIẾU (config từ đâu?)
  newCustomers: number           // ❌ API THIẾU
  openInvoices: number           // ⚠️ Có thể dùng unpaidCount
}
```

**Hiển thị:**
- Card 1: Doanh thu tháng này (85M ₫) vs tháng trước (+9%)
- Card 2: Hoa hồng ước tính (1.7M ₫)
- Card 3: Khách hàng mới (8 khách)
- Card 4: Hóa đơn chưa thu (12 HĐ)

---

#### **B. Target Progress (Gauge Chart)**

Frontend cần:
```typescript
interface TargetProgress {
  currentRevenue: number      // ✅ API có: thisMonthRevenue
  targetRevenue: number       // ❌ API THIẾU (goal từ đâu?)
  completionRate: number      // ❌ API THIẾU (hoặc FE tính)
  remainingAmount: number     // ❌ API THIẾU (hoặc FE tính)
  daysLeft: number            // ❌ API THIẾU (FE có thể tự tính)
}
```

**Hiển thị:**
- Gauge: 85% hoàn thành target
- Số tiền: 85M / 100M
- Còn lại: 15M (10 ngày)

---

#### **C. Sales Trend (Line Chart - 6 Months)**

Frontend cần:
```typescript
interface SalesTrendData {
  month: string               // "T07/2024", "T08/2024"...
  revenue: number             // Doanh thu tháng đó
  invoiceCount: number        // Số hóa đơn
  commissionEarned: number    // Hoa hồng đã kiếm
}

// Array of 6 months data
SalesTrendData[] // ❌ API THIẾU HOÀN TOÀN
```

**Hiển thị:**
- Line chart: Doanh thu 6 tháng gần nhất
- Tooltip: Tháng, doanh thu, số HĐ, hoa hồng

---

#### **D. Debt Watchlist (Action Table)**

Frontend cần:
```typescript
interface DebtCustomer {
  id: string
  name: string                // ❌ API THIẾU
  company: string             // ❌ API THIẾU
  overdueAmount: number       // ⚠️ Có thể từ totalDebt (nhưng không breakdown)
  overdueDays: number         // ❌ API THIẾU
  lastContactDate: Date       // ❌ API THIẾU
  phone: string               // ❌ API THIẾU
  email: string               // ❌ API THIẾU
  urgencyLevel: 'critical' | 'high' | 'medium'  // ❌ API THIẾU
}

DebtCustomer[]  // Top 5-10 khách nợ quá hạn
```

**Hiển thị:**
- Table: Khách hàng nợ quá hạn
- Urgency badge: Critical (>30 days), High (15-30), Medium (<15)
- Actions: Call button, Send reminder button

---

#### **E. My Recent Invoices (Table)**

Frontend cần:
```typescript
interface SalesInvoice {
  id: string                  // ❌ API thiếu
  invoiceNumber: string       // ❌ API thiếu
  customerName: string        // ❌ API thiếu
  amount: number              // ❌ API thiếu
  status: 'paid' | 'unpaid' | 'rejected' | 'pending'  // ❌ API thiếu
  issueDate: Date             // ❌ API thiếu
  dueDate: Date               // ❌ API thiếu
  isPriority: boolean         // ❌ API thiếu (rejected = priority)
}

SalesInvoice[]  // Top 10 hóa đơn gần nhất
```

**Hiển thị:**
- Table: 10 hóa đơn gần nhất của Sale
- Status badges: Paid (green), Unpaid (orange), Rejected (red)
- Priority flag: Rejected invoices cần xử lý gấp

---

## 4. API GAP ANALYSIS

### 🔴 CRITICAL - Thiếu hoàn toàn

| Data | Frontend cần | API hiện tại | Gap |
|------|-------------|--------------|-----|
| **Sales Trend 6 months** | ✅ Bắt buộc | ❌ Không có | Cần API mới |
| **Debt Watchlist** | ✅ Bắt buộc | ❌ Không có | Cần API mới |
| **Recent Invoices Detail** | ✅ Bắt buộc | ⚠️ Có array rỗng | Cần chi tiết |
| **Target Revenue** | ✅ Bắt buộc | ❌ Không có | Cần config |
| **Commission Rate** | ✅ Bắt buộc | ❌ Không có | Cần config |

### 🟡 MEDIUM - Có nhưng thiếu

| Data | Frontend cần | API hiện tại | Gap |
|------|-------------|--------------|-----|
| **Last Month Revenue** | ✅ Cần | ❌ Không có | Để tính % growth |
| **New Customers Count** | ✅ Cần | ❌ Không có | Hiển thị KPI |
| **Open Invoices** | ✅ Cần | ⚠️ unpaidCount | Không rõ scope |

### 🟢 OK - Có thể dùng được

| Data | Frontend cần | API hiện tại | Note |
|------|-------------|--------------|------|
| **This Month Revenue** | ✅ | ✅ thisMonthRevenue | OK |
| **This Month Invoice Count** | ✅ | ✅ thisMonthInvoiceCount | OK |
| **Overdue Count** | ✅ | ✅ overdueCount | OK |

---

## 5. YÊU CẦU BACKEND

### 🔴 PRIORITY 1 - MUST HAVE (Week 1)

#### **5.1. Fix recentSales array**

**Hiện tại:** `"recentSales": []` (empty)

**Yêu cầu:**
```json
"recentSales": [
  {
    "invoiceId": 150,
    "invoiceNumber": "HD-2026-150",
    "customerName": "Công ty ABC",
    "amount": 15000000,
    "statusName": "Paid",              // ✅ PascalCase
    "paymentStatus": "Paid",
    "issueDate": "2026-01-10T08:00:00Z",
    "dueDate": "2026-02-10T08:00:00Z",
    "isPriority": false                 // true nếu status = Rejected
  }
]
```

**Limit:** Top 10 invoices gần nhất của Sale này (ORDER BY issueDate DESC)

---

#### **5.2. Add lastMonthRevenue**

**Mục đích:** Tính % growth so với tháng trước

**Yêu cầu thêm field:**
```json
{
  "thisMonthRevenue": 85000000,
  "lastMonthRevenue": 78000000,         // ✨ NEW
  "revenueGrowthPercentage": 8.97       // ✨ NEW (optional, FE có thể tính)
}
```

---

#### **5.3. Add newCustomersThisMonth**

**Mục đích:** Hiển thị KPI "Khách hàng mới"

**Logic:**
```sql
SELECT COUNT(DISTINCT customerId)
FROM Invoices
WHERE saleId = :currentSaleId
  AND MONTH(createdAt) = CURRENT_MONTH
  AND customerId NOT IN (
    SELECT DISTINCT customerId
    FROM Invoices
    WHERE saleId = :currentSaleId
      AND createdAt < START_OF_CURRENT_MONTH
  )
```

**Yêu cầu thêm field:**
```json
{
  "newCustomersThisMonth": 8  // ✨ NEW
}
```

---

#### **5.4. Add targetRevenue & commissionRate**

**Mục đích:** Hiển thị Target Progress Gauge

**Yêu cầu thêm fields:**
```json
{
  "targetRevenue": 100000000,     // ✨ NEW: Goal tháng này (config từ Admin)
  "commissionRate": 2.0           // ✨ NEW: % hoa hồng (config)
}
```

**Note:**
- `targetRevenue`: Nên lấy từ bảng `SaleTargets` hoặc config
- `commissionRate`: Lấy từ `Users` table hoặc config global

---

### 🟡 PRIORITY 2 - SHOULD HAVE (Week 2)

#### **5.5. Add salesTrend (6 months history)**

**Mục đích:** Hiển thị Line Chart xu hướng doanh thu

**Yêu cầu thêm field:**
```json
{
  "salesTrend": [
    {
      "month": "Aug 2025",           // hoặc "T08/2025"
      "monthNumber": 8,
      "year": 2025,
      "revenue": 78000000,
      "invoiceCount": 28,
      "commissionEarned": 1560000    // revenue × commissionRate
    },
    {
      "month": "Sep 2025",
      "monthNumber": 9,
      "year": 2025,
      "revenue": 68000000,
      "invoiceCount": 22,
      "commissionEarned": 1360000
    }
    // ... 4 more months (total 6)
  ]
}
```

**Logic:**
```sql
SELECT 
  MONTH(i.createdAt) as monthNumber,
  YEAR(i.createdAt) as year,
  SUM(i.totalAmount) as revenue,
  COUNT(*) as invoiceCount
FROM Invoices i
WHERE i.saleId = :currentSaleId
  AND i.createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
  AND i.status != 'Cancelled'
GROUP BY YEAR(i.createdAt), MONTH(i.createdAt)
ORDER BY year DESC, monthNumber DESC
LIMIT 6
```

---

#### **5.6. Add debtWatchlist (Top overdue customers)**

**Mục đích:** Sale cần theo dõi khách nợ quá hạn để liên hệ

**Yêu cầu thêm field:**
```json
{
  "debtWatchlist": [
    {
      "customerId": 45,
      "customerName": "Trần Văn B",
      "companyName": "Công ty TNHH XYZ",
      "overdueAmount": 18500000,
      "overdueDays": 45,                     // Số ngày quá hạn
      "lastContactDate": "2026-01-09T00:00:00Z",  // Lần gọi/email cuối
      "phone": "0912345678",
      "email": "tranvanb@xyz.com",
      "urgencyLevel": "Critical"             // Critical | High | Medium
    }
  ]
}
```

**Logic:**
```sql
SELECT 
  c.customerId,
  c.customerName,
  c.companyName,
  c.phone,
  c.email,
  SUM(i.totalAmount - i.paidAmount) as overdueAmount,
  MAX(DATEDIFF(NOW(), i.dueDate)) as overdueDays,
  (SELECT MAX(contactDate) FROM CustomerContacts WHERE customerId = c.customerId) as lastContactDate,
  CASE 
    WHEN DATEDIFF(NOW(), i.dueDate) > 30 THEN 'Critical'
    WHEN DATEDIFF(NOW(), i.dueDate) > 15 THEN 'High'
    ELSE 'Medium'
  END as urgencyLevel
FROM Invoices i
JOIN Customers c ON i.customerId = c.customerId
WHERE i.saleId = :currentSaleId
  AND i.dueDate < NOW()
  AND i.paymentStatus IN ('Unpaid', 'PartiallyPaid')
GROUP BY c.customerId
ORDER BY overdueDays DESC
LIMIT 10
```

**Urgency Rules:**
- `Critical`: Quá hạn > 30 ngày
- `High`: Quá hạn 15-30 ngày
- `Medium`: Quá hạn < 15 ngày

---

### 🟢 PRIORITY 3 - NICE TO HAVE (Future)

#### **5.7. Filter by date range**

**Mục đích:** Xem dashboard của tháng khác

```typescript
GET /api/Dashboard/sales?startDate=2025-12-01&endDate=2025-12-31
```

---

#### **5.8. Commission calculation details**

**Mục đích:** Breakdown hoa hồng chi tiết

```json
{
  "commissionDetails": {
    "baseCommission": 1700000,        // 2% của doanh thu
    "bonusCommission": 300000,        // Bonus nếu đạt target
    "totalCommission": 2000000,
    "paidCommission": 1000000,        // Đã trả
    "pendingCommission": 1000000      // Chưa trả
  }
}
```

---

## 6. API RESPONSE MONG MUỐN

### 6.1. Full Response Schema

```typescript
interface SalesDashboardResponse {
  // === BASIC STATS ===
  totalInvoicesGenerated: number      // All time (keep)
  totalRevenue: number                // All time (keep)
  totalCollected: number              // All time (keep)
  totalDebt: number                   // All time (keep)
  
  // === THIS MONTH ===
  thisMonthRevenue: number            // ✅ Keep
  thisMonthInvoiceCount: number       // ✅ Keep
  lastMonthRevenue: number            // ✨ NEW
  revenueGrowthPercentage?: number    // ✨ NEW (optional)
  newCustomersThisMonth: number       // ✨ NEW
  
  // === COUNTS ===
  paidCount: number                   // ✅ Keep (clarify scope)
  unpaidCount: number                 // ✅ Keep (clarify scope)
  overdueCount: number                // ✅ Keep
  
  // === TARGET & COMMISSION ===
  targetRevenue: number               // ✨ NEW
  commissionRate: number              // ✨ NEW (e.g., 2.0 = 2%)
  estimatedCommission?: number        // ✨ NEW (optional, can calculate)
  
  // === TREND DATA ===
  salesTrend: Array<{                 // ✨ NEW
    month: string                     // "Aug 2025"
    monthNumber: number               // 8
    year: number                      // 2025
    revenue: number
    invoiceCount: number
    commissionEarned: number
  }>
  
  // === DEBT WATCHLIST ===
  debtWatchlist: Array<{              // ✨ NEW
    customerId: number
    customerName: string
    companyName: string
    overdueAmount: number
    overdueDays: number
    lastContactDate: string | null
    phone: string
    email: string
    urgencyLevel: 'Critical' | 'High' | 'Medium'
  }>
  
  // === RECENT INVOICES ===
  recentSales: Array<{                // ✅ Keep but enhance
    invoiceId: number
    invoiceNumber: string             // ✨ NEW
    customerName: string              // ✨ NEW
    amount: number                    // ✨ NEW
    statusName: string                // ✨ NEW (PascalCase)
    paymentStatus: string             // ✨ NEW
    issueDate: string                 // ✨ NEW (ISO 8601)
    dueDate: string                   // ✨ NEW (ISO 8601)
    isPriority: boolean               // ✨ NEW
  }>
}
```

### 6.2. Example Response (Full)

```json
{
  "totalInvoicesGenerated": 245,
  "totalRevenue": 890000000,
  "totalCollected": 780000000,
  "totalDebt": 110000000,
  
  "thisMonthRevenue": 85000000,
  "thisMonthInvoiceCount": 29,
  "lastMonthRevenue": 78000000,
  "revenueGrowthPercentage": 8.97,
  "newCustomersThisMonth": 8,
  
  "paidCount": 17,
  "unpaidCount": 12,
  "overdueCount": 3,
  
  "targetRevenue": 100000000,
  "commissionRate": 2.0,
  "estimatedCommission": 1700000,
  
  "salesTrend": [
    {
      "month": "Aug 2025",
      "monthNumber": 8,
      "year": 2025,
      "revenue": 78000000,
      "invoiceCount": 28,
      "commissionEarned": 1560000
    },
    {
      "month": "Sep 2025",
      "monthNumber": 9,
      "year": 2025,
      "revenue": 68000000,
      "invoiceCount": 22,
      "commissionEarned": 1360000
    },
    {
      "month": "Oct 2025",
      "monthNumber": 10,
      "year": 2025,
      "revenue": 82000000,
      "invoiceCount": 30,
      "commissionEarned": 1640000
    },
    {
      "month": "Nov 2025",
      "monthNumber": 11,
      "year": 2025,
      "revenue": 76000000,
      "invoiceCount": 26,
      "commissionEarned": 1520000
    },
    {
      "month": "Dec 2025",
      "monthNumber": 12,
      "year": 2025,
      "revenue": 78000000,
      "invoiceCount": 27,
      "commissionEarned": 1560000
    },
    {
      "month": "Jan 2026",
      "monthNumber": 1,
      "year": 2026,
      "revenue": 85000000,
      "invoiceCount": 29,
      "commissionEarned": 1700000
    }
  ],
  
  "debtWatchlist": [
    {
      "customerId": 45,
      "customerName": "Trần Văn B",
      "companyName": "Công ty TNHH XYZ",
      "overdueAmount": 18500000,
      "overdueDays": 45,
      "lastContactDate": "2026-01-09T00:00:00Z",
      "phone": "0912345678",
      "email": "tranvanb@xyz.com",
      "urgencyLevel": "Critical"
    },
    {
      "customerId": 67,
      "customerName": "Lê Thị C",
      "companyName": "Cửa hàng Điện máy C",
      "overdueAmount": 12300000,
      "overdueDays": 28,
      "lastContactDate": "2026-01-13T00:00:00Z",
      "phone": "0987654321",
      "email": "lethic@dienmayc.vn",
      "urgencyLevel": "High"
    },
    {
      "customerId": 89,
      "customerName": "Phạm Văn D",
      "companyName": "Siêu thị Mini D",
      "overdueAmount": 8700000,
      "overdueDays": 18,
      "lastContactDate": "2026-01-15T00:00:00Z",
      "phone": "0909111222",
      "email": "phamvand@minimart.vn",
      "urgencyLevel": "Medium"
    }
  ],
  
  "recentSales": [
    {
      "invoiceId": 150,
      "invoiceNumber": "HD-2026-150",
      "customerName": "Công ty ABC",
      "amount": 15000000,
      "statusName": "Paid",
      "paymentStatus": "Paid",
      "issueDate": "2026-01-11T08:00:00Z",
      "dueDate": "2026-02-11T08:00:00Z",
      "isPriority": false
    },
    {
      "invoiceId": 149,
      "invoiceNumber": "HD-2026-149",
      "customerName": "Công ty TNHH XYZ",
      "amount": 18500000,
      "statusName": "Unpaid",
      "paymentStatus": "Unpaid",
      "issueDate": "2025-11-28T08:00:00Z",
      "dueDate": "2025-12-28T08:00:00Z",
      "isPriority": true
    },
    {
      "invoiceId": 148,
      "invoiceNumber": "HD-2026-148",
      "customerName": "Cửa hàng Điện máy C",
      "amount": 12300000,
      "statusName": "Rejected",
      "paymentStatus": "Unpaid",
      "issueDate": "2026-01-06T08:00:00Z",
      "dueDate": "2026-02-06T08:00:00Z",
      "isPriority": true
    }
  ]
}
```

---

## 7. SECURITY REQUIREMENTS

### 🔒 Authorization

**CRITICAL:** API **PHẢI** filter theo `saleId = currentUserId`

```csharp
// Backend validation
var currentUserId = User.GetUserId();
var userRole = User.GetRole();

if (userRole != "Sale") {
  return Forbid();
}

// Filter all queries by saleId
var invoices = _context.Invoices
  .Where(i => i.SaleId == currentUserId)
  .ToList();
```

**Sale không được xem dữ liệu của Sale khác!**

---

## 8. TESTING CHECKLIST

### Backend cần test:

- ✅ API chỉ trả về dữ liệu của Sale đang login
- ✅ `recentSales` có đủ 10 items (nếu có)
- ✅ `salesTrend` có đúng 6 tháng
- ✅ `debtWatchlist` sort theo `overdueDays` DESC
- ✅ `urgencyLevel` tính đúng (Critical/High/Medium)
- ✅ `commissionEarned` = revenue × commissionRate
- ✅ `revenueGrowthPercentage` tính đúng
- ✅ Dates ở format ISO 8601 UTC
- ✅ Status names PascalCase (không underscore)
- ✅ Handle empty data (Sale mới, chưa có invoice)

---

## 9. PRIORITY & TIMELINE

### ⏸️ **CURRENT STATUS: ON HOLD**

**Lý do tạm hoãn:**
- Role Sale và các chức năng liên quan chưa hoàn thiện
- Frontend cần hoàn tất business logic trước khi integrate API
- Document này đã sẵn sàng cho backend khi cần implement

---

### 🎯 **IMPLEMENTATION PLAN (Khi Role Sale hoàn chỉnh)**

#### **Phase 1: Backend Preparation** (1-2 days)
1. ✅ Review document requirements
2. ✅ Clarify business logic với Frontend Team
3. ✅ Setup database queries và filters
4. ✅ Implement security (filter by saleId)

#### **Phase 2: Priority 1 - MUST HAVE** (Week 1)
1. ✅ Fix `recentSales` array (add chi tiết đầy đủ)
2. ✅ Confirm `lastMonthRevenue` đã có
3. ✅ Confirm `newCustomersThisMonth` đã có
4. ✅ Confirm `targetRevenue` & `commissionRate` đã có
5. ✅ **Cung cấp sample data** cho tất cả fields

#### **Phase 3: Priority 2 - SHOULD HAVE** (Week 2)
5. ✅ Implement `salesTrend` (6 months history)
   - Include logic tính `commissionEarned`
   - Format month names chuẩn
6. ✅ Implement `debtWatchlist` (top 10 overdue customers)
   - Calculate `urgencyLevel` logic
   - Include customer contact info

#### **Phase 4: Testing & Validation** (2-3 days)
7. ✅ Test API với real Sale user
8. ✅ Verify security (chỉ xem data của mình)
9. ✅ Test edge cases (Sale mới, no invoices, empty data)
10. ✅ Frontend integration testing

#### **Phase 5: Future Enhancements** (Optional)
11. Add date range filter
12. Add commission breakdown details
13. Performance optimization

---

### 📋 **READINESS CHECKLIST**

#### **Frontend Ready When:**
- [ ] Role Sale business logic hoàn thiện
- [ ] Sale user flows completed
- [ ] Mock data testing successful
- [ ] UI components finalized
- [ ] Ready to integrate real API

#### **Backend Ready When:**
- [ ] All Priority 1 fields có sample data
- [ ] All Priority 2 arrays implemented
- [ ] Security filters working
- [ ] API documentation updated
- [ ] Test cases passed

#### **Integration Ready When:**
- [ ] Frontend thông báo sẵn sàng
- [ ] Backend confirm API ready
- [ ] Sample data available for testing
- [ ] Both teams aligned on data structure

---

### 🔔 **NOTIFICATION PROCESS**

**Khi Frontend hoàn tất Role Sale:**
1. Frontend Lead thông báo qua Slack #backend-api-support
2. Schedule meeting giữa Frontend & Backend teams
3. Review document này và clarify questions
4. Backend estimate timeline
5. Start implementation theo phases trên

---

### 📅 **ESTIMATED TIMELINE (Khi bắt đầu)**

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1 | 1-2 days | Backend prep & review |
| Phase 2 | 3-5 days | Priority 1 implementation |
| Phase 3 | 3-5 days | Priority 2 implementation |
| Phase 4 | 2-3 days | Testing & validation |
| **Total** | **~2 weeks** | Full implementation |

---

## 10. CONTACT & SUPPORT

**Frontend Team:**
- Lead: Frontend Dev Team
- Slack: #backend-api-support

**Questions?**
- API Documentation: `/api/swagger`
- Issues: GitHub Issues hoặc Slack

---

**END OF DOCUMENT**

---

## 📝 **QUICK SUMMARY FOR BACKEND TEAM**

### **Hiện trạng:**
- ✅ API structure đã tốt, có đầy đủ fields cần thiết
- ✅ Backend đã thêm: `lastMonthRevenue`, `revenueGrowthPercentage`, `newCustomersThisMonth`, `targetRevenue`, `commissionRate`
- ✅ Backend đã thêm arrays: `salesTrend[]`, `debtWatchlist[]`, `recentSales[]`
- ⚠️ **Vấn đề:** Các arrays đang empty, chưa có sample data để test

### **Cần Backend làm gì (Khi Frontend ready):**
1. **Cung cấp sample data** cho 3 arrays (structure trong document section 6.2)
2. **Implement business logic:**
   - `salesTrend`: 6 months history với commission calculation
   - `debtWatchlist`: Top 10 overdue customers với urgency level
   - `recentSales`: Top 10 recent invoices với full details
3. **Security:** Filter tất cả data theo `saleId = currentUserId`
4. **Testing:** Verify với real Sale user

### **Timeline:**
- ⏸️ **Hiện tại:** ON HOLD (chờ Frontend hoàn thiện role Sale)
- 🎯 **Khi ready:** ~2 weeks implementation
- 📧 **Contact:** Frontend Team sẽ thông báo khi sẵn sàng

### **Document này:**
- ✅ Đã hoàn tất 100% requirements
- ✅ Có đầy đủ data structure, SQL logic, examples
- ✅ Sẵn sàng cho backend implement khi cần
- 📌 **Không cần sửa gì thêm** - Chỉ cần chờ Frontend signal

---

**Change Log:**
- v1.0 (16/01/2026): Initial version - Sales Dashboard API requirements
- v1.1 (17/01/2026): Added ON HOLD status - Waiting for role Sale completion

---

✅ **Document READY - Waiting for implementation signal from Frontend Team**
