/**
 * Statement Service - API calls for Statement Management
 * 
 * Endpoints:
 * - GET /api/Statement - List statements with pagination
 * - GET /api/Statement/{id} - Get statement detail with products and invoices
 * - GET /api/Statement/{id}/export-pdf - Export statement as PDF
 */

import axios from 'axios';
import API_CONFIG from '@/config/api.config';
import type {
  StatementListResponse,
  StatementDetailResponse,
  StatementFilterParams,
  StatementListItem,
} from '@/types/statement.types';

// ==================== EMAIL INTERFACES ====================

export interface SendStatementEmailRequest {
  statementId: number;
  recipientEmail: string;
  ccEmails?: string[];
  bccEmails?: string[];
  subject: string;
  message: string;
  includePdf: boolean;
  rootPath?: string;
}

export interface SendStatementEmailResponse {
  success: boolean;
  message: string;
}

export interface SendDebtReminderRequest {
  statementId: number;
  includePdf: boolean;
}

export interface SendDebtReminderResponse {
  success: boolean;
  message: string;
}

// ==================== API ENDPOINTS ====================

const STATEMENT_ENDPOINTS = {
  LIST: '/api/Statement',
  DETAIL: (id: number) => `/api/Statement/${id}`,
  EXPORT_PDF: (id: number) => `/api/Statement/${id}/export-pdf`,
  GENERATE: '/api/Statement/generate',
  GENERATE_BATCH: '/api/Statement/generate-batch',
  SEND_REMINDERS: '/api/Statement/send-monthly-reminders',
  SEND_EMAIL: (id: number) => `/api/Statement/${id}/send-email`,
  SEND_DEBT_REMINDER: (id: number) => `/api/Statement/${id}/send-debt-reminder`,
  CREATE_PAYMENT: (id: number) => `/api/Statement/${id}/payments`,
  GET_PAYMENTS: (id: number) => `/api/Statement/${id}/payments`,
};

// ==================== LIST STATEMENTS ====================

/**
 * Fetch statements list with pagination and filters
 * 
 * @param filters - Filter parameters (pageIndex, pageSize, customerName, status, dates)
 * @returns StatementListResponse with items and pagination info
 * 
 * Example:
 * ```typescript
 * const response = await fetchStatements({ pageIndex: 1, pageSize: 10 });
 * console.log(response.items); // StatementListItem[]
 * console.log(response.totalPages); // 5
 * ```
 */
