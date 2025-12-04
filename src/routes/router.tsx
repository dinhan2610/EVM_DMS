import { Navigate, Route, Routes, type RouteProps } from 'react-router-dom'

import AuthLayout from '@/layouts/AuthLayout'
import SimpleLayout from '@/layouts/SimpleLayout'
import { useAuthContext } from '@/context/useAuthContext'
import { routes } from '@/routes/index'
import AdminLayout from '@/layouts/AdminLayout'

const AppRouter = (props: RouteProps) => {
  const { isAuthenticated } = useAuthContext()

  // Filter routes by path prefix
  const authRoutes = routes.filter((route) => route.path?.toString().startsWith('/auth'))
  const publicRoutes = routes.filter((route) => route.path?.toString().startsWith('/invoice-lookup'))
  const templateEditorRoutes = routes.filter(
    (route) =>
      route.path?.toString().includes('/admin/templates/new') ||
      route.path?.toString().includes('/admin/templates/edit') ||
      route.path?.toString().includes('/admin/templates/select'),
  )
  const appRoutes = routes.filter(
    (route) =>
      !route.path?.toString().startsWith('/auth') &&
      !route.path?.toString().startsWith('/invoice-lookup') &&
      route.path !== '*' &&
      !route.path?.toString().includes('/admin/templates/new') &&
      !route.path?.toString().includes('/admin/templates/edit') &&
      !route.path?.toString().includes('/admin/templates/select'),
  )

  return (
    <Routes>
      {(authRoutes || []).map((route, idx) => (
        <Route key={idx + route.name} path={route.path} element={<AuthLayout {...props}>{route.element}</AuthLayout>} />
      ))}

      {/* Public routes - No authentication required */}
      {(publicRoutes || []).map((route, idx) => (
        <Route key={idx + route.name} path={route.path} element={route.element} />
      ))}

      {/* Template Editor routes - Simple Layout (No Menu) */}
      {(templateEditorRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated ? (
              <SimpleLayout>{route.element}</SimpleLayout>
            ) : (
              <Navigate
                to={{
                  pathname: '/auth/sign-in',
                  search: 'redirectTo=' + route.path,
                }}
              />
            )
          }
        />
      ))}

      {/* Other App routes - Admin Layout (With Menu) */}
      {(appRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated ? (
              <AdminLayout {...props}>{route.element}</AdminLayout>
            ) : (
              <Navigate
                to={{
                  pathname: '/auth/sign-in',
                  search: 'redirectTo=' + route.path,
                }}
              />
            )
          }
        />
      ))}
    </Routes>
  )
}

export default AppRouter
