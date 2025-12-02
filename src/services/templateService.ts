/**
 * Template Service
 * Handles API calls for invoice template and serial management
 * 
 * ✅ OPTIMIZED FOR 100% API COMPATIBILITY
 * - Uses correct type definitions from templateApi.ts
 * - Proper handling of layoutDefinition as OBJECT in request
 * - Proper handling of layoutDefinition as JSON STRING in response
 */

import axios from 'axios'
import API_CONFIG from '@/config/api.config'
import type { 
  CreateTemplateApiRequest, 
  UpdateTemplateApiRequest, 
  TemplateApiResponse,
  LayoutDefinitionRequest,
} from '@/types/templateApi'
import { parseLayoutDefinition, stringifyLayoutDefinition } from '@/utils/templateApiMapper'

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

// ✅ Use API types from templateApi.ts
export type CreateTemplateRequest = CreateTemplateApiRequest
export type UpdateTemplateRequest = UpdateTemplateApiRequest
export type TemplateResponse = TemplateApiResponse

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
 * 
 * ✅ OPTIMIZED: Sends layoutDefinition as OBJECT directly (not string)
 * 
 * @param data Template data with layoutDefinition as LayoutDefinitionRequest object
 * @returns Created template with ID
 * 
 * @example
 * const layoutDef = mapEditorStateToApiRequest(templateState)
 * const template = await createTemplate({
 *   templateName: "My Template",
 *   serialID: 1,
 *   templateTypeID: 1,
 *   layoutDefinition: layoutDef, // ✅ OBJECT
 *   templateFrameID: 1,
 *   logoUrl: null
 * })
 */
export const createTemplate = async (data: CreateTemplateRequest): Promise<TemplateResponse> => {
  try {
    console.log('[createTemplate] Request URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.CREATE}`)
    
    // ✅ CRITICAL: Send layoutDefinition as OBJECT, not string
    // The API expects an object structure, not a JSON string
    const requestData: CreateTemplateRequest = {
      templateName: data.templateName,
      serialID: data.serialID,
      templateTypeID: data.templateTypeID,
      layoutDefinition: data.layoutDefinition, // ✅ Already a LayoutDefinitionRequest object
      templateFrameID: data.templateFrameID,
      logoUrl: data.logoUrl,
    }
    
    console.log('[createTemplate] Request Data:', {
      templateName: requestData.templateName,
      serialID: requestData.serialID,
      templateTypeID: requestData.templateTypeID,
      templateFrameID: requestData.templateFrameID,
      logoUrl: requestData.logoUrl,
      layoutDefinition: {
        displaySettings: requestData.layoutDefinition.displaySettings,
        customerSettings: requestData.layoutDefinition.customerSettings,
        tableSettings: requestData.layoutDefinition.tableSettings,
        style: requestData.layoutDefinition.style,
      }
    })
    
    const response = await axios.post<TemplateResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.CREATE}`,
      requestData,
      { headers: getAuthHeaders() }
    )
    
    console.log('[createTemplate] ✅ Success:', {
      templateID: response.data.templateID,
      templateName: response.data.templateName,
      serialID: response.data.serialID,
      serial: response.data.serial,
    })
    
    return response.data
  } catch (error) {
    // Log detailed error info before throwing
    if (axios.isAxiosError(error)) {
      console.error('[createTemplate] ❌ Response Status:', error.response?.status)
      console.error('[createTemplate] ❌ Response Data:', error.response?.data)
      console.error('[createTemplate] ❌ Validation Errors:', error.response?.data?.errors)
      console.error('[createTemplate] ❌ Response Headers:', error.response?.headers)
    }
    handleApiError(error, 'Create Template')
  }
}

/**
 * Get all invoice templates
 * 
 * ✅ OPTIMIZED: Returns templates with layoutDefinition as JSON STRING
 * 
 * @returns Array of templates
 * 
 * @example
 * const templates = await getAllTemplates()
 * templates.forEach(template => {
 *   const layoutDef = parseLayoutDefinition(template.layoutDefinition)
 *   // Use layoutDef...
 * })
 */
export const getAllTemplates = async (): Promise<TemplateResponse[]> => {
  try {
    const response = await axios.get<TemplateResponse[]>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.GET_ALL}`,
      { headers: getAuthHeaders() }
    )
    
    console.log('[getAllTemplates] ✅ Success:', `Fetched ${response.data.length} templates`)
    
    // Log first template structure for debugging
    if (response.data.length > 0) {
      console.log('[getAllTemplates] Sample template:', {
        templateID: response.data[0].templateID,
        templateName: response.data[0].templateName,
        serial: response.data[0].serial,
        layoutDefinitionType: typeof response.data[0].layoutDefinition,
      })
    }
    
    return response.data
  } catch (error) {
    handleApiError(error, 'Get Templates')
  }
}

