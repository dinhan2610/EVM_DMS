/**
 * Payment Service - API calls for payment/debt management
 */

import axios from 'axios';
import API_CONFIG from '@/config/api.config';

// ==================== TYPES ====================

export interface PaymentRequest {
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  transactionCode?: string;
  note?: string;
  paymentDate: string;
  userId: number;
}

export interface PaymentResponse {
  id: number;
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  transactionCode?: string;
  note?: string;
  paymentDate: string;
  userId: number;
  createdAt: string;
  updatedAt?: string;
  // Additional fields backend might return
  invoice?: {
    invoiceNumber: string;
    customerName?: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  };
  user?: {
    userId: number;
    userName: string;
  };
}

export interface PaginatedPaymentResponse {
  data: PaymentResponse[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PaymentQueryParams {
  pageIndex?: number;
  pageSize?: number;
  invoiceId?: number;
  customerId?: number;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
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
      throw new Error('Session expired. Please login again.');
    }
    
    if (status === 403) {
      throw new Error('You do not have permission to perform this action.');
    }
    
    if (status === 404) {
      throw new Error(`${context}: Resource not found.`);
    }
    
    if (status === 400) {
      throw new Error(`${context}: ${message}`);
    }
    
    throw new Error(`${context}: ${message}`);
  }
  
  throw new Error(`${context}: An unexpected error occurred.`);
};

// ==================== API FUNCTIONS ====================

/**
 * Create a new payment record
 */
export const createPayment = async (paymentData: PaymentRequest): Promise<PaymentResponse> => {
  try {
    const response = await axios.post<PaymentResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT.CREATE}`,
      paymentData,
      {
        headers: getAuthHeaders(),
        timeout: API_CONFIG.TIMEOUT,
      }
    );
    
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Create Payment');
  }
};

/**
 * Get paginated list of payments with filters
 */
export const getPayments = async (params?: PaymentQueryParams): Promise<PaginatedPaymentResponse> => {
  try {
    const response = await axios.get<PaginatedPaymentResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT.GET_ALL}`,
      {
        headers: getAuthHeaders(),
        params: params,
        timeout: API_CONFIG.TIMEOUT,
      }
    );
    
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Get Payments');
  }
};

/**
 * Get single payment by ID
 */
export const getPaymentById = async (id: number): Promise<PaymentResponse> => {
  try {
    const response = await axios.get<PaymentResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT.GET_BY_ID(id)}`,
      {
        headers: getAuthHeaders(),
        timeout: API_CONFIG.TIMEOUT,
      }
    );
    
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Get Payment Detail');
  }
};

/**
 * Get all payments for a specific invoice
 */
export const getPaymentsByInvoice = async (invoiceId: number): Promise<PaymentResponse[]> => {
  try {
    const response = await axios.get<PaginatedPaymentResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT.GET_BY_INVOICE(invoiceId)}`,
      {
        headers: getAuthHeaders(),
        timeout: API_CONFIG.TIMEOUT,
      }
    );
    
    return response.data.data || [];
  } catch (error) {
    return handleApiError(error, 'Get Invoice Payments');
  }
};

/**
 * Get all payments for a specific customer
 */
export const getPaymentsByCustomer = async (
  customerId: number,
  params?: Omit<PaymentQueryParams, 'customerId'>
): Promise<PaginatedPaymentResponse> => {
  try {
    const response = await axios.get<PaginatedPaymentResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT.GET_BY_CUSTOMER(customerId)}`,
      {
        headers: getAuthHeaders(),
        params: params,
        timeout: API_CONFIG.TIMEOUT,
      }
    );
    
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Get Customer Payments');
  }
};

// ==================== EXPORTS ====================

export const paymentService = {
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentsByInvoice,
  getPaymentsByCustomer,
};

export default paymentService;
