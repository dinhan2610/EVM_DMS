/**
 * Quick Migration Script
 * 
 * Copy-paste các đoạn code này để nhanh chóng apply usePageTitle
 * vào các trang còn lại trong dự án.
 */

// ============================================================================
// STEP 1: Import hook (Add to imports section)
// ============================================================================

import { usePageTitle } from '@/hooks/usePageTitle'


// ============================================================================
// STEP 2: Apply trong component (Add sau const ComponentName = () => {)
// ============================================================================

// --- INVOICE PAGES ---

// InvoiceManagement.tsx
usePageTitle('Quản lý hóa đơn')

// CreateVatInvoice.tsx
usePageTitle('Lập hóa đơn mới')

// CreateAdjustmentInvoice.tsx
usePageTitle('Lập hóa đơn điều chỉnh')

// CreateReplacementInvoice.tsx
usePageTitle('Lập hóa đơn thay thế')

// PublicInvoiceLookup.tsx
usePageTitle('Tra cứu hóa đơn')


// --- INVOICE DETAIL (with dynamic invoice number) ---
const InvoiceDetail = () => {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const { setTitle } = usePageTitle('Chi tiết hóa đơn')
  
  useEffect(() => {
    if (invoice?.invoiceNumber) {
      setTitle(`${invoice.invoiceNumber} - Chi tiết hóa đơn`)
    }
  }, [invoice, setTitle])
  
  return <div>...</div>
}


// --- HOD INVOICE MANAGEMENT (with notification count) ---
const HODInvoiceManagement = () => {
  const [pendingInvoices, setPendingInvoices] = useState([])
  const pendingCount = pendingInvoices.filter(inv => inv.status === 'Pending').length
  
  usePageTitle('Duyệt hóa đơn', pendingCount)
  
  return <div>...</div>
}


// --- CUSTOMER MANAGEMENT ---

// CustomerManagement.tsx
usePageTitle('Quản lý khách hàng')

// SalesCustomerPage.tsx
usePageTitle('Khách hàng của tôi')

// CustomerInvoiceList.tsx
usePageTitle('Hóa đơn của tôi')

// CustomerPaymentHistory.tsx
usePageTitle('Lịch sử thanh toán')


// --- DEBT & STATEMENT ---

// DebtManagement.tsx
usePageTitle('Quản lý công nợ')

// StatementManagement.tsx
usePageTitle('Quản lý bảng kê')

// CreateStatement.tsx
usePageTitle('Tạo bảng kê mới')


// --- TEMPLATE MANAGEMENT ---

// TemplateManagement.tsx
usePageTitle('Quản lý mẫu hóa đơn')

// TemplateSelection.tsx
usePageTitle('Chọn mẫu hóa đơn')

// TemplateEditor.tsx (check if editing or creating)
const TemplateEditor = () => {
  const { templateId } = useParams()
  const isEditing = !!templateId
  
  usePageTitle(isEditing ? 'Chỉnh sửa mẫu hóa đơn' : 'Tạo mẫu hóa đơn')
  
  return <div>...</div>
}

// TemplatePreview.tsx
usePageTitle('Xem trước mẫu hóa đơn')

// EmailTemplateManagement.tsx
usePageTitle('Quản lý mẫu email')


// --- ADMIN PAGES ---

// UserManagement.tsx
usePageTitle('Quản lý người dùng')

// RolesPermissions.tsx
usePageTitle('Phân quyền')

// SystemConfiguration.tsx
usePageTitle('Cấu hình hệ thống')

// AuditLogsPage.tsx
usePageTitle('Nhật ký hệ thống')

// ReportsPage.tsx
usePageTitle('Báo cáo')


// --- OTHER MANAGEMENT ---

// ItemsManagement.tsx
usePageTitle('Quản lý sản phẩm')

// RequestManagement.tsx
usePageTitle('Yêu cầu hóa đơn')

// TaxErrorNotificationManagement.tsx
usePageTitle('Quản lý lỗi thuế')


// --- SALES PAGES ---

// SaleDashboard.tsx
usePageTitle('Tổng quan - Sales')

// CreateSalesOrder.tsx
usePageTitle('Tạo đơn hàng')


// --- CUSTOMER PAGES ---

// CustomerDashboard.tsx
usePageTitle('Hóa đơn của tôi')


