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

// Backend actual response format (different field names)
interface BackendPaymentResponse {
  paymentID: number;
  invoiceID: number;
  amountPaid: number;
  remainingAmount: number;        // ✅ NEW - Số tiền còn lại của hóa đơn
  paymentMethod: string;
  transactionCode?: string | null;
  note?: string | null;
  paymentDate: string;
  createdBy: number;
  invoice?: {
    invoiceNumber: string | number;  // Can be number
    customerName?: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus?: string;
  };
  user?: {
    userId: number;
    userName: string;
  };
}

// Frontend expected format
export interface PaymentResponse {
  id: number;
  invoiceId: number;
  amount: number;
  remainingAmount?: number;       // ✅ NEW - Số tiền còn lại của hóa đơn
  paymentMethod: string;
  transactionCode?: string;
  note?: string;
  paymentDate: string;
  userId: number;
  createdAt: string;
  updatedAt?: string;
  invoice?: {
    invoiceNumber: string;
    customerName?: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus?: string;
  };
  user?: {
    userId: number;
    userName: string;
  };
}

// ✅ NEW - Paginated response from GET /api/Payment
export interface BackendPaginatedPaymentResponse {
  items: BackendPaymentResponse[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PaginatedPaymentResponse {
  data: PaymentResponse[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;  // ✅ NEW - From updated API
  hasNextPage: boolean;       // ✅ NEW - From updated API
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

// ✅ NEW - Monthly debt response types
export interface MonthlyDebtInvoice {
  invoiceId: number;
  invoiceDate: string;
  dueDate: string | null;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  overdueAmount: number;
  status: string;
}

export interface MonthlyDebtSummary {
  totalReceivable: number;   // Tổng phải thu
  totalPaid: number;          // Tổng đã thu
  totalRemaining: number;     // Tổng còn lại
  totalOverdue: number;       // Tổng quá hạn
}

export interface MonthlyDebtData {
  summary: MonthlyDebtSummary;
  invoices: {
    items: MonthlyDebtInvoice[];
    pageIndex: number;
    totalPages: number;
    totalCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export interface MonthlyDebtResponse {
  value: MonthlyDebtData;
  valueOrDefault: MonthlyDebtData;
  isFailed: boolean;
  isSuccess: boolean;
  reasons: string[];
  errors: string[];
  successes: string[];
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
 * Transforms backend response format to frontend format
 */
export const createPayment = async (paymentData: PaymentRequest): Promise<PaymentResponse> => {
  try {
    console.log('[createPayment] Request:', paymentData);
    
    const response = await axios.post<BackendPaymentResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT.CREATE}`,
      paymentData,
      {
        headers: getAuthHeaders(),
        timeout: API_CONFIG.TIMEOUT,
      }
    );
    
    console.log('[createPayment] Backend response:', response.data);
    
    // Transform backend response to frontend format
    const backendData = response.data;
    
    const transformedResponse: PaymentResponse = {
      id: backendData.paymentID,                    // Map paymentID → id
      invoiceId: backendData.invoiceID,
      amount: backendData.amountPaid,               // Map amountPaid → amount
      remainingAmount: backendData.remainingAmount, // ✅ NEW - Remaining amount after payment
      paymentMethod: backendData.paymentMethod,
      transactionCode: backendData.transactionCode || undefined,
      note: backendData.note || undefined,
      paymentDate: backendData.paymentDate,
      userId: backendData.createdBy,                // Map createdBy → userId
      createdAt: backendData.paymentDate,           // Use paymentDate as createdAt
      invoice: backendData.invoice ? {
        invoiceNumber: String(backendData.invoice.invoiceNumber), // Convert to string
        customerName: backendData.invoice.customerName,
        totalAmount: backendData.invoice.totalAmount,
        paidAmount: backendData.invoice.paidAmount,
        remainingAmount: backendData.invoice.remainingAmount,
        paymentStatus: backendData.invoice.paymentStatus,
      } : undefined,
      user: backendData.user
    };
    
    console.log('[createPayment] ✅ Transformed response:', transformedResponse);
    
    return transformedResponse;
  } catch (error) {
    console.error('[createPayment] ❌ Error:', error);
    return handleApiError(error, 'Create Payment');
  }
};

/**
 * Get paginated list of payments with filters
 * Handles new API structure with items[] array and transforms backend payment format
 */
export const getPayments = async (params?: PaymentQueryParams): Promise<PaginatedPaymentResponse> => {
  try {
    console.log('[getPayments] Request params:', params);
    
    const response = await axios.get<BackendPaginatedPaymentResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT.GET_ALL}`,
      {
        headers: getAuthHeaders(),
        params: params,
        timeout: API_CONFIG.TIMEOUT,
      }
    );
    
    console.log('[getPayments] Backend response:', response.data);
    
    // Transform backend paginated response to frontend format
    const transformedPayments: PaymentResponse[] = response.data.items.map(backendPayment => ({
      id: backendPayment.paymentID,                    // Map paymentID → id
      invoiceId: backendPayment.invoiceID,
      amount: backendPayment.amountPaid,               // Map amountPaid → amount
      remainingAmount: backendPayment.remainingAmount, // ✅ NEW field
      paymentMethod: backendPayment.paymentMethod,
      transactionCode: backendPayment.transactionCode || undefined,
      note: backendPayment.note || undefined,
      paymentDate: backendPayment.paymentDate,
      userId: backendPayment.createdBy,                // Map createdBy → userId
      createdAt: backendPayment.paymentDate,
      invoice: backendPayment.invoice ? {
        invoiceNumber: String(backendPayment.invoice.invoiceNumber),
        customerName: backendPayment.invoice.customerName,
        totalAmount: backendPayment.invoice.totalAmount,
        paidAmount: backendPayment.invoice.paidAmount,
        remainingAmount: backendPayment.invoice.remainingAmount,
        paymentStatus: backendPayment.invoice.paymentStatus,
      } : undefined,
      user: backendPayment.user
    }));
    
    const transformedResponse: PaginatedPaymentResponse = {
      data: transformedPayments,
      pageIndex: response.data.pageIndex,
      pageSize: params?.pageSize || transformedPayments.length, // Use requested pageSize or actual items length
      totalPages: response.data.totalPages,
      totalCount: response.data.totalCount,
      hasPreviousPage: response.data.hasPreviousPage,
      hasNextPage: response.data.hasNextPage,
    };
    
    console.log('[getPayments] ✅ Transformed response:', transformedResponse);
    
    return transformedResponse;
  } catch (error) {
    console.error('[getPayments] ❌ Error:', error);
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

/**
 * Get monthly debt report for a specific customer
 * Returns summary statistics and detailed invoice breakdown
 * @param month - Month number (1-12)
 * @param year - Year (e.g., 2025, 2026)
 * @param customerId - Customer ID
 * @returns Monthly debt data with summary and invoice list
 */
export const getMonthlyDebt = async (
  month: number,
  year: number,
  customerId: number
): Promise<MonthlyDebtData> => {
  try {
    console.log('[getMonthlyDebt] Request:', { month, year, customerId });
    
    const response = await axios.get<MonthlyDebtResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT.GET_MONTHLY_DEBT}`,
      {
        headers: getAuthHeaders(),
        params: { month, year, customerId },
        timeout: API_CONFIG.TIMEOUT,
      }
    );
    
    console.log('[getMonthlyDebt] Backend response:', response.data);
    
    // Handle Result pattern wrapper - use value or valueOrDefault
    const monthlyDebtData = response.data.value || response.data.valueOrDefault;
    
    if (!monthlyDebtData) {
      throw new Error('Monthly debt data is empty or unavailable');
    }
    
    // Check if the operation failed
    if (response.data.isFailed) {
      const errorMessage = response.data.errors?.join(', ') || 'Failed to retrieve monthly debt data';
      throw new Error(errorMessage);
    }
    
    console.log('[getMonthlyDebt] ✅ Monthly debt data:', monthlyDebtData);
    
    return monthlyDebtData;
  } catch (error) {
    console.error('[getMonthlyDebt] ❌ Error:', error);
    return handleApiError(error, 'Get Monthly Debt Report');
  }
};

// ==================== EXPORTS ====================

export const paymentService = {
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentsByInvoice,
  getPaymentsByCustomer,
  getMonthlyDebt, // ✅ NEW - Monthly debt report
};

export default paymentService;
