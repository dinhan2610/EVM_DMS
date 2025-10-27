import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardTitle, Col, Row, Table, Badge } from 'react-bootstrap'
import KpiCard from './KpiCard'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

const SalesDashboard = () => {
  // KPI Data
  const kpiData = [
    {
      icon: 'iconamoon:file-add-duotone',
      name: 'Yêu cầu chờ duyệt',
      amount: '5',
      variant: 'warning',
      trend: '+20%',
      trendColor: 'success',
    },
    {
      icon: 'iconamoon:check-circle-1-duotone',
      name: 'HĐ đã thanh toán',
      amount: '28',
      variant: 'success',
      trend: '+15%',
      trendColor: 'success',
    },
    {
      icon: 'iconamoon:invoice-duotone',
      name: 'Tổng giá trị',
      amount: '450 Tr',
      variant: 'primary',
      trend: '+8%',
      trendColor: 'success',
    },
  ]

  // Monthly Stats Area Chart
  const monthlyStatsOptions: ApexOptions = {
    series: [
      {
        name: 'Yêu cầu mới',
        data: [8, 12, 15, 18, 14, 20],
      },
      {
        name: 'Đã duyệt',
        data: [5, 9, 12, 15, 11, 17],
      },
    ],
    chart: {
      height: 350,
      type: 'area',
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    colors: ['#7f56da', '#22c55e'],
    xaxis: {
      categories: ['T5', 'T6', 'T7', 'T8', 'T9', 'T10'],
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
    },
    grid: {
      strokeDashArray: 3,
    },
  }

  // Top Performers
  const topPerformers = [
    {
      name: 'Nguyễn Văn A',
      avatar: 'iconamoon:profile-circle-duotone',
      requests: 15,
      approved: 13,
      approvalRate: 87,
      totalValue: '450 Tr',
    },
    {
      name: 'Trần Thị B',
      avatar: 'iconamoon:profile-circle-duotone',
      requests: 12,
      approved: 10,
      approvalRate: 83,
      totalValue: '380 Tr',
    },
    {
      name: 'Lê Văn C',
      avatar: 'iconamoon:profile-circle-duotone',
      requests: 10,
      approved: 9,
      approvalRate: 90,
      totalValue: '320 Tr',
    },
  ]

  // Recent Requests
  const recentRequests = [
    {
      id: 'REQ-001',
      project: 'Dự án Website ABC',
      value: '125 Tr',
      date: '15/10/2024',
      status: 'approved',
      statusText: 'Đã duyệt',
    },
    {
      id: 'REQ-002',
      project: 'Hợp đồng Tư vấn XYZ',
      value: '89 Tr',
      date: '14/10/2024',
      status: 'pending',
      statusText: 'Chờ duyệt',
    },
    {
      id: 'REQ-003',
      project: 'Dịch vụ Marketing DEF',
      value: '65 Tr',
      date: '13/10/2024',
      status: 'approved',
      statusText: 'Đã duyệt',
    },
  ]

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success'
      case 'pending':
        return 'warning'
      case 'rejected':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  return (
    <>
      {/* KPI Cards */}
      <Row>
        {kpiData.map((stat, idx) => (
          <Col md={6} lg={4} className="col-xl" key={idx}>
            <KpiCard {...stat} />
          </Col>
        ))}
      </Row>

      {/* Charts Row */}
      <Row>
        <Col xxl={8}>
          <Card>
            <CardBody>
              <CardTitle as="h4" className="mb-4">
                Xu hướng Yêu cầu Theo Tháng
              </CardTitle>
              <ReactApexChart options={monthlyStatsOptions} series={monthlyStatsOptions.series} type="area" height={350} />
            </CardBody>
          </Card>
        </Col>
        <Col xxl={4}>
          <Card>
            <CardBody>
              <CardTitle as="h4" className="mb-4">
                Top Performers
              </CardTitle>
              {topPerformers.map((performer, idx) => (
                <div key={idx} className={`d-flex align-items-start mb-3 ${idx !== topPerformers.length - 1 ? 'pb-3 border-bottom' : ''}`}>
                  <div className="avatar-md bg-primary-subtle rounded-circle flex-centered me-3">
                    <IconifyIcon icon={performer.avatar} className="text-primary fs-32" />
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="fs-14 mb-1">{performer.name}</h5>
                    <p className="text-muted mb-1 fs-12">
                      {performer.requests} yêu cầu | {performer.approved} duyệt ({performer.approvalRate}%)
                    </p>
                    <p className="fw-bold text-primary mb-0">{performer.totalValue}</p>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Recent Requests & Monthly Stats */}
      <Row>
        <Col xxl={8}>
          <Card>
            <CardBody>
              <CardTitle as="h4" className="mb-4">
                Yêu cầu Gần đây
              </CardTitle>
              <div className="table-responsive">
                <Table className="table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Mã YC</th>
                      <th>Dự án</th>
                      <th>Giá trị</th>
                      <th>Ngày tạo</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((request, idx) => (
                      <tr key={idx}>
                        <td className="fw-semibold">{request.id}</td>
                        <td>{request.project}</td>
                        <td className="fw-semibold text-primary">{request.value}</td>
                        <td>{request.date}</td>
                        <td>
                          <Badge bg={getStatusVariant(request.status)}>{request.statusText}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xxl={4}>
          <Card>
            <CardBody>
              <CardTitle as="h4" className="mb-4">
                Thống kê Tháng này
              </CardTitle>
              <div className="border-bottom pb-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">
                    <IconifyIcon icon="iconamoon:file-add-duotone" className="text-primary me-1" />
                    Yêu cầu mới
                  </span>
                  <div className="text-end">
                    <h5 className="mb-0">15</h5>
                    <span className="badge badge-soft-success fs-11">+25%</span>
                  </div>
                </div>
              </div>
              <div className="border-bottom pb-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">
                    <IconifyIcon icon="iconamoon:check-circle-1-duotone" className="text-success me-1" />
                    Tỷ lệ chấp thuận
                  </span>
                  <div className="text-end">
                    <h5 className="mb-0">85%</h5>
                    <span className="badge badge-soft-success fs-11">+5%</span>
                  </div>
                </div>
              </div>
              <div className="border-bottom pb-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">
                    <IconifyIcon icon="iconamoon:clock-duotone" className="text-warning me-1" />
                    Thời gian xử lý TB
                  </span>
                  <div className="text-end">
                    <h5 className="mb-0">2.5 ngày</h5>
                  </div>
                </div>
              </div>
              <div className="pb-0">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">
                    <IconifyIcon icon="iconamoon:trophy-duotone" className="text-info me-1" />
                    Dự án hoàn thành
                  </span>
                  <div className="text-end">
                    <h5 className="mb-0">8</h5>
                    <span className="badge badge-soft-success fs-11">+2</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default SalesDashboard
