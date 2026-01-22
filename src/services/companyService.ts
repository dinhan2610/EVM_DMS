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
  logoUrl?: string;            // ✅ URL của logo công ty
  taxAuthorityCode?: string;  // ✅ Mã cơ quan thuế (6 digits: 100394, 100395) - Optional
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
  },

  /**
   * Upload company logo
   * @param file - Logo file to upload
   * @returns Updated company with new logoUrl
   */
  uploadLogo: async (file: File): Promise<Company> => {
    try {
      const formData = new FormData();
      formData.append('File', file);
      formData.append('CompanyId', '1'); // Cố định company ID = 1

      const response = await axios.post<Company>(
        `${API_CONFIG.BASE_URL}/Company/1/logo`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'accept': '*/*',
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  }
};

export default companyService;
