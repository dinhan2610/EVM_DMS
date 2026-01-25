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

// Paginated response from backend
export interface PaginatedResponse<T> {
  items: T[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateCustomerRequest {
  saleID: number | null;   // ✅ ID nhân viên sales phụ trách (null = unassigned)
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
 * Get all customers (fetches ALL pages)
 * GET /api/Customer?PageNumber=1&PageSize=1000
 * Response: Paginated { items: Customer[], pageIndex, totalPages, totalCount, ... }
 * 
 * ⚠️ Note: API uses pagination. This function fetches with large PageSize to get all.
 * For very large datasets (>1000), consider using getCustomersPaginated() instead.
 */
export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    console.log('[getAllCustomers] Fetching all customers...');
    
    // First request to get totalCount
    const firstResponse = await axios.get<PaginatedResponse<Customer>>(
      '/api/Customer',
      { 
        headers: getAuthHeaders(),
        params: {
          PageNumber: 1,
          PageSize: 1000  // Large page size to get all in one request
        }
      }
    );
    
    const { items, totalCount, totalPages } = firstResponse.data;
    console.log(`[getAllCustomers] Got ${items.length}/${totalCount} customers (${totalPages} pages)`);
    
    // If all items fit in first page, return immediately
    if (items.length >= totalCount || totalPages <= 1) {
      console.log('[getAllCustomers] All customers fetched in single request');
      return items;
    }
    
    // Otherwise, fetch remaining pages in parallel
    const allCustomers = [...items];
    const remainingPageRequests = [];
    
    for (let page = 2; page <= totalPages; page++) {
      remainingPageRequests.push(
        axios.get<PaginatedResponse<Customer>>(
          '/api/Customer',
          { 
            headers: getAuthHeaders(),
            params: {
              PageNumber: page,
              PageSize: 1000
            }
          }
        )
      );
    }
    
    const remainingResponses = await Promise.all(remainingPageRequests);
    for (const response of remainingResponses) {
      allCustomers.push(...response.data.items);
    }
    
    console.log('[getAllCustomers] Success:', allCustomers.length, 'total customers');
    return allCustomers;
  } catch (error) {
    return handleApiError(error, 'getAllCustomers');
  }
};

/**
 * Get customers with pagination (for paginated UI)
 * GET /api/Customer?PageNumber=X&PageSize=Y&SearchTerm=Z
 */
export const getCustomersPaginated = async (params: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
}): Promise<PaginatedResponse<Customer>> => {
  try {
    const { pageNumber = 1, pageSize = 10, searchTerm } = params;
    console.log('[getCustomersPaginated] Fetching page', pageNumber, 'size', pageSize);
    
    const response = await axios.get<PaginatedResponse<Customer>>(
      '/api/Customer',
      { 
        headers: getAuthHeaders(),
        params: {
          PageNumber: pageNumber,
          PageSize: pageSize,
          ...(searchTerm && { SearchTerm: searchTerm })
        }
      }
    );
    
    console.log('[getCustomersPaginated] Success:', response.data.items.length, 'items, total:', response.data.totalCount);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'getCustomersPaginated');
  }
};

/**
 * Get only active customers (isActive = true)
 * GET /api/Customer/active?PageNumber=1&PageSize=1000
 * Response: Paginated { items: Customer[], pageIndex, totalPages, totalCount, ... }
 * 
 * ✅ USE THIS for invoice/request creation to prevent inactive customers from being selected
 */
