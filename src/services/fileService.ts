/**
 * File Service - API calls for file management
 * Backend API Group: /api/File
 */

import axios from 'axios';
import API_CONFIG from '@/config/api.config';

// ==================== AUTH HELPERS ====================

const getAuthHeaders = () => {
  const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

// ==================== TYPES ====================

export interface ConvertHtmlToPdfRequest {
  html: string;
}

export interface UploadFileResponse {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface GenerateXmlResponse {
  xmlContent: string;
  fileName: string;
}

// ==================== FILE UPLOAD ====================

/**
 * Upload generic file
 * POST /api/File/upload
 */
export const uploadFile = async (file: File): Promise<UploadFileResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<UploadFileResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FILE.UPLOAD}`,
      formData,
      {
        headers: {
          Authorization: getAuthHeaders().Authorization,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('[uploadFile] Error:', error);
    throw error;
  }
};

/**
 * Upload template logo/image
 * POST /api/File/upload-template-image
 */
export const uploadTemplateImage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<{ url: string }>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FILE.UPLOAD_TEMPLATE_IMAGE}`,
      formData,
      {
        headers: {
          Authorization: getAuthHeaders().Authorization,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.url;
  } catch (error) {
    console.error('[uploadTemplateImage] Error:', error);
    throw error;
  }
};

// ==================== XML OPERATIONS ====================

/**
 * Upload XML file to tax authority
 * POST /api/File/uploadXML
 */
export const uploadXML = async (file: File): Promise<UploadFileResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<UploadFileResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FILE.UPLOAD_XML}`,
      formData,
      {
        headers: {
          Authorization: getAuthHeaders().Authorization,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('[uploadXML] Error:', error);
    throw error;
  }
};

/**
 * Convert PDF to XML
 * POST /api/File/convert-pdf-xml
 */
export const convertPdfToXml = async (file: File): Promise<GenerateXmlResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<GenerateXmlResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FILE.CONVERT_PDF_XML}`,
      formData,
      {
        headers: {
          Authorization: getAuthHeaders().Authorization,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('[convertPdfToXml] Error:', error);
    throw error;
  }
};

/**
 * Generate XML for invoice (for tax authority submission)
 * POST /api/File/generate-xml/{invoiceId}
 */
export const generateInvoiceXml = async (invoiceId: number): Promise<Blob> => {
  try {
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FILE.GENERATE_XML(invoiceId)}`,
      {},
      {
        headers: getAuthHeaders(),
        responseType: 'blob',
      }
    );

    return response.data;
  } catch (error) {
    console.error('[generateInvoiceXml] Error:', error);
    throw error;
  }
};

// ==================== HTML TO PDF CONVERSION ====================

/**
 * ⭐ Convert HTML to PDF (Backend rendering)
 * POST /api/File/pdf-from-html
 * 
 * Use case:
 * - Export invoice HTML to PDF với backend rendering
 * - Consistent font và formatting
 * - Better quality than frontend html2pdf
 * 
 * @param html - Complete HTML string (self-contained)
 * @returns PDF file as Blob
 * 
 * @example
 * ```typescript
 * const html = exportTemplateToHTML(previewElement);
 * const pdfBlob = await convertHtmlToPdf(html);
 * const url = URL.createObjectURL(pdfBlob);
 * window.open(url); // Open in new tab
 * ```
 */
export const convertHtmlToPdf = async (html: string): Promise<Blob> => {
  try {
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FILE.HTML_TO_PDF}`,
      { html },
      {
        headers: getAuthHeaders(),
        responseType: 'blob',
      }
    );

    return response.data;
  } catch (error) {
    console.error('[convertHtmlToPdf] Error:', error);
    throw error;
  }
};

/**
 * Download PDF from Blob
 * Helper function to trigger download
 */
export const downloadPdfBlob = (blob: Blob, filename: string = 'invoice.pdf') => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Open PDF in new tab
 * Helper function to preview PDF
 */
export const openPdfInNewTab = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

// ==================== EXPORTS ====================

const fileService = {
  // Generic Upload
  uploadFile,
  uploadTemplateImage,
  
  // XML Operations
  uploadXML,
  convertPdfToXml,
  generateInvoiceXml,
  
  // PDF Conversion ⭐
  convertHtmlToPdf,
  downloadPdfBlob,
  openPdfInNewTab,
};

export default fileService;
