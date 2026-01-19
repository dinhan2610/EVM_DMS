# Backend API Requirements: Sales Dashboard

## 📋 API Endpoint Yêu Cầu
```
GET /api/Dashboard/sales
Authorization: Bearer {token}
X-Sales-ID: {salesId} (hoặc lấy từ token)
```

---

## 🎯 Mục đích Dashboard

Dashboard Sales được thiết kế để:
- **Theo dõi hiệu suất bán hàng cá nhân**: Doanh số, hoa hồng, target
- **Quản lý công việc hàng ngày**: Nợ quá hạn, đơn hàng cần follow-up
- **Tạo động lực**: So sánh với tháng trước, tiến độ target, xu hướng 6 tháng

**🔐 BẢO MẬT QUAN TRỌNG:** 
- Chỉ trả về dữ liệu của salesId === currentUser.id
- KHÔNG BAO GIỜ trả về dữ liệu của sales khác
- Lọc tất cả invoices/customers theo salesId

---

## 📊 Frontend Components Đang Có

Dashboard Sales hiện tại có **5 components chính**:

### 1️⃣ **SalesKPIs** (4 cards KPI)
- Doanh số tháng này (so với tháng trước)
- Hoa hồng dự kiến
- Khách hàng mới
- Đơn chờ thanh toán

### 2️⃣ **TargetProgressChart** (Radial gauge)
- Tiến độ target tháng (%)
- Số tiền còn thiếu
- Số ngày còn lại

### 3️⃣ **SalesTrendChart** (Bar chart 6 tháng)
- Doanh số theo tháng
- Số đơn hàng theo tháng
- Hoa hồng kiếm được

### 4️⃣ **DebtWatchlist** (Danh sách khách nợ)
- Khách hàng nợ quá hạn
- Mức độ khẩn cấp (critical/high/medium)
- Action: Gọi điện, gửi nhắc nợ

### 5️⃣ **MyRecentInvoices** (Bảng 10 đơn mới nhất)
- Hóa đơn của sales này
- Trạng thái: Paid, Unpaid, Rejected, Pending
- Priority flag cho urgent items

---

## ✅ Response Structure Đề Xuất

```typescript
{
  "currentUser": {
    "userId": 5,
    "userName": "sale001",      // ✅ Trả về username thật (không null)
    "fullName": "Nguyễn Văn A",
    "role": "Sales",
    "email": "sale001@eims.local",
    "salesId": 5                // ✅ ID của sales này
  },
  
  "salesKPIs": {
    "currentRevenue": 85000000,         // VND - Tháng này
    "lastMonthRevenue": 78000000,       // VND - Tháng trước (để tính growth)
    "revenueGrowthPercent": 8.97,       // % (tính sẵn từ BE nếu muốn)
    "estimatedCommission": 1700000,     // VND - Hoa hồng dự kiến
    "commissionRate": 2.0,              // % - Tỉ lệ hoa hồng
    "newCustomersThisMonth": 8,         // Số KH mới tháng này
    "openInvoicesCount": 12             // Số đơn chưa thanh toán
  },
  
  "targetProgress": {
    "currentRevenue": 85000000,         // VND - Doanh số hiện tại
    "targetRevenue": 100000000,         // VND - Target tháng
    "completionRate": 85.0,             // % (0-100)
    "remainingAmount": 15000000,        // VND - Còn thiếu
    "daysLeftInMonth": 10               // Số ngày còn lại tháng này
  },
  
  "salesTrend": [
    {
      "month": "T07/2024",              // Format: "T{MM}/{YYYY}"
      "revenue": 72000000,              // VND
      "invoiceCount": 24,               // Số đơn hàng
      "commissionEarned": 1440000       // VND - Hoa hồng thực tế
    },
    // ... 5 tháng tiếp theo (tổng 6 tháng gần nhất)
  ],
  
  "debtWatchlist": [
    {
      "customerId": 45,
      "customerName": "Trần Văn B",
      "companyName": "Công ty TNHH XYZ",
      "overdueAmount": 18500000,        // VND - Số tiền nợ quá hạn
      "overdueDays": 45,                // Số ngày quá hạn
      "lastContactDate": "2024-12-01T10:30:00Z",  // ISO 8601
      "phone": "0912-345-678",
      "email": "tranvanb@xyz.com",
      "urgencyLevel": "critical"        // critical | high | medium
    }
    // Sắp xếp theo urgencyLevel: critical → high → medium
    // Tối đa 10-15 khách hàng ưu tiên nhất
  ],
  
  "recentInvoices": [
    {
      "invoiceId": 201,
      "invoiceNumber": "HD-2024-1201",  // ✅ Null nếu là Draft
      "customerName": "Công ty ABC",
      "amount": 15000000,               // VND
      "status": "Paid",                 // Paid | Unpaid | Rejected | Pending
      "issueDate": "2024-12-15T14:20:00Z",
      "dueDate": "2025-01-15T23:59:59Z",
      "isPriority": false               // true nếu Rejected hoặc quá hạn lâu
    }
    // 10 hóa đơn mới nhất của sales này
    // Sắp xếp: isPriority=true lên đầu, sau đó issueDate DESC
  ],
  
  "generatedAt": "2025-01-19T10:30:45Z"
}
```

