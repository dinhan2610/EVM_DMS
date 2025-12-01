import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useState } from 'react'
import { Button, Card, Form, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap'
import type { OverlayInjectedProps } from 'react-bootstrap/esm/Overlay'
import InvoiceDetailModal from './InvoiceDetailModal'

interface InvoiceData {
  id: string
  invoiceNumber: string
  date: string
  lookupCode: string
  sellerTaxCode: string
  sellerName: string
  totalAmount: string
  formNumber: string
  symbol: string
  pdfUrl: string
  paymentDeadline: string
  isPaid: boolean
}

const CustomersListView = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InvoiceData | null
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' })

  const itemsPerPage = 10

  const invoices: InvoiceData[] = [
    {
      id: '1',
      invoiceNumber: '0000018',
      date: '11/06/2020',
      lookupCode: 'QXVSUWW_B',
      sellerTaxCode: '0104880443-195',
      sellerName: 'Công ty CP Kachi Việt Nam',
      totalAmount: '88,000,000VND',
      formNumber: '01GTKT01001',
      symbol: 'AB/2DE',
      pdfUrl: '/sample-invoice.pdf', // Replace with actual PDF URL from database
      paymentDeadline: 'Không có hạn',
      isPaid: true,
    },
    {
      id: '2',
      invoiceNumber: '0000014',
      date: '11/06/2020',
      lookupCode: 'B4SP5EWLX',
      sellerTaxCode: '0104880443-195',
      sellerName: 'Công ty CP Kachi Việt Nam',
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
      sellerTaxCode: '0104880443-195',
      sellerName: 'Công ty CP Kachi Việt Nam',
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
      sellerTaxCode: '0104880443-195',
      sellerName: 'Công ty CP Kachi Việt Nam',
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
      date: '11/06/2020',
      lookupCode: 'NVSGSKG0D',
      sellerTaxCode: '0104880443-195',
      sellerName: 'Công ty CP Kachi Việt Nam',
      totalAmount: '88,000,000VND',
      formNumber: '01GTKT01001',
      symbol: 'AB/2DE',
      pdfUrl: '/sample-invoice.pdf',
      paymentDeadline: 'Không có hạn',
      isPaid: true,
    },
    {
      id: '6',
      invoiceNumber: '0000054',
      date: '11/06/2020',
      lookupCode: '75FdKl28b',
      sellerTaxCode: '0101243150-195',
      sellerName: 'Công ty TNHH XYZ',
      totalAmount: '550,000VND',
      formNumber: '01GTKT01002',
      symbol: 'AC/TRE',
      pdfUrl: '/sample-invoice.pdf',
      paymentDeadline: 'Không có hạn',
      isPaid: false,
    },
    {
      id: '7',
      invoiceNumber: '0000001',
      date: '11/06/2020',
      lookupCode: 'IKF7HH2NQ',
      sellerTaxCode: '0101243150-195',
      sellerName: 'Công ty TNHH XYZ',
      totalAmount: '550,000VND',
      formNumber: '01GTKT01003',
      symbol: 'AB/TRE',
      pdfUrl: '/sample-invoice.pdf',
      paymentDeadline: 'Không có hạn',
      isPaid: true,
    },
    {
      id: '8',
      invoiceNumber: '0000065',
      date: '11/06/2020',
      lookupCode: 'WXFHl9QRr',
      sellerTaxCode: '0101243150-195',
      sellerName: 'Công ty TNHH XYZ',
      totalAmount: '24,750,000VND',
      formNumber: '01GTKT01001',
      symbol: 'AB/TRE',
      pdfUrl: '/sample-invoice.pdf',
      paymentDeadline: 'Không có hạn',
      isPaid: false,
    },
    {
      id: '9',
      invoiceNumber: '0000050',
      date: '11/06/2020',
      lookupCode: 'lh7F4UXGfl2',
      sellerTaxCode: '0101243150-195',
      sellerName: 'Công ty TNHH XYZ',
      totalAmount: '220,000,000VND',
      formNumber: '01GTKT01001',
      symbol: 'AB/TRE',
      pdfUrl: '/sample-invoice.pdf',
      paymentDeadline: 'Không có hạn',
      isPaid: true,
    },
    {
      id: '10',
      invoiceNumber: '0000047',
      date: '11/06/2020',
      lookupCode: 'l3_FXU1Xl8',
      sellerTaxCode: '0101243150-195',
      sellerName: 'Công ty TNHH XYZ',
      totalAmount: '11,000,000VND',
      formNumber: '01GTKT01001',
      symbol: 'AB/TRE',
      pdfUrl: '/sample-invoice.pdf',
      paymentDeadline: 'Không có hạn',
      isPaid: false,
    },
  ]

  // Filter invoices based on search query
  const filteredInvoices = invoices.filter((invoice) => invoice.lookupCode.toLowerCase().includes(searchQuery.toLowerCase()))

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

  const handleSort = (key: keyof InvoiceData) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleViewDetail = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice)
    setShowDetailModal(true)
  }

  const renderTooltip = (message: string) => (props: OverlayInjectedProps) => (
    <Tooltip id="button-tooltip" {...props}>
      {message}
    </Tooltip>
  )

  // Pagination logic
  const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInvoices = sortedInvoices.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

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
              <Form.Control placeholder="Tìm kiếm theo mã tra cứu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
                {paginatedInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <strong>{invoice.invoiceNumber}</strong>
                    </td>
                    <td>{invoice.lookupCode}</td>
                    <td>{invoice.date}</td>
                    <td className="fw-semibold">{invoice.totalAmount}</td>
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
        {totalPages > 1 && (
          <Card.Footer>
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted">
                Hiển thị {startIndex + 1} - {Math.min(endIndex, sortedInvoices.length)} trong tổng số {sortedInvoices.length} hóa đơn
              </div>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                      Trước
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => handlePageChange(page)}>
                        {page}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                      Sau
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </Card.Footer>
        )}
      </Card>

      {selectedInvoice && <InvoiceDetailModal show={showDetailModal} onHide={() => setShowDetailModal(false)} invoice={selectedInvoice} />}
    </>
  )
}

export default CustomersListView
