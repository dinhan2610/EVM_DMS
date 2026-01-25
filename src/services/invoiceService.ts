/**
 * Invoice Service - API calls for invoice management
 */

import axios from 'axios'
import API_CONFIG from '@/config/api.config'
import type { BackendInvoiceRequest, BackendDraftInvoiceRequest, BackendInvoiceResponse } from '@/utils/invoiceAdapter'

// ==================== INVOICE REQUEST TYPES ====================

/**
 * Backend Invoice Request Payload - POST /api/InvoiceRequest
 * ✅ 17 fields - GIỮ NGUYÊN API hiện tại
 * ⚠️ salesID: Frontend gửi 0, backend OVERRIDE từ JWT
 * ⚠️ accountantId: Frontend gửi null, backend set null
 */
export interface BackendInvoiceRequestPayload {
  accountantId: number | null // NULL = chưa assign accountant
  salesID?: number // 🆕 Optional - Backend tự thêm từ JWT token
  customerID: number // ID khách hàng
  taxCode: string // MST khách hàng
  customerName: string // Tên công ty
  address: string // Địa chỉ
  notes: string // Ghi chú
  paymentMethod: string // "Tiền mặt" | "Chuyển khoản"
  items: BackendInvoiceRequestItem[]
  amount: number // Tổng chưa VAT
  taxAmount: number // Tổng VAT
  totalAmount: number // Tổng thanh toán
  minRows: number // Số dòng trống (mặc định 5)
  contactEmail: string // Email
  contactPerson: string // Người liên hệ
  contactPhone: string // SĐT
  companyID: number // Mặc định 1
  invoiceCustomerType: number // ✅ REQUIRED: 1=Retail/Bán lẻ (B2C), 2=Business/Doanh nghiệp (B2B)
}

export interface BackendInvoiceRequestItem {
  productId: number
  productName: string
  unit: string
  quantity: number
  unitPrice?: number
  amount: number
  vatAmount: number
}

/**
 * Backend Invoice Request Response - GET /api/InvoiceRequest
 */
export interface BackendInvoiceRequestResponse {
  requestID: number
  requestCode?: string
  statusID?: number
  statusId?: number
  statusName?: string
  customerID?: number
  customerName: string
  taxCode?: string
  address?: string
  salesID?: number
  salesName?: string
  saleName?: string
  accountantId?: number | null
  accountantName?: string
  items?: BackendInvoiceRequestItem[]
  amount?: number
  taxAmount?: number
  totalAmount: number
  totalAmountInWords?: string
  notes?: string
  paymentMethod?: string
  contactEmail?: string
  contactPerson?: string
  contactPhone?: string
  requestDate?: string
  approvedDate?: string
  completedDate?: string
  rejectionReason?: string
  rejectReason?: string
  invoiceID?: number
  createdInvoiceId?: number | null
  invoiceNumber?: number
  evidenceFilePath?: string // File path to uploaded evidence PDF by Sales
  createdAt?: string
  updatedAt?: string
}

/**
 * Request để update trạng thái
 */
export interface UpdateInvoiceRequestStatusPayload {
  requestID: number
  statusID: number // New status
  notes?: string // Optional notes/reason
  invoiceID?: number // For completed status
  invoiceNumber?: number // For completed status
}

// ==================== EMAIL TYPES ====================

export interface SendInvoiceEmailRequest {
  emailTemplateId?: number
  recipientEmail: string
  ccEmails?: string[]
  bccEmails?: string[]
  customMessage?: string
  includeXml?: boolean
  includePdf?: boolean
  language?: string
  externalAttachmentUrls?: string[]
}

export interface SendInvoiceEmailResponse {
  success: boolean
  message: string
  sentTo: string
  sentAt: string
}

// ==================== TYPES ====================

export interface Template {
  templateID: number
  templateName: string
  serial: string
  templateTypeName: string
  frameUrl: string
  isActive: boolean
}

// Backend invoice response từ GET /api/Invoice
export interface InvoiceListItem {
  invoiceID: number
  templateID: number
  invoiceNumber: number
  invoiceStatusID: number
  companyId: number
  customerID: number
  issuerID: number
  signDate: string
  paymentDueDate: string | null
  subtotalAmount: number
  vatRate: number
  vatAmount: number
  totalAmount: number
  paymentMethod: string
  totalAmountInWords: string
  digitalSignature: string | null
  taxAuthorityCode: string | null
  taxApiStatusID: number | null // ✅ ID trạng thái CQT (từ TaxApiStatus)
  taxStatusCode: string | null // ✅ Mã trạng thái (PENDING, TB01, KQ01, etc.)
  taxStatusName: string | null // ✅ Tên trạng thái hiển thị
  qrCodeData: string | null
  notes: string | null
  filePath: string | null
  xmlPath: string | null
  createdAt: string
  invoiceItems: InvoiceItemResponse[]
  contactPerson?: string // ✅ Họ tên người mua hàng (buyerName)
  contactEmail?: string // Email liên hệ (legacy field, không dùng)
  contactPhone?: string // SĐT liên hệ

  // Customer fields from backend API response
  customerName?: string // Tên công ty khách hàng
  customerAddress?: string // Địa chỉ khách hàng (backend field name)
  customerEmail?: string // ✅ Email khách hàng (backend trả về field này)
  taxCode?: string // Mã số thuế khách hàng

  // ==================== SALE INFO ====================
  salesID?: number // 🆕 ID nhân viên kinh doanh (để filter cho Sale role)

  // ==================== INVOICE TYPE FIELDS ====================
  invoiceType: number // ✅ 1=Gốc, 2=Điều chỉnh, 3=Thay thế, 4=Hủy, 5=Giải trình
  originalInvoiceID: number | null // ✅ ID hóa đơn gốc (cho HĐ điều chỉnh/thay thế/hủy/giải trình)
  adjustmentReason: string | null // ✅ Lý do điều chỉnh
  replacementReason?: string | null // Lý do thay thế
  cancellationReason?: string | null // Lý do hủy
  explanationText?: string | null // Nội dung giải trình
  originalInvoiceNumber?: number // Số hóa đơn gốc (để hiển thị)
  originalInvoiceSignDate?: string | null // ✅ Ngày ký hóa đơn gốc (từ backend)
  originalInvoiceSymbol?: string | null // ✅ Ký hiệu hóa đơn gốc (template serial)

  // ==================== CUSTOMER TYPE FIELD ====================
  invoiceCustomerType?: number | string // ✅ 1 hoặc 'Customer' = B2C/Bán lẻ, 2 hoặc 'Business' = B2B/Doanh nghiệp

  // ==================== MINUTE FIELD ====================
  minuteCode?: string | null // ✅ Mã biên bản đã thỏa thuận (cho HĐ điều chỉnh/thay thế)
}

export interface InvoiceItemResponse {
  productId: number
  productName: string | null
  unit: string | null
  quantity: number
  amount: number
  vatAmount: number
  isAdjustmentItem?: boolean // ✅ Đánh dấu item điều chỉnh
}

// ==================== INVOICE TYPE CONSTANTS ====================
/**
 * Loại hóa đơn theo quy định
 * 1: Hóa đơn gốc (thường)
 * 2: Hóa đơn điều chỉnh
 * 3: Hóa đơn thay thế
 * 4: Hóa đơn hủy
 * 5: Hóa đơn giải trình
 */
export const INVOICE_TYPE = {
  ORIGINAL: 1, // Hóa đơn gốc
  ADJUSTMENT: 2, // Hóa đơn điều chỉnh
  REPLACEMENT: 3, // Hóa đơn thay thế
  CANCELLED: 4, // Hóa đơn hủy
  EXPLANATION: 5, // Hóa đơn giải trình
} as const

export type InvoiceType = (typeof INVOICE_TYPE)[keyof typeof INVOICE_TYPE]

export const INVOICE_TYPE_LABELS: Record<number, string> = {
  [INVOICE_TYPE.ORIGINAL]: 'Hóa đơn gốc',
  [INVOICE_TYPE.ADJUSTMENT]: 'Hóa đơn điều chỉnh',
  [INVOICE_TYPE.REPLACEMENT]: 'Hóa đơn thay thế',
  [INVOICE_TYPE.CANCELLED]: 'Hóa đơn hủy',
  [INVOICE_TYPE.EXPLANATION]: 'Hóa đơn giải trình',
}

export const INVOICE_TYPE_COLORS: Record<number, string> = {
  [INVOICE_TYPE.ORIGINAL]: 'default',
  [INVOICE_TYPE.ADJUSTMENT]: 'warning',
  [INVOICE_TYPE.REPLACEMENT]: 'info',
  [INVOICE_TYPE.CANCELLED]: 'error',
  [INVOICE_TYPE.EXPLANATION]: 'secondary',
}

// Helper function: Check if invoice has original invoice
export const hasOriginalInvoice = (invoice: InvoiceListItem): boolean => {
  return invoice.invoiceType !== INVOICE_TYPE.ORIGINAL && !!invoice.originalInvoiceID
}

// Helper function: Get invoice type label
export const getInvoiceTypeLabel = (invoiceType: number): string => {
  return INVOICE_TYPE_LABELS[invoiceType] || 'Không xác định'
}

// Helper function: Get invoice type color
export const getInvoiceTypeColor = (invoiceType: number): string => {
  return INVOICE_TYPE_COLORS[invoiceType] || 'default'
}

/**
 * ✅ NEW: Helper function to check if invoice has adjustment child
 * Kiểm tra xem hóa đơn này có HĐ con điều chỉnh không
 *
 * @param invoice - Hóa đơn cần kiểm tra
 * @param allInvoices - Danh sách tất cả hóa đơn
 * @returns true nếu có HĐ con điều chỉnh
 */
