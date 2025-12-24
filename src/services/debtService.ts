// src/services/debtService.ts

import axios from 'axios';
import { CustomerDebt } from '@/types/debt.types';

// ============================
// INTERFACES - API RESPONSES
// ============================

export interface CustomerDebtSummaryResponse {
  data: CustomerDebt[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CustomerDebtDetailResponse {
  customer: {
    customerId: number;
    customerName: string;
    taxCode: string;
    email: string;
    phone: string;
    address: string;
  };
  summary: {
    totalDebt: number;
    overdueDebt: number;
    totalPaid: number;
    invoiceCount: number;
    unpaidInvoiceCount: number;
    lastPaymentDate: string | null;
  };
  unpaidInvoices: Array<{
    invoiceId: number;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus: 'Unpaid' | 'PartiallyPaid' | 'Paid' | 'Overdue';
    description: string;
    isOverdue: boolean;
  }>;
  paymentHistory: Array<{
    paymentId: number;
    invoiceId: number;
    invoiceNumber: string;
    amount: number;
    paymentMethod: string;
    transactionCode: string | null;
    note: string;
    paymentDate: string;
    userId: number;
    userName: string;
  }>;
}

export interface DebtQueryParams {
  PageIndex?: number;
  PageSize?: number;
  SearchTerm?: string;
  SortBy?: 'totalDebt' | 'overdueDebt' | 'lastPaymentDate';
  SortOrder?: 'asc' | 'desc';
  HasOverdue?: boolean;
}

// ============================
// HELPER FUNCTIONS
// ============================

/**
 * Get authorization headers with JWT token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Handle API errors consistently
 */
const handleApiError = (error: unknown, context: string): never => {
  console.error(`[${context}] Error:`, error);
  
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.detail || 
                   error.response?.data?.message || 
                   error.message;
    throw new Error(message);
  }
  
  throw error;
};

// ============================
// API FUNCTIONS
// ============================

/**
 * Get customer debt summary (paginated list)
 * GET /api/Customer/debt-summary
 */
export const getCustomerDebtSummary = async (
  params?: DebtQueryParams
): Promise<CustomerDebtSummaryResponse> => {
  try {
    console.log('[getCustomerDebtSummary] Fetching debt summary with params:', params);
    
    // Backend returns paginated response with "items" instead of "data"
    const response = await axios.get<{
      items: CustomerDebt[];
      pageIndex: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    }>(
      '/api/Customer/debt-summary',
      {
        params,
        headers: getAuthHeaders(),
      }
    );
    
    console.log('[getCustomerDebtSummary] Raw response:', response.data);
    
    // Normalize response: map "items" to "data" for frontend consistency
    const normalizedResponse: CustomerDebtSummaryResponse = {
      data: response.data.items || [],
      pageIndex: response.data.pageIndex,
      pageSize: response.data.pageSize || params?.PageSize || 20,
      totalCount: response.data.totalCount,
      totalPages: response.data.totalPages,
    };
    
    console.log('[getCustomerDebtSummary] Normalized:', normalizedResponse);
    return normalizedResponse;
  } catch (error) {
    return handleApiError(error, 'getCustomerDebtSummary');
  }
};

/**
 * Get detailed debt information for a specific customer
 * GET /api/Customer/{customerId}/debt-detail
 */
export const getCustomerDebtDetail = async (
  customerId: number
): Promise<CustomerDebtDetailResponse> => {
  try {
    console.log('[getCustomerDebtDetail] Fetching debt detail for customer:', customerId);
    
    const response = await axios.get<CustomerDebtDetailResponse>(
      `/api/Customer/${customerId}/debt-detail`,
      { headers: getAuthHeaders() }
    );
    
    console.log('[getCustomerDebtDetail] Success:', response.data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'getCustomerDebtDetail');
  }
};

// ============================
// EXPORTS
// ============================

export const debtService = {
  getCustomerDebtSummary,
  getCustomerDebtDetail,
};

export default debtService;
