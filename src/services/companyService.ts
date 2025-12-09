/**
 * Company Service - API calls for company information
 */

import axios from 'axios';
import API_CONFIG from '@/config/api.config';

// ==================== TYPES ====================

export interface Company {
  companyID: number;
  companyName: string;
  address: string;
  taxCode: string;
  contactPhone: string;
  accountNumber: string;
  bankName: string;
}

// ==================== API CALLS ====================

const companyService = {
  /**
   * Get company information by ID
   */
  getCompanyById: async (companyId: number): Promise<Company> => {
    try {
      const response = await axios.get<Company>(
        `${API_CONFIG.BASE_URL}/Company/${companyId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'accept': '*/*'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  },

  /**
   * Get default company (ID = 1)
   */
  getDefaultCompany: async (): Promise<Company> => {
    return companyService.getCompanyById(1);
  },

  /**
   * Update company information
   */
  updateCompany: async (companyId: number, data: Omit<Company, 'companyID'>): Promise<Company> => {
    try {
      const response = await axios.put<Company>(
        `${API_CONFIG.BASE_URL}/Company/${companyId}`,
        {
          companyID: companyId,
          ...data
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'accept': '*/*',
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }
};

export default companyService;