export const hasAdjustmentChild = (invoice: InvoiceListItem, allInvoices: InvoiceListItem[]): boolean => {
  return allInvoices.some((inv) => inv.originalInvoiceID === invoice.invoiceID && inv.invoiceType === INVOICE_TYPE.ADJUSTMENT)
}

/**
 * ✅ NEW: Helper function to check if invoice has replacement child
 * Kiểm tra xem hóa đơn này có HĐ con thay thế không
 *
 * @param invoice - Hóa đơn cần kiểm tra
 * @param allInvoices - Danh sách tất cả hóa đơn
 * @returns true nếu có HĐ con thay thế
 */
export const hasReplacementChild = (invoice: InvoiceListItem, allInvoices: InvoiceListItem[]): boolean => {
  return allInvoices.some((inv) => inv.originalInvoiceID === invoice.invoiceID && inv.invoiceType === INVOICE_TYPE.REPLACEMENT)
}

/**
 * ✅ NEW: Check if single invoice has adjustment child (for InvoiceDetail page)
 * Kiểm tra xem hóa đơn này có HĐ con điều chỉnh không (query backend)
 *
 * @param invoiceId - ID của hóa đơn cần kiểm tra
 * @returns true nếu có HĐ con điều chỉnh
 */
export const checkHasAdjustmentChild = async (invoiceId: number): Promise<boolean> => {
  try {
    const allInvoices = await getAllInvoices()
    return allInvoices.some((inv) => inv.originalInvoiceID === invoiceId && inv.invoiceType === INVOICE_TYPE.ADJUSTMENT)
  } catch (error) {
    console.error('❌ Error checking adjustment child:', error)
    return false
  }
}

/**
 * ✅ NEW: Check if single invoice has replacement child (for InvoiceDetail page)
 * Kiểm tra xem hóa đơn này có HĐ con thay thế không (query backend)
 *
 * @param invoiceId - ID của hóa đơn cần kiểm tra
 * @returns true nếu có HĐ con thay thế
 */
export const checkHasReplacementChild = async (invoiceId: number): Promise<boolean> => {
  try {
    const allInvoices = await getAllInvoices()
    return allInvoices.some((inv) => inv.originalInvoiceID === invoiceId && inv.invoiceType === INVOICE_TYPE.REPLACEMENT)
  } catch (error) {
    console.error('❌ Error checking replacement child:', error)
    return false
  }
}

// Invoice status mapping
export const INVOICE_STATUS: Record<number, string> = {
  1: 'Đã tạo',
  2: 'Đã ký',
  3: 'Đã gửi',
  4: 'Đã hủy',
}

// Legacy interface - giữ cho tương thích
export interface Invoice {
  invoiceID: number
  invoiceNumber: string
  templateID: number
  customerName: string
  totalAmount: number
  status: string
  createdAt: string
}

// ==================== HELPER FUNCTIONS ====================

const getAuthToken = (): string | null => {
  return localStorage.getItem(API_CONFIG.TOKEN_KEY)
}

const getAuthHeaders = () => {
  const token = getAuthToken()
  if (!token) {
    // Clear any stale auth data and redirect to login
    localStorage.removeItem(API_CONFIG.TOKEN_KEY)
    localStorage.removeItem(API_CONFIG.REFRESH_TOKEN_KEY)
    // Redirect will be handled by the calling component
    throw new Error('No authentication token found. Please login again.')
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

const handleApiError = (error: unknown, context: string): never => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const message = error.response?.data?.message || error.response?.data?.detail || error.message

    if (status === 401) {
      localStorage.removeItem(API_CONFIG.TOKEN_KEY)
      window.location.href = '/auth/login'
      throw new Error('Session expired. Please login again.')
    }

    throw new Error(`${context}: ${message}`)
  }
  throw new Error(`${context}: ${String(error)}`)
}

// ==================== TEMPLATE APIs ====================

export const getAllTemplates = async (): Promise<Template[]> => {
  try {
    const response = await axios.get(`/api/InvoiceTemplate`, { headers: getAuthHeaders() })
    return response.data
  } catch (error) {
    return handleApiError(error, 'Get all templates failed')
  }
}

export const getActiveTemplates = async (): Promise<Template[]> => {
  try {
    const templates = await getAllTemplates()
    return templates.filter((t) => t.isActive)
  } catch (error) {
    return handleApiError(error, 'Get active templates failed')
  }
}

// ==================== INVOICE REQUEST APIs ====================

/**
 * Tạo yêu cầu xuất hóa đơn mới (từ Sales)
 * @param payload - Invoice request data (17 fields)
 * @returns Created request response
 */
export const createInvoiceRequest = async (payload: BackendInvoiceRequestPayload): Promise<BackendInvoiceRequestResponse> => {
  try {
    if (import.meta.env.DEV) {
      console.log('[createInvoiceRequest] Request payload:', payload)
      console.log('[createInvoiceRequest] JSON:', JSON.stringify(payload, null, 2))
    }

    // ⚠️ TEMPORARY WORKAROUND: Hardcode salesID = 49 vì backend chưa extract từ token
    // TODO: Remove khi backend đã fix
    const requestData = {
      ...payload,
      salesID: 49, // ⚠️ TEMP: Hardcode userId từ token
      accountantId: null,
      companyID: payload.companyID || 1,
      minRows: payload.minRows || 5,
    }

    if (import.meta.env.DEV) {
      console.log('[createInvoiceRequest] Sending data:', requestData)
    }

    const response = await axios.post<BackendInvoiceRequestResponse>(`/api/InvoiceRequest`, requestData, { headers: getAuthHeaders() })

    if (import.meta.env.DEV) {
      console.log('[createInvoiceRequest] Success:', response.data)
      console.log('[createInvoiceRequest] 🔍 CHECK SALES:', {
        requestCreated: response.data,
        expectedSalesID: 49, // từ token claim "sub"
        actualSalesID: response.data.salesID,
        saleName: response.data.saleName || 'N/A',
      })
    }

    return response.data
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[createInvoiceRequest] Error:', error)
      if (axios.isAxiosError(error) && error.response) {
        console.error('[createInvoiceRequest] Status:', error.response.status)
        console.error('[createInvoiceRequest] Data:', error.response.data)
      }
    }
    return handleApiError(error, 'Tạo yêu cầu xuất HĐ thất bại')
  }
}

/**
 * Lấy danh sách tất cả yêu cầu xuất hóa đơn
 * @returns List of invoice requests
 */
export const getAllInvoiceRequests = async (): Promise<BackendInvoiceRequestResponse[]> => {
  try {
    if (import.meta.env.DEV) {
      console.log('[getAllInvoiceRequests] Fetching all requests...')
    }

    const response = await axios.get<unknown>(`/api/InvoiceRequest`, {
      headers: getAuthHeaders(),
      params: {
        pageSize: 1000,
        page: 1,
      },
    })

    if (import.meta.env.DEV) {
      console.log('[getAllInvoiceRequests] Raw response:', response.data)

      // 🔍 DEBUG: Check xem backend có trả salesID không
      const responseData = response.data as unknown as { value?: { items?: unknown[] }; valueOrDefault?: { items?: unknown[] } }
      const firstItem = responseData?.value?.items?.[0] || responseData?.valueOrDefault?.items?.[0]
      if (firstItem) {
        console.log('[getAllInvoiceRequests] 🔍 RAW FIRST ITEM:', firstItem)
        console.log('[getAllInvoiceRequests] 🔍 ALL KEYS:', Object.keys(firstItem as object))
      }
    }

    // Backend returns: { value: { items: [...], pageIndex, totalPages, ... }, valueOrDefault: {...}, isFailed, isSuccess }
    const data = response.data as Record<string, unknown>
    const actualData = (data.value || data.valueOrDefault || data) as
      | {
          items?: BackendInvoiceRequestResponse[]
          totalPages?: number
          totalCount?: number
        }
      | BackendInvoiceRequestResponse[]

    // Extract items array from pagination wrapper
    let requestsArray: BackendInvoiceRequestResponse[] = []

    if (!Array.isArray(actualData) && actualData.items && Array.isArray(actualData.items)) {
      // Pagination format: { items: [...], pageIndex, totalPages, totalCount }
      requestsArray = actualData.items
      if (import.meta.env.DEV) {
        console.log('[getAllInvoiceRequests] Extracted from pagination:', {
          count: requestsArray.length,
          totalPages: actualData.totalPages,
          totalCount: actualData.totalCount,
        })

        // 🔍 DEBUG: Check salesID và saleName của từng request
        console.log('[getAllInvoiceRequests] 🔍 CHECK SALES IN LIST:')
        requestsArray.forEach((req, idx) => {
          console.log(`  Request ${idx + 1}:`, {
            requestID: req.requestID,
            customerName: req.customerName,
            salesID: req.salesID,
            saleName: req.saleName,
            statusName: req.statusName,
          })
        })
      }
    } else if (Array.isArray(actualData)) {
      // Direct array
      requestsArray = actualData
    } else {
      console.warn('[getAllInvoiceRequests] Unexpected format:', actualData)
    }

    return requestsArray
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[getAllInvoiceRequests] Error:', error)
    }
    return handleApiError(error, 'Lấy danh sách yêu cầu thất bại')
  }
}

/**
 * Lấy chi tiết một yêu cầu xuất hóa đơn
 * @param requestID - ID của yêu cầu
 * @returns Invoice request detail
 */