---

## 🔧 Logic Tính Toán Backend

### 1. **Sales KPIs**

```sql
-- Current Month Revenue (Tháng này)
SELECT SUM(total_amount) as currentRevenue
FROM invoices
WHERE sales_id = @salesId
  AND MONTH(issue_date) = MONTH(GETDATE())
  AND YEAR(issue_date) = YEAR(GETDATE())
  AND status IN ('Paid', 'Issued', 'Pending')  -- Không tính Draft/Rejected

-- Last Month Revenue (Tháng trước)
SELECT SUM(total_amount) as lastMonthRevenue
FROM invoices
WHERE sales_id = @salesId
  AND MONTH(issue_date) = MONTH(DATEADD(MONTH, -1, GETDATE()))
  AND YEAR(issue_date) = YEAR(DATEADD(MONTH, -1, GETDATE()))
  AND status IN ('Paid', 'Issued', 'Pending')

-- Estimated Commission
estimatedCommission = currentRevenue * (commissionRate / 100)

-- New Customers This Month
SELECT COUNT(DISTINCT customer_id) as newCustomers
FROM invoices
WHERE sales_id = @salesId
  AND MONTH(created_at) = MONTH(GETDATE())
  AND YEAR(created_at) = YEAR(GETDATE())
  AND customer_id NOT IN (
    SELECT DISTINCT customer_id FROM invoices
    WHERE sales_id = @salesId AND created_at < DATEADD(MONTH, -1, GETDATE())
  )

-- Open Invoices Count
SELECT COUNT(*) as openInvoices
FROM invoices
WHERE sales_id = @salesId
  AND status = 'Unpaid'
  AND due_date < GETDATE()  -- Quá hạn
```

### 2. **Target Progress**

```sql
-- Get Sales Target for Current Month
SELECT target_revenue
FROM sales_targets
WHERE sales_id = @salesId
  AND MONTH(target_month) = MONTH(GETDATE())
  AND YEAR(target_month) = YEAR(GETDATE())

-- Calculate
completionRate = (currentRevenue / targetRevenue) * 100
remainingAmount = targetRevenue - currentRevenue
daysLeftInMonth = DAY(EOMONTH(GETDATE())) - DAY(GETDATE())
```

### 3. **Sales Trend (6 tháng gần nhất)**

```sql
SELECT 
  FORMAT(issue_date, 'T') + FORMAT(issue_date, 'MM/yyyy') as month,
  SUM(total_amount) as revenue,
  COUNT(*) as invoiceCount,
  SUM(total_amount * commission_rate / 100) as commissionEarned
FROM invoices
WHERE sales_id = @salesId
  AND issue_date >= DATEADD(MONTH, -6, GETDATE())
  AND status IN ('Paid', 'Issued', 'Pending')
GROUP BY 
  YEAR(issue_date), 
  MONTH(issue_date)
ORDER BY 
  YEAR(issue_date), 
  MONTH(issue_date)
```

### 4. **Debt Watchlist**

