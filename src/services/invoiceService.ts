/**
 * Invoice Service - API calls for invoice management
 */

import axios from 'axios';
import API_CONFIG from '@/config/api.config';
import type { BackendInvoiceRequest, BackendInvoiceResponse } from '@/utils/invoiceAdapter';

// ==================== TYPES ====================

export interface Template {
  templateID: number;
  templateName: string;
  serial: string;
  templateTypeName: string;
  frameUrl: string;
  isActive: boolean;
}

// Backend invoice response từ GET /api/Invoice
export interface InvoiceListItem {
  invoiceID: number;
  templateID: number;
  invoiceNumber: number;
  invoiceStatusID: number;
  companyId: number;
  customerID: number;
  issuerID: number;
  signDate: string;
  paymentDueDate: string | null;
  subtotalAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string;
  totalAmountInWords: string;
  digitalSignature: string | null;
  taxAuthorityCode: string | null;
  taxApiStatusID: number | null;        // ✅ ID trạng thái CQT (từ TaxApiStatus)
  taxStatusCode: string | null;         // ✅ Mã trạng thái (PENDING, TB01, KQ01, etc.)
  taxStatusName: string | null;         // ✅ Tên trạng thái hiển thị
  qrCodeData: string | null;
  notes: string | null;
  filePath: string | null;
  xmlPath: string | null;
  createdAt: string;
  invoiceItems: InvoiceItemResponse[];
  contactPerson?: string;        // ✅ Họ tên người mua hàng (buyerName)
  contactEmail?: string;         // Email liên hệ
  contactPhone?: string;         // SĐT liên hệ
}

export interface InvoiceItemResponse {
  productId: number;
  productName: string | null;
  unit: string | null;
  quantity: number;
  amount: number;
  vatAmount: number;
}

// Invoice status mapping
export const INVOICE_STATUS: Record<number, string> = {
  1: 'Đã tạo',
  2: 'Đã ký',
  3: 'Đã gửi',
  4: 'Đã hủy',
};

// Legacy interface - giữ cho tương thích
export interface Invoice {
  invoiceID: number;
  invoiceNumber: string;
  templateID: number;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

// ==================== HELPER FUNCTIONS ====================

const getAuthToken = (): string | null => {
  return localStorage.getItem(API_CONFIG.TOKEN_KEY);
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const handleApiError = (error: unknown, context: string): never => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data?.detail || error.message;
    
    if (status === 401) {
      localStorage.removeItem(API_CONFIG.TOKEN_KEY);
      window.location.href = '/auth/login';
      throw new Error('Session expired. Please login again.');
    }
    
    throw new Error(`${context}: ${message}`);
  }
  throw new Error(`${context}: ${String(error)}`);
};

// ==================== TEMPLATE APIs ====================