export const getInvoiceRequestDetail = async (requestID: number): Promise<BackendInvoiceRequestResponse> => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[getInvoiceRequestDetail] Fetching request ${requestID}...`)
    }

    const response = await axios.get<unknown>(`/api/InvoiceRequest/${requestID}`, { headers: getAuthHeaders() })

    if (import.meta.env.DEV) {
      console.log('[getInvoiceRequestDetail] Raw response:', response.data)
    }

    // Backend returns: { value: {...}, valueOrDefault: {...}, isFailed, isSuccess }
    const data = response.data as Record<string, unknown>
    const actualData = (data.value || data.valueOrDefault || data) as BackendInvoiceRequestResponse

    return actualData
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[getInvoiceRequestDetail] Error:', error)
    }
    return handleApiError(error, `Lấy chi tiết yêu cầu ${requestID} thất bại`)
  }
}

/**
 * Phê duyệt yêu cầu xuất hóa đơn (HOD/Accountant)
 * @param requestID - ID của yêu cầu
 * @param notes - Ghi chú (optional)
 * @returns Updated request
 */
export const approveInvoiceRequest = async (requestID: number, notes?: string): Promise<BackendInvoiceRequestResponse> => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[approveInvoiceRequest] Approving request ${requestID}...`)
    }

    const response = await axios.post<BackendInvoiceRequestResponse>(
      `/api/InvoiceRequest/${requestID}/approve`,
      { notes },
      { headers: getAuthHeaders() },
    )

    if (import.meta.env.DEV) {
      console.log('[approveInvoiceRequest] Success:', response.data)
    }

    return response.data
  } catch (error) {
    return handleApiError(error, `Phê duyệt yêu cầu ${requestID} thất bại`)
  }
}

/**
 * Từ chối yêu cầu xuất hóa đơn (HOD/Accountant)
 * @param requestID - ID của yêu cầu
 * @param reason - Lý do từ chối (required)
 * @returns Request ID
 */
export const rejectInvoiceRequest = async (requestID: number, reason: string): Promise<number> => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[rejectInvoiceRequest] Rejecting request ${requestID}...`)
      console.log('[rejectInvoiceRequest] Reason:', reason)
    }

    // ⚠️ API mới: POST /api/InvoiceRequest/reject
    // Payload: { requestId, rejectReason }
    const response = await axios.post<{
      value: number
      valueOrDefault: number
      isSuccess: boolean
      isFailed: boolean
    }>(
      `/api/InvoiceRequest/reject`,
      {
        requestId: requestID,
        rejectReason: reason,
      },
      { headers: getAuthHeaders() },
    )

    if (import.meta.env.DEV) {
      console.log('[rejectInvoiceRequest] Success:', response.data)
    }

    return response.data.value || response.data.valueOrDefault
  } catch (error) {
    return handleApiError(error, `Từ chối yêu cầu ${requestID} thất bại`)
  }
}

/**
 * Bắt đầu xử lý yêu cầu (Accountant)
 * @param requestID - ID của yêu cầu
 * @returns Updated request
 */
export const processInvoiceRequest = async (requestID: number): Promise<BackendInvoiceRequestResponse> => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[processInvoiceRequest] Processing request ${requestID}...`)
    }

    const response = await axios.post<BackendInvoiceRequestResponse>(`/api/InvoiceRequest/${requestID}/process`, {}, { headers: getAuthHeaders() })

    if (import.meta.env.DEV) {
      console.log('[processInvoiceRequest] Success:', response.data)
    }

    return response.data
  } catch (error) {
    return handleApiError(error, `Bắt đầu xử lý yêu cầu ${requestID} thất bại`)
  }
}

/**
 * Hoàn thành yêu cầu và liên kết hóa đơn (Accountant)
 * @param requestID - ID của yêu cầu
 * @param invoiceID - ID hóa đơn đã tạo
 * @param invoiceNumber - Số hóa đơn đã tạo
 * @returns Updated request
 */
export const completeInvoiceRequest = async (requestID: number, invoiceID: number, invoiceNumber: number): Promise<BackendInvoiceRequestResponse> => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[completeInvoiceRequest] Completing request ${requestID}...`)
    }

    const response = await axios.post<BackendInvoiceRequestResponse>(
      `/api/InvoiceRequest/${requestID}/complete`,
      { invoiceID, invoiceNumber },
      { headers: getAuthHeaders() },
    )

    if (import.meta.env.DEV) {
      console.log('[completeInvoiceRequest] Success:', response.data)
    }

    return response.data
  } catch (error) {
    return handleApiError(error, `Hoàn thành yêu cầu ${requestID} thất bại`)
  }
}

/**
 * Hủy yêu cầu (Sales)
 * @param requestID - ID của yêu cầu
 * @returns Updated request
 */
export const cancelInvoiceRequest = async (requestID: number): Promise<BackendInvoiceRequestResponse> => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[cancelInvoiceRequest] Cancelling request ${requestID}...`)
    }

    const response = await axios.put<BackendInvoiceRequestResponse>(`/api/InvoiceRequest/${requestID}/cancel`, {}, { headers: getAuthHeaders() })

    if (import.meta.env.DEV) {
      console.log('[cancelInvoiceRequest] Success:', response.data)
    }

    return response.data
  } catch (error) {
    return handleApiError(error, `Hủy yêu cầu ${requestID} thất bại`)
  }
}

/**
 * Upload evidence file (PDF) cho yêu cầu xuất hóa đơn
 * @param requestID - ID của yêu cầu
 * @param file - PDF file to upload
 * @returns Updated request
 */
export const uploadEvidenceFile = async (requestID: number, file: File): Promise<BackendInvoiceRequestResponse> => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[uploadEvidenceFile] Uploading file for request ${requestID}...`, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      })
    }

    const formData = new FormData()
    formData.append('pdfFile', file)

    const response = await axios.post<BackendInvoiceRequestResponse>(`/api/InvoiceRequest/${requestID}/upload-evidence`, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    })

    if (import.meta.env.DEV) {
      console.log('[uploadEvidenceFile] Success:', response.data)
    }

    return response.data
  } catch (error) {
    return handleApiError(error, `Upload file thất bại cho yêu cầu ${requestID}`)
  }
}

/**
 * Xem PDF preview của invoice request
 * @param requestID - ID của request
 * @returns PDF blob
 */
export const previewInvoiceRequestPDF = async (requestID: number): Promise<Blob> => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[previewInvoiceRequestPDF] Fetching PDF for request ${requestID}...`)
    }

    const response = await axios.post(`/api/InvoiceRequest/preview-pdf`, null, {
      params: { id: requestID },
      headers: getAuthHeaders(),
      responseType: 'blob',
    })

    if (import.meta.env.DEV) {
      console.log('[previewInvoiceRequestPDF] PDF fetched:', {
        size: response.data.size,
        type: response.data.type,
      })
    }

    return response.data
  } catch (error) {
    return handleApiError(error, `Không thể tải PDF yêu cầu ${requestID}`)
  }
}

/**
 * Interface cho Invoice Preview Payload
 * API: POST /api/Invoice/preview
 * Dùng để xem preview HTML của hóa đơn từ invoice request
 */
export interface InvoicePreviewPayload {
  templateID: number // Cố định -1 (chỉ để xem, không phải hóa đơn thật)
  customerID: number
  taxCode: string
  invoiceStatusID: number // 0 = draft
  companyID: number
  salesID: number
  customerName: string
  address: string
  notes: string
  paymentMethod: string
  items: {
    productId: number
    productName: string
    productCode?: string // ✅ Mã sản phẩm (optional - có thể backend chưa trả)
    unit: string
    quantity: number
    amount: number
    vatAmount: number
  }[]
  amount: number
  taxAmount: number
  totalAmount: number
  performedBy: number | null // null = auto
  invoiceCustomerType?: number | null // 1 = Bán lẻ (B2C), 2 = Doanh nghiệp (B2B)
  minRows: number
  contactEmail: string
  contactPerson: string
  contactPhone: string
}

/**
 * Interface cho Prefill Invoice Response
 * API: GET /api/InvoiceRequest/{id}/prefill_invoice
 * Trả về data đầy đủ để tạo hóa đơn từ request
 */
export interface PrefillInvoiceResponse {
  invoiceData: InvoicePreviewPayload
  requestId: number
}

/**
 * Lấy dữ liệu prefill cho tạo hóa đơn từ Invoice Request
 * @param requestID - ID của request
 * @returns Prefill invoice data
 */
export const getPrefillInvoiceData = async (requestID: number): Promise<PrefillInvoiceResponse> => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[getPrefillInvoiceData] Fetching prefill data for request ${requestID}...`)
    }

    const response = await axios.get<PrefillInvoiceResponse>(`/api/InvoiceRequest/${requestID}/prefill_invoice`, { headers: getAuthHeaders() })

    if (import.meta.env.DEV) {
      console.log('[getPrefillInvoiceData] Prefill data:', response.data)
    }

    return response.data
  } catch (error) {
    return handleApiError(error, `Lấy dữ liệu prefill cho yêu cầu ${requestID} thất bại`)
  }
}

/**
 * Xem HTML preview của invoice request
 * @param requestID - ID của request
 * @returns HTML string
 */
export const previewInvoiceRequestHTML = async (requestID: number): Promise<string> => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[previewInvoiceRequestHTML] Fetching prefill data for request ${requestID}...`)
    }

    // 1. Gọi API prefill_invoice - Trả về ĐẦY ĐỦ data cho invoice preview
    const prefillResponse = await axios.get<PrefillInvoiceResponse>(`/api/InvoiceRequest/${requestID}/prefill_invoice`, { headers: getAuthHeaders() })

    const { invoiceData } = prefillResponse.data

    if (import.meta.env.DEV) {
      console.log('[previewInvoiceRequestHTML] Prefill invoice data:', invoiceData)
    }

    // 2. Set templateID = -1 để preview (backend trả về -1 rồi nhưng đảm bảo)
    const previewPayload: InvoicePreviewPayload = {
      ...invoiceData,
      templateID: -1, // Force preview mode
    }

    if (import.meta.env.DEV) {
      console.log('[previewInvoiceRequestHTML] Preview payload:', previewPayload)
    }

    // 3. Gọi API Invoice preview
    const response = await axios.post<string>(`/api/Invoice/preview`, previewPayload, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      responseType: 'text',
    })

    if (import.meta.env.DEV) {
      console.log('[previewInvoiceRequestHTML] HTML preview fetched:', {
        length: response.data.length,
        type: typeof response.data,
      })
    }

    return response.data
  } catch (error) {
    return handleApiError(error, `Không thể tải preview hóa đơn ${requestID}`)
  }
}

