import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardBody, Col, Row } from 'react-bootstrap'

interface KpiCardProps {
  icon: string
  name: string
  amount: string | number
  variant: string
  trend?: string
  trendColor?: string
}

const KpiCard = ({ icon, name, amount, variant, trend, trendColor }: KpiCardProps) => {
  return (
    <Card>
      <CardBody>
        <Row>
          <Col xs={6}>
            <div className={`avatar-md bg-opacity-10 rounded flex-centered bg-${variant}`}>
              <IconifyIcon icon={icon} height={32} width={32} className={`text-${variant}`} />
            </div>
          </Col>
          <Col xs={6} className="text-end">
            <p className="text-muted mb-0 text-truncate">{name}</p>
            <h3 className="text-dark mt-1 mb-0">{amount}</h3>
            {trend && (
              <span className={`badge fs-12 badge-soft-${trendColor || 'success'} mt-1`}>
                {trend}
              </span>
            )}
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}

export default KpiCard
