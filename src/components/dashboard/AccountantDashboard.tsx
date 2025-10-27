import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardTitle, Col, Row, Table, Badge } from 'react-bootstrap'
import KpiCard from './KpiCard'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

const AccountantDashboard = () => {
  // KPI Data
  const kpiData = [
    {
      icon: 'iconamoon:file-document-duotone',
      name: 'Hóa đơn chờ ký',
      amount: '12',
      variant: 'warning',
      trend: '-8%',
      trendColor: 'danger',
    },
    {
      icon: 'iconamoon:close-circle-1-duotone',
      name: 'HĐ bị từ chối',
      amount: '3',
      variant: 'danger',
      trend: '+15%',
      trendColor: 'danger',
    },
    {
      icon: 'iconamoon:trend-up-duotone',
      name: 'Doanh thu tháng này',
      amount: '1.2 Tỷ',
      variant: 'success',
      trend: '+12%',
      trendColor: 'success',
    },
    {
      icon: 'iconamoon:time-clock-duotone',
      name: 'Công nợ quá hạn',
      amount: '80 Tr',
      variant: 'info',
      trend: '-5%',
      trendColor: 'success',
    },
  ]

  // Revenue Chart
  const revenueChartOptions: ApexOptions = {
    series: [
      {
        name: 'Doanh thu',
        type: 'bar',
        data: [850, 920, 780, 1100, 950, 1200],
      },
      {
        name: 'Chi phí',
        type: 'area',
        data: [420, 480, 390, 550, 480, 520],
      },
    ],
    chart: {
      height: 350,
      type: 'line',
      toolbar: {
        show: false,
      },
    },
    stroke: {
      dashArray: [0, 0],
      width: [0, 2],
      curve: 'smooth',
    },
    fill: {
      opacity: [1, 0.3],
      type: ['solid', 'gradient'],
      gradient: {
        type: 'vertical',
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 70],
      },
    },
    colors: ['#7f56da', '#22c55e'],
    labels: ['T5', 'T6', 'T7', 'T8', 'T9', 'T10'],
    markers: {
      size: 0,
      hover: {
        size: 4,
      },
    },
    xaxis: {
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return val + ' Tr'
        },
      },
    },
    grid: {
      strokeDashArray: 3,
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
    },
  }

  // Status Radial Chart
  const statusChartOptions: ApexOptions = {
    chart: {
      height: 280,
      type: 'radialBar',
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        dataLabels: {
          name: {
            fontSize: '14px',
            offsetY: 100,
          },
          value: {
            offsetY: 55,
            fontSize: '20px',
            formatter: function (val) {
              return val + '%'
            },
          },
        },
        track: {
          background: 'rgba(170,184,197, 0.2)',
          margin: 0,
        },
      },
    },
    fill: {
      gradient: {
        shade: 'dark',
        shadeIntensity: 0.2,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50, 65, 91],
      },
    },
    stroke: {
      dashArray: 4,
    },
    colors: ['#7f56da'],
    series: [67],
    labels: ['Tỷ lệ duyệt'],
  }

  // Recent Invoices
  const recentInvoices = [
    {
      id: 'INV-2024-001',
      customer: 'Công ty TNHH ABC',
      amount: '125 Tr',
      date: '15/10/2024',
      status: 'pending',
      statusText: 'Chờ ký',
    },
    {
      id: 'INV-2024-002',
      customer: 'Tập đoàn XYZ',
      amount: '450 Tr',
      date: '14/10/2024',
      status: 'approved',
      statusText: 'Đã duyệt',
    },
    {
      id: 'INV-2024-003',
      customer: 'Doanh nghiệp DEF',
      amount: '89 Tr',
      date: '13/10/2024',
      status: 'rejected',
      statusText: 'Từ chối',
    },
    {
      id: 'INV-2024-004',
      customer: 'Công ty GHI',
      amount: '320 Tr',
      date: '12/10/2024',
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
          <Col md={6} xxl={3} key={idx}>
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
                Biểu đồ Doanh thu & Chi phí 6 tháng
              </CardTitle>
              <ReactApexChart options={revenueChartOptions} series={revenueChartOptions.series} type="line" height={350} />
            </CardBody>
          </Card>
        </Col>
        <Col xxl={4}>
          <Card>
            <CardBody>
              <CardTitle as="h4" className="mb-4">
                Hóa đơn theo Trạng thái
              </CardTitle>
              <ReactApexChart options={statusChartOptions} series={statusChartOptions.series} type="radialBar" height={280} />
              <div className="mt-3">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">
                    <IconifyIcon icon="iconamoon:check-circle-1-duotone" className="text-success me-1" />
                    Đã duyệt
                  </span>
                  <span className="fw-semibold">30 (67%)</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">
                    <IconifyIcon icon="iconamoon:clock-duotone" className="text-warning me-1" />
                    Chờ ký
                  </span>
                  <span className="fw-semibold">12 (27%)</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">
                    <IconifyIcon icon="iconamoon:close-circle-1-duotone" className="text-danger me-1" />
                    Từ chối
                  </span>
                  <span className="fw-semibold">3 (6%)</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Recent Invoices Table */}
      <Row>
        <Col xs={12}>
          <Card>
            <CardBody>
              <CardTitle as="h4" className="mb-4">
                Hóa đơn Gần đây
              </CardTitle>
              <div className="table-responsive">
                <Table className="table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Mã HĐ</th>
                      <th>Khách hàng</th>
                      <th>Giá trị</th>
                      <th>Ngày tạo</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((invoice, idx) => (
                      <tr key={idx}>
                        <td className="fw-semibold">{invoice.id}</td>
                        <td>{invoice.customer}</td>
                        <td className="fw-semibold text-primary">{invoice.amount}</td>
                        <td>{invoice.date}</td>
                        <td>
                          <Badge bg={getStatusVariant(invoice.status)}>{invoice.statusText}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default AccountantDashboard