// ==================== INVOICE APIs ====================

/**
 * Tạo hóa đơn mới
 * @param data - Invoice data (đã map qua adapter)
 * @returns Created invoice response
 */
export const createInvoice = async (data: BackendInvoiceRequest): Promise<BackendInvoiceResponse> => {
  try {
    if (import.meta.env.DEV) {
      console.log('[createInvoice] Request:', data)
      console.log('[createInvoice] Request JSON:', JSON.stringify(data, null, 2))
    }

    // ⭐ DEBUGGING: Keep original values from adapter
    const debugData = {
      ...data,
      // ✅ GIỮ NGUYÊN signedBy: 0 - backend có thể không chấp nhận null
      // signedBy: data.signedBy === 0 ? null : data.signedBy,
      // ✅ GIỮ NGUYÊN empty string - không convert sang null
      // contactPerson và notes có thể là empty string
      // Thử bỏ companyID nếu backend tự lấy từ token
      // companyID: undefined,
    }

    if (import.meta.env.DEV) {
      console.log('[createInvoice] Sending modified request:', debugData)
    }

    // ⭐ Thử gửi trực tiếp trước
    let response
    try {
      response = await axios.post<BackendInvoiceResponse>(`/api/Invoice`, debugData, { headers: getAuthHeaders() })
    } catch (firstError) {
      // Nếu lỗi yêu cầu "command" field, thử wrap lại
      if (axios.isAxiosError(firstError) && firstError.response?.status === 400 && JSON.stringify(firstError.response?.data).includes('command')) {
        if (import.meta.env.DEV) {
          console.log('[createInvoice] Retrying with command wrapper...')
        }

        // ⭐ Thử wrap trong object "command"
        response = await axios.post<BackendInvoiceResponse>(`/api/Invoice`, { command: debugData }, { headers: getAuthHeaders() })
      } else {
        throw firstError
      }
    }

    if (import.meta.env.DEV) {
      console.log('[createInvoice] Success:', response.data)
    }
    return response.data
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[createInvoice] Error details:', error)
      if (axios.isAxiosError(error) && error.response) {
        console.error('[createInvoice] Response status:', error.response.status)
        console.error('[createInvoice] Response data:', error.response.data)
        console.error('[createInvoice] Full error response:', JSON.stringify(error.response.data, null, 2))
      }
    }
    return handleApiError(error, 'Create invoice failed')
  }
}

/**
 * Cập nhật hóa đơn đã tạo (Draft hoặc Rejected)
 * API: PUT /api/Invoice/{id}
 *
 * @param invoiceId - ID hóa đơn cần cập nhật
 * @param data - Invoice data (đã map qua adapter)
 * @returns Updated invoice response
 *
 * ⚠️ CHỈ ÁP DỤNG CHO:
 * - Hóa đơn Nháp (status = 1)
 * - Hóa đơn Bị từ chối (status = 16)
 */
