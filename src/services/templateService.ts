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
} from '@/types/templateApi'

// ==================== TYPE DEFINITIONS ====================

/**
 * Internal Create Template Request (send as object)
 */
export interface CreateTemplateInternalRequest {
  templateName: string
  serialID: number
  templateTypeID: number
  layoutDefinition: unknown // ✅ Object (OLD or FULL schema)
  templateFrameID: number
  logoUrl: string | null
  renderedHtml?: string // ✅ NEW: Template HTML
}

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
 * Serial Response - ACTUAL backend structure
 * Backend returns pre-formatted serial string, not individual components
 * 
 * Example:
 * {
 *   serialID: 7,
 *   serial: "1C25T12",
 *   description: "Hóa đơn điện tử giá trị gia tăng - Hóa đơn có mã của cơ quan thuế"
 * }
 * 
 * Serial format: [Prefix][Status][Year][InvoiceType][Tail]
 * Example: "1C26HA" = Prefix:1 + Status:C + Year:26 + Type:H + Tail:HA
 */
export interface SerialResponse {
  serialID: number
  serial: string  // Full serial string (e.g., "1C25T12")
  description?: string
  createdAt?: string
}

/**
 * Reference data interfaces for building serial strings
 */
export interface PrefixResponse {
  prefixID: number
  prefixName: string  // e.g., "Hóa đơn điện tử giá trị gia tăng"
}

export interface SerialStatusResponse {
  serialStatusID: number
  symbol: string  // "C", "K", "0"
  statusName: string  // e.g., "Hóa đơn có mã của cơ quan thuế"
}

export interface InvoiceTypeResponse {
  invoiceTypeID: number
  symbol: string  // "T", "D", "L", etc.
  typeName: string  // e.g., "Hóa đơn Doanh nghiệp..."
}

// ✅ Use API types from templateApi.ts
export type CreateTemplateRequest = CreateTemplateInternalRequest // ✅ Accept object
export type UpdateTemplateRequest = UpdateTemplateApiRequest
export type TemplateResponse = TemplateApiResponse

// ==================== HELPER FUNCTIONS ====================

/**
 * Get authentication headers with Bearer token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem(API_CONFIG.TOKEN_KEY)
  if (!token) {
    // Clear any stale auth data
    localStorage.removeItem(API_CONFIG.TOKEN_KEY);
    localStorage.removeItem(API_CONFIG.REFRESH_TOKEN_KEY);
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
const handleApiError = (error: unknown, context: string): never => {
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

    // Handle 400 validation errors from ASP.NET
    if (error.response?.status === 400 && error.response?.data?.errors) {
      const errors = error.response.data.errors
      const errorMessages = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join(' | ')
      
      console.error('❌ Validation Errors:', errorMessages)
      throw new Error(`${context} failed: ${errorMessages}`)
    }

    const message = error.response?.data?.detail || error.response?.data?.message || error.response?.data?.title || error.message
    throw new Error(`${context} failed: ${message}`)
  }

  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  throw new Error(`${context} failed: ${errorMessage}`)
}

// ==================== SERIAL API FUNCTIONS ====================

/**
 * Get all prefixes (Ký hiệu)
 * GET /api/Prefix
 */
export const getAllPrefixes = async (): Promise<PrefixResponse[]> => {
  try {
    const response = await axios.get<PrefixResponse[]>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVOICE_SYMBOL.PREFIX}`,
      { headers: getAuthHeaders() }
    )
    console.log('🔍 [getAllPrefixes] Response:', JSON.stringify(response.data.slice(0, 3), null, 2))
    return response.data
  } catch (error) {
    throw handleApiError(error, 'Get All Prefixes')
  }
}

/**
 * Get all serial statuses (Trạng thái)
 * GET /api/SerialStatus
 */
export const getAllSerialStatuses = async (): Promise<SerialStatusResponse[]> => {
  try {
    const response = await axios.get<SerialStatusResponse[]>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVOICE_SYMBOL.SERIAL_STATUS}`,
      { headers: getAuthHeaders() }
    )
    console.log('🔍 [getAllSerialStatuses] Response:', JSON.stringify(response.data, null, 2))
    return response.data
  } catch (error) {
    throw handleApiError(error, 'Get All Serial Statuses')
  }
}

