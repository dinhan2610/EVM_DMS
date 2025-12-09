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
    console.log('[getAllInvoices] Fetching invoices...');
    
    const response = await axios.get<InvoiceListItem[]>(
      `/api/Invoice`,
      { headers: getAuthHeaders() }
    );
    
    console.log('[getAllInvoices] Raw response:', response.data);
    console.log('[getAllInvoices] Response type:', typeof response.data);
    console.log('[getAllInvoices] Is array?', Array.isArray(response.data));
    
    // ⚠️ Backend có thể wrap trong object { data: [...] } hoặc { invoices: [...] }
    let invoicesArray = response.data;
    
    if (!Array.isArray(invoicesArray)) {
      console.warn('[getAllInvoices] Response is not array, trying to extract...');
      
      // Thử unwrap các format phổ biến
      if (response.data && typeof response.data === 'object') {
        invoicesArray = (response.data as any).data || 
                       (response.data as any).invoices || 
                       (response.data as any).items || 
                       [];
      } else {
        invoicesArray = [];
      }
    }
    
    console.log(`[getAllInvoices] ✅ Success: ${invoicesArray.length} invoices`);
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

/**
 * Cập nhật trạng thái hóa đơn
 * @param invoiceId - ID hóa đơn
 * @param statusId - Status mới (1=Nháp, 6=Chờ duyệt, 2=Chờ ký, 3=Đã phát hành)
 */
export const updateInvoiceStatus = async (invoiceId: number, statusId: number): Promise<void> => {
  try {
    console.log(`[updateInvoiceStatus] Updating invoice ${invoiceId} to status ${statusId}`);
    
    // ✅ Backend API: PUT /api/Invoice/{id}?statusId={statusId}
    await axios.put(
      `/api/Invoice/${invoiceId}?statusId=${statusId}`,
      null, // Không cần body, dùng query param
      { headers: getAuthHeaders() }
    );
    
    console.log('[updateInvoiceStatus] Success');
  } catch (error) {
    console.error('[updateInvoiceStatus] Error:', error);
    return handleApiError(error, 'Update invoice status failed');
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
  updateInvoiceStatus,
};

export default invoiceService;