// --- USER PAGES ---

// UserProfile.tsx
usePageTitle('Hồ sơ cá nhân')

// AllNotifications.tsx (with notification count)
const AllNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0)
  
  usePageTitle('Thông báo', unreadCount)
  
  return <div>...</div>
}


// --- AUTH PAGES (NO BRAND) ---

// AuthSignIn.tsx
usePageTitle('Đăng nhập', 0, false)  // false = no brand

// AuthSignUp.tsx
usePageTitle('Đăng ký', 0, false)  // false = no brand


// ============================================================================
// COMPLETE EXAMPLE: HODInvoiceManagement.tsx
// ============================================================================

import { useState, useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { usePageTitle } from '@/hooks/usePageTitle'
import invoiceService from '@/services/invoiceService'

const HODInvoiceManagement = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Calculate pending count
  const pendingCount = invoices.filter(inv => inv.status === 'Pending').length
  
  // Set title với count - sẽ tự động update khi pendingCount thay đổi
  usePageTitle('Duyệt hóa đơn', pendingCount)
  
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true)
        const data = await invoiceService.getPendingApprovals()
        setInvoices(data)
      } catch (error) {
        console.error('Failed to fetch invoices:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchInvoices()
    
    // Optional: Poll every 30 seconds for new invoices
    const interval = setInterval(fetchInvoices, 30000)
    return () => clearInterval(interval)
  }, [])
  
  const handleApprove = async (invoiceId) => {
    await invoiceService.approveInvoice(invoiceId)
    setInvoices(prev => prev.filter(inv => inv.id !== invoiceId))
    // Title tự động update vì pendingCount giảm
  }
  
  return (
    <Box>
      <Typography variant="h4">
        Duyệt hóa đơn ({pendingCount} chờ duyệt)
      </Typography>
      {/* Rest of component */}
    </Box>
  )
}

export default HODInvoiceManagement


// ============================================================================
// COMPLETE EXAMPLE: InvoiceDetail.tsx
// ============================================================================

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import { usePageTitle } from '@/hooks/usePageTitle'
import invoiceService from '@/services/invoiceService'

const InvoiceDetail = () => {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Initial title
  const { setTitle } = usePageTitle('Chi tiết hóa đơn')
  
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true)
        const data = await invoiceService.getInvoiceById(id)
        setInvoice(data)
      } catch (error) {
        console.error('Failed to fetch invoice:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchInvoice()
  }, [id])
  
  // Update title khi có invoice data
  useEffect(() => {
    if (invoice?.invoiceNumber) {
      setTitle(`${invoice.invoiceNumber} - Chi tiết hóa đơn`)
    }
  }, [invoice, setTitle])
  
  if (loading) return <div>Loading...</div>
  if (!invoice) return <div>Không tìm thấy hóa đơn</div>
  
  return (
    <Box>
      <Typography variant="h4">{invoice.invoiceNumber}</Typography>
      {/* Rest of component */}
    </Box>
  )
}

export default InvoiceDetail


// ============================================================================
// TESTING CHECKLIST
// ============================================================================

/*
Sau khi apply usePageTitle, test các scenarios sau:

1. ✅ Page load: Title hiển thị đúng
2. ✅ Switch tab (Cmd+Tab): Title = "Hãy quay lại! 🥺"
3. ✅ Switch back: Title restore về original
4. ✅ Multiple tabs: Mỗi tab có title riêng, dễ phân biệt
5. ✅ Notification count: Badge số hiển thị và update real-time
6. ✅ Dynamic title: Update khi data load xong (invoice detail)
7. ✅ Route change: Title update khi navigate sang trang khác

Browser DevTools Console:
- No memory leaks
- No errors
- Event listeners được cleanup

*/


// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/*
Issue: Title không update
Fix: Check dependencies trong usePageTitle() và useEffect()

Issue: Title bị reset về default
Fix: Đảm bảo không còn code cũ set document.title ở nơi khác

Issue: Memory leak warning
Fix: Đảm bảo cleanup event listeners trong useEffect return

Issue: Count không update real-time
Fix: Đảm bảo pendingCount được tính toán từ state, không phải hardcode

Issue: Title bị duplicate "| EIMS | EIMS"
Fix: Check không gọi usePageTitle() nhiều lần trong 1 component

*/
