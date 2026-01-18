/**
 * Example Implementation: Invoice Detail Page with Dynamic Title
 * 
 * Ví dụ về cách hiển thị mã hóa đơn cụ thể trên title tab
 * 
 * 📝 NOTE: Đây là file documentation example
 * Copy code này vào component thực tế và thay import path phù hợp
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
// Import usePageTitle từ hooks (adjust path theo vị trí component của bạn)
// import { usePageTitle } from '@/hooks/usePageTitle'
import { usePageTitle } from '../src/hooks/usePageTitle'

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  amount: number
  status: string
  createdAt: Date
}

const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  // Set initial title
  // Title: "Chi tiết hóa đơn | EIMS"
  const { setTitle } = usePageTitle('Chi tiết hóa đơn')

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true)
        
        // TODO: Replace với real API
        // const response = await invoiceService.getInvoiceById(id)
        // setInvoice(response.data)
        
        // Mock data
        const mockInvoice: Invoice = {
          id: id || '1',
          invoiceNumber: 'HD-2026-150',
          customerName: 'Công ty TNHH ABC',
          amount: 125000000,
          status: 'Pending',
          createdAt: new Date(),
        }
        
        setInvoice(mockInvoice)
      } catch (error) {
        console.error('Failed to fetch invoice:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [id])

  // Update title khi đã load xong invoice
  useEffect(() => {
    if (invoice?.invoiceNumber) {
      // Title: "HD-2026-150 - Chi tiết hóa đơn | EIMS"
      setTitle(`${invoice.invoiceNumber} - Chi tiết hóa đơn`)
    }
  }, [invoice, setTitle])

  if (loading) {
    return <div>Đang tải...</div>
  }

  if (!invoice) {
    return <div>Không tìm thấy hóa đơn</div>
  }

  return (
    <div>
      <h1>{invoice.invoiceNumber}</h1>
      <p>Khách hàng: {invoice.customerName}</p>
      <p>Số tiền: {invoice.amount.toLocaleString('vi-VN')} VNĐ</p>
      <p>Trạng thái: {invoice.status}</p>
    </div>
  )
}

export default InvoiceDetail

/**
 * Timeline của title:
 * 
 * 1. Component mount:
 *    Title: "Chi tiết hóa đơn | EIMS"
 * 
 * 2. API call đang loading:
 *    Title: "Chi tiết hóa đơn | EIMS" (không đổi)
 * 
 * 3. API trả về data:
 *    Title: "HD-2026-150 - Chi tiết hóa đơn | EIMS"
 *    → User biết đang xem hóa đơn nào
 * 
 * 4. User mở nhiều tab hóa đơn:
 *    Tab 1: "HD-2026-150 - Chi tiết hóa đơn | EIMS"
 *    Tab 2: "HD-2026-151 - Chi tiết hóa đơn | EIMS"
 *    Tab 3: "HD-2026-152 - Chi tiết hóa đơn | EIMS"
 *    → Dễ phân biệt từng tab
 * 
 * 5. User switch tab:
 *    Title: "Hãy quay lại! 🥺"
 * 
 * 6. User quay lại:
 *    Title: "HD-2026-150 - Chi tiết hóa đơn | EIMS"
 */
