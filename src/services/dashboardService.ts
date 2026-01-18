import httpClient from '@/helpers/httpClient'
import type { AdminDashboardData, HODDashboardData } from '@/types/dashboard.types'
import type { AccountantDashboardAPI } from '@/types/staff.types'

/**
 * Dashboard Service - Admin, HOD & Accountant Dashboard APIs
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

/**
 * Get Accountant Dashboard Data
 * @returns Accountant dashboard data including KPIs, task queue, and recent invoices
 */
const getAccountantDashboard = async (): Promise<AccountantDashboardAPI> => {
  const response = await httpClient.get<AccountantDashboardAPI>('/Dashboard/accountant')
  return response.data
}

export default {
  getAdminDashboard,
  getHODDashboard,
  getAccountantDashboard,
}
