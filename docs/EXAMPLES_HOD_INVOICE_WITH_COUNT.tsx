/**
 * Example Implementation: HOD Invoice Management với Notification Count
 * 
 * Đây là ví dụ real-world về cách implement usePageTitle với dynamic count
 * để hiển thị số hóa đơn chờ duyệt trên tab title.
 * 
 * 📝 NOTE: Đây là file documentation example
 * Copy code này vào component thực tế và thay import path phù hợp
 */

import { useState, useEffect } from 'react'
// Import usePageTitle từ hooks (adjust path theo vị trí component của bạn)
// import { usePageTitle } from '@/hooks/usePageTitle'
import { usePageTitle } from '../src/hooks/usePageTitle'

// Mock data structure - thay bằng real API response
interface PendingInvoice {
  id: string
  invoiceNumber: string
  amount: number
  status: 'Pending' | 'Approved' | 'Rejected'
}

const HODInvoiceManagement = () => {
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([])
  const [loading, setLoading] = useState(true)

  // Calculate pending count
  const pendingCount = pendingInvoices.filter(inv => inv.status === 'Pending').length

  // Set title với notification count
  // Title sẽ là: "(5) Duyệt hóa đơn | EIMS" khi có 5 hóa đơn chờ
  usePageTitle('Duyệt hóa đơn', pendingCount)

  useEffect(() => {
    // Fetch pending invoices from API
    const fetchPendingInvoices = async () => {
      try {
        setLoading(true)
        
        // TODO: Replace với real API call
        // const response = await invoiceService.getPendingInvoices()
        // setPendingInvoices(response.data)
        
        // Mock data for demo
        const mockData: PendingInvoice[] = [
          { id: '1', invoiceNumber: 'HD-001', amount: 1000000, status: 'Pending' },
          { id: '2', invoiceNumber: 'HD-002', amount: 2000000, status: 'Pending' },
          { id: '3', invoiceNumber: 'HD-003', amount: 3000000, status: 'Pending' },
          { id: '4', invoiceNumber: 'HD-004', amount: 4000000, status: 'Approved' },
          { id: '5', invoiceNumber: 'HD-005', amount: 5000000, status: 'Pending' },
        ]
        
        setPendingInvoices(mockData)
      } catch (error) {
        console.error('Failed to fetch pending invoices:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPendingInvoices()

    // Optional: Poll for updates every 30 seconds
    const interval = setInterval(fetchPendingInvoices, 30000)

    return () => clearInterval(interval)
  }, [])

  // Handler khi approve hóa đơn
  const handleApprove = async (invoiceId: string) => {
    // TODO: API call to approve
    // await invoiceService.approveInvoice(invoiceId)

    // Update local state
    setPendingInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId ? { ...inv, status: 'Approved' } : inv
      )
    )

    // Title sẽ tự động update vì pendingCount thay đổi
    // Ví dụ: từ "(5) Duyệt hóa đơn | EIMS" → "(4) Duyệt hóa đơn | EIMS"
  }

  return (
    <div>
      <h1>Duyệt hóa đơn</h1>
      
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <>
          <p>Có {pendingCount} hóa đơn chờ duyệt</p>
          
          <ul>
            {pendingInvoices.map(invoice => (
              <li key={invoice.id}>
                {invoice.invoiceNumber} - {invoice.amount.toLocaleString('vi-VN')} VNĐ
                {invoice.status === 'Pending' && (
                  <button onClick={() => handleApprove(invoice.id)}>
                    Duyệt
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default HODInvoiceManagement

/**
 * Cách hoạt động:
 * 
 * 1. Initial Load:
 *    - Title: "(5) Duyệt hóa đơn | EIMS"
 *    - User thấy có 5 hóa đơn cần duyệt ngay trên tab
 * 
 * 2. User duyệt 1 hóa đơn:
 *    - pendingCount giảm từ 5 → 4
 *    - usePageTitle tự động update title: "(4) Duyệt hóa đơn | EIMS"
 * 
 * 3. User duyệt hết:
 *    - pendingCount = 0
 *    - Title: "Duyệt hóa đơn | EIMS" (không có badge số)
 * 
 * 4. User switch sang tab khác:
 *    - Title: "Hãy quay lại! 🥺"
 * 
 * 5. User quay lại:
 *    - Title restore: "(4) Duyệt hóa đơn | EIMS"
 * 
 * 6. Có hóa đơn mới (polling sau 30s):
 *    - pendingCount tăng 4 → 5
 *    - Title update: "(5) Duyệt hóa đơn | EIMS"
 *    - User thấy ngay có việc mới cần làm
 */