/**
 * Get a specific invoice template by ID
 * 
 * ✅ OPTIMIZED: Returns template with layoutDefinition as JSON STRING
 * 
 * @param templateId Template ID
 * @returns Template details
 * 
 * @example
 * const template = await getTemplateById(1)
 * const layoutDef = parseLayoutDefinition(template.layoutDefinition)
 * const editorState = mapApiResponseToEditorState(layoutDef)
 */
export const getTemplateById = async (templateId: number): Promise<TemplateResponse> => {
  try {
    const response = await axios.get<TemplateResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.GET_BY_ID(templateId)}`,
      { headers: getAuthHeaders() }
    )
    
    console.log('[getTemplateById] ✅ Success:', {
      templateID: response.data.templateID,
      templateName: response.data.templateName,
      layoutDefinitionType: typeof response.data.layoutDefinition,
    })
    
    return response.data
  } catch (error) {
    handleApiError(error, 'Get Template By ID')
  }
}

/**
 * Update an existing invoice template
 * 
 * ✅ OPTIMIZED: Expects layoutDefinition as JSON STRING for update
 * 
 * @param templateId Template ID
 * @param data Updated template data
 * @returns Updated template
 * 
 * @example
 * const layoutDefResponse = createLayoutDefinitionResponse(editorState)
 * const layoutDefString = stringifyLayoutDefinition(layoutDefResponse)
 * 
 * await updateTemplate(templateId, {
 *   templateID: templateId,
 *   templateName: "Updated Name",
 *   layoutDefinition: layoutDefString, // ✅ JSON STRING
 *   templateFrameID: 1,
 *   logoUrl: null,
 *   isActive: true
 * })
 */
export const updateTemplate = async (
  templateId: number,
  data: UpdateTemplateRequest
): Promise<TemplateResponse> => {
  try {
    console.log('[updateTemplate] Request URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.UPDATE(templateId)}`)
    console.log('[updateTemplate] Request Data:', {
      templateID: data.templateID,
      templateName: data.templateName,
      templateFrameID: data.templateFrameID,
      logoUrl: data.logoUrl,
      isActive: data.isActive,
      layoutDefinitionType: typeof data.layoutDefinition,
      layoutDefinitionLength: data.layoutDefinition.length,
    })
    
    const response = await axios.put<TemplateResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.UPDATE(templateId)}`,
      data,
      { headers: getAuthHeaders() }
    )
    
    console.log('[updateTemplate] ✅ Success:', {
      templateID: response.data.templateID,
      templateName: response.data.templateName,
    })
    
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[updateTemplate] ❌ Response Status:', error.response?.status)
      console.error('[updateTemplate] ❌ Response Data:', error.response?.data)
    }
    handleApiError(error, 'Update Template')
  }
}

/**
 * Upload logo image for template
 * @param file Logo file
 * @returns Uploaded logo URL
 */
export const uploadLogo = async (file: File): Promise<string> => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post<string>(
      `${API_CONFIG.BASE_URL}/api/File/upload-template-image`,
      formData,
      {
        params: {
          type: 'logo', // Query parameter
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem(API_CONFIG.TOKEN_KEY)}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    
    // API trả về trực tiếp URL string
    return response.data
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

