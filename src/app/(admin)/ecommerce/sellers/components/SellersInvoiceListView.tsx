import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useState } from 'react'
import { Button, Card, Form, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap'
import type { OverlayInjectedProps } from 'react-bootstrap/esm/Overlay'
import InvoiceDetailModal from '@/app/(admin)/ecommerce/customers/components/InvoiceDetailModal'

interface SellerInvoiceData {
  id: string
  invoiceNumber: string
  date: string
  lookupCode: string
  buyerTaxCode: string
  buyerName: string
  totalAmount: string
  formNumber: string
  symbol: string
  pdfUrl: string
  paymentDeadline: string
  isPaid: boolean
}

const SellersListView = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<SellerInvoiceData | null>(null)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof SellerInvoiceData | null
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' })

  const invoices: SellerInvoiceData[] = [
    {
      id: '1',
      invoiceNumber: '0000018',
      date: '11/06/2020',
      lookupCode: 'QXVSUWW_B',
      buyerTaxCode: '0104880443-195',
      buyerName: 'Công ty CP ABC Việt Nam',
      totalAmount: '88,000,000VND',
      formNumber: '01GTKT01001',
      symbol: 'AB/2DE',
      pdfUrl: '/sample-invoice.pdf',
      paymentDeadline: 'Không có hạn',
      isPaid: true,
    },
    {
      id: '2',
      invoiceNumber: '0000014',
      date: '11/06/2020',
      lookupCode: 'B4SP5EWLX',
      buyerTaxCode: '0104880443-195',
      buyerName: 'Công ty CP XYZ Việt Nam',
      totalAmount: '88,000,000VND',
      formNumber: '01GTKT01001',
      symbol: 'AB/2DE',
      pdfUrl: '/sample-invoice.pdf',
      paymentDeadline: 'Không có hạn',
      isPaid: false,
    },
    {
      id: '3',
      invoiceNumber: '0000010',
      date: '11/06/2020',
      lookupCode: '4AESEIV4DA',
      buyerTaxCode: '0104880443-195',
      buyerName: 'Công ty CP DEF Việt Nam',
      totalAmount: '88,000,000VND',
      formNumber: '01GTKT01001',
      symbol: 'AB/2DE',
      pdfUrl: '/sample-invoice.pdf',
      paymentDeadline: 'Không có hạn',
      isPaid: true,
    },
    {
      id: '4',
      invoiceNumber: '0000009',
      date: '11/06/2020',
      lookupCode: '2W5DS4E2k',
      buyerTaxCode: '0104880443-195',
      buyerName: 'Công ty CP GHI Việt Nam',
      totalAmount: '88,000,000VND',
      formNumber: '01GTKT01001',
      symbol: 'AB/2DE',
      pdfUrl: '/sample-invoice.pdf',
      paymentDeadline: 'Không có hạn',
      isPaid: false,
    },
    {
      id: '5',
      invoiceNumber: '0000008',
      date: '10/06/2020',
      lookupCode: 'M8N4O9P1Q',
      buyerTaxCode: '0104880443-195',
      buyerName: 'Công ty CP JKL Việt Nam',
      totalAmount: '50,000,000VND',
      formNumber: '01GTKT01001',
      symbol: 'AB/2DE',
      pdfUrl: '/sample-invoice.pdf',
      paymentDeadline: '30/06/2020',
      isPaid: false,
    },
    {
      id: '6',
      invoiceNumber: '0000007',
      date: '10/06/2020',
      lookupCode: 'R2S3T4U5V',
      buyerTaxCode: '0104880443-195',
      buyerName: 'Công ty CP MNO Việt Nam',
      totalAmount: '120,000,000VND',
      formNumber: '01GTKT01001',
      symbol: 'AB/2DE',
      pdfUrl: '/sample-invoice.pdf',
      paymentDeadline: '15/07/2020',
      isPaid: true,
    },
    {
      id: '7',
      invoiceNumber: '0000006',
      date: '09/06/2020',
      lookupCode: 'W6X7Y8Z9A',
      buyerTaxCode: '0104880443-195',
      buyerName: 'Công ty CP PQR Việt Nam',
      totalAmount: '75,000,000VND',
      formNumber: '01GTKT01001',
      symbol: 'AB/2DE',
      pdfUrl: '/sample-invoice.pdf',
      paymentDeadline: 'Không có hạn',
      isPaid: true,
    },
    {
      id: '8',
      invoiceNumber: '0000005',
      date: '09/06/2020',
      lookupCode: 'B1C2D3E4F',
      buyerTaxCode: '0104880443-195',
      buyerName: 'Công ty CP STU Việt Nam',
      totalAmount: '95,000,000VND',
      formNumber: '01GTKT01001',
      symbol: 'AB/2DE',
      pdfUrl: '/sample-invoice.pdf',
      paymentDeadline: '20/06/2020',
      isPaid: false,
    },
    {
      id: '9',
      invoiceNumber: '0000004',
      date: '08/06/2020',
      lookupCode: 'G5H6I7J8K',
      buyerTaxCode: '0104880443-195',
      buyerName: 'Công ty CP VWX Việt Nam',
      totalAmount: '60,000,000VND',
      formNumber: '01GTKT01001',
      symbol: 'AB/2DE',
      pdfUrl: '/sample-invoice.pdf',
      paymentDeadline: 'Không có hạn',
      isPaid: true,
    },
    {
      id: '10',
      invoiceNumber: '0000003',
      date: '08/06/2020',
      lookupCode: 'L9M0N1O2P',
      buyerTaxCode: '0104880443-195',
      buyerName: 'Công ty CP YZA Việt Nam',
      totalAmount: '110,000,000VND',
      formNumber: '01GTKT01001',
      symbol: 'AB/2DE',
      pdfUrl: '/sample-invoice.pdf',
      paymentDeadline: '25/06/2020',
      isPaid: false,
    },
  ]

  // Filter invoices based on search query
  const filteredInvoices = invoices.filter((invoice) => invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()))

  // Sort invoices
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (!sortConfig.key) return 0

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    // Handle sorting for totalAmount (convert to number for proper comparison)
    if (sortConfig.key === 'totalAmount') {
      const aNumber = parseFloat(aValue.toString().replace(/[^0-9]/g, ''))
      const bNumber = parseFloat(bValue.toString().replace(/[^0-9]/g, ''))
      return sortConfig.direction === 'asc' ? aNumber - bNumber : bNumber - aNumber
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return sortConfig.direction === 'asc' ? (aValue ? 1 : -1) : bValue ? 1 : -1
    }

    return 0
  })

  const handleSort = (key: keyof SellerInvoiceData) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleViewDetail = (invoice: SellerInvoiceData) => {
    setSelectedInvoice(invoice)
    setShowDetailModal(true)
  }

  const renderTooltip = (message: string) => (props: OverlayInjectedProps) => (
    <Tooltip id="button-tooltip" {...props}>
      {message}
    </Tooltip>
  )

  return (
    <>
      <Card className="my-4">
        <Card.Header>
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="mb-0">Danh sách hóa đơn</h5>
            <InputGroup className="w-auto">
              <InputGroup.Text>
                <IconifyIcon icon="bx:search" />
              </InputGroup.Text>
              <Form.Control placeholder="Tìm kiếm theo số hóa đơn..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </InputGroup>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th onClick={() => handleSort('invoiceNumber')} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center gap-2">
                      Số hóa đơn
                      <IconifyIcon
                        icon={sortConfig.key === 'invoiceNumber' ? (sortConfig.direction === 'asc' ? 'bx:up-arrow' : 'bx:down-arrow') : 'bx:sort'}
                      />
                    </div>
                  </th>
                  <th>Mã tra cứu</th>
                  <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center gap-2">
                      Ngày
                      <IconifyIcon
                        icon={sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? 'bx:up-arrow' : 'bx:down-arrow') : 'bx:sort'}
                      />
                    </div>
                  </th>
                  <th onClick={() => handleSort('totalAmount')} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center gap-2">
                      Tổng tiền
                      <IconifyIcon
                        icon={sortConfig.key === 'totalAmount' ? (sortConfig.direction === 'asc' ? 'bx:up-arrow' : 'bx:down-arrow') : 'bx:sort'}
                      />
                    </div>
                  </th>
                  <th onClick={() => handleSort('buyerName')} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center gap-2">
                      Khách hàng
                      <IconifyIcon
                        icon={sortConfig.key === 'buyerName' ? (sortConfig.direction === 'asc' ? 'bx:up-arrow' : 'bx:down-arrow') : 'bx:sort'}
                      />
                    </div>
                  </th>
                  <th onClick={() => handleSort('isPaid')} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center gap-2">
                      Trạng thái
                      <IconifyIcon
                        icon={sortConfig.key === 'isPaid' ? (sortConfig.direction === 'asc' ? 'bx:up-arrow' : 'bx:down-arrow') : 'bx:sort'}
                      />
                    </div>
                  </th>
                  <th style={{ width: '120px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <strong>{invoice.invoiceNumber}</strong>
                    </td>
                    <td>{invoice.lookupCode}</td>
                    <td>{invoice.date}</td>
                    <td className="fw-semibold">{invoice.totalAmount}</td>
                    <td>{invoice.buyerName}</td>
                    <td>
                      {invoice.isPaid ? (
                        <span className="badge bg-success">Đã thanh toán</span>
                      ) : (
                        <span className="badge bg-warning">Chưa thanh toán</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <OverlayTrigger placement="top" overlay={renderTooltip('Xem chi tiết')}>
                          <Button variant="light" size="sm" className="btn-icon" onClick={() => handleViewDetail(invoice)}>
                            <IconifyIcon icon="bx:show" />
                          </Button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={renderTooltip('Tải xuống')}>
                          <Button variant="light" size="sm" className="btn-icon">
                            <IconifyIcon icon="bx:download" />
                          </Button>
                        </OverlayTrigger>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      {selectedInvoice && <InvoiceDetailModal show={showDetailModal} onHide={() => setShowDetailModal(false)} invoice={selectedInvoice} />}
    </>
  )
}

export default SellersListView