export const updateInvoice = async (invoiceId: number, data: BackendInvoiceRequest): Promise<BackendInvoiceResponse> => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[updateInvoice] Updating draft invoice ${invoiceId}`)
      console.log('[updateInvoice] Items count:', data.items?.length)
      console.log('[updateInvoice] Customer ID:', data.customerID)
    }

    // ✅ Convert to draft request (remove fields not needed by /draft endpoint)
    const draftRequest: BackendDraftInvoiceRequest = {
      CustomerID: data.customerID,
      taxCode: data.taxCode,
      customerName: data.customerName,
      address: data.address,
      notes: data.notes,
      paymentMethod: data.paymentMethod,
      items: data.items,
      amount: data.amount,
      taxAmount: data.taxAmount,
      totalAmount: data.totalAmount,
      minRows: data.minRows,
      contactEmail: data.contactEmail,
      contactPerson: data.contactPerson,
      contactPhone: data.contactPhone,
      signedBy: data.performedBy || 0,
    }

    if (import.meta.env.DEV) {
      console.log('[updateInvoice] Draft request:', JSON.stringify(draftRequest, null, 2))
    }

    // ✅ CORRECT ENDPOINT: /api/Invoice/draft/{id}
    const response = await axios.put<BackendInvoiceResponse>(`/api/Invoice/draft/${invoiceId}`, draftRequest, { headers: getAuthHeaders() })

    if (import.meta.env.DEV) {
      console.log('[updateInvoice] ✅ Success:', response.data)
    }

    return response.data
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[updateInvoice] Error details:', error)
      if (axios.isAxiosError(error) && error.response) {
        console.error('[updateInvoice] Response status:', error.response.status)
        console.error('[updateInvoice] Response data:', error.response.data)
      }
    }

    // Handle specific errors
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status
      const errorData = error.response.data

      if (status === 400) {
        const message = errorData?.message || errorData?.title || 'Dữ liệu không hợp lệ'
        throw new Error(message)
      }

      if (status === 404) {
        throw new Error('Không tìm thấy hóa đơn')
      }

      if (status === 403) {
        throw new Error('Không có quyền cập nhật hóa đơn này')
      }

      if (status === 409) {
        throw new Error('Hóa đơn đang ở trạng thái không thể chỉnh sửa')
      }
    }

    return handleApiError(error, 'Cập nhật hóa đơn thất bại')
  }
}

/**
 * Lấy danh sách tất cả hóa đơn
 */
export const getAllInvoices = async (): Promise<InvoiceListItem[]> => {
  try {
    console.log('🔍 [getAllInvoices] Fetching invoices from backend...')

    // Try with pagination parameters to get all records
    const response = await axios.get<InvoiceListItem[]>(`/api/Invoice`, {
      headers: getAuthHeaders(),
      params: {
        // Try common pagination parameters
        pageSize: 1000, // Request large page size
        limit: 1000,
        page: 1,
        pageNumber: 1,
        // Some backends use these
        take: 1000,
        count: 1000,
      },
    })

    console.log('📦 [getAllInvoices] Raw response:', {
      status: response.status,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
      dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : [],
    })

    // Backend may wrap response in object { data: [...] } or { items: [...] }
    let invoicesArray = response.data

    if (!Array.isArray(invoicesArray)) {
      // Try to unwrap common response formats
      if (response.data && typeof response.data === 'object') {
        const dataObj = response.data as unknown as Record<string, unknown>
        invoicesArray = (dataObj.data || dataObj.invoices || dataObj.items || []) as InvoiceListItem[]

        // Log pagination info if exists
        console.log('📊 [getAllInvoices] Pagination info:', {
          totalCount: dataObj.totalCount || dataObj.total || 'N/A',
          page: dataObj.page || dataObj.pageNumber || 'N/A',
          pageSize: dataObj.pageSize || dataObj.limit || 'N/A',
          totalPages: dataObj.totalPages || 'N/A',
        })
      } else {
        invoicesArray = []
      }
    }

    console.log('✅ [getAllInvoices] Returning invoices:', {
      count: invoicesArray.length,
      firstInvoice: invoicesArray[0]?.invoiceNumber || 'N/A',
      lastInvoice: invoicesArray[invoicesArray.length - 1]?.invoiceNumber || 'N/A',
    })

    return invoicesArray
  } catch (error) {
    console.error('❌ [getAllInvoices] Error:', error)
    if (axios.isAxiosError(error)) {
      console.error('❌ [getAllInvoices] Response:', error.response?.data)
    }
    return handleApiError(error, 'Get invoices failed')
  }
}

/**
 * Lấy danh sách hóa đơn được gán cho Sale hiện tại
 * API: GET /api/Invoice/sale-assigned
 *
 * Backend tự động filter theo salesID của user đang login
 * Sale CHỈ xem được hóa đơn của mình (salesID match với currentUserId)
 *
 * @returns Danh sách hóa đơn được gán cho Sale này
 */
export const getSaleAssignedInvoices = async (): Promise<InvoiceListItem[]> => {
  try {
    console.log('🔍 [getSaleAssignedInvoices] Fetching sale-assigned invoices from backend...')

    const response = await axios.get<InvoiceListItem[]>(`/api/Invoice/sale-assigned`, { headers: getAuthHeaders() })

    console.log('📦 [getSaleAssignedInvoices] Raw response:', {
      status: response.status,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
    })

    // Backend trả về array trực tiếp
    let invoicesArray = response.data

    // Handle wrapped response if needed
    if (!Array.isArray(invoicesArray)) {
      if (response.data && typeof response.data === 'object') {
        const dataObj = response.data as unknown as Record<string, unknown>
        invoicesArray = (dataObj.data || dataObj.invoices || dataObj.items || []) as InvoiceListItem[]
      } else {
        invoicesArray = []
      }
    }

    console.log('✅ [getSaleAssignedInvoices] Returning invoices:', {
      count: invoicesArray.length,
      firstInvoice: invoicesArray[0]?.invoiceNumber || 'N/A',
      salesID: invoicesArray[0]?.salesID || 'N/A',
    })

    return invoicesArray
  } catch (error) {
    console.error('❌ [getSaleAssignedInvoices] Error:', error)
    if (axios.isAxiosError(error)) {
      console.error('❌ [getSaleAssignedInvoices] Response:', error.response?.data)
    }
    return handleApiError(error, 'Get sale assigned invoices failed')
  }
}

/**
 * Lấy danh sách hóa đơn cho role Kế toán trưởng (HOD - Head of Department)
 * API: GET /api/Invoice/hodInvoices
 *
 * @returns Danh sách hóa đơn cần xử lý bởi Kế toán trưởng
 */
export const getHODInvoices = async (): Promise<InvoiceListItem[]> => {
  try {
    console.log('🔍 [getHODInvoices] Fetching HOD invoices from backend...')

    // Try with pagination parameters to get all records
    const response = await axios.get<{ items: InvoiceListItem[] }>(`/api/Invoice/hodInvoices`, {
      headers: getAuthHeaders(),
      params: {
        // Try common pagination parameters
        pageSize: 1000,
        limit: 1000,
        page: 1,
        pageNumber: 1,
        take: 1000,
        count: 1000,
      },
    })

    console.log('📦 [getHODInvoices] Raw response:', {
      status: response.status,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : [],
    })

    // Backend trả về format: { items: [...] }
    let invoicesArray: InvoiceListItem[] = []

    if (response.data && typeof response.data === 'object') {
      if (Array.isArray(response.data)) {
        // Nếu response trực tiếp là array
        invoicesArray = response.data
      } else if ('items' in response.data && Array.isArray(response.data.items)) {
        // Nếu response là { items: [...] }
        invoicesArray = response.data.items

        // Log pagination info if exists
        const dataObj = response.data as Record<string, unknown>
        console.log('📊 [getHODInvoices] Pagination info:', {
          totalCount: dataObj.totalCount || dataObj.total || 'N/A',
          page: dataObj.page || dataObj.pageNumber || 'N/A',
          pageSize: dataObj.pageSize || dataObj.limit || 'N/A',
          totalPages: dataObj.totalPages || 'N/A',
        })
      } else if ('data' in response.data && Array.isArray((response.data as Record<string, unknown>).data)) {
        // Nếu response là { data: [...] }
        invoicesArray = (response.data as Record<string, unknown>).data as InvoiceListItem[]
      }
    }

    console.log('✅ [getHODInvoices] Returning invoices:', {
      count: invoicesArray.length,
      firstInvoice: invoicesArray[0]?.invoiceNumber || 'N/A',
      lastInvoice: invoicesArray[invoicesArray.length - 1]?.invoiceNumber || 'N/A',
    })

    return invoicesArray
  } catch (error) {
    console.error('❌ [getHODInvoices] Error:', error)
    if (axios.isAxiosError(error)) {
      console.error('❌ [getHODInvoices] Response:', error.response?.data)
    }
    return handleApiError(error, 'Get HOD invoices failed')
  }
}

/**
 * Lấy chi tiết hóa đơn theo ID
 */
export const getInvoiceById = async (invoiceId: number): Promise<InvoiceListItem> => {
  try {
    const response = await axios.get<InvoiceListItem>(`/api/Invoice/${invoiceId}`, { headers: getAuthHeaders() })
    return response.data
  } catch (error) {
    return handleApiError(error, 'Get invoice failed')
  }
}

/**
 * Tìm hóa đơn theo mã biên bản (minuteCode)
 * Dùng để navigate từ biên bản sang HĐ điều chỉnh/thay thế tương ứng
 *
 * @param minuteCode - Mã biên bản cần tìm
 * @returns Invoice có minuteCode tương ứng hoặc null nếu không tìm thấy
 */
export const getInvoiceByMinuteCode = async (minuteCode: string): Promise<InvoiceListItem | null> => {
  try {
    console.log(`🔍 [getInvoiceByMinuteCode] Searching for invoice with minuteCode: ${minuteCode}`)

    // Lấy tất cả invoices và filter theo minuteCode
    const allInvoices = await getAllInvoices()
    const invoice = allInvoices.find((inv) => inv.minuteCode === minuteCode)

    if (invoice) {
      console.log(`✅ [getInvoiceByMinuteCode] Found invoice:`, {
        invoiceID: invoice.invoiceID,
        invoiceNumber: invoice.invoiceNumber,
        invoiceType: invoice.invoiceType,
        minuteCode: invoice.minuteCode,
      })
      return invoice
    }

    console.log(`⚠️ [getInvoiceByMinuteCode] No invoice found with minuteCode: ${minuteCode}`)
    return null
  } catch (error) {
    console.error(`❌ [getInvoiceByMinuteCode] Error:`, error)
    return null
  }
}

// ==================== UPDATE STATUS REQUEST ====================

/**
 * Request body cho API PATCH /api/Invoice/{id}/status
 */
export interface UpdateInvoiceStatusRequest {
  invoiceId: number
  newStatusId: number
  note?: string // Ghi chú khi chuyển trạng thái (optional)
}

/**
 * Cập nhật trạng thái hóa đơn (API mới - PATCH method)
 * API: PATCH /api/Invoice/{id}/status
 *
 * @param invoiceId - ID hóa đơn
 * @param statusId - Status mới
 * @param note - Ghi chú khi chuyển trạng thái (optional)
 *
 * 🔄 LUỒNG TRẠNG THÁI CHÍNH:
 * 1 (Nháp) → 6 (Chờ duyệt) → 9 (Đã duyệt) → 7 (Chờ ký) → 10 (Đã ký) → 2 (Đã phát hành)
 *
 * Status IDs:
 * - 1: Nháp
 * - 6: Chờ duyệt (Đã gửi cho KTT)
 * - 9: Đã duyệt (KTT đã phê duyệt) ✨ NEW
 * - 7: Chờ ký (Chờ ký số)
 * - 10: Đã ký (Đã ký số thành công) ✨ NEW
 * - 2: Đã phát hành (Hoàn tất)
 * - 3: Bị từ chối (KTT từ chối)
 */
export const updateInvoiceStatus = async (invoiceId: number, statusId: number, note?: string): Promise<void> => {
  try {
    // ✅ Backend API: PATCH /api/Invoice/{id}/status
    // Body: { invoiceId, newStatusId, note? }
    const requestBody: UpdateInvoiceStatusRequest = {
      invoiceId,
      newStatusId: statusId,
    }

    // Chỉ thêm note nếu có
    if (note && note.trim()) {
      requestBody.note = note.trim()
    }

    await axios.patch(`/api/Invoice/${invoiceId}/status`, requestBody, { headers: getAuthHeaders() })

    if (import.meta.env.DEV) {
      console.log(`✅ Updated invoice ${invoiceId} status to ${statusId}`)
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`❌ Failed to update invoice ${invoiceId} status:`, error)
    }
    if (axios.isAxiosError(error) && error.response) {
      // Xử lý lỗi cụ thể
      const status = error.response.status
      const errorData = error.response.data

      if (status === 400) {
        const message = errorData?.message || errorData?.title || 'Không thể cập nhật trạng thái'
        throw new Error(message)
      }
      if (status === 404) {
        throw new Error('Không tìm thấy hóa đơn.')
      }
      if (status === 409) {
        throw new Error('Trạng thái không hợp lệ cho chuyển đổi này.')
      }
    }
    return handleApiError(error, 'Cập nhật trạng thái hóa đơn thất bại')
  }
}

/**
 * Gửi hóa đơn cho kế toán trưởng duyệt
 * Chuyển từ DRAFT (1) → PENDING_APPROVAL (6)
 */
export const sendForApproval = async (invoiceId: number, note?: string): Promise<void> => {
  return updateInvoiceStatus(invoiceId, 6, note || 'Gửi hóa đơn chờ duyệt')
}

/**
 * Kế toán trưởng duyệt hóa đơn
 * Chuyển từ PENDING_APPROVAL (6) → PENDING_SIGN (7)
 */
export const approveInvoice = async (invoiceId: number, approverNote?: string): Promise<void> => {
  return updateInvoiceStatus(invoiceId, 7, approverNote || 'Kế toán trưởng đã duyệt')
}

/**
 * Chuyển hóa đơn sang trạng thái chờ ký
 * ⚠️ DEPRECATED: approveInvoice đã chuyển trực tiếp sang status 7
 * Giữ lại để tương thích ngược nếu cần
 */
export const markPendingSign = async (invoiceId: number): Promise<void> => {
  return updateInvoiceStatus(invoiceId, 7, 'Chuyển sang chờ ký số')
}

/**
 * Đánh dấu hóa đơn đã ký số thành công
 * Chuyển từ PENDING_SIGN (7) → SIGNED (8)
 */
export const markSigned = async (invoiceId: number, signerId?: number): Promise<void> => {
  const note = signerId ? `Đã ký số bởi user ${signerId}` : 'Đã ký số thành công'
  return updateInvoiceStatus(invoiceId, 8, note)
}

/**
 * Kế toán trưởng từ chối hóa đơn
 * Chuyển từ PENDING_APPROVAL (6) → REJECTED (16)
 */
export const rejectInvoice = async (invoiceId: number, reason: string): Promise<void> => {
  if (!reason || !reason.trim()) {
    throw new Error('Vui lòng nhập lý do từ chối')
  }
  return updateInvoiceStatus(invoiceId, 16, `Từ chối: ${reason}`)
}

/**
 * ✅ Gửi lại hóa đơn sau khi bị từ chối
 * Chuyển từ REJECTED (16) → PENDING_APPROVAL (6)
 */
export const resubmitForApproval = async (invoiceId: number): Promise<void> => {
  return updateInvoiceStatus(invoiceId, 6, 'Đã sửa và gửi lại duyệt')
}

/**
 * Hủy hóa đơn (dùng cho PENDING_APPROVAL hoặc PENDING_SIGN)
 * Chuyển về DRAFT (1)
 */
export const cancelInvoice = async (invoiceId: number, reason?: string): Promise<void> => {
  const note = reason ? `Hủy: ${reason}` : 'Đã hủy hóa đơn'
  return updateInvoiceStatus(invoiceId, 1, note)
}

/**
 * Đánh dấu hóa đơn lỗi gửi CQT
 * ⚠️ KHÔNG DÙNG NỮA - Lỗi gửi CQT hiển thị ở cột "Trạng thái CQT", không phải cột "Trạng thái"
 * @deprecated Sử dụng taxStatusID thay vì internal status
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const markSendError = async (_invoiceId: number, _errorMessage?: string): Promise<void> => {
  console.warn('[markSendError] DEPRECATED: Lỗi gửi CQT nên hiển thị ở Tax Status, không phải Internal Status')
  // Giữ hóa đơn ở trạng thái SIGNED (10), chỉ cập nhật Tax Status
  // Backend sẽ xử lý việc update taxApiStatusID
  return Promise.resolve()
}

/**
 * Đánh dấu hóa đơn đã phát hành thành công
 * Chuyển từ SIGNED (8) → ISSUED (2)
 */
export const markIssued = async (invoiceId: number, taxCode?: string): Promise<void> => {
  const note = taxCode ? `Đã phát hành và gửi CQT thành công. Mã CQT: ${taxCode}` : 'Đã phát hành hóa đơn'
  return updateInvoiceStatus(invoiceId, 2, note)
}

/**
 * Phát hành hóa đơn (Issue invoice)
 * ⚠️ Backend logic: CHỈ được phát hành khi hóa đơn ở trạng thái PENDING_SIGN (7 - Chờ ký)
 *
 * ⭐ QUAN TRỌNG: Bước này CẤP SỐ HÓA ĐƠN (invoiceNumber)
 *
 * Luồng đúng:
 *   1. Sign (ký số) → Chưa có số
 *   2. Issue (phát hành) → Backend CẤP SỐ ← ĐÂY!
 *   3. Submit to Tax (gửi CQT) → Có mã CQT
 *
 * @param invoiceId - ID hóa đơn cần phát hành
 * @param issuerId - ID người phát hành (userId)
 * @param paymentMethod - Phương thức thanh toán
 * @param note - Ghi chú
 * @returns Response chứa invoiceNumber đã được cấp
 */
export const issueInvoice = async (
  invoiceId: number,
  issuerId: number,
  paymentMethod: string = 'Tiền mặt',
  note: string = '',
): Promise<InvoiceListItem> => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[issueInvoice] Issuing invoice ${invoiceId} by user ${issuerId}`)
    }

    // ✅ Backend API: POST /api/Invoice/{id}/issue
    // ⭐ Body request theo API spec
    const requestBody = {
      issuerId: issuerId,
      autoCreatePayment: false, // Không tự động tạo payment
      paymentAmount: 0,
      paymentMethod: paymentMethod,
      note: note,
    }

    if (import.meta.env.DEV) {
      console.log('[issueInvoice] Request body:', JSON.stringify(requestBody, null, 2))
    }

    const response = await axios.post<InvoiceListItem>(`/api/Invoice/${invoiceId}/issue`, requestBody, { headers: getAuthHeaders() })

    if (import.meta.env.DEV) {
      console.log('[issueInvoice] ✅ Success - Invoice issued')
      console.log('[issueInvoice] 🔍 FULL Response data:', JSON.stringify(response.data, null, 2))
      console.log(
        '[issueInvoice] Response with invoiceNumber:',
        JSON.stringify(
          {
            invoiceID: response.data.invoiceID,
            invoiceNumber: response.data.invoiceNumber,
            invoiceStatusID: response.data.invoiceStatusID,
          },
          null,
          2,
        ),
      )
    }

    return response.data
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[issueInvoice] Error:', error)
      if (axios.isAxiosError(error)) {
        // Log chi tiết error response
        console.error('[issueInvoice] Error status:', error.response?.status)
        console.error('[issueInvoice] Error data:', error.response?.data)
        console.error('[issueInvoice] Error errors array:', error.response?.data?.errors)
        console.error('[issueInvoice] Error message:', error.response?.data?.message || error.response?.data?.title)
      }
    }
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        const errorData = error.response?.data
        let errorMsg = errorData?.message || errorData?.title || 'Không thể phát hành hoá đơn'

        // Nếu có mảng errors, lấy message chi tiết
        if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const detailedErrors = errorData.errors.join(', ')
          errorMsg = `${errorMsg}\n${detailedErrors}`
        }

        throw new Error(errorMsg)
      }
      if (error.response?.status === 404) {
        throw new Error('Không tìm thấy hoá đơn.')
      }
    }
    return handleApiError(error, 'Phát hành hoá đơn thất bại')
  }
}