```sql
SELECT TOP 15
  c.customer_id,
  c.customer_name,
  c.company_name,
  SUM(i.total_amount - ISNULL(p.paid_amount, 0)) as overdueAmount,
  DATEDIFF(DAY, i.due_date, GETDATE()) as overdueDays,
  (SELECT MAX(contact_date) FROM sales_contacts 
   WHERE customer_id = c.customer_id AND sales_id = @salesId) as lastContactDate,
  c.phone,
  c.email,
  CASE
    WHEN DATEDIFF(DAY, i.due_date, GETDATE()) >= 30 THEN 'critical'
    WHEN DATEDIFF(DAY, i.due_date, GETDATE()) >= 15 THEN 'high'
    ELSE 'medium'
  END as urgencyLevel
FROM customers c
JOIN invoices i ON c.customer_id = i.customer_id
LEFT JOIN payments p ON i.invoice_id = p.invoice_id
WHERE i.sales_id = @salesId
  AND i.status = 'Unpaid'
  AND i.due_date < GETDATE()
GROUP BY c.customer_id, c.customer_name, c.company_name, c.phone, c.email, i.due_date
ORDER BY 
  CASE urgencyLevel
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    ELSE 3
  END,
  overdueDays DESC
```

### 5. **Recent Invoices**

```sql
SELECT TOP 10
  i.invoice_id,
  CASE 
    WHEN i.status = 'Draft' THEN NULL 
    ELSE i.invoice_number 
  END as invoiceNumber,
  c.customer_name,
  i.total_amount,
  i.status,
  i.issue_date,
  i.due_date,
  CASE
    WHEN i.status = 'Rejected' THEN 1
    WHEN i.status = 'Unpaid' AND i.due_date < DATEADD(DAY, -7, GETDATE()) THEN 1
    ELSE 0
  END as isPriority
FROM invoices i
JOIN customers c ON i.customer_id = c.customer_id
WHERE i.sales_id = @salesId
ORDER BY 
  isPriority DESC,
  i.issue_date DESC
```

---

## ⚠️ Các Vấn Đề Cần Tránh

### 1. ❌ **userName = null**
```json
// SAI
"currentUser": {
  "userName": null  // ❌
}

// ĐÚNG
"currentUser": {
  "userName": "sale001"  // ✅
}
```

### 2. ❌ **invoiceNumber = "N/A" hoặc "Draft"**
```json
// SAI
"invoiceNumber": "N/A"     // ❌
"invoiceNumber": "Draft"   // ❌

// ĐÚNG
"invoiceNumber": null      // ✅ Khi chưa có số
"invoiceNumber": "HD-2024-1201"  // ✅ Khi có số thật
```

### 3. ❌ **Trả dữ liệu của sales khác**
```typescript
// PHẢI FILTER THEO salesId
WHERE sales_id = @currentUserId  // ✅
// KHÔNG được trả dữ liệu của sales khác
```

### 4. ❌ **Empty string thay vì null**
```json
// SAI
"lastContactDate": ""  // ❌

// ĐÚNG
"lastContactDate": null  // ✅ Khi không có
"lastContactDate": "2024-12-01T10:30:00Z"  // ✅ Khi có
```

---

## 💡 Tính Năng Nâng Cao (Optional)

### 1. **Thêm Leaderboard Info**
```json
"leaderboard": {
  "myRank": 3,              // Xếp hạng của sales này
  "totalSales": 15,         // Tổng số sales
  "topPerformer": "Nguyễn Văn B",
  "topRevenue": 120000000
}
```

### 2. **Customer Interaction Tracking**
```json
"customerInteractions": {
  "callsMadeToday": 8,
  "emailsSentToday": 5,
  "meetingsScheduled": 3
}
```

### 3. **Product Performance**
```json
"topProducts": [
  {
    "productName": "Laptop Dell XPS",
    "unitsSold": 15,
    "revenue": 45000000
  }
  // Top 5 sản phẩm bán chạy của sales này
]
```

### 4. **Commission Breakdown**
```json
"commissionDetails": {
  "baseCommission": 1500000,     // Hoa hồng cơ bản
  "bonusCommission": 200000,     // Thưởng đạt target
  "totalCommission": 1700000
}
```

---

## 📊 Business Rules

### Urgency Level Logic
```typescript
overdueDays >= 30  → urgencyLevel = "critical" (Màu đỏ 🚨)
overdueDays >= 15  → urgencyLevel = "high"     (Màu cam ⚠️)
overdueDays < 15   → urgencyLevel = "medium"   (Màu xanh 📋)
```

