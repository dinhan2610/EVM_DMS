/**
 * Template Service
 * Handles API calls for invoice template and serial management
 */

import axios from 'axios'
import API_CONFIG from '@/config/api.config'

// ==================== TYPE DEFINITIONS ====================

/**
 * Serial (Mã số hóa đơn) - Request
 */
export interface CreateSerialRequest {
  prefixID: number
  serialStatusID: number
  year: string
  invoiceTypeID: number
  tail: string
}

/**
 * Serial Response
 */
export interface SerialResponse {
  serialID: number
  prefixID: number
  serialStatusID: number
  year: string
  invoiceTypeID: number
  tail: string
  fullSerial: string // e.g., "1C25TAA"
  createdAt: string
}

/**
 * Invoice Template - Create Request
 */
export interface CreateTemplateRequest {
  templateName: string
  serialID: number
  templateTypeID: number // 1 = withCode, 2 = withoutCode
  layoutDefinition: string // JSON string of template state
  templateFrameID: number
  logoUrl: string | null
}

/**
 * Invoice Template - Update Request
 */
export interface UpdateTemplateRequest {
  templateID: number
  templateName: string
  layoutDefinition: string
  templateFrameID: number
  logoUrl: string | null
  isActive: boolean
}

/**
 * Invoice Template Response (Both List and Detail now return same structure)
 */
export interface TemplateResponse {
  templateID: number
  templateName: string
  isActive: boolean
  serialID: number
  serial: string
  templateTypeID: number
  templateTypeName: string
  templateFrameID: number
  frameUrl: string | null
  logoUrl: string | null
  layoutDefinition: string
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
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem(API_CONFIG.TOKEN_KEY)
      window.location.href = '/auth/sign-in'
      throw new Error('Session expired. Please login again.')
    }

    // Handle 500 with specific token error
    if (error.response?.status === 500) {
      const detail = error.response?.data?.detail || ''
      if (detail.includes('User ID not found in token') || detail.includes('token')) {
        console.error('❌ Token validation failed. Clearing token and redirecting...')
        localStorage.removeItem(API_CONFIG.TOKEN_KEY)
        setTimeout(() => {
          window.location.href = '/auth/sign-in'
        }, 1500)
        throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.')
      }
    }

    const message = error.response?.data?.detail || error.response?.data?.message || error.response?.data?.title || error.message
    throw new Error(`${context} failed: ${message}`)
  }

  throw new Error(`${context} failed: ${error.message || 'Unknown error'}`)
}

// ==================== SERIAL API FUNCTIONS ====================

/**
 * Create a new serial (Mã số hóa đơn)
 * @param data Serial data
 * @returns Created serial with ID
 */
export const createSerial = async (data: CreateSerialRequest): Promise<SerialResponse> => {
  try {
    console.log('[createSerial] Request URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SERIAL.CREATE}`)
    console.log('[createSerial] Request Data:', data)
    
    const response = await axios.post<SerialResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SERIAL.CREATE}`,
      data,
      { headers: getAuthHeaders() }
    )
    
    console.log('[createSerial] Success:', response.data)
    return response.data
  } catch (error) {
    // Log detailed error info before throwing
    if (axios.isAxiosError(error)) {
      console.error('[createSerial] Response Status:', error.response?.status)
      console.error('[createSerial] Response Data:', error.response?.data)
      console.error('[createSerial] Response Headers:', error.response?.headers)
    }
    handleApiError(error, 'Create Serial')
  }
}

/**
 * Get all serials
 * @returns Array of serials
 */
export const getAllSerials = async (): Promise<SerialResponse[]> => {
  try {
    const response = await axios.get<SerialResponse[]>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SERIAL.GET_ALL}`,
      { headers: getAuthHeaders() }
    )
    return response.data
  } catch (error) {
    handleApiError(error, 'Get Serials')
  }
}

// ==================== TEMPLATE API FUNCTIONS ====================

/**
 * Create a new invoice template
 * @param data Template data
 * @returns Created template with ID
 */
export const createTemplate = async (data: CreateTemplateRequest): Promise<TemplateResponse> => {
  try {
    console.log('[createTemplate] Request URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.CREATE}`)
    console.log('[createTemplate] Request Data:', {
      ...data,
      layoutDefinition: `${data.layoutDefinition.substring(0, 100)}... (${data.layoutDefinition.length} chars)`
    })
    
    const response = await axios.post<TemplateResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.CREATE}`,
      data,
      { headers: getAuthHeaders() }
    )
    
    console.log('[createTemplate] Success:', response.data)
    return response.data
  } catch (error) {
    // Log detailed error info before throwing
    if (axios.isAxiosError(error)) {
      console.error('[createTemplate] Response Status:', error.response?.status)
      console.error('[createTemplate] Response Data:', error.response?.data)
      console.error('[createTemplate] Response Headers:', error.response?.headers)
    }
    handleApiError(error, 'Create Template')
  }
}

/**
 * Get all invoice templates
 * @returns Array of templates (now returns full details, same as getById)
 */
export const getAllTemplates = async (): Promise<TemplateResponse[]> => {
  try {
    const response = await axios.get<TemplateResponse[]>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.GET_ALL}`,
      { headers: getAuthHeaders() }
    )
    console.log('[getAllTemplates] Success:', response.data)
    return response.data
  } catch (error) {
    handleApiError(error, 'Get Templates')
  }
}

/**
 * Get a specific invoice template by ID
 * @param templateId Template ID
 * @returns Template details
 */
export const getTemplateById = async (templateId: number): Promise<TemplateResponse> => {
  try {
    const response = await axios.get<TemplateResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.GET_BY_ID(templateId)}`,
      { headers: getAuthHeaders() }
    )
    return response.data
  } catch (error) {
    handleApiError(error, 'Get Template By ID')
  }
}

/**
 * Update an existing invoice template
 * @param templateId Template ID
 * @param data Updated template data
 * @returns Updated template
 */
export const updateTemplate = async (
  templateId: number,
  data: UpdateTemplateRequest
): Promise<TemplateResponse> => {
  try {
    const response = await axios.put<TemplateResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.UPDATE(templateId)}`,
      data,
      { headers: getAuthHeaders() }
    )
    return response.data
  } catch (error) {
    handleApiError(error, 'Update Template')
  }
}

/**
 * Upload logo image (if needed)
 * @param file Logo file
 * @returns Uploaded logo URL
 */
export const uploadLogo = async (file: File): Promise<string> => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post<{ url: string }>(
      `${API_CONFIG.BASE_URL}/api/Upload/logo`, // Adjust endpoint as needed
      formData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(API_CONFIG.TOKEN_KEY)}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data.url
  } catch (error) {
    handleApiError(error, 'Upload Logo')
  }
}

// ==================== DEFAULT EXPORT ====================

const templateService = {
  // Serial
  createSerial,
  getAllSerials,
  
  // Template
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  uploadLogo,
}

export default templateService