/**
 * Ký số hóa đơn
 * ⚠️ Backend logic: CHỈ được ký khi hóa đơn ở trạng thái PENDING_SIGN (7 - Chờ ký)
 * Luồng đúng: PENDING_APPROVAL (6) → Duyệt (approve API) → PENDING_SIGN (7) → Ký (sign API) → ISSUED (2)
 *
 * ⭐ QUAN TRỌNG: Backend tự động cấp invoiceNumber sau khi ký thành công
 *
 * @param invoiceId - ID hóa đơn cần ký
 * @param signerId - ID người ký (userId)
 * @returns Response chứa invoiceNumber mới được cấp
 */
export const signInvoice = async (invoiceId: number, signerId: number): Promise<InvoiceListItem> => {
  try {
    // CRITICAL: Backend needs serial to know which serial to generate invoice number from
    // Step 1: Get invoice to extract templateID and check status
    const invoice = await getInvoiceById(invoiceId)

    if (import.meta.env.DEV) {
      console.log('🔍 [signInvoice] Invoice status check:', {
        invoiceId,
        signerId,
        statusID: invoice.invoiceStatusID,
        invoiceNumber: invoice.invoiceNumber,
        templateID: invoice.templateID,
      })
    }

    // Step 1.5: Check if already signed
    if (invoice.invoiceStatusID === 8) {
      if (import.meta.env.DEV) {
        console.log('⚠️ [signInvoice] Invoice already signed (status=8)')
      }

      // If already signed with invoice number → Success (idempotent)
      if (invoice.invoiceNumber && invoice.invoiceNumber > 0) {
        if (import.meta.env.DEV) {
          console.log('✅ [signInvoice] Invoice already has number:', invoice.invoiceNumber)
        }
        return invoice
      }

      // If signed but no number → This is the inconsistent state we're trying to fix
      // Backend should handle this, but for now we'll try to proceed
      if (import.meta.env.DEV) {
        console.log('⚠️ [signInvoice] Invoice signed but no number - attempting to proceed')
      }

      // Return error to trigger recovery flow in UI
      throw new Error('Hóa đơn đã được ký nhưng chưa có số. Vui lòng liên hệ IT để kiểm tra backend.')
    }

    // Step 2: Get template to extract serial
    const template = await axios.get(`/api/InvoiceTemplate/${invoice.templateID}`, { headers: getAuthHeaders() })

    const serial = template.data.serial

    if (!serial) {
      throw new Error('Template không có serial. Không thể ký hóa đơn.')
    }

    const headers = getAuthHeaders()

    // TRY BOTH: Empty body for status=7, serial body for swagger compatibility
    // Test 1: Try with empty body first (might be what backend expects for fresh sign)
    let requestBody: Record<string, unknown> | undefined = undefined

    console.log('🧪 [signInvoice] Testing with EMPTY body first...')

    // Log request details for debugging
    console.log('🔵 [signInvoice] REQUEST DETAILS:')
    console.log('  Invoice ID:', invoiceId)
    console.log('  Current Status (from GET):', invoice.invoiceStatusID)
    console.log('  Invoice Number:', invoice.invoiceNumber)
    console.log('  Template ID:', invoice.templateID)
    console.log('  Serial:', serial)
    console.log('  URL:', `/api/Invoice/${invoiceId}/sign`)
    console.log('  Method: POST')
    console.log('  Body (attempt 1):', requestBody)
    console.log('  Headers:', headers)
    console.log('🔍 FULL INVOICE OBJECT:', invoice)

    try {
      // Backend API: POST /api/Invoice/{id}/sign
      // Attempt 1: Empty body
      const response = await axios.post(`/api/Invoice/${invoiceId}/sign`, requestBody, { headers })

      console.log('✅ [signInvoice] RESPONSE (empty body worked):', response.status, response.data)

      // Fetch full invoice data after signing
      const fullInvoice = await getInvoiceById(invoiceId)
      return fullInvoice
    } catch (emptyBodyError) {
      console.log('❌ Empty body failed, trying with serial...')

      // Attempt 2: Try with serial in body
      requestBody = { serial }
      console.log('🔵 [signInvoice] REQUEST DETAILS (attempt 2):')
      console.log('  Body (attempt 2):', requestBody)

      const response = await axios.post(`/api/Invoice/${invoiceId}/sign`, requestBody, { headers })

      console.log('✅ [signInvoice] RESPONSE (serial body worked):', response.status, response.data)

      // Fetch full invoice data after signing
      const fullInvoice = await getInvoiceById(invoiceId)
      return fullInvoice
    }
  } catch (error) {
    console.error('[signInvoice] Error:', error)
    if (axios.isAxiosError(error)) {
      // Log chi tiết error response
      console.error('[signInvoice] Error status:', error.response?.status)
      console.error('[signInvoice] Error data:', error.response?.data)
      console.error('[signInvoice] Error errors array:', error.response?.data?.errors)
      console.error('[signInvoice] Error message:', error.response?.data?.message || error.response?.data?.title)

      if (error.response?.status === 400) {
        const errorData = error.response?.data
        let errorMsg = errorData?.message || errorData?.title || 'Không thể ký hoá đơn'

        // Nếu có mảng errors, lấy message chi tiết
        if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const detailedErrors = errorData.errors.join(', ')
          errorMsg = `${errorMsg}\n${detailedErrors}`
        }

        throw new Error(errorMsg)
      }
      if (error.response?.status === 404) {
        throw new Error('Không tìm thấy hoá đơn.')
      }
    }
    return handleApiError(error, 'Ký hoá đơn thất bại')
  }
}

// ============================================================
// 🔐 USB TOKEN SIGNING - Ký số bằng USB Token (LocalSigner)
// ============================================================

