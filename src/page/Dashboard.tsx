import { useState } from 'react'
import { Box } from '@mui/material'
import { ButtonGroup, Button } from 'react-bootstrap'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import AccountantDashboard from '@/components/dashboard/AccountantDashboard'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import SalesDashboard from '@/components/dashboard/SalesDashboard'

type RoleType = 'Admin' | 'Accountant' | 'Sales'

const Dashboard = () => {
  // State để chọn role (trong thực tế sẽ lấy từ useAuth Context)
  const [role, setRole] = useState<RoleType>('Accountant')

  const getDashboardTitle = () => {
    switch (role) {
      case 'Admin':
        return 'Dashboard Quản trị'
      case 'Accountant':
        return 'Dashboard Kế toán'
      case 'Sales':
        return 'Dashboard PM/Sales'
      default:
        return 'Dashboard'
    }
  }

  const renderDashboard = () => {
    switch (role) {
      case 'Admin':
        return <AdminDashboard />
      case 'Accountant':
        return <AccountantDashboard />
      case 'Sales':
        return <SalesDashboard />
      default:
        return (
          <Box sx={{ padding: 3, textAlign: 'center' }}>
            <h5>Không có quyền truy cập Dashboard</h5>
            <p className="text-muted">
              Vui lòng liên hệ quản trị viên để được cấp quyền truy cập phù hợp.
            </p>
          </Box>
        )
    }
  }

  return (
    <>
      <PageBreadcrumb title={getDashboardTitle()} subName="Dashboards" />
      <PageMetaData title={getDashboardTitle()} />
      
      {/* Role Selector - Chỉ để demo, xóa khi dùng Auth thật */}
      <div className="mb-3">
        <ButtonGroup>
          <Button 
            variant={role === 'Admin' ? 'primary' : 'outline-primary'}
            onClick={() => setRole('Admin')}
          >
            👨‍💼 Admin Dashboard
          </Button>
          <Button 
            variant={role === 'Accountant' ? 'primary' : 'outline-primary'}
            onClick={() => setRole('Accountant')}
          >
            📊 Kế toán Dashboard
          </Button>
          <Button 
            variant={role === 'Sales' ? 'primary' : 'outline-primary'}
            onClick={() => setRole('Sales')}
          >
            💼 PM/Sales Dashboard
          </Button>
        </ButtonGroup>
      </div>

      {renderDashboard()}
    </>
  )
}

export default Dashboard