/**
 * Get all invoice types (Loại hóa đơn)
 * GET /api/InvoiceType
 */
export const getAllInvoiceTypes = async (): Promise<InvoiceTypeResponse[]> => {
  try {
    const response = await axios.get<InvoiceTypeResponse[]>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVOICE_SYMBOL.INVOICE_TYPE}`,
      { headers: getAuthHeaders() }
    )
    console.log('🔍 [getAllInvoiceTypes] Response:', JSON.stringify(response.data.slice(0, 3), null, 2))
    return response.data
  } catch (error) {
    throw handleApiError(error, 'Get All Invoice Types')
  }
}

/**
 * Build serial string from components
 * Format: [Prefix][Status][Year][InvoiceType][Tail]
 * Example: "1C26HA" = Prefix:1 + Status:C + Year:26 + Type:H + Tail:HA
 * 
 * @param data Serial components
 * @param prefixes All prefix reference data
 * @param statuses All serial status reference data
 * @param types All invoice type reference data
 * @returns Built serial string (e.g., "1C26HA")
 */
const buildSerialString = (
  data: CreateSerialRequest,
  prefixes: PrefixResponse[],
  statuses: SerialStatusResponse[],
  types: InvoiceTypeResponse[]
): string => {
  console.log('🔨 [buildSerialString] Looking for:', {
    prefixID: data.prefixID,
    serialStatusID: data.serialStatusID,
    invoiceTypeID: data.invoiceTypeID
  })
  
  const prefix = prefixes.find(p => p.prefixID === data.prefixID)
  const status = statuses.find(s => s.serialStatusID === data.serialStatusID)
  const type = types.find(t => t.invoiceTypeID === data.invoiceTypeID)
  
  console.log('🔨 [buildSerialString] Found:', {
    prefix: prefix ? JSON.stringify(prefix) : 'NOT FOUND',
    status: status ? JSON.stringify(status) : 'NOT FOUND',
    type: type ? JSON.stringify(type) : 'NOT FOUND'
  })
  
  if (!prefix || !status || !type) {
    console.error('❌ Missing reference data:', { prefix, status, type })
    console.error('❌ Available prefixes:', prefixes)
    console.error('❌ Available statuses:', statuses)
    console.error('❌ Available types:', types)
    throw new Error('Cannot build serial: missing reference data')
  }
  
  // Normalize year to 2 digits
  const year = data.year.length === 4 ? data.year.slice(-2) : data.year
  
  // Build serial string
  // Format: [PrefixID][Status Symbol][Year][Type Symbol][Tail]
  // Example: "1C26THA" = prefixID:1 + status:C + year:26 + type:T + tail:HA
  const serialString = `${prefix.prefixID}${status.symbol}${year}${type.symbol}${data.tail}`
  console.log('🔨 Built serial string:', serialString, 'from:', data)
  
  return serialString
}

/**
 * Get all serials from database
 * GET /api/Serial
 * @returns Array of all serials
 */
export const getAllSerials = async (): Promise<SerialResponse[]> => {
  try {
    console.log('[getAllSerials] Fetching all serials...')
    
    const response = await axios.get<SerialResponse[]>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SERIAL.GET_ALL}`,
      { headers: getAuthHeaders() }
    )
    
    // Filter out system serials (serialID = -1)
    const userSerials = response.data.filter(s => s.serialID > 0)
    
    console.log('[getAllSerials] Total:', response.data.length, '| User-created:', userSerials.length)
    
    return userSerials
  } catch (error) {
    throw handleApiError(error, 'Get All Serials')
  }
}

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
      console.error('[createSerial] Response Data (Full):', JSON.stringify(error.response?.data, null, 2))
      console.error('[createSerial] Validation Errors:', error.response?.data?.errors)
      console.error('[createSerial] Response Headers:', error.response?.headers)
    }
    throw handleApiError(error, 'Create Serial')
  }
}

