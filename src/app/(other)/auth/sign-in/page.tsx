import { Card, CardBody, Col, Row } from 'react-bootstrap'


import LogoBox from '@/components/LogoBox'
import PageMetaData from '@/components/PageTitle'
import LoginForm from './LoginForm'

import signInImg from '@/assets/images/sign-in.png'

const SignIn = () => {
  return (
    <>
      <PageMetaData title="Sign In" />

      <Card className="auth-card">
        <CardBody className="p-0">
          <Row className="align-items-center g-0">
            <Col lg={6} className="d-none d-lg-inline-block border-end">
              <div className="auth-page-sidebar">
                <img src={signInImg} width={521} height={521} alt="auth" className="img-fluid" />
              </div>
            </Col>
            <Col lg={6}>
              <div className="p-4">
                <div className="mx-auto mb-4 text-center auth-logo">
                  <LogoBox
                    textLogo={{
                      height: 24,
                      width: 73,
                    }}
                    squareLogo={{ className: 'me-1' }}
                    containerClassName="mx-auto mb-4 text-center auth-logo"
                  />
                </div>
                <h2 className="fw-bold text-center fs-18">Đăng Nhập</h2>
                <p className="text-muted text-center mt-1 mb-4">Vui lòng xác thực danh tính để vào khu vực quản trị.</p>
                <Row className="justify-content-center">
                  <Col xs={12} md={8}>
                    <LoginForm />
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>
    </>
  )
}

export default SignIn