export async function fetchStatements(
  filters: StatementFilterParams = {}
): Promise<StatementListResponse> {
  try {
    const params = {
      pageIndex: filters.pageIndex || 1,
      pageSize: filters.pageSize || 10,
      ...(filters.customerName && { customerName: filters.customerName }),
      ...(filters.status && { status: filters.status }),
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
    };

    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    const response = await axios.get<StatementListResponse>(
      STATEMENT_ENDPOINTS.LIST,
      {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('❌ Error fetching statements:', error);
    throw error;
  }
}

// ==================== GET STATEMENT DETAIL ====================

/**
 * Fetch statement detail including product summaries and invoices
 * 
 * @param id - Statement ID
 * @returns StatementDetailResponse with productSummaries[] and invoices[]
 * 
 * Example:
 * ```typescript
 * const detail = await fetchStatementDetail(1);
 * console.log(detail.productSummaries); // ProductSummary[]
 * console.log(detail.invoices); // StatementInvoice[]
 * ```
 */
export async function fetchStatementDetail(
  id: number
): Promise<StatementDetailResponse> {
  try {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    const response = await axios.get<StatementDetailResponse>(
      STATEMENT_ENDPOINTS.DETAIL(id),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching statement detail (ID: ${id}):`, error);
    throw error;
  }
}

// ==================== SEND DEBT REMINDER ====================

/**
 * Send debt reminder email for a statement
 * 
 * @param id - Statement ID
 * @param includePdf - Include PDF attachment (default: true)
 * @returns SendDebtReminderResponse with success status
 * 
 * Example:
 * ```typescript
 * const result = await sendDebtReminder(1, true);
 * console.log(result.message); // "Đã gửi email nhắc nợ thành công"
 * ```
 */
export async function sendDebtReminder(
  id: number,
  includePdf: boolean = true
): Promise<SendDebtReminderResponse> {
  try {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    const response = await axios.post<SendDebtReminderResponse>(
      STATEMENT_ENDPOINTS.SEND_DEBT_REMINDER(id),
      {
        statementId: id,
        includePdf,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Debt reminder sent successfully for statement ID: ${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending debt reminder (ID: ${id}):`, error);
    throw error;
  }
}

// ==================== EXPORT STATEMENT PDF ====================

/**
 * Export statement as PDF file
 * 
 * @param id - Statement ID
 * @param filename - Optional filename for download (default: "Statement_{statementCode}.pdf")
 * @returns void - Triggers browser download
 * 
 * Example:
 * ```typescript
 * await exportStatementPDF(1, 'BK202512-0002.pdf');
 * // Browser will download: BK202512-0002.pdf
 * ```
 */
export async function exportStatementPDF(
  id: number,
  filename?: string
): Promise<void> {
  try {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    const response = await axios.get(
      STATEMENT_ENDPOINTS.EXPORT_PDF(id),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob', // Important: receive file as blob
      }
    );

    // Create blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `Statement_${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log(`✅ Statement PDF exported successfully: ${link.download}`);
  } catch (error) {
    console.error(`❌ Error exporting statement PDF (ID: ${id}):`, error);
    throw error;
  }
}

// ==================== GENERATE STATEMENT ====================

/**
 * Generate statement for a specific customer and period
 * 
 * @param customerID - Customer ID
 * @param month - Month (1-12)
 * @param year - Year (e.g., 2025)
 * @returns StatementDetailResponse - The generated statement details
 * 
 * Example:
 * ```typescript
 * const statement = await generateStatement(123, 12, 2025);
 * console.log(statement.statementCode); // "BK202512-0001"
 * console.log(statement.totalAmount); // 50000000
 * ```
 */
export async function generateStatement(
  customerID: number,
  month: number,
  year: number
): Promise<StatementDetailResponse> {
  try {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    const response = await axios.post<StatementDetailResponse>(
      STATEMENT_ENDPOINTS.GENERATE,
      {
        customerID,
        month,
        year,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Statement generated successfully for customer ${customerID}, ${month}/${year}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error generating statement:', error);
    throw error;
  }
}

// ==================== SEND MONTHLY REMINDERS ====================

/**
 * Send monthly payment reminder emails to customers
 * Auto-retrieves customer emails from database
 * 
 * @returns void
 * 
 * Example:
 * ```typescript
 * await sendMonthlyReminders();
 * // Emails sent to all customers with pending statements
 * ```
 */
export async function sendMonthlyReminders(): Promise<void> {
  try {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    await axios.post(
      STATEMENT_ENDPOINTS.SEND_REMINDERS,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✅ Monthly reminder emails sent successfully');
  } catch (error) {
    console.error('❌ Error sending monthly reminders:', error);
    throw error;
  }
}

// ==================== SEND STATEMENT EMAIL ====================

/**
 * Send email for a specific statement to customer
 * 
 * @param statementId - Statement ID
 * @param statementCode - Statement code (e.g., "ST-1-012026")
 * @param customerName - Customer name
 * @param customerEmail - Customer email address
 * @param period - Statement period (e.g., "01/2026")
 * @returns SendStatementEmailResponse
 * 
 * Example:
 * ```typescript
 * await sendStatementEmail(123, 'ST-1-012026', 'Công ty ABC', 'abc@example.com', '01/2026');
 * // Email sent to customer for statement #123
 * ```
 */
export async function sendStatementEmail(
  statementId: number,
  statementCode: string,
  customerName: string,
  customerEmail: string,
  period: string
): Promise<SendStatementEmailResponse> {
  try {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    
    // Tạo subject và message tự động
    const subject = `Thông báo bảng kê cước - Kỳ ${period} - ${statementCode}`;
    const message = `Kính gửi Quý khách hàng ${customerName},\n\nChúng tôi xin gửi đến Quý khách bảng kê cước cho kỳ ${period}.\n\nMã bảng kê: ${statementCode}\n\nVui lòng xem chi tiết trong file đính kèm.\n\nTrân trọng!`;
    
    const requestBody: SendStatementEmailRequest = {
      statementId,
      recipientEmail: customerEmail,
      ccEmails: [],
      bccEmails: [],
      subject,
      message,
      includePdf: true,
      rootPath: '',
    };
    
    const response = await axios.post<SendStatementEmailResponse>(
      STATEMENT_ENDPOINTS.SEND_EMAIL(statementId),
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Statement email sent successfully for ID: ${statementId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending statement email (ID: ${statementId}):`, error);
    throw error;
  }
}

// ==================== CREATE STATEMENT PAYMENT ====================

/**
 * Create payment record for a statement
 * POST /api/Statement/{id}/payments
 * 
 * @param statementId - Statement ID
 * @param paymentData - Payment information
 * @returns Payment response with updated statement amounts
 * 
 * Example:
 * ```typescript
 * const payment = await createStatementPayment(1, {
 *   statementId: 1,
 *   amount: 1500000000,
 *   paymentMethod: 'Chuyển khoản',
 *   transactionCode: 'TXN123456',
 *   note: 'Thanh toán kỳ 01/2026',
 *   paymentDate: '2026-01-23T10:30:00Z',
 *   createdBy: 5,
 * });
 * console.log('Remaining amount:', payment.remainingAmount);
 * ```
 */
export interface CreateStatementPaymentRequest {
  statementId: number;
  amount: number;
  paymentMethod: string;
  transactionCode?: string;
  note?: string;
  paymentDate: string; // ISO format: "2026-01-23T10:30:00Z"
  createdBy: number;
}

export interface StatementPaymentResponse {
  paymentId: number;
  statementId: number;
  amount: number;
  paymentMethod: string;
  transactionCode: string | null;
  note: string | null;
  paymentDate: string;
  createdBy: number;
  createdAt: string;
  // Updated statement amounts
  remainingAmount?: number;
  paidAmount?: number;
  totalAmount?: number;
}

export async function createStatementPayment(
  statementId: number,
  paymentData: CreateStatementPaymentRequest
): Promise<StatementPaymentResponse> {
  try {
    console.log('[createStatementPayment] Creating payment for statement:', statementId)
    console.log('[createStatementPayment] Payment data:', JSON.stringify(paymentData, null, 2))
    
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    const response = await axios.post<StatementPaymentResponse>(
      STATEMENT_ENDPOINTS.CREATE_PAYMENT(statementId),
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Statement payment created successfully');
    console.log('[createStatementPayment] Response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error creating statement payment (ID: ${statementId}):`, error);
    if (axios.isAxiosError(error)) {
      console.error('[createStatementPayment] Response status:', error.response?.status);
      console.error('[createStatementPayment] Response data:', error.response?.data);
    }
    throw error;
  }
}

// ==================== GET STATEMENT PAYMENTS ====================

/**
 * Statement Payment Record from API
 * ✅ Updated: 23/01/2026 - Added statementPaidAfter, statementBalanceAfter
 */
export interface StatementPaymentRecord {
  statementPaymentId: number;
  paymentId: number;
  invoiceId: number;
  invoiceNumber: number;           // Số hóa đơn
  appliedAmount: number;           // Số tiền thanh toán cho bảng kê
  invoiceRemainingAfter: number;   // Số tiền còn nợ của HÓA ĐƠN sau thanh toán
  statementPaidAfter: number;      // ✅ Tổng đã thanh toán của BẢNG KÊ SAU giao dịch
  statementBalanceAfter: number;   // ✅ Số tiền còn nợ của BẢNG KÊ SAU giao dịch
  paymentDate: string;             // ISO format
  paymentMethod: string;           // "Chuyển khoản", "Tiền mặt", etc.
  transactionCode: string | null;
  note: string | null;
  createdBy: number;
}

/**
 * Statement Payment History Response
 * GET /api/Statement/{id}/payments
 */
export interface StatementPaymentHistoryResponse {
  statementId: number;
  totalAmount: number;             // Tổng tiền bảng kê
  paidAmount: number;              // Đã thanh toán
  balanceDue: number;              // Còn nợ
  statusId: number;                // 1=Draft, 2=Pending, 3=Sent, 4=PartiallyPaid, 5=Paid
  status: string;                  // "Partially Paid", "Paid", etc.
  payments: StatementPaymentRecord[]; // Lịch sử thanh toán
}

/**
 * Get payment history for a statement
 * GET /api/Statement/{id}/payments
 * 
 * @param id - Statement ID
 * @returns Payment history with summary and list of payments
 * 
 * Example:
 * ```typescript
 * const history = await getStatementPayments(1);
 * console.log('Total:', history.totalAmount);
 * console.log('Paid:', history.paidAmount);
 * console.log('Balance:', history.balanceDue);
 * console.log('Payments:', history.payments.length);
 * ```
 */
export async function getStatementPayments(
  id: number
): Promise<StatementPaymentHistoryResponse> {
  try {
    console.log('[getStatementPayments] Fetching payment history for statement:', id)
    
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    const response = await axios.get<StatementPaymentHistoryResponse>(
      STATEMENT_ENDPOINTS.GET_PAYMENTS(id),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✅ Statement payment history fetched successfully');
    console.log('[getStatementPayments] Summary:', {
      totalAmount: response.data.totalAmount,
      paidAmount: response.data.paidAmount,
      balanceDue: response.data.balanceDue,
      status: response.data.status,
      paymentCount: response.data.payments.length,
    });
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching statement payments (ID: ${id}):`, error);
    if (axios.isAxiosError(error)) {
      console.error('[getStatementPayments] Response status:', error.response?.status);
      console.error('[getStatementPayments] Response data:', error.response?.data);
    }
    throw error;
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Format statement date to display format
 * ISO "2025-12-11T00:00:00" → "11/12/2025"
 */
export function formatStatementDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return isoDate; // Fallback to original string
  }
}

/**
 * Format statement date to period format
 * ISO "2025-12-11T00:00:00" → "12/2025"
 */
export function formatStatementPeriod(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${year}`;
  } catch (error) {
    return isoDate;
  }
}

/**
 * Convert StatementListItem to legacy Statement format
 * For backward compatibility with existing code
 * 
 * @deprecated This function is for backward compatibility only
 */
export function convertToLegacyStatement(item: StatementListItem): Statement {
  return {
    id: String(item.statementID),
    code: item.statementCode,
    customerName: item.customerName,
    period: formatStatementPeriod(item.statementDate),
    totalAmount: item.totalAmount,
    status: item.status,
    linkedInvoiceNumber: item.totalInvoices > 0 ? String(item.totalInvoices) : null,
    isEmailSent: false, // Not available in API
    createdDate: formatStatementDate(item.statementDate),
  };
}

// Legacy Statement interface for backward compatibility
interface Statement {
  id: string;
  code: string;
  customerName: string;
  period: string;
  totalAmount: number;
  status: string;
  linkedInvoiceNumber: string | null;
  isEmailSent: boolean;
  createdDate: string;
}