/**
 * Get existing serial or create new one if not exists
 * Smart function that prevents duplicate serial errors
 * 
 * @param data Serial data to find or create
 * @returns Existing or newly created serial
 * 
 * @example
 * ```typescript
 * const serial = await getOrCreateSerial({
 *   prefixID: 1,
 *   serialStatusID: 1,
 *   year: '26',
 *   invoiceTypeID: 1,
 *   tail: 'HA'
 * });
 * console.log('Serial ID:', serial.serialID);
 * ```
 */
export const getOrCreateSerial = async (data: CreateSerialRequest): Promise<SerialResponse> => {
  try {
    console.log('[getOrCreateSerial] Checking if serial exists:', data)
    
    // Step 1: Fetch reference data in parallel
    const [existingSerials, prefixes, statuses, types] = await Promise.all([
      getAllSerials(),
      getAllPrefixes(),
      getAllSerialStatuses(),
      getAllInvoiceTypes()
    ])
    
    console.log('📦 Reference data loaded:', {
      existingSerials: existingSerials.length,
      prefixes: prefixes.length,
      statuses: statuses.length,
      types: types.length
    })
    
    // Step 2: Build expected serial string from input components
    const expectedSerial = buildSerialString(data, prefixes, statuses, types)
    console.log('🔍 Looking for serial:', expectedSerial)
    
    // Step 3: Find matching serial by comparing serial strings
    const matchingSerial = existingSerials.find(s => s.serial === expectedSerial)
    
    // Step 4: If found, return existing serial
    if (matchingSerial) {
      console.log('✅ [getOrCreateSerial] Found existing serial:', matchingSerial.serialID, matchingSerial.serial)
      return matchingSerial
    }
    
    // Step 5: If not found, create new serial
    console.log('🆕 [getOrCreateSerial] Serial not found, creating new one...')
    const newSerial = await createSerial(data)
    console.log('✅ [getOrCreateSerial] Created new serial:', newSerial.serialID, newSerial.serial)
    return newSerial
    
  } catch (error) {
    throw handleApiError(error, 'Get Or Create Serial')
  }
}

// ==================== TEMPLATE PREVIEW API FUNCTIONS ====================

/**
 * Get template preview HTML from backend
 * This endpoint returns fully rendered HTML with inline CSS
 * Used for: Final preview, Print, PDF generation
 * 
 * @param templateId - Template ID
 * @returns HTML string ready for display in iframe or print
 */
