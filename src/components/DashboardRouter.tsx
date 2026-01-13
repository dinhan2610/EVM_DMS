import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'
import { USER_ROLES } from '@/constants/roles'

/**
 * DashboardRouter Component
 * 
 * 🎯 Chức năng: Điều hướng tự động tới dashboard phù hợp với role của user
 * 
 * 📋 Dashboard mapping:
 * - Admin       → /dashboard/admin
 * - HOD         → /dashboard/hod
 * - Accountant  → /dashboard/staff
 * - Sale        → /dashboard/sale
 * - Customer    → /dashboard/customer (không dùng, chỉ tra cứu công khai)
 * 
 * ⚠️ Lưu ý: Component này chỉ dùng cho route '/dashboard' chính
 * Không dùng cho các route cụ thể như '/dashboard/admin'
 */
const DashboardRouter = () => {
  const { user, isAuthenticated } = useAuthContext()

  // Nếu chưa đăng nhập → redirect về trang login
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/sign-in" replace />
  }

  // Lấy role của user
  const userRole = user.role

  // Map role → dashboard path
  const dashboardPath = (() => {
    switch (userRole) {
      case USER_ROLES.ADMIN:
        return '/dashboard/admin'
      
      case USER_ROLES.HOD:
        return '/dashboard/hod'
      
      case USER_ROLES.ACCOUNTANT:
        return '/dashboard/staff'
      
      case USER_ROLES.SALES:
        return '/dashboard/sale'
      
      case USER_ROLES.CUSTOMER:
        // Customer không có dashboard nội bộ, redirect về tra cứu công khai
        return '/lookup'
      
      default:
        // Fallback: Nếu role không xác định, redirect về trang chủ
        console.warn('⚠️ Unknown user role:', userRole)
        return '/dashboard/admin' // Default safe fallback
    }
  })()

  console.log('🔄 DashboardRouter:', {
    userRole,
    redirectTo: dashboardPath,
    userInfo: {
      email: user.email,
      role: user.role,
    }
  })

  return <Navigate to={dashboardPath} replace />
}

export default DashboardRouter