/**
 * Interface cho response từ GET /api/Invoice/get-hash
 */
export interface GetHashResponse {
  invoiceId: number
  signedInfoXml: string // SignedInfo XML cần ký
  digestValue: string // Digest value đã tính
}

/**
 * Interface cho request body của POST /api/Invoice/complete_signing
 */
export interface CompleteSigningRequest {
  invoiceId: number
  signatureBase64: string
  certificateBase64: string
}

/**
 * Lấy SignedInfo XML để ký bằng USB Token
 * API: POST /api/Invoice/get-hash
 *
 * @param invoiceId - ID hóa đơn cần ký
 * @returns SignedInfo XML và digestValue
 */
export const getInvoiceHashForSigning = async (invoiceId: number): Promise<GetHashResponse> => {
  try {
    console.log(`[getInvoiceHashForSigning] Getting hash for invoice ${invoiceId}...`)

    const response = await axios.post(`/api/Invoice/get-hash`, { invoiceId }, { headers: getAuthHeaders() })

    // 🔍 DEBUG: Log raw response để xem backend trả về gì
    console.log('🔍 [getInvoiceHashForSigning] Raw response.data:', response.data)
    console.log('🔍 [getInvoiceHashForSigning] Response keys:', Object.keys(response.data))

    // Map response - backend trả về dataToSign thay vì signedInfoXml
    const data = response.data
    const result: GetHashResponse = {
      invoiceId: data.invoiceId || data.InvoiceId || invoiceId,
      // ✅ Backend trả về "dataToSign" - đây là SignedInfo XML cần ký
      signedInfoXml:
        data.dataToSign ||
        data.DataToSign ||
        data.signedInfoXml ||
        data.SignedInfoXml ||
        data.signedInfo ||
        data.SignedInfo ||
        data.data ||
        data.Data,
      digestValue: data.digestValue || data.DigestValue || '',
    }

    console.log('✅ [getInvoiceHashForSigning] Mapped result:', {
      invoiceId: result.invoiceId,
      signedInfoLength: result.signedInfoXml?.length,
      hasSignedInfo: !!result.signedInfoXml,
    })

    if (!result.signedInfoXml) {
      console.error('❌ [getInvoiceHashForSigning] signedInfoXml is empty! Check backend response format.')
      throw new Error('Backend không trả về dữ liệu cần ký (signedInfoXml). Vui lòng kiểm tra API.')
    }

    return result
  } catch (error) {
    console.error('[getInvoiceHashForSigning] Error:', error)
    if (axios.isAxiosError(error)) {
      const errorMsg = error.response?.data?.message || error.response?.data?.title || 'Không thể lấy dữ liệu ký số'
      throw new Error(errorMsg)
    }
    return handleApiError(error, 'Lấy dữ liệu ký số thất bại')
  }
}

/**
 * Hoàn tất ký số bằng USB Token
 * API: POST /api/Invoice/complete_signing
 *
 * Flow:
 * 1. Frontend gọi getInvoiceHashForSigning() → Lấy SignedInfo XML
 * 2. Frontend gọi LocalSigner với SignedInfo → Nhận signature + certificate
 * 3. Frontend gọi completeSigningWithUSB() → Gửi về backend hoàn tất
 *
 * @param request - {invoiceId, signatureBase64, certificateBase64}
 * @returns Invoice đã ký
 */
export const completeSigningWithUSB = async (request: CompleteSigningRequest): Promise<InvoiceListItem> => {
  try {
    console.log(`[completeSigningWithUSB] Completing signing for invoice ${request.invoiceId}...`)
    console.log('  Signature length:', request.signatureBase64.length)
    console.log('  Certificate length:', request.certificateBase64.length)

    const response = await axios.post(`/api/Invoice/complete_signing`, request, { headers: getAuthHeaders() })

    console.log('✅ [completeSigningWithUSB] Success:', response.data)

    // Fetch full invoice data after signing
    const fullInvoice = await getInvoiceById(request.invoiceId)
    return fullInvoice
  } catch (error) {
    console.error('[completeSigningWithUSB] Error:', error)
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data
      let errorMsg = errorData?.message || errorData?.title || 'Hoàn tất ký số thất bại'

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        errorMsg = `${errorMsg}\n${errorData.errors.join(', ')}`
      }

      throw new Error(errorMsg)
    }
    return handleApiError(error, 'Hoàn tất ký số thất bại')
  }
}

/**
 * Gửi hóa đơn lên cơ quan thuế (Submit to Tax Authority)
 * API: POST /api/Tax/submit?invoiceId={id}
 * @param invoiceId - ID hóa đơn cần gửi
 * @returns Mã cơ quan thuế (taxAuthorityCode) nếu thành công
 */
export const submitToTaxAuthority = async (invoiceId: number): Promise<string> => {
  try {
    console.log(`[submitToTaxAuthority] Submitting invoice ${invoiceId} to tax authority`)

    // ✅ Backend API: POST /api/Tax/submit?invoiceId={id}
    const response = await axios.post(
      `/api/Tax/submit?invoiceId=${invoiceId}`,
      null, // Empty body theo curl
      { headers: getAuthHeaders() },
    )

    console.log('[submitToTaxAuthority] ✅ Success - Invoice submitted to tax authority')
    console.log('[submitToTaxAuthority] Response:', response.data)

    // Trả về mã CQT từ response (có thể là response.data.taxAuthorityCode hoặc response.data)
    const taxCode = response.data?.taxAuthorityCode || response.data?.code || response.data
    return taxCode
  } catch (error) {
    console.error('[submitToTaxAuthority] Error:', error)
    if (axios.isAxiosError(error)) {
      console.error('[submitToTaxAuthority] Error status:', error.response?.status)
      console.error('[submitToTaxAuthority] Error data:', error.response?.data)

      if (error.response?.status === 400) {
        const errorData = error.response?.data
        let errorMsg = errorData?.message || errorData?.title || 'Không thể gửi lên cơ quan thuế'

        if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const detailedErrors = errorData.errors.join(', ')
          errorMsg = `${errorMsg}: ${detailedErrors}`
        }

        throw new Error(errorMsg)
      }
      if (error.response?.status === 404) {
        throw new Error('Không tìm thấy hóa đơn')
      }
    }
    throw error
  }
}

// ==================== EMAIL ====================

/**
 * Send invoice via email
 * POST /api/Email/{id}/send-email
 *
 * ⚠️ QUAN TRỌNG: API này KHÔNG NÊN thay đổi trạng thái hóa đơn
 * Chỉ gửi email thông báo cho khách hàng, không ảnh hưởng đến invoice status
 *
 * @param invoiceId - ID of invoice to send
 * @param request - Email data (recipient, cc, bcc, attachments, etc.)
 * @returns Response with success status and sent info
 */
export const sendInvoiceEmail = async (invoiceId: number, request: SendInvoiceEmailRequest): Promise<SendInvoiceEmailResponse> => {
  try {
    const response = await axios.post<SendInvoiceEmailResponse>(API_CONFIG.ENDPOINTS.INVOICE.SEND_EMAIL(invoiceId), request, {
      headers: getAuthHeaders(),
    })

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error('Không tìm thấy hóa đơn')
      }
      if (error.response?.status === 400) {
        const message = error.response.data?.message || 'Dữ liệu gửi email không hợp lệ'
        throw new Error(message)
      }
      // Network hoặc server errors
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        throw new Error('Không thể kết nối đến server email')
      }
    }
    throw error
  }
}

// ==================== INVOICE PREVIEW & LOOKUP ====================

/**
 * ⭐ Preview invoice before creating
 * POST /api/Invoice/preview
 *
 * Use case:
 * - Preview invoice với template trước khi save
 * - Validate invoice data
 * - Show preview modal to user
 *
 * @param data - Invoice data (same as create invoice)
 * @returns Preview HTML or validation result
 */
export const previewInvoice = async (data: BackendInvoiceRequest): Promise<{ html: string; isValid: boolean; errors?: string[] }> => {
  try {
    const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVOICE.PREVIEW}`, data, { headers: getAuthHeaders() })

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        const message = error.response.data?.message || 'Dữ liệu hóa đơn không hợp lệ'
        throw new Error(message)
      }
    }
    throw error
  }
}

/**
 * ⭐ Public invoice lookup (no authentication required)
 * GET /api/Invoice/lookup/{lookupCode}
 *
 * Use case:
 * - Khách hàng tra cứu hóa đơn qua QR code
 * - Public invoice verification
 * - Customer portal
 *
 * @param lookupCode - Unique lookup code from QR or email
 * @returns Public invoice information
 */
export const lookupInvoice = async (
  lookupCode: string,
): Promise<{
  invoiceNumber: string
  invoiceDate: string
  customerName: string
  totalAmount: number
  status: string
  qrCodeUrl?: string
  pdfUrl?: string
}> => {
  try {
    // No auth headers - public endpoint
    const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVOICE.LOOKUP(lookupCode)}`)

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error('Không tìm thấy hóa đơn với mã tra cứu này')
      }
    }
    throw error
  }
}

/**
 * Get original invoice (before adjustment)
 * GET /api/Invoice/{id}/original
 *
 * Use case:
 * - View original invoice when viewing adjusted invoice
 * - Compare original vs adjusted
 *
 * @param invoiceId - Adjusted invoice ID
 * @returns Original invoice data
 */