export const getAllTemplates = async (): Promise<Template[]> => {
  try {
    const response = await axios.get(
      `/api/InvoiceTemplate`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Get all templates failed');
  }
};

export const getActiveTemplates = async (): Promise<Template[]> => {
  try {
    const templates = await getAllTemplates();
    return templates.filter(t => t.isActive);
  } catch (error) {
    return handleApiError(error, 'Get active templates failed');
  }
};

// ==================== INVOICE APIs ====================

/**
 * Tạo hóa đơn mới
 * @param data - Invoice data (đã map qua adapter)
 * @returns Created invoice response
 */
export const createInvoice = async (data: BackendInvoiceRequest): Promise<BackendInvoiceResponse> => {
  try {
    console.log('[createInvoice] Request:', data);
    console.log('[createInvoice] Request JSON:', JSON.stringify(data, null, 2));
    
    // ⭐ DEBUGGING: Thử với signedBy = null thay vì 0
    const debugData = {
      ...data,
      signedBy: data.signedBy === 0 ? null : data.signedBy,
      // Thử bỏ companyID nếu backend tự lấy từ token
      // companyID: undefined,
    };
    
    console.log('[createInvoice] Sending modified request:', debugData);
    
    // ⭐ Thử gửi trực tiếp trước
    let response;
    try {
      response = await axios.post<BackendInvoiceResponse>(
        `/api/Invoice`,
        debugData,
        { headers: getAuthHeaders() }
      );
    } catch (firstError) {
      // Nếu lỗi yêu cầu "command" field, thử wrap lại
      if (axios.isAxiosError(firstError) && 
          firstError.response?.status === 400 && 
          JSON.stringify(firstError.response?.data).includes('command')) {
        console.log('[createInvoice] Retrying with command wrapper...');
        
        // ⭐ Thử wrap trong object "command"
        response = await axios.post<BackendInvoiceResponse>(
          `/api/Invoice`,
          { command: debugData },
          { headers: getAuthHeaders() }
        );
      } else {
        throw firstError;
      }
    }
    
    console.log('[createInvoice] Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('[createInvoice] Error details:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('[createInvoice] Response status:', error.response.status);
      console.error('[createInvoice] Response data:', error.response.data);
      console.error('[createInvoice] Full error response:', JSON.stringify(error.response.data, null, 2));
    }
    return handleApiError(error, 'Create invoice failed');
  }
};

/**
 * Lấy danh sách tất cả hóa đơn
 */
export const getAllInvoices = async (): Promise<InvoiceListItem[]> => {
  try {
    const response = await axios.get<InvoiceListItem[]>(
      `/api/Invoice`,
      { headers: getAuthHeaders() }
    );
    
    // Backend may wrap response in object { data: [...] } or { items: [...] }
    let invoicesArray = response.data;
    
    if (!Array.isArray(invoicesArray)) {
      // Try to unwrap common response formats
      if (response.data && typeof response.data === 'object') {
        invoicesArray = (response.data as any).data || 
                       (response.data as any).invoices || 
                       (response.data as any).items || 
                       [];
      } else {
        invoicesArray = [];
      }
    }
    
    return invoicesArray;
  } catch (error) {
    console.error('[getAllInvoices] Error:', error);
    return handleApiError(error, 'Get invoices failed');
  }
};

/**
 * Lấy chi tiết hóa đơn theo ID
 */
export const getInvoiceById = async (invoiceId: number): Promise<InvoiceListItem> => {
  try {
    const response = await axios.get<InvoiceListItem>(
      `/api/Invoice/${invoiceId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Get invoice failed');
  }
};

// ==================== UPDATE STATUS REQUEST ====================

/**
 * Request body cho API PATCH /api/Invoice/{id}/status
 */
export interface UpdateInvoiceStatusRequest {
  invoiceId: number;
  newStatusId: number;
  note?: string; // Ghi chú khi chuyển trạng thái (optional)
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
export const updateInvoiceStatus = async (
  invoiceId: number, 
  statusId: number, 
  note?: string
): Promise<void> => {
  try {
    console.log(`[updateInvoiceStatus] Updating invoice ${invoiceId} to status ${statusId}`);
    if (note) {
      console.log(`[updateInvoiceStatus] Note: ${note}`);
    }
    
    // ✅ Backend API: PATCH /api/Invoice/{id}/status
    // Body: { invoiceId, newStatusId, note? }
    const requestBody: UpdateInvoiceStatusRequest = {
      invoiceId,
      newStatusId: statusId,
    };
    
    // Chỉ thêm note nếu có
    if (note && note.trim()) {
      requestBody.note = note.trim();
    }
    
    await axios.patch(
      `/api/Invoice/${invoiceId}/status`,
      requestBody,
      { headers: getAuthHeaders() }
    );
    
    console.log('[updateInvoiceStatus] ✅ Success - Status updated');
  } catch (error) {
    console.error('[updateInvoiceStatus] Error:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('[updateInvoiceStatus] Response data:', error.response.data);
      
      // Xử lý lỗi cụ thể
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 400) {
        const message = errorData?.message || errorData?.title || 'Không thể cập nhật trạng thái';
        throw new Error(message);
      }
      if (status === 404) {
        throw new Error('Không tìm thấy hóa đơn.');
      }
      if (status === 409) {
        throw new Error('Trạng thái không hợp lệ cho chuyển đổi này.');
      }
    }
    return handleApiError(error, 'Cập nhật trạng thái hóa đơn thất bại');
  }
};

/**
 * Gửi hóa đơn cho kế toán trưởng duyệt
 * Chuyển từ DRAFT (1) → PENDING_APPROVAL (6)
 */
export const sendForApproval = async (invoiceId: number, note?: string): Promise<void> => {
  return updateInvoiceStatus(invoiceId, 6, note || 'Gửi hóa đơn chờ duyệt');
};

/**
 * Kế toán trưởng duyệt hóa đơn
 * Chuyển từ PENDING_APPROVAL (6) → APPROVED (9) ✨ NEW
 */
export const approveInvoice = async (invoiceId: number, approverNote?: string): Promise<void> => {
  return updateInvoiceStatus(invoiceId, 9, approverNote || 'Kế toán trưởng đã duyệt');
};

/**
 * Chuyển hóa đơn sang trạng thái chờ ký
 * Chuyển từ APPROVED (9) → PENDING_SIGN (7)
 * Thường tự động sau khi duyệt
 */
export const markPendingSign = async (invoiceId: number): Promise<void> => {
  return updateInvoiceStatus(invoiceId, 7, 'Chuyển sang chờ ký số');
};

/**
 * Đánh dấu hóa đơn đã ký số thành công
 * Chuyển từ PENDING_SIGN (7) → SIGNED (10) ✨ NEW
 */
export const markSigned = async (invoiceId: number, signerId?: number): Promise<void> => {
  const note = signerId 
    ? `Đã ký số bởi user ${signerId}` 
    : 'Đã ký số thành công';
  return updateInvoiceStatus(invoiceId, 10, note);
};

/**
 * Kế toán trưởng từ chối hóa đơn
 * Chuyển từ PENDING_APPROVAL (6) → CANCELLED (3)
 */
export const rejectInvoice = async (invoiceId: number, reason: string): Promise<void> => {
  if (!reason || !reason.trim()) {
    throw new Error('Vui lòng nhập lý do từ chối');
  }
  return updateInvoiceStatus(invoiceId, 3, `Từ chối: ${reason}`);
};

/**
 * Hủy hóa đơn (dùng cho PENDING_APPROVAL hoặc PENDING_SIGN)
 * Chuyển về DRAFT (1)
 */
export const cancelInvoice = async (invoiceId: number, reason?: string): Promise<void> => {
  const note = reason ? `Hủy: ${reason}` : 'Đã hủy hóa đơn';
  return updateInvoiceStatus(invoiceId, 1, note);
};

/**
 * Đánh dấu hóa đơn lỗi gửi CQT
 * ⚠️ KHÔNG DÙNG NỮA - Lỗi gửi CQT hiển thị ở cột "Trạng thái CQT", không phải cột "Trạng thái"
 * @deprecated Sử dụng taxStatusID thay vì internal status
 */
export const markSendError = async (invoiceId: number, errorMessage?: string): Promise<void> => {
  console.warn('[markSendError] DEPRECATED: Lỗi gửi CQT nên hiển thị ở Tax Status, không phải Internal Status');
  // Giữ hóa đơn ở trạng thái SIGNED (10), chỉ cập nhật Tax Status
  // Backend sẽ xử lý việc update taxApiStatusID
  return Promise.resolve();
};

/**
 * Đánh dấu hóa đơn đã phát hành thành công
 * Chuyển từ SIGNED (10) → ISSUED (2)
 */
export const markIssued = async (invoiceId: number, taxCode?: string): Promise<void> => {
  const note = taxCode 
    ? `Đã phát hành và gửi CQT thành công. Mã CQT: ${taxCode}` 
    : 'Đã phát hành hóa đơn';
  return updateInvoiceStatus(invoiceId, 2, note);
};

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
  note: string = ''
): Promise<InvoiceListItem> => {
  try {
    console.log(`[issueInvoice] Issuing invoice ${invoiceId} by user ${issuerId}`);
    
    // ✅ Backend API: POST /api/Invoice/{id}/issue
    // ⭐ Body request theo API spec
    const requestBody = {
      issuerId: issuerId,
      autoCreatePayment: false,  // Không tự động tạo payment
      paymentAmount: 0,
      paymentMethod: paymentMethod,
      note: note
    };
    
    console.log('[issueInvoice] Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await axios.post<InvoiceListItem>(
      `/api/Invoice/${invoiceId}/issue`,
      requestBody,
      { headers: getAuthHeaders() }
    );
    
    console.log('[issueInvoice] ✅ Success - Invoice issued');
    console.log('[issueInvoice] 🔍 FULL Response data:', JSON.stringify(response.data, null, 2));
    console.log('[issueInvoice] Response with invoiceNumber:', JSON.stringify({
      invoiceID: response.data.invoiceID,
      invoiceNumber: response.data.invoiceNumber,
      invoiceStatusID: response.data.invoiceStatusID
    }, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('[issueInvoice] Error:', error);
    if (axios.isAxiosError(error)) {
      // Log chi tiết error response
      console.error('[issueInvoice] Error status:', error.response?.status);
      console.error('[issueInvoice] Error data:', error.response?.data);
      console.error('[issueInvoice] Error errors array:', error.response?.data?.errors);
      console.error('[issueInvoice] Error message:', error.response?.data?.message || error.response?.data?.title);
      
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        let errorMsg = errorData?.message || errorData?.title || 'Không thể phát hành hoá đơn';
        
        // Nếu có mảng errors, lấy message chi tiết
        if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const detailedErrors = errorData.errors.join(', ');
          errorMsg = `${errorMsg}\n${detailedErrors}`;
        }
        
        throw new Error(errorMsg);
      }
      if (error.response?.status === 404) {
        throw new Error('Không tìm thấy hoá đơn.');
      }
    }
    return handleApiError(error, 'Phát hành hoá đơn thất bại');
  }
};

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
    const invoice = await getInvoiceById(invoiceId);
    
    console.log('🔍 [signInvoice] Invoice status check:', {
      invoiceId,
      statusID: invoice.invoiceStatusID,
      invoiceNumber: invoice.invoiceNumber,
      templateID: invoice.templateID
    });
    
    // Step 1.5: Check if already signed
    if (invoice.invoiceStatusID === 8) {
      console.log('⚠️ [signInvoice] Invoice already signed (status=8)');
      
      // If already signed with invoice number → Success (idempotent)
      if (invoice.invoiceNumber && invoice.invoiceNumber > 0) {
        console.log('✅ [signInvoice] Invoice already has number:', invoice.invoiceNumber);
        return invoice;
      }
      
      // If signed but no number → This is the inconsistent state we're trying to fix
      // Backend should handle this, but for now we'll try to proceed
      console.log('⚠️ [signInvoice] Invoice signed but no number - attempting to proceed');
      
      // Return error to trigger recovery flow in UI
      throw new Error('Hóa đơn đã được ký nhưng chưa có số. Vui lòng liên hệ IT để kiểm tra backend.');
    }
    
    // Step 2: Get template to extract serial
    const template = await axios.get(
      `/api/InvoiceTemplate/${invoice.templateID}`,
      { headers: getAuthHeaders() }
    );
    
    const serial = template.data.serial;
    
    if (!serial) {
      throw new Error('Template không có serial. Không thể ký hóa đơn.');
    }
    
    const headers = getAuthHeaders();
    
    // TRY BOTH: Empty body for status=7, serial body for swagger compatibility
    // Test 1: Try with empty body first (might be what backend expects for fresh sign)
    let requestBody: any = undefined;
    
    console.log('🧪 [signInvoice] Testing with EMPTY body first...');
    
    // Log request details for debugging
    console.log('🔵 [signInvoice] REQUEST DETAILS:');
    console.log('  Invoice ID:', invoiceId);
    console.log('  Current Status (from GET):', invoice.invoiceStatusID);
    console.log('  Invoice Number:', invoice.invoiceNumber);
    console.log('  Template ID:', invoice.templateID);
    console.log('  Serial:', serial);
    console.log('  URL:', `/api/Invoice/${invoiceId}/sign`);
    console.log('  Method: POST');
    console.log('  Body (attempt 1):', requestBody);
    console.log('  Headers:', headers);
    console.log('🔍 FULL INVOICE OBJECT:', invoice);
    
    try {
      // Backend API: POST /api/Invoice/{id}/sign
      // Attempt 1: Empty body
      const response = await axios.post(
        `/api/Invoice/${invoiceId}/sign`,
        requestBody,
        { headers }
      );
      
      console.log('✅ [signInvoice] RESPONSE (empty body worked):', response.status, response.data);
      
      // Fetch full invoice data after signing
      const fullInvoice = await getInvoiceById(invoiceId);
      return fullInvoice;
    } catch (emptyBodyError) {
      console.log('❌ Empty body failed, trying with serial...');
      
      // Attempt 2: Try with serial in body
      requestBody = { serial };
      console.log('🔵 [signInvoice] REQUEST DETAILS (attempt 2):');
      console.log('  Body (attempt 2):', requestBody);
      
      const response = await axios.post(
        `/api/Invoice/${invoiceId}/sign`,
        requestBody,
        { headers }
      );
      
      console.log('✅ [signInvoice] RESPONSE (serial body worked):', response.status, response.data);
      
      // Fetch full invoice data after signing
      const fullInvoice = await getInvoiceById(invoiceId);
      return fullInvoice;
    }
  } catch (error) {
    console.error('[signInvoice] Error:', error);
    if (axios.isAxiosError(error)) {
      // Log chi tiết error response
      console.error('[signInvoice] Error status:', error.response?.status);
      console.error('[signInvoice] Error data:', error.response?.data);
      console.error('[signInvoice] Error errors array:', error.response?.data?.errors);
      console.error('[signInvoice] Error message:', error.response?.data?.message || error.response?.data?.title);
      
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        let errorMsg = errorData?.message || errorData?.title || 'Không thể ký hoá đơn';
        
        // Nếu có mảng errors, lấy message chi tiết
        if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const detailedErrors = errorData.errors.join(', ');
          errorMsg = `${errorMsg}\n${detailedErrors}`;
        }
        
        throw new Error(errorMsg);
      }
      if (error.response?.status === 404) {
        throw new Error('Không tìm thấy hoá đơn.');
      }
    }
    return handleApiError(error, 'Ký hoá đơn thất bại');
  }
};

/**
 * Gửi hóa đơn lên cơ quan thuế (Submit to Tax Authority)
 * API: POST /api/Tax/submit?invoiceId={id}
 * @param invoiceId - ID hóa đơn cần gửi
 * @returns Mã cơ quan thuế (taxAuthorityCode) nếu thành công
 */
export const submitToTaxAuthority = async (invoiceId: number): Promise<string> => {
  try {
    console.log(`[submitToTaxAuthority] Submitting invoice ${invoiceId} to tax authority`);
    
    // ✅ Backend API: POST /api/Tax/submit?invoiceId={id}
    const response = await axios.post(
      `/api/Tax/submit?invoiceId=${invoiceId}`,
      null, // Empty body theo curl
      { headers: getAuthHeaders() }
    );
    
    console.log('[submitToTaxAuthority] ✅ Success - Invoice submitted to tax authority');
    console.log('[submitToTaxAuthority] Response:', response.data);
    
    // Trả về mã CQT từ response (có thể là response.data.taxAuthorityCode hoặc response.data)
    const taxCode = response.data?.taxAuthorityCode || response.data?.code || response.data;
    return taxCode;
  } catch (error) {
    console.error('[submitToTaxAuthority] Error:', error);
    if (axios.isAxiosError(error)) {
      console.error('[submitToTaxAuthority] Error status:', error.response?.status);
      console.error('[submitToTaxAuthority] Error data:', error.response?.data);
      
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        let errorMsg = errorData?.message || errorData?.title || 'Không thể gửi lên cơ quan thuế';
        
        if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const detailedErrors = errorData.errors.join(', ');
          errorMsg = `${errorMsg}: ${detailedErrors}`;
        }
        
        throw new Error(errorMsg);
      }
      if (error.response?.status === 404) {
        throw new Error('Không tìm thấy hoá đơn.');
      }
    }
    return handleApiError(error, 'Gửi cơ quan thuế thất bại');
  }
};

// ==================== EXPORTS ====================

const invoiceService = {
  // Templates
  getAllTemplates,
  getActiveTemplates,
  
  // Invoices
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  
  // Status Management (New PATCH API)
  updateInvoiceStatus,
  sendForApproval,      // 1 → 6
  approveInvoice,       // 6 → 9 ✨ NEW
  markPendingSign,      // 9 → 7 ✨ NEW
  markSigned,           // 7 → 10 ✨ NEW
  rejectInvoice,        // 6 → 3
  cancelInvoice,        // 6/7 → 1 ✨ NEW
  markIssued,           // 10 → 2
  
  // Sign & Issue
  issueInvoice,
  signInvoice,
  
  // Tax Authority
  submitToTaxAuthority,
};

export default invoiceService;