export const getTemplatePreviewHtml = async (
  templateId: number
): Promise<string> => {
  try {
    console.log('[getTemplatePreviewHtml] Fetching preview for template:', templateId)
    
    const response = await axios.get<string>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.PREVIEW_HTML(templateId)}`,
      {
        headers: getAuthHeaders(),
        responseType: 'text', // ✅ Important: Get as text, not JSON
      }
    )
    
    console.log('[getTemplatePreviewHtml] Success, HTML length:', response.data.length)
    return response.data
  } catch (error) {
    // Fallback: Return empty HTML with error message
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn('[getTemplatePreviewHtml] Template not found, returning empty preview')
      return `
        <!DOCTYPE html>
        <html>
          <head><meta charset="UTF-8"><title>Template Not Found</title></head>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h2>Template không tồn tại</h2>
            <p>Vui lòng tạo và lưu template trước khi xem preview.</p>
          </body>
        </html>
      `
    }
    
    return handleApiError(error, 'getTemplatePreviewHtml')
  }
}

/**
 * Get template preview as PDF (Binary)
 * 
 * API: GET /api/InvoiceTemplate/preview-template/{id}
 * Returns: application/pdf (binary)
 * 
 * @param templateId - Template ID
 * @returns Blob object for PDF display/download
 */
export const getTemplatePreviewPdf = async (
  templateId: number
): Promise<Blob> => {
  try {
    console.log('[getTemplatePreviewPdf] Fetching PDF preview for template:', templateId)
    
    const response = await axios.get(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.PREVIEW_HTML(templateId)}`,
      {
        headers: getAuthHeaders(),
        responseType: 'blob', // ✅ Important: Get as blob for PDF binary data
      }
    )
    
    // Verify it's actually a PDF
    const contentType = response.headers['content-type'] || response.data.type
    if (!contentType.includes('pdf')) {
      console.warn('[getTemplatePreviewPdf] Response is not PDF:', contentType)
      throw new Error('Server did not return a PDF file')
    }
    
    console.log('[getTemplatePreviewPdf] Success, PDF size:', response.data.size, 'bytes')
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.error('[getTemplatePreviewPdf] Template not found')
      throw new Error('Template không tồn tại')
    }
    
    return handleApiError(error, 'getTemplatePreviewPdf')
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
    
    // ✅ CRITICAL: Send layoutDefinition as OBJECT
    // Axios will automatically JSON.stringify the entire request body
    // DO NOT manually stringify layoutDefinition here!
    const requestData: CreateTemplateApiRequest = {
      templateName: data.templateName,
      serialID: data.serialID,
      templateTypeID: data.templateTypeID,
      layoutDefinition: data.layoutDefinition, // ✅ Send as OBJECT, Axios will handle
      templateFrameID: data.templateFrameID,
      logoUrl: data.logoUrl,
      renderedHtml: data.renderedHtml, // ✅ NEW: Template HTML
    }
    
    console.log('[createTemplate] Request Data:', {
      templateName: requestData.templateName,
      serialID: requestData.serialID,
      templateTypeID: requestData.templateTypeID,
      templateFrameID: requestData.templateFrameID,
      logoUrl: requestData.logoUrl,
      layoutDefinitionType: typeof requestData.layoutDefinition,
      layoutDefinitionPreview: requestData.layoutDefinition,
    })
    
    const response = await axios.post<TemplateResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.CREATE}`,
      requestData,
      { headers: getAuthHeaders() }
    )
    
    console.log('[createTemplate] ✅ Success:', {
      response: response.data,
      templateID: response.data.templateID,
      templateName: response.data.templateName,
      serialID: response.data.serialID,
      serial: response.data.serial,
      layoutDefinition: response.data.layoutDefinition,
    })
    
    return response.data
  } catch (error) {
    // Log detailed error info before throwing
    if (axios.isAxiosError(error)) {
      console.error('[createTemplate] ❌ Response Status:', error.response?.status)
      console.error('[createTemplate] ❌ Response Data:', error.response?.data)
      console.error('[createTemplate] ❌ Validation Errors:', error.response?.data?.errors)
      
      // ✅ Log detailed validation error messages
      if (error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([field, messages]) => {
          console.error(`   Field: ${field}`)
          console.error(`   Messages:`, messages)
        })
      }
      
      console.error('[createTemplate] ❌ Response Headers:', error.response?.headers)
    }
    throw handleApiError(error, 'Create Template')
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
    throw handleApiError(error, 'Get Templates')
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
    console.log('[getTemplateById] Requesting template:', templateId)
    
    const response = await axios.get<TemplateResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.GET_BY_ID(templateId)}`,
      { headers: getAuthHeaders() }
    )
    
    console.log('[getTemplateById] ✅ Success:', {
      templateID: response.data.templateID,
      templateName: response.data.templateName,
      layoutDefinitionType: typeof response.data.layoutDefinition,
      layoutDefinitionPreview: typeof response.data.layoutDefinition === 'string' 
        ? response.data.layoutDefinition.substring(0, 200) 
        : response.data.layoutDefinition,
    })
    
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[getTemplateById] ❌ Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        templateId,
      })
    }
    throw handleApiError(error, 'Get Template By ID')
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
    throw handleApiError(error, 'Update Template')
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

    const response = await axios.post<{ url: string }>(
      `${API_CONFIG.BASE_URL}/File/upload-template-image`,
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
    
    // API trả về object { url: "..." }
    return response.data.url
  } catch (error) {
    throw handleApiError(error, 'Upload Logo')
  }
}

// ==================== DEFAULT EXPORT ====================

const templateService = {
  // Serial
  createSerial,
  getAllSerials,
  getOrCreateSerial,
  getAllPrefixes,
  getAllSerialStatuses,
  getAllInvoiceTypes,
  
  // Template
  createTemplate,
  getAllTemplates,
  getTemplateById,
  getTemplatePreviewHtml,
  getTemplatePreviewPdf,
  updateTemplate,
  uploadLogo,
}

export default templateService