### Priority Invoice Logic
```typescript
isPriority = true nếu:
- status = "Rejected" HOẶC
- (status = "Unpaid" VÀ overdueDays > 7)
```

### Commission Rate
```typescript
// Có thể lấy từ:
- Bảng sales_users.commission_rate (mỗi sales khác nhau)
- Bảng commission_rules (theo doanh số bậc thang)
- Cố định 2% cho tất cả
```

---

## 🔐 Security Checklist

- [ ] Verify `salesId` từ JWT token
- [ ] Filter tất cả queries bằng `WHERE sales_id = @currentUserId`
- [ ] KHÔNG trả về data của sales khác
- [ ] KHÔNG trả về customer data nhạy cảm (credit card, ssn, etc.)
- [ ] Log API access cho audit trail
- [ ] Rate limiting: 60 requests/minute
- [ ] Validate Authorization header

---

## ⚡ Performance Optimization

### Indexing
```sql
-- Indexes cần thiết
CREATE INDEX idx_invoices_sales_date ON invoices(sales_id, issue_date);
CREATE INDEX idx_invoices_sales_status ON invoices(sales_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date, status);
CREATE INDEX idx_customers_sales ON customers(assigned_sales_id);
```

### Caching Strategy
```typescript
// Redis cache key
`sales_dashboard:${salesId}:${YYYYMMDD}`

// TTL: 5 minutes
// Invalidate khi:
- New invoice created by this sales
- Invoice status changed
- Payment received
- Manual refresh button clicked
```

---

## 📝 Tóm Tắt Công Việc Backend

| STT | Công việc | Mức độ | Ước lượng |
|-----|-----------|--------|-----------|
| 1 | Tạo endpoint `/api/Dashboard/sales` | 🔴 Bắt buộc | 2h |
| 2 | Implement logic tính SalesKPIs | 🔴 Bắt buộc | 3h |
| 3 | Implement logic TargetProgress | 🔴 Bắt buộc | 2h |
| 4 | Implement logic SalesTrend (6 months) | 🔴 Bắt buộc | 2h |
| 5 | Implement DebtWatchlist | 🔴 Bắt buộc | 2h |
| 6 | Implement RecentInvoices | 🔴 Bắt buộc | 1h |
| 7 | Add security filters (salesId) | 🔴 Bắt buộc | 1h |
| 8 | Add database indexes | 🟡 Nên có | 1h |
| 9 | Add Redis caching | 🟢 Optional | 2h |
| 10 | Add Leaderboard feature | 🟢 Optional | 3h |

**Tổng: ~13-16 giờ (core) + 5 giờ (optional)**

---

## 🧪 Test Cases

### Test 1: Kiểm tra salesId filtering
```http
GET /api/Dashboard/sales
Authorization: Bearer {token_of_sale_001}

# Kết quả phải:
- Chỉ trả dữ liệu của sale_001
- KHÔNG có dữ liệu của sales khác
```

### Test 2: Kiểm tra empty data
```http
GET /api/Dashboard/sales
Authorization: Bearer {token_of_new_sales}

# Kết quả:
{
  "salesKPIs": {
    "currentRevenue": 0,
    "openInvoicesCount": 0
  },
  "debtWatchlist": [],
  "recentInvoices": []
}
```

### Test 3: Kiểm tra null handling
```http
# Hóa đơn Draft phải có invoiceNumber = null
# Không phải "N/A" hay "Draft"
```

---

## 📅 Metadata

- **Ngày tạo:** 19/01/2025
- **Người tạo:** Frontend Team
- **Version:** 1.0
- **Review by:** Backend Team (pending)
- **Frontend ready:** ✅ Yes (đang dùng mockdata)
- **Backend status:** ⏳ Chờ implement

---

## 📞 Contact

Nếu có thắc mắc về requirements, liên hệ:
- Frontend Lead
- Slack: #eims-sales-dashboard
- Email: dev-team@eims.local

---

## 🔗 Related Documents

- [Backend Accountant Dashboard API Review](./BACKEND_ACCOUNTANT_DASHBOARD_API_REVIEW.md)
- [Sales Dashboard Frontend Components](../src/page/SaleDashboard.tsx)
- [Sales Types Definition](../src/types/sales.types.ts)
- [Sales Mock Data](../src/types/sales.mockdata.ts)
