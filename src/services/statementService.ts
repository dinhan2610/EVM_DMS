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

// ==================== API ENDPOINTS ====================

const STATEMENT_ENDPOINTS = {
  LIST: '/api/Statement',
  DETAIL: (id: number) => `/api/Statement/${id}`,
  EXPORT_PDF: (id: number) => `/api/Statement/${id}/export-pdf`,
  GENERATE: '/api/Statement/generate',
  GENERATE_BATCH: '/api/Statement/generate-batch',
  SEND_REMINDERS: '/api/Statement/send-monthly-reminders',
  SEND_EMAIL: (id: number) => `/api/Statement/${id}/send-email`,
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
 * @param id - Statement ID
 * @returns void
 * 
 * Example:
 * ```typescript
 * await sendStatementEmail(123);
 * // Email sent to customer for statement #123
 * ```
 */
export async function sendStatementEmail(id: number): Promise<void> {
  try {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    await axios.post(
      STATEMENT_ENDPOINTS.SEND_EMAIL(id),
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`✅ Statement email sent successfully for ID: ${id}`);
  } catch (error) {
    console.error(`❌ Error sending statement email (ID: ${id}):`, error);
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
