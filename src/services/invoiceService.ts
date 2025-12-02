/**
 * Invoice Service - API calls for invoice management
 */

import axios from 'axios';
import API_CONFIG from '@/config/api.config';

// ==================== TYPES ====================

export interface Template {
  templateID: number;
  templateName: string;
  serial: string;
  templateTypeName: string;
  frameUrl: string;
  isActive: boolean;
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
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE.GET_ALL}`,
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

// ==================== EXPORTS ====================

const invoiceService = {
  getAllTemplates,
  getActiveTemplates,
};

export default invoiceService;