export const getActiveCustomers = async (): Promise<Customer[]> => {
  try {
    console.log('[getActiveCustomers] Fetching active customers...');
    
    // First request to get totalCount
    const firstResponse = await axios.get<PaginatedResponse<Customer>>(
      '/api/Customer/active',
      { 
        headers: getAuthHeaders(),
        params: {
          PageNumber: 1,
          PageSize: 1000  // Large page size to get all in one request
        }
      }
    );
    
    const { items, totalCount, totalPages } = firstResponse.data;
    console.log(`[getActiveCustomers] Got ${items.length}/${totalCount} active customers (${totalPages} pages)`);
    
    // If all items fit in first page, return immediately
    if (items.length >= totalCount || totalPages <= 1) {
      console.log('[getActiveCustomers] All active customers fetched in single request');
      return items;
    }
    
    // Otherwise, fetch remaining pages in parallel
    const allCustomers = [...items];
    const remainingPageRequests = [];
    
    for (let page = 2; page <= totalPages; page++) {
      remainingPageRequests.push(
        axios.get<PaginatedResponse<Customer>>(
          '/api/Customer/active',
          { 
            headers: getAuthHeaders(),
            params: {
              PageNumber: page,
              PageSize: 1000
            }
          }
        )
      );
    }
    
    const remainingResponses = await Promise.all(remainingPageRequests);
    for (const response of remainingResponses) {
      allCustomers.push(...response.data.items);
    }
    
    console.log('[getActiveCustomers] Success:', allCustomers.length, 'total active customers');
    return allCustomers;
  } catch (error) {
    return handleApiError(error, 'getActiveCustomers');
  }
};

/**
 * Get customers by Sale ID (for Sales role)
 * GET /api/Customer/by-sale/{saleId}?PageNumber=1&PageSize=1000
 * 
 * @param saleId - ID của nhân viên Sales
 * @returns Danh sách tất cả khách hàng của Sales đó
 */
export const getCustomersBySaleId = async (saleId: number): Promise<Customer[]> => {
  try {
    console.log('[getCustomersBySaleId] Fetching all customers for saleId:', saleId);
    
    // First request to get totalCount
    const firstResponse = await axios.get<PaginatedResponse<Customer>>(
      `/api/Customer/by-sale/${saleId}`,
      { 
        headers: getAuthHeaders(),
        params: {
          PageNumber: 1,
          PageSize: 1000
        }
      }
    );
    
    const { items, totalCount, totalPages } = firstResponse.data;
    console.log(`[getCustomersBySaleId] Got ${items.length}/${totalCount} customers (${totalPages} pages)`);
    
    // If all items fit in first page, return immediately
    if (items.length >= totalCount || totalPages <= 1) {
      return items;
    }
    
    // Otherwise, fetch remaining pages in parallel
    const allCustomers = [...items];
    const remainingPageRequests = [];
    
    for (let page = 2; page <= totalPages; page++) {
      remainingPageRequests.push(
        axios.get<PaginatedResponse<Customer>>(
          `/api/Customer/by-sale/${saleId}`,
          { 
            headers: getAuthHeaders(),
            params: {
              PageNumber: page,
              PageSize: 1000
            }
          }
        )
      );
    }
    
    const remainingResponses = await Promise.all(remainingPageRequests);
    for (const response of remainingResponses) {
      allCustomers.push(...response.data.items);
    }
    
    console.log('[getCustomersBySaleId] Success:', allCustomers.length, 'total customers for saleId:', saleId);
    return allCustomers;
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
 * Get customer by ID
 * GET /api/Customer/{id}
 * Response: Single customer object
 */
export const getCustomerById = async (id: number): Promise<Customer> => {
  try {
    console.log('[getCustomerById] Fetching customer:', id);
    
    const response = await axios.get<Customer>(
      `/api/Customer/${id}`,
      { headers: getAuthHeaders() }
    );
    
    console.log('[getCustomerById] Success:', response.data);
    return response.data;
  } catch (error) {
    return handleApiError(error, `getCustomerById(${id})`);
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
  getActiveCustomers,
  getCustomersBySaleId,
  getCustomersPaginated,   // 🆕 New paginated function
  getCustomerById,         // 🆕 Get single customer by ID
  createCustomer,
  updateCustomer,
  setCustomerActive,
  setCustomerInactive,
  findCustomerByTaxCode,
};

export default customerService;
