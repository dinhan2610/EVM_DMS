import { useState } from 'react'
import { Button, Card, Col, Container, Form, InputGroup, Row, Alert, Badge } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

interface InvoiceDetail {
  invoiceNumber: string
  date: string
  lookupCode: string
  sellerTaxCode: string
  sellerName: string
  sellerAddress: string
  buyerTaxCode: string
  buyerName: string
  buyerAddress: string
  totalAmount: string
  taxAmount: string
  totalAmountWithTax: string
  formNumber: string
  symbol: string
  paymentDeadline: string
  isPaid: boolean
  items: Array<{
    no: number
    productName: string
    unit: string
    quantity: number
    unitPrice: string
    amount: string
  }>
}

const InvoiceLookupPage = () => {
  const navigate = useNavigate()
  const [lookupCode, setLookupCode] = useState('')
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Mock data - replace with API call
  const mockInvoices: Record<string, InvoiceDetail> = {
    '1M7YMDP1R7G': {
      invoiceNumber: '0000001',
      date: '01/12/2025',
      lookupCode: '1M7YMDP1R7G',
      sellerTaxCode: '0104880443-195',
      sellerName: 'CÔNG TY CỔ PHẦN KACHI VIỆT NAM',
      sellerAddress: 'Số 123, Đường ABC, Phường XYZ, Quận 1, TP.HCM',
      buyerTaxCode: '0123456789',
      buyerName: 'CÔNG TY TNHH ABC',
      buyerAddress: 'Số 456, Đường DEF, Phường GHI, Quận 2, TP.HCM',
      totalAmount: '100,000,000',
      taxAmount: '10,000,000',
      totalAmountWithTax: '110,000,000',
      formNumber: '01GTKT01001',
      symbol: 'AB/2DE',
      paymentDeadline: '15/12/2025',
      isPaid: false,
      items: [
        {
          no: 1,
          productName: 'Sản phẩm A',
          unit: 'Cái',
          quantity: 10,
          unitPrice: '10,000,000',
          amount: '100,000,000',
        },
      ],
    },
    QXVSUWW_B: {
      invoiceNumber: '0000018',
      date: '11/06/2020',
      lookupCode: 'QXVSUWW_B',
      sellerTaxCode: '0104880443-195',
      sellerName: 'CÔNG TY CỔ PHẦN KACHI VIỆT NAM',
      sellerAddress: 'Số 123, Đường ABC, Phường XYZ, Quận 1, TP.HCM',
      buyerTaxCode: '0987654321',
      buyerName: 'CÔNG TY TNHH XYZ',
      buyerAddress: 'Số 789, Đường JKL, Phường MNO, Quận 3, TP.HCM',
      totalAmount: '80,000,000',
      taxAmount: '8,000,000',
      totalAmountWithTax: '88,000,000',
      formNumber: '01GTKT01001',
      symbol: 'AB/2DE',
      paymentDeadline: 'Không có hạn',
      isPaid: true,
      items: [
        {
          no: 1,
          productName: 'Dịch vụ tư vấn',
          unit: 'Dịch vụ',
          quantity: 1,
          unitPrice: '80,000,000',
          amount: '80,000,000',
        },
      ],
    },
  }

  const handleSearch = () => {
    setError('')
    setInvoice(null)
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      const foundInvoice = mockInvoices[lookupCode.toUpperCase()]
      if (foundInvoice) {
        setInvoice(foundInvoice)
      } else {
        setError('Không tìm thấy hóa đơn với mã tra cứu này. Vui lòng kiểm tra lại.')
      }
      setLoading(false)
    }, 500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    if (!invoice) return

    // In a real application, this would call an API to get the PDF
    // For now, we'll simulate a download
    const link = document.createElement('a')
    link.href = `/api/invoices/${invoice.lookupCode}/pdf` // Replace with actual API endpoint
    link.download = `HoaDon_${invoice.invoiceNumber}_${invoice.lookupCode}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Show notification
    alert('Đang tải xuống file PDF...')
  }

  const handleDownloadXML = () => {
    if (!invoice) return

    // Generate XML content
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice>
  <InvoiceNumber>${invoice.invoiceNumber}</InvoiceNumber>
  <Date>${invoice.date}</Date>
  <LookupCode>${invoice.lookupCode}</LookupCode>
  <FormNumber>${invoice.formNumber}</FormNumber>
  <Symbol>${invoice.symbol}</Symbol>
  <Seller>
    <Name>${invoice.sellerName}</Name>
    <TaxCode>${invoice.sellerTaxCode}</TaxCode>
    <Address>${invoice.sellerAddress}</Address>
  </Seller>
  <Buyer>
    <Name>${invoice.buyerName}</Name>
    <TaxCode>${invoice.buyerTaxCode}</TaxCode>
    <Address>${invoice.buyerAddress}</Address>
  </Buyer>
  <Items>
${invoice.items
  .map(
    (item) => `    <Item>
      <No>${item.no}</No>
      <ProductName>${item.productName}</ProductName>
      <Unit>${item.unit}</Unit>
      <Quantity>${item.quantity}</Quantity>
      <UnitPrice>${item.unitPrice}</UnitPrice>
      <Amount>${item.amount}</Amount>
    </Item>`,
  )
  .join('\n')}
  </Items>
  <TotalAmount>${invoice.totalAmount}</TotalAmount>
  <TaxAmount>${invoice.taxAmount}</TaxAmount>
  <TotalAmountWithTax>${invoice.totalAmountWithTax}</TotalAmountWithTax>
  <PaymentDeadline>${invoice.paymentDeadline}</PaymentDeadline>
  <IsPaid>${invoice.isPaid}</IsPaid>
</Invoice>`

    // Create blob and download
    const blob = new Blob([xmlContent], { type: 'application/xml' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `HoaDon_${invoice.invoiceNumber}_${invoice.lookupCode}.xml`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div
      className="min-vh-100 position-relative"
      style={{
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        backgroundAttachment: 'fixed',
      }}>
      {/* Decorative Background Elements */}
      <div
        className="position-absolute w-100 h-100"
        style={{
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          pointerEvents: 'none',
        }}
      />

      <Container className="position-relative py-5">
        {/* Login Button */}
        <div className="d-flex justify-content-end mb-3">
          <Button variant="light" onClick={() => navigate('/auth/sign-in')} className="shadow-sm">
            <IconifyIcon icon="bx:log-in" className="me-1" />
            Đăng nhập
          </Button>
        </div>

        <Row className="justify-content-center mb-4">
          <Col lg={8}>
            <Card className="shadow-lg border-0">
              <Card.Body className="text-center py-5">
                <div className="mb-4">
                  <div className="d-inline-block p-3 rounded-circle bg-info bg-opacity-10">
                    <IconifyIcon icon="mdi:file-document-outline" className="text-info" style={{ fontSize: '64px' }} />
                  </div>
                </div>
                <h2 className="mb-3 fw-bold">Tra cứu hóa đơn điện tử</h2>
                <p className="text-muted mb-4">Nhập mã tra cứu để xem chi tiết và tải xuống hóa đơn của bạn</p>

                <Row className="justify-content-center">
                  <Col md={8}>
                    <InputGroup size="lg">
                      <Form.Control
                        type="text"
                        placeholder="Nhập mã tra cứu hóa đơn..."
                        value={lookupCode}
                        onChange={(e) => setLookupCode(e.target.value)}
                        onKeyPress={handleKeyPress}
                      />
                      <Button variant="primary" onClick={handleSearch} disabled={!lookupCode.trim() || loading}>
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Đang tìm...
                          </>
                        ) : (
                          <>
                            <IconifyIcon icon="bx:search" className="me-1" />
                            Tra cứu
                          </>
                        )}
                      </Button>
                    </InputGroup>
                    <Form.Text className="text-muted">Ví dụ: 1M7YMDP1R7G, QXVSUWW_B</Form.Text>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {error && (
          <Row className="justify-content-center mb-4">
            <Col lg={8}>
              <Alert variant="danger" dismissible onClose={() => setError('')} className="shadow-sm border-0">
                <IconifyIcon icon="bx:error-circle" className="me-2" />
                {error}
              </Alert>
            </Col>
          </Row>
        )}

        {invoice && (
          <Row className="justify-content-center">
            <Col lg={10}>
              <Card className="shadow-lg border-0">
                <Card.Header className="bg-white py-3">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h4 className="mb-0">Chi tiết hóa đơn</h4>
                    <div className="d-flex gap-2 flex-wrap">
                      {invoice.isPaid ? (
                        <Badge bg="success" className="px-3 py-2">
                          <IconifyIcon icon="bx:check-circle" className="me-1" />
                          Đã thanh toán
                        </Badge>
                      ) : (
                        <Badge bg="warning" className="px-3 py-2">
                          <IconifyIcon icon="bx:time-five" className="me-1" />
                          Chưa thanh toán
                        </Badge>
                      )}
                      <Button variant="success" size="sm" onClick={handleDownloadPDF}>
                        <IconifyIcon icon="bx:download" className="me-1" />
                        Tải PDF
                      </Button>
                      <Button variant="info" size="sm" onClick={handleDownloadXML}>
                        <IconifyIcon icon="bx:download" className="me-1" />
                        Tải XML
                      </Button>
                      <Button variant="outline-primary" size="sm" onClick={handlePrint}>
                        <IconifyIcon icon="bx:printer" className="me-1" />
                        In hóa đơn
                      </Button>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="p-4">
                  {/* Invoice Header */}
                  <div className="text-center mb-4 pb-4 border-bottom">
                    <h3 className="text-primary mb-2">HÓA ĐƠN GIA TRỊ GIA TĂNG</h3>
                    <p className="mb-1">
                      Mẫu số: {invoice.formNumber} - Ký hiệu: {invoice.symbol}
                    </p>
                    <p className="mb-0">
                      Số: <strong>{invoice.invoiceNumber}</strong>
                    </p>
                  </div>

                  {/* Seller Info */}
                  <Row className="mb-4">
                    <Col md={6}>
                      <h5 className="text-primary mb-3">Đơn vị bán hàng</h5>
                      <p className="mb-2">
                        <strong>Tên công ty:</strong> {invoice.sellerName}
                      </p>
                      <p className="mb-2">
                        <strong>Mã số thuế:</strong> {invoice.sellerTaxCode}
                      </p>
                      <p className="mb-2">
                        <strong>Địa chỉ:</strong> {invoice.sellerAddress}
                      </p>
                    </Col>
                    <Col md={6}>
                      <h5 className="text-primary mb-3">Đơn vị mua hàng</h5>
                      <p className="mb-2">
                        <strong>Tên công ty:</strong> {invoice.buyerName}
                      </p>
                      <p className="mb-2">
                        <strong>Mã số thuế:</strong> {invoice.buyerTaxCode}
                      </p>
                      <p className="mb-2">
                        <strong>Địa chỉ:</strong> {invoice.buyerAddress}
                      </p>
                    </Col>
                  </Row>

                  {/* Invoice Info */}
                  <Row className="mb-4">
                    <Col md={4}>
                      <p className="mb-2">
                        <strong>Ngày hóa đơn:</strong> {invoice.date}
                      </p>
                    </Col>
                    <Col md={4}>
                      <p className="mb-2">
                        <strong>Mã tra cứu:</strong> {invoice.lookupCode}
                      </p>
                    </Col>
                    <Col md={4}>
                      <p className="mb-2">
                        <strong>Hạn thanh toán:</strong> {invoice.paymentDeadline}
                      </p>
                    </Col>
                  </Row>

                  {/* Items Table */}
                  <div className="table-responsive mb-4">
                    <table className="table table-bordered">
                      <thead className="table-light">
                        <tr className="text-center">
                          <th style={{ width: '50px' }}>STT</th>
                          <th>Tên hàng hóa, dịch vụ</th>
                          <th style={{ width: '100px' }}>Đơn vị tính</th>
                          <th style={{ width: '100px' }}>Số lượng</th>
                          <th style={{ width: '150px' }}>Đơn giá</th>
                          <th style={{ width: '150px' }}>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item) => (
                          <tr key={item.no}>
                            <td className="text-center">{item.no}</td>
                            <td>{item.productName}</td>
                            <td className="text-center">{item.unit}</td>
                            <td className="text-center">{item.quantity}</td>
                            <td className="text-end">{item.unitPrice}</td>
                            <td className="text-end fw-semibold">{item.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total Section */}
                  <Row className="justify-content-end">
                    <Col md={6}>
                      <div className="border-top pt-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Tổng tiền hàng:</span>
                          <strong>{invoice.totalAmount} VNĐ</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Thuế GTGT (10%):</span>
                          <strong>{invoice.taxAmount} VNĐ</strong>
                        </div>
                        <div className="d-flex justify-content-between border-top pt-2">
                          <span className="h5 mb-0">Tổng cộng:</span>
                          <strong className="h5 mb-0 text-primary">{invoice.totalAmountWithTax} VNĐ</strong>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {/* Footer Note */}
                  <div className="mt-4 pt-4 border-top text-center text-muted">
                    <p className="mb-0">
                      <IconifyIcon icon="bx:info-circle" className="me-1" />
                      Đây là hóa đơn điện tử hợp lệ. Để xác thực, vui lòng truy cập website và nhập mã tra cứu.
                    </p>
                  </div>
                </Card.Body>
              </Card>

              {/* Action Buttons */}
              <div className="text-center mt-4">
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setInvoice(null)
                    setLookupCode('')
                  }}>
                  <IconifyIcon icon="bx:search" className="me-1" />
                  Tra cứu hóa đơn khác
                </Button>
              </div>
            </Col>
          </Row>
        )}

        {/* Footer */}
        <Row className="mt-5 pt-5 border-top">
          <Col lg={4} className="mb-4 mb-lg-0">
            <h5 className="text-white fw-bold mb-3">
              <IconifyIcon icon="bx:receipt" className="me-2" />
              EVM DMS
            </h5>
            <p className="text-white-50 small">
              Hệ thống quản lý hóa đơn điện tử chuyên nghiệp, giúp doanh nghiệp dễ dàng quản lý và tra cứu hóa đơn mọi lúc, mọi nơi.
            </p>
          </Col>
          <Col lg={4} className="mb-4 mb-lg-0">
            <h5 className="text-white fw-bold mb-3">Liên hệ</h5>
            <ul className="list-unstyled text-white-50 small">
              <li className="mb-2">
                <IconifyIcon icon="bx:phone" className="me-2" />
                Hotline: 1900-xxxx
              </li>
              <li className="mb-2">
                <IconifyIcon icon="bx:envelope" className="me-2" />
                Email: support@evmdms.com
              </li>
              <li className="mb-2">
                <IconifyIcon icon="bx:map" className="me-2" />
                Địa chỉ: Hà Nội, Việt Nam
              </li>
            </ul>
          </Col>
          <Col lg={4}>
            <h5 className="text-white fw-bold mb-3">Hỗ trợ</h5>
            <ul className="list-unstyled text-white-50 small">
              <li className="mb-2">
                <a href="#" className="text-white-50 text-decoration-none">
                  Hướng dẫn tra cứu
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-white-50 text-decoration-none">
                  Câu hỏi thường gặp
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-white-50 text-decoration-none">
                  Điều khoản sử dụng
                </a>
              </li>
            </ul>
          </Col>
        </Row>

        <Row className="mt-4 pt-4 border-top">
          <Col className="text-center">
            <p className="text-white-50 small mb-0">
              © {new Date().getFullYear()} Bản quyền © 2025 thuộc về Công ty Cổ phần Giải pháp Tổng thể Kỷ Nguyên Số
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default InvoiceLookupPage
