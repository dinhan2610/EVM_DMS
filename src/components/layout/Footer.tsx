import { currentYear } from '@/context/constants'
import { Col, Container, Row } from 'react-bootstrap'

const Footer = () => {
  return (
    <footer className="footer">
      <Container fluid>
        <Row>
          <Col xs={12} className="text-center">
            <span className="icons-center">
              Bản quyền © {currentYear} thuộc về&nbsp;
              <span className="fw-bold footer-text">Công ty Cổ phần Giải pháp Tổng thể Kỷ Nguyên Số</span>
            </span>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer
