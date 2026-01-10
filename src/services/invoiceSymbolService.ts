/**
 * Invoice Symbol Service
 * Handles API calls for invoice symbol components (Prefix, SerialStatus, InvoiceType)
 */

import axios from 'axios'
import API_CONFIG from '@/config/api.config'

// ==================== TYPE DEFINITIONS ====================

/**
 * Prefix (Loại hóa đơn - Số đầu tiên 1-9)
 */
export interface PrefixApiResponse {
  prefixID: number
  prefixName: string
}

/**
 * Serial Status (Mã CQT - C/K)
 */
export interface SerialStatusApiResponse {
  serialStatusID: number
  symbol: 'C' | 'K'
  statusName: string
}

/**
 * Invoice Type (Loại hóa đơn điện tử - T/D/L/M/N/B/G/H/X)
 */
export interface InvoiceTypeApiResponse {
  invoiceTypeID: number
  symbol: 'T' | 'D' | 'L' | 'M' | 'N' | 'B' | 'G' | 'H' | 'X'
  typeName: string
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get authentication headers with Bearer token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem(API_CONFIG.TOKEN_KEY)
  if (!token) {
    throw new Error('No authentication token found. Please login again.')
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Handle API errors consistently
 */
const handleApiError = (error: any, context: string): never => {
  console.error(`[${context}] Error:`, error)

  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      localStorage.removeItem(API_CONFIG.TOKEN_KEY)
      window.location.href = '/auth/sign-in'
      throw new Error('Session expired. Please login again.')
    }

    const message = error.response?.data?.message || error.response?.data?.title || error.message
    throw new Error(`${context} failed: ${message}`)
  }

  throw new Error(`${context} failed: ${error.message || 'Unknown error'}`)
}

// ==================== API FUNCTIONS ====================

/**
 * Get all invoice prefixes (Loại hóa đơn 1-9)
 * @returns Array of prefix options
 */
export const getAllPrefixes = async (): Promise<PrefixApiResponse[]> => {
  try {
    const response = await axios.get<PrefixApiResponse[]>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVOICE_SYMBOL.PREFIX}`,
      { headers: getAuthHeaders() }
    )
    return response.data
  } catch (error) {
    handleApiError(error, 'Get Prefixes')
    return []
  }
}

/**
 * Get all serial statuses (Mã CQT - C/K)
 * @returns Array of serial status options
 */
export const getAllSerialStatuses = async (): Promise<SerialStatusApiResponse[]> => {
  try {
    const response = await axios.get<SerialStatusApiResponse[]>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVOICE_SYMBOL.SERIAL_STATUS}`,
      { headers: getAuthHeaders() }
    )
    return response.data
  } catch (error) {
    handleApiError(error, 'Get Serial Statuses')
    return []
  }
}

/**
 * Get all invoice types (Loại hóa đơn điện tử - T/D/L/M/N/B/G/H/X)
 * @returns Array of invoice type options
 */
export const getAllInvoiceTypes = async (): Promise<InvoiceTypeApiResponse[]> => {
  try {
    const response = await axios.get<InvoiceTypeApiResponse[]>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVOICE_SYMBOL.INVOICE_TYPE}`,
      { headers: getAuthHeaders() }
    )
    return response.data
  } catch (error) {
    handleApiError(error, 'Get Invoice Types')
    return []
  }
}

/**
 * Fetch all symbol data at once (optimized)
 * @returns Object containing all symbol options
 */
export const fetchAllSymbolData = async () => {
  try {
    const [prefixes, serialStatuses, invoiceTypes] = await Promise.all([
      getAllPrefixes(),
      getAllSerialStatuses(),
      getAllInvoiceTypes(),
    ])

    return {
      prefixes,
      serialStatuses,
      invoiceTypes,
    }
  } catch (error) {
    console.error('[fetchAllSymbolData] Error:', error)
    throw error
  }
}

// ==================== DEFAULT EXPORT ====================

export default {
  getAllPrefixes,
  getAllSerialStatuses,
  getAllInvoiceTypes,
  fetchAllSymbolData,
}

