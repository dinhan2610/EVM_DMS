import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardTitle, Col, Row, Table } from 'react-bootstrap'
import KpiCard from './KpiCard'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

const AdminDashboard = () => {
  // KPI Data
  const kpiData = [
    {
      icon: 'iconamoon:profile-duotone',
      name: 'Tổng Người dùng',
      amount: '45',
      variant: 'primary',
    },
    {
      icon: 'iconamoon:shield-yes-duotone',
      name: 'Hoạt động 24h qua',
      amount: '320',
      variant: 'success',
    },
    {
      icon: 'iconamoon:file-duotone',
      name: 'Số Mẫu hóa đơn',
      amount: '5',
      variant: 'info',
    },
  ]

  // User Distribution Donut Chart
  const userDistributionOptions: ApexOptions = {
    chart: {
      height: 300,
      type: 'donut',
    },
    series: [5, 15, 25],
    labels: ['Admin', 'Kế toán', 'Sales/PM'],
    colors: ['#ef4444', '#7f56da', '#22c55e'],
    legend: {
      show: true,
      position: 'bottom',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
        },
      },
    },
    dataLabels: {
      enabled: true,
    },
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: {
            height: 240,
          },
          legend: {
            show: false,
          },
        },
      },
    ],
  }

  // System Logs
  const systemLogs = [
    {
      icon: 'iconamoon:profile-circle-duotone',
      iconColor: 'info',
      title: 'Người dùng mới đăng ký',
      description: 'admin@example.com',
      time: '2 phút trước',
    },
    {
      icon: 'iconamoon:settings-duotone',
      iconColor: 'success',
      title: 'Cập nhật cấu hình hệ thống',
      description: 'Thay đổi cấu hình email',
      time: '15 phút trước',
    },
    {
      icon: 'iconamoon:lock-duotone',
      iconColor: 'warning',
      title: 'Thay đổi quyền truy cập',
      description: 'User #45 được cấp quyền Admin',
      time: '1 giờ trước',
    },
    {
      icon: 'iconamoon:file-document-duotone',
      iconColor: 'primary',
      title: 'Mẫu hóa đơn mới',
      description: 'Template VAT Invoice v2.0',
      time: '3 giờ trước',
    },
    {
      icon: 'iconamoon:cloud-upload-duotone',
      iconColor: 'success',
      title: 'Backup hoàn tất',
      description: 'Database backup thành công',
      time: '5 giờ trước',
    },
  ]

  // System Stats
  const systemStats = [
    { label: 'Uptime', value: '98.5%', icon: 'iconamoon:check-circle-1-duotone', color: 'success' },
    { label: 'Tổng hóa đơn', value: '1,245', icon: 'iconamoon:file-duotone', color: 'primary' },
    { label: 'Dung lượng', value: '256 GB', icon: 'iconamoon:cloud-duotone', color: 'info' },
    { label: 'API Calls/min', value: '12', icon: 'iconamoon:chart-duotone', color: 'warning' },
  ]

  return (
    <>
      {/* KPI Cards */}
      <Row>
        {kpiData.map((stat, idx) => (
          <Col md={6} xxl={4} key={idx}>
            <KpiCard {...stat} />
          </Col>
        ))}
      </Row>

      {/* Charts & Logs Row */}
      <Row>
        <Col xxl={4}>
          <Card>
            <CardBody>
              <CardTitle as="h4" className="mb-4">
                Phân bổ Người dùng
              </CardTitle>
              <ReactApexChart
                options={userDistributionOptions}
                series={userDistributionOptions.series}
                type="donut"
                height={300}
              />
            </CardBody>
          </Card>
        </Col>
        <Col xxl={8}>
          <Card>
            <CardBody>
              <CardTitle as="h4" className="mb-4">
                Nhật ký Hệ thống Mới nhất
              </CardTitle>
              <div className="table-responsive">
                <Table className="table-hover table-nowrap mb-0">
                  <tbody>
                    {systemLogs.map((log, idx) => (
                      <tr key={idx}>
                        <td style={{ width: '60px' }}>
                          <div className={`avatar-sm bg-${log.iconColor}-subtle rounded-circle flex-centered`}>
                            <IconifyIcon icon={log.icon} className={`text-${log.iconColor} fs-24`} />
                          </div>
                        </td>
                        <td>
                          <h5 className="fs-14 mb-1">{log.title}</h5>
                          <p className="text-muted mb-0">{log.description}</p>
                        </td>
                        <td className="text-end text-muted" style={{ width: '120px' }}>
                          {log.time}
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

      {/* System Statistics */}
      <Row>
        <Col xs={12}>
          <Card>
            <CardBody>
              <CardTitle as="h4" className="mb-4">
                Thống kê Hệ thống
              </CardTitle>
              <Row>
                {systemStats.map((stat, idx) => (
                  <Col md={6} lg={3} key={idx}>
                    <div className="text-center p-3">
                      <div className={`avatar-md bg-${stat.color}-subtle rounded-circle flex-centered mx-auto mb-3`}>
                        <IconifyIcon icon={stat.icon} className={`text-${stat.color} fs-32`} />
                      </div>
                      <h3 className="fw-bold mb-1">{stat.value}</h3>
                      <p className="text-muted mb-0">{stat.label}</p>
                    </div>
                  </Col>
                ))}
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default AdminDashboard
