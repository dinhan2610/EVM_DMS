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
    
    const response = await axios.post<BackendInvoiceResponse>(
      `/api/Invoice`,
      data,
      { headers: getAuthHeaders() }
    );
    
    console.log('[createInvoice] Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('[createInvoice] Error details:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('[createInvoice] Response status:', error.response.status);
      console.error('[createInvoice] Response data:', error.response.data);
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
    return response.data;
  } catch (error) {
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

// ==================== EXPORTS ====================

const invoiceService = {
  // Templates
  getAllTemplates,
  getActiveTemplates,
  
  // Invoices
  createInvoice,
  getAllInvoices,
  getInvoiceById,
};

export default invoiceService;


