// src/services/customerService.ts

import axios from 'axios';
import API_CONFIG from '@/config/api.config';

// ============================
// INTERFACES
// ============================

export interface Customer {
  customerID: number;
  saleID: number;           // ✅ ID của nhân viên sales phụ trách (0 = chưa assign)
  customerName: string;
  taxCode: string;
  address: string;
  contactEmail: string;
  contactPerson: string;
  contactPhone: string;
  isActive: boolean;
}

export interface CreateCustomerRequest {
  customerName: string;
  taxCode: string;
  address: string;
  contactEmail: string;
  contactPerson: string;
  contactPhone: string;
  isActive: boolean;
}

export interface UpdateCustomerRequest {
  customerName: string;
  taxCode: string;
  address: string;
  contactEmail: string;
  contactPerson: string;
  contactPhone: string;
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
 * Get all customers
 * GET /api/Customer
 * Response: Paginated { items: Customer[], pageIndex, totalPages, totalCount, ... }
 */
export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    console.log('[getAllCustomers] Fetching customers...');
    
    const response = await axios.get<{
      items: Customer[];
      pageIndex: number;
      totalPages: number;
      totalCount: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    }>(
      '/api/Customer',
      { headers: getAuthHeaders() }
    );
    
    // Backend trả về paginated response với items array
    const customers = response.data.items || [];
    
    console.log('[getAllCustomers] Success:', customers.length, 'customers');
    return customers;
  } catch (error) {
    return handleApiError(error, 'getAllCustomers');
  }
};

/**
 * Paginated response from Customer API
 */
export interface CustomerPaginatedResponse {
  items: Customer[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * Get customers by Sale ID (for Sales role)
 * GET /api/Customer?saleId={saleId}
 * 
 * @param saleId - ID của nhân viên Sales
 * @returns Danh sách khách hàng của Sales đó
 */
export const getCustomersBySaleId = async (saleId: number): Promise<Customer[]> => {
  try {
    console.log('[getCustomersBySaleId] Fetching customers for saleId:', saleId);
    
    const response = await axios.get<CustomerPaginatedResponse>(
      `/api/Customer?saleId=${saleId}`,
      { headers: getAuthHeaders() }
    );
    
    const customers = response.data.items || [];
    
    console.log('[getCustomersBySaleId] Success:', customers.length, 'customers for saleId:', saleId);
    return customers;
  } catch (error) {
    return handleApiError(error, 'getCustomersBySaleId');
  }
};

/**
 * Create new customer
 * POST /api/Customer
 */
export const createCustomer = async (
  data: CreateCustomerRequest
): Promise<Customer> => {
  try {
    console.log('[createCustomer] Creating customer:', data.customerName);
    console.log('[createCustomer] Request JSON:', JSON.stringify(data, null, 2));
    
    const response = await axios.post<Customer>(
      '/api/Customer',
      data,
      { headers: getAuthHeaders() }
    );
    
    console.log('[createCustomer] Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('[createCustomer] Error details:', error);
    if (axios.isAxiosError(error)) {
      console.error('[createCustomer] Response status:', error.response?.status);
      console.error('[createCustomer] Response data:', error.response?.data);
    }
    return handleApiError(error, 'createCustomer');
  }
};

/**
 * Update existing customer
 * PUT /api/Customer/{id}
 */
export const updateCustomer = async (
  id: number,
  data: UpdateCustomerRequest
): Promise<Customer> => {
  try {
    console.log('[updateCustomer] Updating customer:', id);
    console.log('[updateCustomer] Request JSON:', JSON.stringify(data, null, 2));
    
    const response = await axios.put<Customer>(
      `/api/Customer/${id}`,
      data,
      { headers: getAuthHeaders() }
    );
    
    console.log('[updateCustomer] Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('[updateCustomer] Error details:', error);
    if (axios.isAxiosError(error)) {
      console.error('[updateCustomer] Response status:', error.response?.status);
      console.error('[updateCustomer] Response data:', error.response?.data);
    }
    return handleApiError(error, 'updateCustomer');
  }
};

/**
 * Set customer status to active
 * PUT /api/Customer/{id}/active
 */
export const setCustomerActive = async (id: number): Promise<void> => {
  try {
    console.log('[setCustomerActive] Activating customer:', id);
    
    await axios.put(
      `/api/Customer/${id}/active`,
      null,
      { headers: getAuthHeaders() }
    );
    
    console.log('[setCustomerActive] Success');
  } catch (error) {
    return handleApiError(error, 'setCustomerActive');
  }
};

/**
 * Set customer status to inactive
 * PUT /api/Customer/{id}/inactive
 */
export const setCustomerInactive = async (id: number): Promise<void> => {
  try {
    console.log('[setCustomerInactive] Deactivating customer:', id);
    
    await axios.put(
      `/api/Customer/${id}/inactive`,
      null,
      { headers: getAuthHeaders() }
    );
    
    console.log('[setCustomerInactive] Success');
  } catch (error) {
    return handleApiError(error, 'setCustomerInactive');
  }
};

/**
 * Find customer by tax code
 * GET /api/Customer/find?q={taxCode}
 * Response: Array with single customer or empty array
 */
export const findCustomerByTaxCode = async (taxCode: string): Promise<Customer | null> => {
  try {
    console.log('[findCustomerByTaxCode] Searching for tax code:', taxCode);
    
    const response = await axios.get<Customer[]>(
      `/api/Customer/find?q=${taxCode}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('[findCustomerByTaxCode] Success:', response.data);
    
    // API trả về array, lấy phần tử đầu tiên nếu có
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log('[findCustomerByTaxCode] Customer not found');
      return null;
    }
    return handleApiError(error, 'findCustomerByTaxCode');
  }
};

// ============================
// EXPORT DEFAULT SERVICE
// ============================

const customerService = {
  getAllCustomers,
  getCustomersBySaleId,  // ✅ Thêm function mới
  createCustomer,
  updateCustomer,
  setCustomerActive,
  setCustomerInactive,
  findCustomerByTaxCode,
};

export default customerService;
