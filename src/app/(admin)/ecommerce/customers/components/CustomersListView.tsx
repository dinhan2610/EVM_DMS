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
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InvoiceData | null
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' })

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedInvoices(invoices.map((inv) => inv.id))
    } else {
      setSelectedInvoices([])
    }
  }

  const handleSelectInvoice = (id: string) => {
    if (selectedInvoices.includes(id)) {
      setSelectedInvoices(selectedInvoices.filter((invId) => invId !== id))
    } else {
      setSelectedInvoices([...selectedInvoices, id])
    }
  }

  const handleViewInvoice = (id: string) => {
    const invoice = invoices.find((inv) => inv.id === id)
    if (invoice) {
      setSelectedInvoice(invoice)
      setShowDetailModal(true)
    }
  }

  const handleDownloadInvoice = (id: string) => {
    const invoice = invoices.find((inv) => inv.id === id)
    if (invoice) {
      // Download PDF from database
      window.open(invoice.pdfUrl, '_blank')
    }
  }

  const handleTogglePaymentStatus = (id: string) => {
    // In real app, this would call an API to update the status
    console.log('Toggle payment status for invoice:', id)
    // You can add state update logic here to update the invoice status
  }

  const handleSort = (key: keyof InvoiceData) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const getSortedInvoices = () => {
    const sortedInvoices = [...invoices]

    if (sortConfig.key) {
      sortedInvoices.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]

        // Handle date sorting
        if (sortConfig.key === 'date') {
          const dateA = new Date(aValue as string).getTime()
          const dateB = new Date(bValue as string).getTime()
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA
        }

        // Handle boolean sorting (isPaid)
        if (sortConfig.key === 'isPaid') {
          const valA = aValue ? 1 : 0
          const valB = bValue ? 1 : 0
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA
        }

        // Handle price sorting (totalAmount)
        if (sortConfig.key === 'totalAmount') {
          // Remove commas and 'VND' from string and convert to number
          const numA = parseFloat((aValue as string).replace(/,/g, '').replace('VND', ''))
          const numB = parseFloat((bValue as string).replace(/,/g, '').replace('VND', ''))
          return sortConfig.direction === 'asc' ? numA - numB : numB - numA
        }

        // Handle string/number sorting
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return sortedInvoices
  }

  const getSortIcon = (key: keyof InvoiceData) => {
    if (sortConfig.key !== key) {
      return <IconifyIcon icon="bx:sort" className="ms-1 text-muted" />
    }
    return sortConfig.direction === 'asc' ? <IconifyIcon icon="bx:sort-up" className="ms-1" /> : <IconifyIcon icon="bx:sort-down" className="ms-1" />
  }

  const handleExportExcel = () => {
    console.log('Export to Excel')
  }

  const renderSearchTooltip = (props: OverlayInjectedProps) => (
    <Tooltip id="search-tooltip" {...props}>
      Có thể tìm kiếm hóa đơn theo Mã số thuế, tên người bán, số hóa đơn...
    </Tooltip>
  )

  const renderExportTooltip = (props: OverlayInjectedProps) => (
    <Tooltip id="export-tooltip" {...props}>
      Nhấn vào đây để xuất khẩu danh sách hóa đơn
    </Tooltip>
  )

  const renderActionsTooltip = (props: OverlayInjectedProps) => (
    <Tooltip id="actions-tooltip" {...props}>
      Có thể xem lại và tải từng hóa đơn từ danh sách
    </Tooltip>
  )

  return (
    <>
      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <h4 className="mb-0">Hóa đơn của tôi</h4>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <OverlayTrigger placement="bottom" overlay={renderSearchTooltip}>
                <InputGroup style={{ width: '300px' }}>
                  <InputGroup.Text>
                    <IconifyIcon icon="bx:search" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Nhập MST, tên người bán để tìm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </OverlayTrigger>
              <OverlayTrigger placement="bottom" overlay={renderExportTooltip}>
                <Button variant="primary" onClick={handleExportExcel}>
                  <IconifyIcon icon="bx:download" className="me-1" />
                  Xuất Excel
                </Button>
              </OverlayTrigger>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover text-nowrap mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '40px' }}>
                  <Form.Check type="checkbox" id="select-all" checked={selectedInvoices.length === invoices.length} onChange={handleSelectAll} />
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('invoiceNumber')}>
                  Số hóa đơn {getSortIcon('invoiceNumber')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('date')}>
                  Ngày hóa đơn {getSortIcon('date')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('lookupCode')}>
                  Mã tra cứu {getSortIcon('lookupCode')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('totalAmount')}>
                  Tổng tiền {getSortIcon('totalAmount')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('formNumber')}>
                  Mẫu số {getSortIcon('formNumber')}
                </th>
                <th style={{ width: '150px', cursor: 'pointer' }} onClick={() => handleSort('isPaid')}>
                  Trạng thái {getSortIcon('isPaid')}
                </th>
                <th style={{ width: '100px' }}></th>
              </tr>
            </thead>
            <tbody>
              {getSortedInvoices().map((invoice, index) => (
                <tr key={invoice.id} className={index === 1 ? 'table-active' : ''}>
                  <td>
                    <Form.Check type="checkbox" checked={selectedInvoices.includes(invoice.id)} onChange={() => handleSelectInvoice(invoice.id)} />
                  </td>
                  <td>{invoice.invoiceNumber}</td>
                  <td>{invoice.date}</td>
                  <td>{invoice.lookupCode}</td>
                  <td>{invoice.totalAmount}</td>
                  <td>{invoice.formNumber}</td>
                  <td>
                    {invoice.isPaid ? (
                      <Button variant="success" size="sm" onClick={() => handleTogglePaymentStatus(invoice.id)}>
                        <IconifyIcon icon="bx:check-circle" className="me-1" />
                        Đã thanh toán
                      </Button>
                    ) : (
                      <Button variant="warning" size="sm" onClick={() => handleTogglePaymentStatus(invoice.id)}>
                        <IconifyIcon icon="bx:time-five" className="me-1" />
                        Chưa thanh toán
                      </Button>
                    )}
                  </td>
                  <td>
                    <OverlayTrigger placement="left" overlay={renderActionsTooltip}>
                      <div className="d-flex gap-2">
                        <Button variant="soft-primary" size="sm" onClick={() => handleViewInvoice(invoice.id)} title="Xem">
                          <IconifyIcon icon="bx:show" />
                        </Button>
                        <Button variant="soft-success" size="sm" onClick={() => handleDownloadInvoice(invoice.id)} title="Tải xuống">
                          <IconifyIcon icon="bx:download" />
                        </Button>
                      </div>
                    </OverlayTrigger>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <InvoiceDetailModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        invoice={
          selectedInvoice
            ? {
                invoiceNumber: selectedInvoice.invoiceNumber,
                totalAmount: selectedInvoice.totalAmount,
                paymentDeadline: selectedInvoice.paymentDeadline,
                pdfUrl: selectedInvoice.pdfUrl,
                isPaid: selectedInvoice.isPaid,
              }
            : null
        }
      />
    </>
  )
}

export default CustomersListView
