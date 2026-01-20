// src/services/invoiceHistoryService.ts

import axios from 'axios';
import API_CONFIG from '@/config/api.config';

// ============================
// INTERFACES
// ============================

export interface InvoiceHistory {
  historyID: number;
  invoiceID: number;
  actionType: string;
  date: string;
  performedBy: number | null;
  performerName: string;
  referenceInvoiceID: number | null;
  referenceInvoiceNumber: string | null;
}

// ============================
// HELPER FUNCTIONS
// ============================

/**
 * Get authorization headers with JWT token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Handle API errors consistently
 */
const handleApiError = (error: unknown, context: string): never => {
  console.error(`[${context}] Error:`, error);
  
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.detail || error.response?.data?.message || error.message;
    
    if (status === 401) {
      localStorage.removeItem(API_CONFIG.TOKEN_KEY);
      window.location.href = '/auth/sign-in';
      throw new Error('Session expired. Please login again.');
    }
    
    throw new Error(`${context}: ${message}`);
  }
  
  throw error;
};

/**
 * Map action type to Vietnamese label
 */
export const getActionTypeLabel = (actionType: string): string => {
  const labels: Record<string, string> = {
    'Created': 'Tạo hóa đơn',
    'Issued': 'Phát hành',
    'Signed': 'Ký số',
    'CqtAccepted': 'CQT chấp nhận',
    'CqtRejected': 'CQT từ chối',
    'Replaced': 'Thay thế',
    'Adjusted': 'Điều chỉnh',
    'Cancelled': 'Hủy',
    'SentForApproval': 'Gửi duyệt',
    'Approved': 'Đã duyệt',
    'Rejected': 'Từ chối duyệt',
    'Manual Status Update': 'Cập nhật trạng thái',
    'EmailSent': 'Gửi email',
  };
  return labels[actionType] || actionType;
};

/**
 * Get action type color
 */
export const getActionTypeColor = (actionType: string): 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' | 'grey' => {
  const colors: Record<string, 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' | 'grey'> = {
    'Created': 'info',
    'Issued': 'success',
    'Signed': 'success',
    'CqtAccepted': 'success',
    'CqtRejected': 'error',
    'Replaced': 'warning',
    'Adjusted': 'warning',
    'Cancelled': 'error',
    'SentForApproval': 'info',
    'Approved': 'success',
    'Rejected': 'error',
    'Manual Status Update': 'grey',
    'EmailSent': 'info',
  };
  return colors[actionType] || 'grey';
};

// ============================
// API FUNCTIONS
// ============================

/**
 * Get invoice history by invoice ID
 * GET /api/InvoiceHistory/by-invoice/{invoiceId}
 */
export const getInvoiceHistory = async (invoiceId: number): Promise<InvoiceHistory[]> => {
  try {
    console.log('[getInvoiceHistory] Fetching history for invoice:', invoiceId);
    
    const response = await axios.get<InvoiceHistory[]>(
      `/api/InvoiceHistory/by-invoice/${invoiceId}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('[getInvoiceHistory] Success:', response.data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'getInvoiceHistory');
  }
};

// ============================
// EXPORT DEFAULT SERVICE
// ============================

const invoiceHistoryService = {
  getInvoiceHistory,
  getActionTypeLabel,
  getActionTypeColor,
};

export default invoiceHistoryService;
