// src/services/emailTemplateService.ts

import axios from 'axios';
import API_CONFIG from '@/config/api.config';

// ============================
// INTERFACES
// ============================

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

export interface CreateEmailTemplateRequest {
  templateCode: string;
  languageCode: string;
  subject: string;
  category: string;
  bodyContent: string;
  name: string;
  isActive: boolean;
}

export interface UpdateEmailTemplateRequest {
  emailTemplateID: number;
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
 * Get all email templates
 * GET /api/EmailTemplates
 */
export const getAllEmailTemplates = async (): Promise<EmailTemplate[]> => {
  try {
    console.log('[getAllEmailTemplates] Fetching templates...');
    
    const response = await axios.get<EmailTemplate[]>(
      '/api/EmailTemplates',
      { headers: getAuthHeaders() }
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
 */
export const getEmailTemplateById = async (id: number): Promise<EmailTemplate> => {
  try {
    console.log('[getEmailTemplateById] Fetching template:', id);
    
    const response = await axios.get<EmailTemplate>(
      `/api/EmailTemplates/${id}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('[getEmailTemplateById] Success:', response.data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'getEmailTemplateById');
  }
};

/**
 * Create new email template
 * POST /api/EmailTemplates
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
    
    console.log('[createEmailTemplate] Success:', response.data);
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
 */
export const updateEmailTemplate = async (
  id: number,
  data: UpdateEmailTemplateRequest
): Promise<void> => {
  try {
    console.log('[updateEmailTemplate] Updating template:', id);
    console.log('[updateEmailTemplate] Request JSON:', JSON.stringify(data, null, 2));
    
    await axios.put(
      `/api/EmailTemplates/${id}`,
      data,
      { headers: getAuthHeaders() }
    );
    
    console.log('[updateEmailTemplate] Success');
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
 */
export const deleteEmailTemplate = async (id: number): Promise<void> => {
  try {
    console.log('[deleteEmailTemplate] Deleting template:', id);
    
    await axios.delete(
      `/api/EmailTemplates/${id}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('[deleteEmailTemplate] Success');
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
