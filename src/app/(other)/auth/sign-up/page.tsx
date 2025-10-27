import { Card, CardBody, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import LogoBox from '@/components/LogoBox'
import PageMetaData from '@/components/PageTitle'
import ThirdPartyAuth from '@/components/ThirdPartyAuth'
import SignUpForm from './components/SignUpForm'

import signUpImg from '@/assets/images/sign-in.png'

const SignUp = () => {
  return (
    <>
      <PageMetaData title="Đăng ký" />

      <Card className="auth-card">
        <CardBody className="p-0">
          <Row className="align-items-center g-0">
            <Col lg={6} className="d-none d-lg-inline-block border-end">
              <div className="auth-page-sidebar">
                <img src={signUpImg} width={521} height={521} alt="auth" className="img-fluid" />
              </div>
            </Col>
            <Col lg={6}>
              <div className="p-4">
                <LogoBox
                  textLogo={{
                    height: 24,
                    width: 73,
                  }}
                  squareLogo={{ className: 'me-1' }}
                  containerClassName="mx-auto mb-4 text-center auth-logo"
                />
                <h2 className="fw-bold text-center fs-18">Đăng Ký</h2>
                <p className="text-muted text-center mt-1 mb-4">Mới tham gia nền tảng của chúng tôi? Đăng ký ngay! Chỉ mất một phút.</p>
                <Row className="justify-content-center">
                  <Col xs={12} md={8}>
                    <SignUpForm />
                    <ThirdPartyAuth />
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>
      <p className="text-white mb-0 text-center">
        Bạn đã có tài khoản?
        <Link to="/auth/sign-in" className="text-white fw-bold ms-1">
          Đăng Nhập
        </Link>
      </p>
    </>
  )
}

export default SignUp
