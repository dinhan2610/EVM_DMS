# 🚀 QUICK INTEGRATION GUIDE - Tax Error Notification Management

## ⚡ **5-MINUTE SETUP**

### **Step 1: Add Route to Router** (30 seconds)

Edit `/src/routes/router.tsx`:

```tsx
import TaxErrorNotificationManagement from '@/page/TaxErrorNotificationManagement'

// Add to your routes
const routes = [
  // ... existing routes
  {
    path: '/tax-error-notifications',
    element: <TaxErrorNotificationManagement />,
  },
]
```

### **Step 2: Add Menu Item to Sidebar** (1 minute)

Edit your sidebar/navigation component:

```tsx
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

// Add menu item
<MenuItem 
  icon={<ErrorOutlineIcon />}
  title="Thông báo sai sót"
  path="/tax-error-notifications"
/>
```

### **Step 3: Test with Mock Data** (2 minutes)

Navigate to: `http://localhost:5173/tax-error-notifications`

**Expected Result:**
- ✅ Page loads with 6 mock notifications
- ✅ Filter bar displays
- ✅ Statistics cards show: Total=6, Accepted=2, Need Attention=2
- ✅ Table displays all columns
- ✅ Actions menu works (3-dot icon)
- ✅ Invoice links clickable

### **Step 4: Verify Features** (1.5 minutes)

**Search:**
- Type "00000045" → Filters to notification with that invoice number

**Filters:**
- Click "Lọc" button → Expands advanced filters
- Select "CQT Từ chối" status → Filters to rejected notifications
- Click "Đặt lại" → Resets all filters

**Actions:**
- Click 3-dot menu on any row
- Verify "Xem chi tiết" always enabled
- Verify "Sửa & Gửi lại" only enabled for rejected/error status
- Verify "Tải về XML" only enabled for accepted status

**Navigation:**
- Click invoice number link (e.g., "00000045")
- Should navigate to `/invoices/131`

---

## 🔌 **API INTEGRATION** (When Backend Ready)

### **Create API Service** (`/src/services/taxErrorNotificationService.ts`)

```typescript
import axios from 'axios'
import { ITaxErrorNotification } from '@/page/TaxErrorNotificationManagement'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

class TaxErrorNotificationService {
  private getAuthHeader() {
    const token = localStorage.getItem('token')
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  }

  // Get all notifications
  async getAll(): Promise<ITaxErrorNotification[]> {
    const response = await axios.get(
      `${API_BASE_URL}/TaxErrorNotifications`,
      this.getAuthHeader()
    )
    return response.data
  }

  // Get notification by ID
  async getById(id: string | number): Promise<ITaxErrorNotification> {
    const response = await axios.get(
      `${API_BASE_URL}/TaxErrorNotifications/${id}`,
      this.getAuthHeader()
    )
    return response.data
  }

  // Resend notification to CQT
  async resend(id: string | number): Promise<{ success: boolean; message: string }> {
    const response = await axios.post(
      `${API_BASE_URL}/TaxErrorNotifications/${id}/resend`,
      {},
      this.getAuthHeader()
    )
    return response.data
  }

  // Download XML file
  async downloadXml(id: string | number): Promise<Blob> {
    const response = await axios.get(
      `${API_BASE_URL}/TaxErrorNotifications/${id}/download-xml`,
      {
        ...this.getAuthHeader(),
        responseType: 'blob',
      }
    )
    return response.data
  }

  // Update notification (for edit & resend)
  async update(
    id: string | number,
    data: Partial<ITaxErrorNotification>
  ): Promise<ITaxErrorNotification> {
    const response = await axios.put(
      `${API_BASE_URL}/TaxErrorNotifications/${id}`,
      data,
      this.getAuthHeader()
    )
    return response.data
  }
}

export default new TaxErrorNotificationService()
```

### **Update Component to Use Real API**

Edit `/src/page/TaxErrorNotificationManagement.tsx`:

