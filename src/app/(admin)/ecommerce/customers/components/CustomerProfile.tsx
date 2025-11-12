import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import { useState } from 'react'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

const CustomerProfile = () => {
  const [formData, setFormData] = useState({
    fullName: 'Nguyễn Thị Vân Anh',
    email: 'vananh@email.com',
    phone: '0974979653',
    address: 'Hà Nội, Việt Nam',
    taxCode: '0104880443',
    companyName: 'Công ty TNHH ABC',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Profile updated:', formData)
    // Add your update logic here
  }

  const handleReset = () => {
    setFormData({
      fullName: 'Nguyễn Thị Vân Anh',
      email: 'vananh@email.com',
      phone: '0974979653',
      address: 'Hà Nội, Việt Nam',
      taxCode: '0104880443',
      companyName: 'Công ty TNHH ABC',
    })
  }

  return (
    <Row>
      <Col lg={12}>
        <Card>
          <Card.Header className="d-flex align-items-center justify-content-between">
            <h4 className="card-title mb-0">Thông tin cá nhân</h4>
            <IconifyIcon icon="bx:user-circle" className="fs-2 text-primary" />
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col lg={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Họ và tên <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Nhập họ và tên"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col lg={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Email <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Nhập email"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col lg={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Số điện thoại <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Nhập số điện thoại"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col lg={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mã số thuế</Form.Label>
                    <Form.Control
                      type="text"
                      name="taxCode"
                      value={formData.taxCode}
                      onChange={handleChange}
                      placeholder="Nhập mã số thuế"
                    />
                  </Form.Group>
                </Col>

                <Col lg={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tên công ty</Form.Label>
                    <Form.Control
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Nhập tên công ty"
                    />
                  </Form.Group>
                </Col>

                <Col lg={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Địa chỉ</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Nhập địa chỉ"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" type="button" onClick={handleReset}>
                  <IconifyIcon icon="bx:reset" className="me-1" />
                  Đặt lại
                </Button>
                <Button variant="primary" type="submit">
                  <IconifyIcon icon="bx:save" className="me-1" />
                  Cập nhật thông tin
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* Additional Information Card */}
        <Card className="mt-3">
          <Card.Header>
            <h4 className="card-title mb-0">Thông tin bổ sung</h4>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <td className="fw-semibold" style={{ width: '200px' }}>
                      Ngày đăng ký:
                    </td>
                    <td>11/06/2020</td>
                  </tr>
                  <tr>
                    <td className="fw-semibold">Trạng thái tài khoản:</td>
                    <td>
                      <span className="badge bg-success">Đã kích hoạt</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-semibold">Tổng số hóa đơn:</td>
                    <td>
                      <span className="text-primary fw-semibold">127 hóa đơn</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-semibold">Lần đăng nhập cuối:</td>
                    <td>12/11/2025 09:30 AM</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}

export default CustomerProfile
