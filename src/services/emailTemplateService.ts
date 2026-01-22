// src/services/emailTemplateService.ts

/**
 * Email Template Service
 * 
 * Manages email templates for invoice notifications, payment reminders, and minutes.
 * 
 * Available Placeholders:
 * - {{CustomerName}}: Tên khách hàng
 * - {{InvoiceNumber}}: Số hóa đơn
 * - {{Serial}}: Ký hiệu hóa đơn
 * - {{IssuedDate}}: Ngày phát hành
 * - {{TotalAmount}}: Tổng tiền
 * - {{LookupCode}}: Mã tra cứu hóa đơn
 * - {{Message}}: Tin nhắn tùy chỉnh
 * - {{AttachmentList}}: Danh sách file đính kèm (HTML list)
 * - {{Reason}}: Lý do điều chỉnh/thu hồi
 * 
 * Template Categories:
 * - invoice: Gửi hóa đơn
 * - payment: Nhắc thanh toán
 * - minutes: Biên bản (điều chỉnh/thu hồi)
 */

import axios from 'axios';
import API_CONFIG from '@/config/api.config';

// ============================
// INTERFACES
// ============================

/**
 * Email Template entity from API
 */
export interface EmailTemplate {
  emailTemplateID: number;
  templateCode: string;
  languageCode: string;
  category: string;
  name: string;
  subject: string;
  bodyContent: string;
  isActive: boolean;
  isSystemTemplate: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Request body for creating new email template
 * POST /api/EmailTemplates
 */
export interface CreateEmailTemplateRequest {
  templateCode: string;
  languageCode: string;
  subject: string;
  category: string;
  bodyContent: string;
  name: string;
  isActive: boolean;
}

/**
 * Request body for updating email template
 * PUT /api/EmailTemplates/{id}
 * Note: emailTemplateID is in URL path, not in body
 */
export interface UpdateEmailTemplateRequest {
  subject: string;
  bodyContent: string;
  category: string;
  name: string;
  isActive: boolean;
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

// ============================
// API FUNCTIONS
// ============================

/**
 * Get all email templates with optional filtering
 * GET /api/EmailTemplates?IsActive={true|false}
 * 
 * @param isActive - Filter by active status (optional)
 * @returns Array of email templates
 * 
 * @example
 * ```typescript
 * // Get all templates
 * const all = await getAllEmailTemplates();
 * 
 * // Get only active templates
 * const active = await getAllEmailTemplates(true);
 * 
 * // Get only inactive templates
 * const inactive = await getAllEmailTemplates(false);
 * ```
 */
export const getAllEmailTemplates = async (isActive?: boolean): Promise<EmailTemplate[]> => {
  try {
    const filterText = isActive !== undefined ? ` (IsActive=${isActive})` : '';
    console.log(`[getAllEmailTemplates] Fetching templates${filterText}...`);
    
    const params = isActive !== undefined ? { IsActive: isActive } : {};
    
    const response = await axios.get<EmailTemplate[]>(
      '/api/EmailTemplates',
      { 
        headers: getAuthHeaders(),
        params 
      }
    );
    
    console.log('[getAllEmailTemplates] Success:', response.data.length, 'templates');
    return response.data;
  } catch (error) {
    return handleApiError(error, 'getAllEmailTemplates');
  }
};

/**
 * Get email template by ID
 * GET /api/EmailTemplates/{id}
 * 
 * @param id - Template ID
 * @returns Email template details
 * 
 * @example
 * ```typescript
 * const template = await getEmailTemplateById(1);
 * console.log(template.subject); // "🔔 [Hóa đơn] #{{InvoiceNumber}}..."
 * ```
 */
export const getEmailTemplateById = async (id: number): Promise<EmailTemplate> => {
  try {
    console.log('[getEmailTemplateById] Fetching template:', id);
    
    const response = await axios.get<EmailTemplate>(
      `/api/EmailTemplates/${id}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('[getEmailTemplateById] Success:', response.data.name);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'getEmailTemplateById');
  }
};

/**
 * Create new email template
 * POST /api/EmailTemplates
 * 
 * @param data - Template data (subject, bodyContent, category, name, languageCode, templateCode, isActive)
 * @returns Created template with generated ID
 * 
 * @example
 * ```typescript
 * const newTemplate = await createEmailTemplate({
 *   subject: "🔔 [Hóa đơn] #{{InvoiceNumber}} - {{CustomerName}}",
 *   bodyContent: "<p>Xin chào {{CustomerName}},</p>...",
 *   category: "invoice",
 *   name: "New Invoice Notification",
 *   languageCode: "vi",
 *   templateCode: "INVOICE_NEW",
 *   isActive: true
 * });
 * ```
 */
export const createEmailTemplate = async (
  data: CreateEmailTemplateRequest
): Promise<EmailTemplate> => {
  try {
    console.log('[createEmailTemplate] Creating template:', data.name);
    console.log('[createEmailTemplate] Request JSON:', JSON.stringify(data, null, 2));
    
    const response = await axios.post<EmailTemplate>(
      '/api/EmailTemplates',
      data,
      { headers: getAuthHeaders() }
    );
    
    console.log('[createEmailTemplate] Success - Template ID:', response.data.emailTemplateID);
    return response.data;
  } catch (error) {
    console.error('[createEmailTemplate] Error details:', error);
    if (axios.isAxiosError(error)) {
      console.error('[createEmailTemplate] Response status:', error.response?.status);
      console.error('[createEmailTemplate] Response data:', error.response?.data);
    }
    return handleApiError(error, 'createEmailTemplate');
  }
};

/**
 * Update existing email template
 * PUT /api/EmailTemplates/{id}
 * 
 * Note: Template ID is in URL path, not in request body
 * 
 * @param id - Template ID to update
 * @param data - Updated template data (subject, bodyContent, category, name, isActive)
 * @returns void
 * 
 * @example
 * ```typescript
 * await updateEmailTemplate(5, {
 *   subject: "Updated subject",
 *   bodyContent: "<p>Updated content</p>",
 *   category: "invoice",
 *   name: "Updated Template Name",
 *   isActive: true
 * });
 * ```
 */
export const updateEmailTemplate = async (
  id: number,
  data: UpdateEmailTemplateRequest
): Promise<void> => {
  try {
    console.log('[updateEmailTemplate] Updating template ID:', id);
    console.log('[updateEmailTemplate] Request JSON:', JSON.stringify(data, null, 2));
    
    await axios.put(
      `/api/EmailTemplates/${id}`,
      data,
      { headers: getAuthHeaders() }
    );
    
    console.log('[updateEmailTemplate] Success - Template updated');
  } catch (error) {
    console.error('[updateEmailTemplate] Error details:', error);
    if (axios.isAxiosError(error)) {
      console.error('[updateEmailTemplate] Response status:', error.response?.status);
      console.error('[updateEmailTemplate] Response data:', error.response?.data);
    }
    return handleApiError(error, 'updateEmailTemplate');
  }
};

/**
 * Delete email template
 * DELETE /api/EmailTemplates/{id}
 * 
 * @param id - Template ID to delete
 * @returns void
 * 
 * @example
 * ```typescript
 * await deleteEmailTemplate(5);
 * console.log('Template deleted successfully');
 * ```
 */
export const deleteEmailTemplate = async (id: number): Promise<void> => {
  try {
    console.log('[deleteEmailTemplate] Deleting template ID:', id);
    
    await axios.delete(
      `/api/EmailTemplates/${id}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('[deleteEmailTemplate] Success - Template deleted');
  } catch (error) {
    return handleApiError(error, 'deleteEmailTemplate');
  }
};

// ============================
// EXPORT DEFAULT SERVICE
// ============================

const emailTemplateService = {
  getAllEmailTemplates,
  getEmailTemplateById,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
};

export default emailTemplateService;
