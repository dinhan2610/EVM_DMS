# 📊 BACKEND API REQUIREMENTS - ADMIN DASHBOARD

**Document Version:** 1.0  
**Date:** 16/01/2026  
**Author:** Frontend Team  
**For:** Backend Development Team

---

## 📑 MỤC LỤC

1. [Tổng quan](#1-tổng-quan)
2. [Hiện trạng API](#2-hiện-trạng-api)
3. [Các vấn đề cần sửa](#3-các-vấn-đề-cần-sửa)
4. [Yêu cầu bổ sung](#4-yêu-cầu-bổ-sung)
5. [API Response mong muốn](#5-api-response-mong-muốn)

---

## 1. TỔNG QUAN

### 1.1. Endpoint hiện tại
```
GET /api/Dashboard/admin
```

### 1.2. Mục đích
API cung cấp dữ liệu tổng quan cho Admin Dashboard bao gồm:
- ✅ Thống kê tài chính (doanh thu, lợi nhuận, thuế)
- ✅ Số lượng hóa đơn theo trạng thái
- ✅ Thống kê người dùng
- ✅ Xu hướng doanh thu
- ✅ Top khách hàng
- ✅ Hóa đơn gần đây

### 1.3. Đánh giá chung
- ✅ **Cấu trúc API tốt:** Đầy đủ các trường dữ liệu cần thiết
- ⚠️ **Một số vấn đề nhỏ:** Format dữ liệu cần chuẩn hóa
- 🔶 **Thiếu một số tính năng:** Cần bổ sung để tối ưu UX

---

## 2. HIỆN TRẠNG API

### 2.1. Response hiện tại

```json
{
  "currentMonthStats": {
    "totalRevenue": 186311222,
    "netProfit": 174151111,
    "taxLiability": 12160111,
    "collectedAmount": 130000,
    "outstandingAmount": 0,
    "overdueAmount": 0
  },
  "allTimeStats": {
    "totalRevenue": 10455388490,
    "netProfit": 9616475895,
    "taxLiability": 838912595,
    "collectedAmount": 265429998,
    "outstandingAmount": 2691718480,
    "overdueAmount": 0
  },
  "invoiceCounts": {
    "total": 104,
    "paid": 9,
    "unpaid": 91,
    "overdue": 0,
    "cancelled": 0
  },
  "userStats": {
    "totalUsers": 23,
    "totalCustomers": 2,
    "newUsersThisMonth": 10
  },
  "revenueTrend": [
    {
      "month": "Dec 2025",
      "monthNumber": 12,
      "year": 2025,
      "revenue": 43830002
    },
    {
      "month": "Jan 2026",
      "monthNumber": 1,
      "year": 2026,
      "revenue": 186311222
    }
  ],
  "topCustomers": [
    {
      "customerName": "Công ty Hải Âu",
      "invoiceCount": 73,
      "totalSpent": 10346649576
    }
  ],
  "recentInvoices": [
    {
      "invoiceId": 150,
      "invoiceNumber": 3,
      "customerName": "Test Auto Create",
      "createdAt": "2026-01-15T04:00:33.046567Z",
      "amount": 10000000,
      "statusName": "Adjustment_in_process",
      "paymentStatus": "Unpaid"
    }
  ],
  "revenueGrowthPercentage": 325.07691877358343
}
```

---

## 3. CÁC VẤN ĐỀ CẦN SỬA

### ❌ 3.1. Status Name Format (CRITICAL)

**Vấn đề:**
```json
"statusName": "Adjustment_in_process"  // ❌ Underscore không chuẩn
```

**Yêu cầu sửa:**
```json
"statusName": "AdjustmentInProcess"  // ✅ PascalCase
// HOẶC
"statusName": "ADJUSTMENT_IN_PROCESS"  // ✅ SCREAMING_SNAKE_CASE
```

**Lý do:**
- Underscore trông không professional
- Khó parse và mapping
- Không nhất quán với các API khác

**Danh sách status cần chuẩn hóa:**
| Hiện tại ❌ | Nên là ✅ |
|------------|----------|
| `Adjustment_in_process` | `AdjustmentInProcess` |
| `Issued` | `Issued` (OK) |
| `Replaced` | `Replaced` (OK) |
| `Cancelled` | `Cancelled` (OK) |
| `Pending` | `Pending` (OK) |

---

### ⚠️ 3.2. Revenue Growth Percentage Precision

**Vấn đề:**
```json
"revenueGrowthPercentage": 325.07691877358343  // ❌ Quá nhiều số thập phân
```

**Yêu cầu sửa:**
```json
"revenueGrowthPercentage": 325.08  // ✅ Round về 2 chữ số thập phân
```

**Lý do:**
- Frontend chỉ hiển thị 1-2 chữ số thập phân
- Dữ liệu quá chi tiết không cần thiết
- Giảm kích thước response

---

### ⚠️ 3.3. Payment Status Format

**Vấn đề:**
```json
"paymentStatus": "Unpaid"  // ✅ OK nhưng thiếu option
```

**Yêu cầu:**
Đảm bảo các giá trị sau được support:
```
- "Paid"
- "Unpaid"  
- "PartiallyPaid"  (KHÔNG dùng "Partially_Paid")
- "Overdue" (nếu có)
```

---

### 🔶 3.4. CreatedAt Timezone (INFO)

**Hiện tại:**
```json
"createdAt": "2026-01-15T04:00:33.046567Z"  // ✅ UTC format OK
```

**Xác nhận:**
- Đúng format ISO 8601 ✅
- Có timezone Z (UTC) ✅
- Frontend sẽ convert sang múi giờ VN (UTC+7)

---

## 4. YÊU CẦU BỔ SUNG

### 🆕 4.1. Filter by Period (OPTIONAL - NICE TO HAVE)

**Mục đích:** Cho phép xem dashboard theo kỳ khác nhau

**Query Parameters:**
```typescript
GET /api/Dashboard/admin?period=current_month  // Default
GET /api/Dashboard/admin?period=last_month
GET /api/Dashboard/admin?period=last_3_months
GET /api/Dashboard/admin?period=all_time
```

**Lợi ích:**
- Admin có thể xem dashboard của tháng trước
- So sánh performance giữa các tháng
- Phân tích xu hướng dài hạn

---

### 🆕 4.2. User Distribution by Role (OPTIONAL - SHOULD HAVE)

**Vấn đề:**
API hiện tại chỉ có:
```json
"userStats": {
  "totalUsers": 23,
  "totalCustomers": 2,
  "newUsersThisMonth": 10
}
```

**Yêu cầu bổ sung:**
```json
"userStats": {
  "totalUsers": 23,
  "totalCustomers": 2,
  "newUsersThisMonth": 10,
  "usersByRole": [           // ✨ NEW FIELD
    { "role": "Admin", "count": 2 },
    { "role": "HOD", "count": 3 },
    { "role": "Staff", "count": 10 },
    { "role": "Sale", "count": 6 },
    { "role": "Customer", "count": 2 }
  ]
}
```

**Lợi ích:**
- Hiển thị biểu đồ phân bổ user theo role (Pie Chart)
- Admin quản lý số lượng user từng loại
- Dễ phát hiện bất thường (quá nhiều Admin, quá ít Staff)

**Implementation SQL:**
```sql
SELECT 
  role,
  COUNT(*) as count
FROM Users
WHERE isActive = true
GROUP BY role
ORDER BY count DESC
```

---

### 🆕 4.3. Invoice Status Details (OPTIONAL)

**Hiện tại:**
```json
"recentInvoices": [
  {
    "statusName": "Adjustment_in_process",
    "paymentStatus": "Unpaid"
  }
]
```

**Yêu cầu bổ sung:**
```json
"recentInvoices": [
  {
    "statusName": "AdjustmentInProcess",
    "paymentStatus": "Unpaid",
    "dueDate": "2026-02-15T00:00:00Z",     // ✨ NEW: Ngày đến hạn
    "isOverdue": false                      // ✨ NEW: Quá hạn chưa?
  }
]
```

**Lợi ích:**
- Hiển thị ngày đến hạn trên bảng
- Highlight hóa đơn quá hạn (màu đỏ)
- Admin dễ theo dõi hóa đơn cần xử lý gấp

---

### 🆕 4.4. Top Customers Limit (OPTIONAL)

**Hiện tại:** API trả về tất cả customers (không rõ limit)

**Yêu cầu:**
```typescript
GET /api/Dashboard/admin?topCustomersLimit=5  // Default: 5
GET /api/Dashboard/admin?topCustomersLimit=10
```

**Hoặc:** Backend cố định trả về **Top 5** (recommended)

**Lý do:**
- Dashboard chỉ hiển thị 5 khách hàng top
- Giảm kích thước response
- Performance tốt hơn

---

## 5. API RESPONSE MONG MUỐN

### 5.1. Response Schema (Fixed)

```typescript
interface AdminDashboardResponse {
  currentMonthStats: {
    totalRevenue: number
    netProfit: number
    taxLiability: number
    collectedAmount: number
    outstandingAmount: number
    overdueAmount: number
  }
  allTimeStats: {
    totalRevenue: number
    netProfit: number
    taxLiability: number
    collectedAmount: number
    outstandingAmount: number
    overdueAmount: number
  }
  invoiceCounts: {
    total: number
    paid: number
    unpaid: number
    overdue: number
    cancelled: number
  }
  userStats: {
    totalUsers: number
    totalCustomers: number
    newUsersThisMonth: number
    usersByRole?: Array<{          // 🆕 OPTIONAL
      role: string
      count: number
    }>
  }
  revenueTrend: Array<{
    month: string                  // "Dec 2025"
    monthNumber: number            // 12
    year: number                   // 2025
    revenue: number
  }>
  topCustomers: Array<{            // 🎯 Top 5 only
    customerName: string
    invoiceCount: number
    totalSpent: number
  }>
  recentInvoices: Array<{          // 🎯 Top 7 only
    invoiceId: number
    invoiceNumber: number
    customerName: string
    createdAt: string              // ISO 8601 UTC
    amount: number
    statusName: string             // ✅ FIXED: PascalCase
    paymentStatus: string          // ✅ FIXED: PascalCase
    dueDate?: string               // 🆕 OPTIONAL
    isOverdue?: boolean            // 🆕 OPTIONAL
  }>
  revenueGrowthPercentage: number  // ✅ FIXED: Rounded to 2 decimals
}
```

### 5.2. Example Response (Fixed)

```json
{
  "currentMonthStats": {
    "totalRevenue": 186311222,
    "netProfit": 174151111,
    "taxLiability": 12160111,
    "collectedAmount": 130000,
    "outstandingAmount": 0,
    "overdueAmount": 0
  },
  "allTimeStats": {
    "totalRevenue": 10455388490,
    "netProfit": 9616475895,
    "taxLiability": 838912595,
    "collectedAmount": 265429998,
    "outstandingAmount": 2691718480,
    "overdueAmount": 0
  },
  "invoiceCounts": {
    "total": 104,
    "paid": 9,
    "unpaid": 91,
    "overdue": 0,
    "cancelled": 0
  },
  "userStats": {
    "totalUsers": 23,
    "totalCustomers": 2,
    "newUsersThisMonth": 10,
    "usersByRole": [
      { "role": "Admin", "count": 2 },
      { "role": "HOD", "count": 3 },
      { "role": "Staff", "count": 10 },
      { "role": "Sale", "count": 6 },
      { "role": "Customer", "count": 2 }
    ]
  },
  "revenueTrend": [
    {
      "month": "Dec 2025",
      "monthNumber": 12,
      "year": 2025,
      "revenue": 43830002
    },
    {
      "month": "Jan 2026",
      "monthNumber": 1,
      "year": 2026,
      "revenue": 186311222
    }
  ],
  "topCustomers": [
    {
      "customerName": "Công ty Hải Âu",
      "invoiceCount": 73,
      "totalSpent": 10346649576
    },
    {
      "customerName": "Công Ty Dịch Vụ Giải Trí MTP",
      "invoiceCount": 17,
      "totalSpent": 46128900
    },
    {
      "customerName": "CÔNG TY CỔ PHẦN DỊCH VỤ DI ĐỘNG TRỰC TUYẾN",
      "invoiceCount": 2,
      "totalSpent": 32500000
    },
    {
      "customerName": "Công Ty Kỷ Nguyên Số",
      "invoiceCount": 3,
      "totalSpent": 20110000
    },
    {
      "customerName": "Test Auto Create",
      "invoiceCount": 1,
      "totalSpent": 10000000
    }
  ],
  "recentInvoices": [
    {
      "invoiceId": 150,
      "invoiceNumber": 3,
      "customerName": "Test Auto Create",
      "createdAt": "2026-01-15T04:00:33.046567Z",
      "amount": 10000000,
      "statusName": "AdjustmentInProcess",
      "paymentStatus": "Unpaid",
      "dueDate": "2026-02-15T00:00:00Z",
      "isOverdue": false
    },
    {
      "invoiceId": 149,
      "invoiceNumber": 2,
      "customerName": "Công Ty Kỷ Nguyên Số",
      "createdAt": "2026-01-12T21:09:14.408501Z",
      "amount": 110000,
      "statusName": "Issued",
      "paymentStatus": "Unpaid",
      "dueDate": "2026-02-12T00:00:00Z",
      "isOverdue": false
    }
  ],
  "revenueGrowthPercentage": 325.08
}
```

---

## 6. PRIORITY & TIMELINE

### 🔴 CRITICAL (Must Fix - Week 1)
1. ✅ Fix `statusName` format: `Adjustment_in_process` → `AdjustmentInProcess`
2. ✅ Fix `paymentStatus` format: `Partially_Paid` → `PartiallyPaid`
3. ✅ Round `revenueGrowthPercentage` to 2 decimals

### 🟡 SHOULD HAVE (Week 2)
4. 🆕 Add `usersByRole` to `userStats`
5. 🆕 Limit `topCustomers` to 5 (if not already)
6. 🆕 Limit `recentInvoices` to 7 (if not already)

### 🟢 NICE TO HAVE (Future)
7. 🆕 Add `dueDate` and `isOverdue` to `recentInvoices`
8. 🆕 Support query param `?period=` for filter
9. 🆕 Support query param `?topCustomersLimit=`

---

## 7. TESTING CHECKLIST

### Backend cần test:
- ✅ Response format đúng schema
- ✅ Status names không có underscore
- ✅ Revenue growth rounded 2 decimals
- ✅ Top customers limited to 5
- ✅ Recent invoices limited to 7
- ✅ All dates in ISO 8601 UTC
- ✅ Negative revenue growth handled correctly
- ✅ Empty data cases (no invoices, no customers)

---

## 8. CONTACT & SUPPORT

**Frontend Team:**
- Lead: Frontend Dev Team
- Slack: #backend-api-support

**Questions?**
- API Documentation: `/api/swagger`
- Issues: GitHub Issues hoặc Slack

---

**END OF DOCUMENT**

✅ Tài liệu này cung cấp đầy đủ yêu cầu để Backend Team fix và optimize API Dashboard Admin.  
📧 Mọi thắc mắc xin liên hệ Frontend Team.

---

**Change Log:**
- v1.0 (16/01/2026): Initial version - API analysis and requirements