```typescript
// Add import
import taxErrorNotificationService from '@/services/taxErrorNotificationService'

// Replace mock data load
useEffect(() => {
  const loadNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Real API call
      const data = await taxErrorNotificationService.getAll()
      setNotifications(data)
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setError('Không thể tải danh sách thông báo sai sót')
    } finally {
      setLoading(false)
    }
  }

  loadNotifications()
}, [])

// Update action handlers
const handleResend = async (id: string | number) => {
  try {
    setLoading(true)
    const result = await taxErrorNotificationService.resend(id)
    
    if (result.success) {
      // Refresh data
      const data = await taxErrorNotificationService.getAll()
      setNotifications(data)
      
      alert('✅ ' + result.message)
    }
  } catch (err) {
    alert('❌ Gửi lại thông báo thất bại')
  } finally {
    setLoading(false)
  }
}

const handleDownload = async (id: string | number) => {
  try {
    const blob = await taxErrorNotificationService.downloadXml(id)
    
    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `TB04_${id}.xml`
    link.click()
    
    window.URL.revokeObjectURL(url)
  } catch (err) {
    alert('❌ Tải file XML thất bại')
  }
}
```

---

## 📋 **BACKEND API REQUIREMENTS**

### **Endpoints Needed:**

```
GET    /api/TaxErrorNotifications              - List all notifications
GET    /api/TaxErrorNotifications/{id}         - Get notification by ID
POST   /api/TaxErrorNotifications/{id}/resend  - Resend to CQT
GET    /api/TaxErrorNotifications/{id}/download-xml - Download XML
PUT    /api/TaxErrorNotifications/{id}         - Update notification
```

### **Response Schema:**

```json
{
  "id": 1,
  "sentDate": "2026-01-08T10:30:00Z",
  "messageId": "TB04-20260108-001",
  "invoiceRef": "00000045",
  "invoiceId": 131,
  "invoiceSymbol": "C25TAA",
  "invoiceDate": "2026-01-07",
  "taxAuthority": "Cục Thuế TP. Hà Nội",
  "type": 1,
  "reason": "Khách hàng yêu cầu hủy...",
  "status": 2,
  "cqtResponse": "Đã tiếp nhận thông báo...",
  "notificationCode": "TB04/001/2026",
  "xmlPath": "/uploads/notifications/TB04_001_2026.xml",
  "customerName": "Công ty TNHH ABC Technology",
  "totalAmount": 121000000
}
```

---

## 🎯 **TESTING CHECKLIST**

### **Manual Testing:**
- [ ] Page loads without errors
- [ ] Mock data displays correctly (6 items)
- [ ] Search bar filters by invoice number
- [ ] Date range filter works
- [ ] Status multi-select filter works
- [ ] Type multi-select filter works
- [ ] Tax authority filter works
- [ ] Statistics cards show correct counts
- [ ] Invoice link navigates to detail page
- [ ] Actions menu opens on 3-dot click
- [ ] Menu items enable/disable based on status
- [ ] Tooltips display on hover
- [ ] Table sorting works
- [ ] Pagination works
- [ ] Error state displays on API failure
- [ ] Loading spinner shows during data fetch

### **Browser Testing:**
- [ ] Chrome (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Edge (Latest)

### **Responsive Testing:**
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Page shows blank screen**
**Solution:** Check browser console for errors. Ensure React Router is properly configured.

### **Issue: Mock data not displaying**
**Solution:** Check that `generateMockData()` function is called in `useEffect`.

### **Issue: Invoice link not working**
**Solution:** Verify Invoice Detail route exists: `/invoices/:id`

### **Issue: Actions menu not opening**
**Solution:** Check Material-UI version. Ensure `@mui/material` >= 5.0

### **Issue: Filters not applying**
**Solution:** Verify `onFilterChange` callback is passed to TaxErrorNotificationFilter component.

### **Issue: TypeScript errors**
**Solution:** Run `npm install` to ensure all dependencies are installed. Check `tsconfig.json`.

---

## 📞 **SUPPORT**

**Documentation:** `/docs/TAX_ERROR_NOTIFICATION_MANAGEMENT_PAGE_GUIDE.md`  
**Component Files:**
- Main Page: `/src/page/TaxErrorNotificationManagement.tsx`
- Filter: `/src/components/TaxErrorNotificationFilter.tsx`

**Questions?** Check the comprehensive guide or contact the development team.

---

**Status:** ✅ Ready for Integration  
**Last Updated:** January 9, 2026  
**Version:** 1.0.0
