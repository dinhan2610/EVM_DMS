import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'
import { hasRole, DEFAULT_DASHBOARD, type UserRole } from '@/constants/roles'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

/**
 * 🔐 PROTECTED ROUTE COMPONENT
 * Bảo vệ route theo role - chỉ cho phép các role được chỉ định truy cập
 * 
 * @param children - Component con cần được bảo vệ
 * @param allowedRoles - Mảng các role được phép truy cập (nếu không truyền = allow all authenticated users)
 * 
 * @example
 * // Chỉ cho Admin và HOD vào
 * <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.HOD]}>
 *   <InvoiceApproval />
 * </ProtectedRoute>
 * 
 * // Cho tất cả user đã login
 * <ProtectedRoute>
 *   <UserProfile />
 * </ProtectedRoute>
 */
export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuthContext()

  // 1. Chưa đăng nhập → Redirect về login
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/sign-in" replace />
  }

  // 2. Có allowedRoles nhưng user không có role phù hợp → Redirect về dashboard của user
  if (allowedRoles && !hasRole(user.role, allowedRoles)) {
    const userDashboard = DEFAULT_DASHBOARD[user.role as UserRole] || '/dashboard'
    return <Navigate to={userDashboard} replace />
  }

  // 3. Có quyền truy cập → Render component
  return <>{children}</>
}
