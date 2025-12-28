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
    invoiceStatusID: number; // ✅ NEW: Backend đã thêm - Luôn = 2 (ISSUED)
    invoiceStatus: string; // ✅ NEW: Backend đã thêm - "Issued"
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
    amount: number; // ✅ Changed from "amountPaid" to "amount"
    paymentMethod: string;
    transactionCode: string | null;
    note: string;
    paymentDate: string;
    userId: number;
    userName: string;
  }>;
  // ✅ NEW: Add pagination metadata
  unpaidInvoicesPagination?: {
    pageIndex: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  paymentHistoryPagination?: {
    pageIndex: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
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
 * Get detailed debt information for a specific customer with pagination
 * GET /api/Customer/{customerId}/debt-detail
 */
export const getCustomerDebtDetail = async (
  customerId: number,
  params?: { 
    InvoicePageSize?: number; 
    InvoicePageIndex?: number;
    PaymentPageSize?: number;
    PaymentPageIndex?: number;
    SortBy?: string;
    SortOrder?: 'asc' | 'desc';
  }
): Promise<CustomerDebtDetailResponse> => {
  try {
    console.log('[getCustomerDebtDetail] Fetching debt detail for customer:', customerId, 'with params:', params);
    
    // ✅ NEW: Use backend pagination parameters (InvoicePageSize, InvoicePageIndex, etc.)
    const response = await axios.get<{
      customer: CustomerDebtDetailResponse['customer'];
      summary: CustomerDebtDetailResponse['summary'];
      unpaidInvoices: {
        items: CustomerDebtDetailResponse['unpaidInvoices'];
        pageIndex: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasPreviousPage?: boolean;
        hasNextPage?: boolean;
      };
      paymentHistory: {
        items: CustomerDebtDetailResponse['paymentHistory'];
        pageIndex: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasPreviousPage?: boolean;
        hasNextPage?: boolean;
      };
    }>(
      `/api/Customer/${customerId}/debt-detail`,
      { 
        headers: getAuthHeaders(),
        params: {
          InvoicePageIndex: params?.InvoicePageIndex || 1,
          InvoicePageSize: params?.InvoicePageSize || 10,
          PaymentPageIndex: params?.PaymentPageIndex || 1,
          PaymentPageSize: params?.PaymentPageSize || 10,
          SortBy: params?.SortBy || 'invoiceDate',
          SortOrder: params?.SortOrder || 'desc',
        }
      }
    );
    
    console.log('[getCustomerDebtDetail] Success:', {
      customer: response.data.customer.customerName,
      invoices: response.data.unpaidInvoices.items.length,
      invoicesTotalCount: response.data.unpaidInvoices.totalCount,
      payments: response.data.paymentHistory.items.length,
      paymentsTotalCount: response.data.paymentHistory.totalCount,
    });
    
    // ✅ NEW: Return paginated structure
    return {
      customer: response.data.customer,
      summary: response.data.summary,
      unpaidInvoices: response.data.unpaidInvoices.items,
      paymentHistory: response.data.paymentHistory.items,
      // Add pagination metadata
      unpaidInvoicesPagination: {
        pageIndex: response.data.unpaidInvoices.pageIndex,
        pageSize: response.data.unpaidInvoices.pageSize,
        totalCount: response.data.unpaidInvoices.totalCount,
        totalPages: response.data.unpaidInvoices.totalPages,
        hasPreviousPage: response.data.unpaidInvoices.hasPreviousPage ?? response.data.unpaidInvoices.pageIndex > 1,
        hasNextPage: response.data.unpaidInvoices.hasNextPage ?? response.data.unpaidInvoices.pageIndex < response.data.unpaidInvoices.totalPages,
      },
      paymentHistoryPagination: {
        pageIndex: response.data.paymentHistory.pageIndex,
        pageSize: response.data.paymentHistory.pageSize,
        totalCount: response.data.paymentHistory.totalCount,
        totalPages: response.data.paymentHistory.totalPages,
        hasPreviousPage: response.data.paymentHistory.hasPreviousPage ?? response.data.paymentHistory.pageIndex > 1,
        hasNextPage: response.data.paymentHistory.hasNextPage ?? response.data.paymentHistory.pageIndex < response.data.paymentHistory.totalPages,
      },
    };
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
