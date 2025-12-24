/**
 * Tax Service - API calls for tax authority integration
 * Xử lý tích hợp với Cơ Quan Thuế (CQT) và quản lý trạng thái hóa đơn điện tử
 */

import axios from 'axios';
import API_CONFIG from '@/config/api.config';
import type { TaxApiStatus, InvoiceWithTaxStatus } from '@/types/tax.types';

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

// ==================== TAX API STATUS ====================

/**
 * Lấy danh sách tất cả các trạng thái CQT
 * API: GET /api/TaxApiStatus
 * @returns Danh sách các trạng thái được định nghĩa bởi CQT
 */
export const getAllTaxApiStatuses = async (): Promise<TaxApiStatus[]> => {
  try {
    console.log('[getAllTaxApiStatuses] Fetching tax API statuses...');
    
    const response = await axios.get<TaxApiStatus[]>(
      `/api/TaxApiStatus`,
      { headers: getAuthHeaders() }
    );
    
    console.log(`[getAllTaxApiStatuses] ✅ Success: ${response.data.length} statuses`);
    return response.data;
  } catch (error) {
    console.error('[getAllTaxApiStatuses] Error:', error);
    return handleApiError(error, 'Get tax API statuses failed');
  }
};

/**
 * Lấy trạng thái CQT theo ID
 * @param statusId - ID của trạng thái cần lấy
 * @returns Thông tin trạng thái CQT
 */
export const getTaxApiStatusById = async (statusId: number): Promise<TaxApiStatus> => {
  try {
    console.log(`[getTaxApiStatusById] Fetching tax status ${statusId}...`);
    
    const response = await axios.get<TaxApiStatus>(
      `/api/TaxApiStatus/${statusId}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('[getTaxApiStatusById] ✅ Success');
    return response.data;
  } catch (error) {
    console.error('[getTaxApiStatusById] Error:', error);
    return handleApiError(error, 'Get tax status by ID failed');
  }
};

// ==================== TAX INVOICE OPERATIONS ====================

/**
 * Gửi hóa đơn lên cơ quan thuế để cấp mã
 * API: POST /api/Tax/submit?invoiceId={id}
 * @param invoiceId - ID hóa đơn cần gửi lên CQT
 * @returns Mã CQT (taxAuthorityCode) nếu thành công
 */
export const submitInvoiceToTax = async (invoiceId: number): Promise<string> => {
  try {
    console.log(`[submitInvoiceToTax] Submitting invoice ${invoiceId} to tax authority...`);
    
    const response = await axios.post(
      `/api/Tax/submit?invoiceId=${invoiceId}`,
      null,
      { headers: getAuthHeaders() }
    );
    
    console.log('[submitInvoiceToTax] ✅ Success - Invoice submitted');
    console.log('[submitInvoiceToTax] Response:', response.data);
    
    // Trả về mã CQT
    const taxCode = response.data?.taxAuthorityCode || response.data?.code || response.data;
    return taxCode;
  } catch (error) {
    console.error('[submitInvoiceToTax] Error:', error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      
      if (status === 400) {
        let errorMsg = errorData?.message || errorData?.title || 'Không thể gửi hóa đơn lên CQT';
        
        if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const detailedErrors = errorData.errors.join(', ');
          errorMsg = `${errorMsg}: ${detailedErrors}`;
        }
        
        throw new Error(errorMsg);
      }
      
      if (status === 404) {
        throw new Error('Không tìm thấy hóa đơn.');
      }
    }
    return handleApiError(error, 'Gửi hóa đơn lên CQT thất bại');
  }
};

/**
 * Kiểm tra trạng thái hóa đơn với CQT
 * API: GET /api/Tax/status/{invoiceId}
 * @param invoiceId - ID hóa đơn cần kiểm tra
 * @returns Trạng thái hiện tại của hóa đơn với CQT
 */
export const checkInvoiceTaxStatus = async (invoiceId: number): Promise<InvoiceWithTaxStatus> => {
  try {
    console.log(`[checkInvoiceTaxStatus] Checking tax status for invoice ${invoiceId}...`);
    
    const response = await axios.get<InvoiceWithTaxStatus>(
      `/api/Tax/status/${invoiceId}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('[checkInvoiceTaxStatus] ✅ Success');
    console.log('[checkInvoiceTaxStatus] Tax status:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('[checkInvoiceTaxStatus] Error:', error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      
      if (status === 404) {
        throw new Error('Không tìm thấy thông tin trạng thái CQT cho hóa đơn này.');
      }
    }
    return handleApiError(error, 'Kiểm tra trạng thái CQT thất bại');
  }
};

/**
 * Đồng bộ trạng thái hóa đơn từ CQT
 * API: POST /api/Tax/sync/{invoiceId}
 * @param invoiceId - ID hóa đơn cần đồng bộ
 * @returns Trạng thái mới sau khi đồng bộ
 */
export const syncInvoiceTaxStatus = async (invoiceId: number): Promise<InvoiceWithTaxStatus> => {
  try {
    console.log(`[syncInvoiceTaxStatus] Syncing tax status for invoice ${invoiceId}...`);
    
    const response = await axios.post<InvoiceWithTaxStatus>(
      `/api/Tax/sync/${invoiceId}`,
      null,
      { headers: getAuthHeaders() }
    );
    
    console.log('[syncInvoiceTaxStatus] ✅ Success - Status synced');
    console.log('[syncInvoiceTaxStatus] New status:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('[syncInvoiceTaxStatus] Error:', error);
    return handleApiError(error, 'Đồng bộ trạng thái CQT thất bại');
  }
};

/**
 * Gửi lại hóa đơn lên CQT (retry)
 * Sử dụng khi hóa đơn bị từ chối hoặc lỗi gửi
 * API: POST /api/Tax/retry/{invoiceId}
 * @param invoiceId - ID hóa đơn cần gửi lại
 * @returns Kết quả gửi lại
 */
export const retrySubmitInvoiceToTax = async (invoiceId: number): Promise<string> => {
  try {
    console.log(`[retrySubmitInvoiceToTax] Retrying submit invoice ${invoiceId}...`);
    
    const response = await axios.post(
      `/api/Tax/retry/${invoiceId}`,
      null,
      { headers: getAuthHeaders() }
    );
    
    console.log('[retrySubmitInvoiceToTax] ✅ Success - Invoice resubmitted');
    
    const taxCode = response.data?.taxAuthorityCode || response.data?.code || response.data;
    return taxCode;
  } catch (error) {
    console.error('[retrySubmitInvoiceToTax] Error:', error);
    return handleApiError(error, 'Gửi lại hóa đơn thất bại');
  }
};

// ==================== EXPORTS ====================

const taxService = {
  // Tax API Statuses
  getAllTaxApiStatuses,
  getTaxApiStatusById,
  
  // Tax Invoice Operations
  submitInvoiceToTax,
  checkInvoiceTaxStatus,
  syncInvoiceTaxStatus,
  retrySubmitInvoiceToTax,
};

export default taxService;
