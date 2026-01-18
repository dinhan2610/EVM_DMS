import httpClient from '@/helpers/httpClient'
import type { AdminDashboardData, HODDashboardData } from '@/types/dashboard.types'

/**
 * Dashboard Service - Admin & HOD Dashboard APIs
 */

/**
 * Get Admin Dashboard Data
 * @returns Complete dashboard data including stats, charts, and recent activities
 */
const getAdminDashboard = async (): Promise<AdminDashboardData> => {
  const response = await httpClient.get<AdminDashboardData>('/Dashboard/admin')
  return response.data
}

/**
 * Get HOD Dashboard Data
 * @returns HOD dashboard data including financials, cash flow, debt aging, and pending invoices
 */
const getHODDashboard = async (): Promise<HODDashboardData> => {
  const response = await httpClient.get<HODDashboardData>('/Dashboard/hod')
  return response.data
}

export default {
  getAdminDashboard,
  getHODDashboard,
}
