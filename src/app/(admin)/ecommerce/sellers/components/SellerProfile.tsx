import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import { useState } from 'react'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

const SellerProfile = () => {
  const [formData, setFormData] = useState({
    fullName: 'Nguyễn Văn A',
    email: 'seller@email.com',
    phone: '0912345678',
    address: 'Tp. Hồ Chí Minh, Việt Nam',
    taxCode: '0104880443',
    storeName: 'Cửa hàng ABC',
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
      fullName: 'Nguyễn Văn A',
      email: 'seller@email.com',
      phone: '0912345678',
      address: 'Tp. Hồ Chí Minh, Việt Nam',
      taxCode: '0104880443',
      storeName: 'Cửa hàng ABC',
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
                    <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Nhập email" required />
                  </Form.Group>
                </Col>

                <Col lg={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Số điện thoại <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Nhập số điện thoại" required />
                  </Form.Group>
                </Col>

                <Col lg={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mã số thuế</Form.Label>
                    <Form.Control type="text" name="taxCode" value={formData.taxCode} onChange={handleChange} placeholder="Nhập mã số thuế" />
                  </Form.Group>
                </Col>

                <Col lg={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tên cửa hàng</Form.Label>
                    <Form.Control type="text" name="storeName" value={formData.storeName} onChange={handleChange} placeholder="Nhập tên cửa hàng" />
                  </Form.Group>
                </Col>

                <Col lg={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Địa chỉ</Form.Label>
                    <Form.Control as="textarea" rows={3} name="address" value={formData.address} onChange={handleChange} placeholder="Nhập địa chỉ" />
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
      </Col>
    </Row>
  )
}

export default SellerProfile
