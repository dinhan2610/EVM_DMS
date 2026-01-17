import httpClient from '@/helpers/httpClient'
import type { AdminDashboardData } from '@/types/dashboard.types'

/**
 * Dashboard Service - Admin Dashboard APIs
 */

/**
 * Get Admin Dashboard Data
 * @returns Complete dashboard data including stats, charts, and recent activities
 */
const getAdminDashboard = async (): Promise<AdminDashboardData> => {
  const response = await httpClient.get<AdminDashboardData>('/Dashboard/admin')
  return response.data
}

export default {
  getAdminDashboard,
}