export const getOriginalInvoice = async (invoiceId: number): Promise<BackendInvoiceResponse> => {
  try {
    const response = await axios.get<BackendInvoiceResponse>(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVOICE.GET_ORIGINAL(invoiceId)}`, {
      headers: getAuthHeaders(),
    })

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error('Không tìm thấy hóa đơn gốc')
      }
    }
    throw error
  }
}

// ==================== ADJUSTMENT INVOICE API ====================

/**
 * Request body cho tạo hóa đơn điều chỉnh
 * API: POST /api/Invoice/adjustment
 * Updated: 25/01/2026
 */
export interface CreateAdjustmentInvoiceRequest {
  originalInvoiceId: number // ✅ ID hóa đơn gốc
  templateId: number // ✅ ID template
  invoiceStatusId: number // ✅ Trạng thái hóa đơn (6=PENDING_APPROVAL, 7=PENDING_SIGN)
  adjustmentReason: string // ✅ Lý do điều chỉnh
  minuteCode?: string // ✅ Mã biên bản đã thỏa thuận (optional)
  adjustmentItems: Array<{
    productID: number // ✅ ID sản phẩm
    quantity: number // ✅ Số lượng (có thể âm)
    unitPrice: number // ✅ Đơn giá (có thể âm)
    overrideVATRate?: number // ✅ Thuế suất VAT tùy chỉnh (optional)
  }>
}

/**
 * Response từ API tạo hóa đơn điều chỉnh
 */
export interface CreateAdjustmentInvoiceResponse {
  success: boolean
  message: string
  invoiceId?: number | { value?: number; invoiceID?: number } // ⚠️ Backend có thể trả về object hoặc number
  invoiceNumber?: string
  invoiceSerial?: string
  fullInvoiceCode?: string
  totalAmount?: number
  adjustmentAmount?: number
}

/**
 * Tạo hóa đơn điều chỉnh
 * API: POST /api/Invoice/adjustment
 *
 * @param data - Dữ liệu hóa đơn điều chỉnh
 * @returns Response với invoice ID và thông tin
 */
export const createAdjustmentInvoice = async (data: CreateAdjustmentInvoiceRequest): Promise<CreateAdjustmentInvoiceResponse> => {
  try {
    console.log('[createAdjustmentInvoice] Request:', data)
    console.log('[createAdjustmentInvoice] Request JSON:', JSON.stringify(data, null, 2))

    const response = await axios.post<CreateAdjustmentInvoiceResponse>(`/api/Invoice/adjustment`, data, { headers: getAuthHeaders() })

    console.log('[createAdjustmentInvoice] ✅ Success:', response.data)
    return response.data
  } catch (error) {
    console.error('[createAdjustmentInvoice] ❌ Error:', error)

    if (axios.isAxiosError(error) && error.response) {
      console.error('[createAdjustmentInvoice] Response status:', error.response.status)
      console.error('[createAdjustmentInvoice] Response data:', error.response.data)
      console.error('[createAdjustmentInvoice] Full error response:', JSON.stringify(error.response.data, null, 2))
    }

    return handleApiError(error, 'Tạo hóa đơn điều chỉnh thất bại')
  }
}

// ==================== EXPORTS ====================

// ==================== PREVIEW & EXPORT APIs (Using existing backend) ====================

/**
 * Get HTML preview of issued invoice
 * API: GET /api/Invoice/preview-by-invoice/{id}
 * Use case: Quick view in modal, print preview, email inline content
 * @param invoiceId - ID của hóa đơn đã phát hành
 * @returns HTML string của hóa đơn
 */
export const getInvoiceHTML = async (invoiceId: number): Promise<string> => {
  try {
    console.log(`[getInvoiceHTML] Fetching HTML preview for invoice ${invoiceId}`)

    const response = await axios.get(`/api/Invoice/preview-by-invoice/${invoiceId}`, {
      headers: getAuthHeaders(),
      responseType: 'text',
    })

    console.log('[getInvoiceHTML] ✅ HTML preview loaded successfully')
    return response.data
  } catch (error) {
    console.error('[getInvoiceHTML] Error:', error)
    return handleApiError(error, 'Không thể tải preview hóa đơn')
  }
}

/**
 * Download PDF of issued invoice
 * API: GET /api/Invoice/{id}/pdf
 * Use case: User download, email attachment, archive
 * @param invoiceId - ID của hóa đơn
 * @returns PDF file as Blob
 */
export const downloadInvoicePDF = async (invoiceId: number): Promise<Blob> => {
  try {
    console.log(`[downloadInvoicePDF] Downloading PDF for invoice ${invoiceId}`)

    const response = await axios.get(`/api/Invoice/${invoiceId}/pdf`, {
      headers: getAuthHeaders(),
      responseType: 'blob',
    })

    console.log('[downloadInvoicePDF] ✅ PDF downloaded successfully')
    return response.data
  } catch (error) {
    console.error('[downloadInvoicePDF] Error:', error)
    return handleApiError(error, 'Không thể tải PDF hóa đơn')
  }
}

/**
 * Helper: Open invoice HTML in new window for printing
 * Use case: Quick print without download
 */
export const printInvoiceHTML = async (invoiceId: number): Promise<void> => {
  try {
    const html = await getInvoiceHTML(invoiceId)

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Popup bị chặn. Vui lòng cho phép popup để in hóa đơn.')
    }

    printWindow.document.write(html)
    printWindow.document.close()

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print()
    }

    console.log('[printInvoiceHTML] ✅ Print window opened')
  } catch (error) {
    console.error('[printInvoiceHTML] Error:', error)
    throw error
  }
}

/**
 * Helper: Download PDF with proper filename
 * Use case: Save PDF to user's computer
 */
export const saveInvoicePDF = async (invoiceId: number, invoiceNumber?: string | number): Promise<void> => {
  try {
    const blob = await downloadInvoicePDF(invoiceId)

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // Format filename
    const filename = invoiceNumber ? `HoaDon_${String(invoiceNumber).padStart(7, '0')}.pdf` : `HoaDon_${invoiceId}.pdf`
    link.download = filename

    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Cleanup
    window.URL.revokeObjectURL(url)

    console.log(`[saveInvoicePDF] ✅ PDF saved as ${filename}`)
  } catch (error) {
    console.error('[saveInvoicePDF] Error:', error)
    throw error
  }
}

/**
 * Tạo hóa đơn thay thế
 * API: POST /api/Invoice/replacement
 *
 * ⚠️ QUAN TRỌNG - Luồng tự động của Backend:
 * 1. Tạo hóa đơn mới với invoiceType = 3 (REPLACEMENT)
 * 2. Set originalInvoiceID = ID hóa đơn gốc
 * 3. Lưu replacementReason vào hóa đơn mới
 * 4. ⭐ TỰ ĐỘNG UPDATE hóa đơn gốc: invoiceStatusID = 5 (REPLACED - "Đã thay thế")
 * 5. Hóa đơn gốc sau khi bị thay thế sẽ không thể:
 *    - Chỉnh sửa
 *    - Ký số
 *    - Gửi CQT
 *    - Thực hiện bất kỳ thao tác nào
 *
 * @param originalInvoiceId - ID hóa đơn gốc cần thay thế
 * @param reason - Lý do thay thế (bắt buộc, tối thiểu 10 ký tự)
 * @param data - Invoice data mới (đã map qua adapter)
 * @param minuteCode - Mã biên bản đã thỏa thuận (optional)
 * @returns Created replacement invoice response
 */
export const createReplacementInvoice = async (
  originalInvoiceId: number,
  reason: string,
  data: BackendInvoiceRequest,
  minuteCode?: string,
): Promise<BackendInvoiceResponse> => {
  try {
    const payload = {
      originalInvoiceId,
      reason,
      ...(minuteCode && { minuteCode }), // ✅ Mã biên bản (optional)
      ...data,
    }

    if (import.meta.env.DEV) {
      console.log('[createReplacementInvoice] Request:', payload)
    }

    const response = await axios.post<BackendInvoiceResponse>(`/api/Invoice/replacement`, payload, { headers: getAuthHeaders() })

    if (import.meta.env.DEV) {
      console.log('[createReplacementInvoice] Success:', response.data)
    }
    return response.data
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[createReplacementInvoice] Error:', error)
      if (axios.isAxiosError(error) && error.response) {
        console.error('[createReplacementInvoice] Response:', error.response.data)
      }
    }
    return handleApiError(error, 'Create replacement invoice failed')
  }
}

const invoiceService = {
  // Templates
  getAllTemplates,
  getActiveTemplates,

  // Invoices
  createInvoice,
  updateInvoice, // ✅ Export updateInvoice function
  getAllInvoices,
  getHODInvoices, // ✅ NEW: API cho role Kế toán trưởng
  getSaleAssignedInvoices, // ✅ NEW: API cho role Sale - filtered by backend
  getInvoiceById,
  getInvoiceByMinuteCode, // ✅ NEW: Tìm invoice theo mã biên bản

  // Adjustment Invoice ✨ NEW
  createAdjustmentInvoice,

  // Replacement Invoice ✨ NEW
  createReplacementInvoice,

  // Status Management (New PATCH API)
  updateInvoiceStatus,
  sendForApproval, // 1 → 6
  approveInvoice, // 6 → 9 ✨ NEW
  markPendingSign, // 9 → 7 ✨ NEW
  markSigned, // 7 → 10 ✨ NEW
  rejectInvoice, // 6 → 16 ✅ Từ chối duyệt
  resubmitForApproval, // ✅ 16 → 6 Gửi lại duyệt
  cancelInvoice, // 6/7 → 1 ✨ NEW
  markIssued, // 10 → 2

  // Sign & Issue
  issueInvoice,
  signInvoice,

  // USB Token Signing 🔐 NEW
  getInvoiceHashForSigning, // Lấy SignedInfo XML
  completeSigningWithUSB, // Gửi signature về backend

  // Tax Authority
  submitToTaxAuthority,

  // Email
  sendInvoiceEmail,

  // Preview & Lookup ⭐ NEW
  previewInvoice,
  lookupInvoice,
  getOriginalInvoice,

  // Preview & Export
  getInvoiceHTML,
  downloadInvoicePDF,
  printInvoiceHTML,
  saveInvoicePDF,

  // Invoice Request Prefill
  getPrefillInvoiceData,
}

export default invoiceService
