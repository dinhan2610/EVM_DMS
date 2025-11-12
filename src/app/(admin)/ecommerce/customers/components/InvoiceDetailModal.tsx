import { Button, Modal } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

interface InvoiceDetailModalProps {
  show: boolean
  onHide: () => void
  invoice: {
    invoiceNumber: string
    totalAmount: string
    paymentDeadline: string
    pdfUrl: string
    isPaid: boolean
  } | null
}

const InvoiceDetailModal = ({ show, onHide, invoice }: InvoiceDetailModalProps) => {
  if (!invoice) return null

  const handleDownloadPDF = () => {
    // Download PDF logic
    console.log('Downloading PDF:', invoice.pdfUrl)
  }

  const handleDownloadXML = () => {
    // Download XML logic
    console.log('Downloading XML')
  }

  const handlePrintInvoice = () => {
    // Print invoice
    window.print()
  }

  return (
    <Modal show={show} onHide={onHide} size="xl" fullscreen="lg-down">
      <Modal.Header closeButton className="border-0">
        <Modal.Title>Thông tin hóa đơn</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div className="row g-0">
          {/* Left side - PDF Viewer */}
          <div className="col-lg-8 border-end">
            <div className="p-3 bg-light border-bottom">
              <h6 className="mb-0">Chi tiết hóa đơn</h6>
            </div>
            <div className="p-3" style={{ height: '70vh', overflow: 'auto' }}>
              <iframe
                src={invoice.pdfUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                title="Invoice PDF"
              />
            </div>
          </div>

          {/* Right side - Invoice Information */}
          <div className="col-lg-4">
            <div className="p-4">
              <h5 className="mb-4">Thông tin hóa đơn</h5>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Số hóa đơn:</span>
                  <strong>{invoice.invoiceNumber}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Tổng tiền thanh toán:</span>
                  <strong className="text-primary">{invoice.totalAmount}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Hạn thanh toán:</span>
                  <strong className="text-danger">{invoice.paymentDeadline}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted">Trạng thái:</span>
                  {invoice.isPaid ? (
                    <span className="badge bg-success">Đã thanh toán</span>
                  ) : (
                    <span className="badge bg-warning">Chưa thanh toán</span>
                  )}
                </div>
              </div>

              <hr className="my-4" />

              <h6 className="mb-3">Tải hóa đơn</h6>

              <div className="d-grid gap-2">
                <Button 
                  variant="outline-primary" 
                  className="d-flex align-items-center justify-content-start"
                  onClick={handleDownloadPDF}
                >
                  <div className="d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                    <IconifyIcon icon="bx:file-blank" className="fs-3 text-danger" />
                  </div>
                  <div className="text-start">
                    <div className="fw-semibold">Hóa đơn PDF</div>
                  </div>
                </Button>

                <Button 
                  variant="outline-primary" 
                  className="d-flex align-items-center justify-content-start"
                  onClick={handleDownloadXML}
                >
                  <div className="d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                    <IconifyIcon icon="bx:file" className="fs-3 text-success" />
                  </div>
                  <div className="text-start">
                    <div className="fw-semibold">Hóa đơn XML</div>
                  </div>
                </Button>

                <Button 
                  variant="outline-primary" 
                  className="d-flex align-items-center justify-content-start"
                  onClick={handlePrintInvoice}
                >
                  <div className="d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                    <IconifyIcon icon="bx:printer" className="fs-3 text-secondary" />
                  </div>
                  <div className="text-start">
                    <div className="fw-semibold">In hóa đơn</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default InvoiceDetailModal
