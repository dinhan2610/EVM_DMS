import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import { useState } from 'react'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

const ChangePassword = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp!')
      return
    }

    if (formData.newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự!')
      return
    }

    // Add your password change logic here
    console.log('Password change:', formData)

    // Reset form
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
  }

  const handleReset = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
  }

  return (
    <Row>
      <Col lg={12}>
        <Card>
          <Card.Header className="d-flex align-items-center justify-content-between">
            <h4 className="card-title mb-0">Đổi mật khẩu</h4>
            <IconifyIcon icon="bx:lock-alt" className="fs-2 text-primary" />
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Mật khẩu hiện tại <span className="text-danger">*</span>
                </Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu hiện tại"
                    required
                  />
                  <Button
                    variant="link"
                    className="position-absolute end-0 top-50 translate-middle-y text-muted"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    type="button">
                    <IconifyIcon icon={showCurrentPassword ? 'bx:hide' : 'bx:show'} />
                  </Button>
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Mật khẩu mới <span className="text-danger">*</span>
                </Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu mới"
                    required
                    minLength={8}
                  />
                  <Button
                    variant="link"
                    className="position-absolute end-0 top-50 translate-middle-y text-muted"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    type="button">
                    <IconifyIcon icon={showNewPassword ? 'bx:hide' : 'bx:show'} />
                  </Button>
                </div>
                <Form.Text className="text-muted">Mật khẩu phải có ít nhất 8 ký tự</Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Xác nhận mật khẩu mới <span className="text-danger">*</span>
                </Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                  <Button
                    variant="link"
                    className="position-absolute end-0 top-50 translate-middle-y text-muted"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    type="button">
                    <IconifyIcon icon={showConfirmPassword ? 'bx:hide' : 'bx:show'} />
                  </Button>
                </div>
              </Form.Group>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleReset}>
                  <IconifyIcon icon="bx:reset" className="me-1" />
                  Đặt lại
                </Button>
                <Button variant="primary" type="submit">
                  <IconifyIcon icon="bx:save" className="me-1" />
                  Đổi mật khẩu
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* Security Tips Card */}
        <Card className="mt-3">
          <Card.Header>
            <h5 className="card-title mb-0">
              <IconifyIcon icon="bx:shield" className="me-2" />
              Lời khuyên bảo mật
            </h5>
          </Card.Header>
          <Card.Body>
            <ul className="mb-0">
              <li className="mb-2">
                <IconifyIcon icon="bx:check-circle" className="text-success me-1" />
                Sử dụng mật khẩu dài ít nhất 8 ký tự
              </li>
              <li className="mb-2">
                <IconifyIcon icon="bx:check-circle" className="text-success me-1" />
                Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt
              </li>
              <li className="mb-2">
                <IconifyIcon icon="bx:check-circle" className="text-success me-1" />
                Không sử dụng thông tin cá nhân dễ đoán
              </li>
              <li className="mb-2">
                <IconifyIcon icon="bx:check-circle" className="text-success me-1" />
                Thay đổi mật khẩu định kỳ (mỗi 3-6 tháng)
              </li>
              <li className="mb-0">
                <IconifyIcon icon="bx:check-circle" className="text-success me-1" />
                Không chia sẻ mật khẩu với người khác
              </li>
            </ul>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}

export default ChangePassword
