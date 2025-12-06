/**
 * Centralized Type Definitions for Invoice Template System
 * 
 * This file contains all shared interfaces and types used across:
 * - InvoiceTemplatePreview.tsx (unified component for preview & print)
 * - TemplateEditor.tsx
 * - TemplatePreviewPage.tsx
 * 
 * Benefits:
 * - Single source of truth for all template-related types
 * - Easier maintenance and updates
 * - Better type consistency across components
 * - Reduced code duplication
 */

// ==================== PRODUCT & ITEM TYPES ====================

/**
 * Represents a product/service item in the invoice
 */
export interface ProductItem {
  stt: number;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number; // Changed from 'price' to 'unitPrice' for clarity
  total?: number; // Optional, can be calculated from quantity * unitPrice
}

/**
 * Invoice item structure (used in creation forms)
 */
export interface InvoiceItem {
  id: string | number;
  productId?: number;       // ✅ ID sản phẩm từ DB (nếu chọn từ danh sách)
  description?: string;
  name?: string;
  code?: string;
  type?: string;
  unit: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  priceAfterTax?: number;
  discountPercent?: number;
  discountAmount?: number;
  total: number;
  totalAfterTax?: number;
}

// ==================== TEMPLATE CONFIGURATION ====================

/**
 * Company and template basic configuration
 */
export interface TemplateConfigProps {
  companyLogo: string | null;
  companyName: string;
  companyTaxCode: string;
  companyAddress: string;
  companyPhone: string;
  modelCode: string;
  templateCode: string;
}

/**
 * Visibility settings for company information sections
 */
export interface TemplateVisibility {
  showQrCode?: boolean;
  showLogo?: boolean;
  showCompanyInfo?: boolean;
  showCustomerInfo?: boolean;
  showPaymentInfo?: boolean;
  showSignature?: boolean;
  showCompanyName?: boolean;
  showCompanyTaxCode?: boolean;
  showCompanyAddress?: boolean;
  showCompanyPhone?: boolean;
  showCompanyBankAccount?: boolean;
}

/**
 * Visibility settings for customer information fields
 */
export interface CustomerVisibility {
  customerName: boolean;
  customerTaxCode: boolean;
  customerAddress: boolean;
  customerPhone: boolean;
  customerEmail: boolean;
  paymentMethod: boolean;
}

/**
 * Invoice symbol configuration (e.g., "1C25TAA")
 * Structure: [invoiceType][taxCode][year][invoiceForm][management]
 * Example: 1C25TAA = Loại 1 (GTGT), có mã CQT, năm 2025, doanh nghiệp, quản lý AA
 */
export interface InvoiceSymbol {
  invoiceType: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'; // Loại hóa đơn (1-9)
  taxCode: 'C' | 'K'; // C: Có mã CQT, K: Không mã CQT
  year: string; // 2 chữ số năm (VD: 25)
  invoiceForm: 'T' | 'D' | 'L' | 'M' | 'N' | 'B' | 'G' | 'H' | 'X'; // Loại hóa đơn điện tử
  management: string; // 2 ký tự quản lý mẫu (VD: AA)
}

// ==================== COMPONENT PROPS ====================

/**
 * Props for InvoiceTemplatePreview component (unified for both preview and print)
 */
export interface InvoiceTemplatePreviewProps {
  config: TemplateConfigProps;
  visibility?: TemplateVisibility;
  products?: ProductItem[]; // NEW: Support actual product data
  blankRows?: number;
  backgroundFrame?: string;
  bilingual?: boolean;
  invoiceDate?: string;
  logoSize?: number;
  invoiceType?: 'withCode' | 'withoutCode';
  symbol?: InvoiceSymbol;
  customerVisibility?: CustomerVisibility;
  customerInfo?: CustomerInfo; // NEW: Actual customer data for invoices
  paymentMethod?: string; // NEW: Payment method from invoice
  invoiceNumber?: number | string; // NEW: Actual invoice number
  taxAuthorityCode?: string | null; // NEW: Tax authority code
  notes?: string | null; // NEW: Invoice notes
}

// NOTE: InvoiceTemplatePrintProps has been removed.
// We now use InvoiceTemplatePreview for both preview and print functionality.

// ==================== CUSTOMER & INVOICE DETAILS ====================

/**
 * Customer information structure
 */
export interface CustomerInfo {
  name: string;           // Tên công ty/đơn vị
  email: string;
  taxCode: string;
  address: string;
  phone?: string;
  buyerName?: string;     // ✅ Họ tên người mua hàng (có thể để trống)
}

/**
 * Invoice details structure (for forms using date pickers)
 */
export interface InvoiceDetails {
  issueDate: unknown | null; // Dayjs | Date | null - flexible for different implementations
  dueDate: unknown | null; // Dayjs | Date | null - flexible for different implementations
  notes: string;
}

// ==================== DEFAULT VALUES ====================

/**
 * Default visibility settings for company information
 */
export const DEFAULT_TEMPLATE_VISIBILITY: TemplateVisibility = {
  showQrCode: true,
  showLogo: true,
  showCompanyInfo: true,
  showCustomerInfo: true,
  showPaymentInfo: true,
  showSignature: true,
  showCompanyName: true,
  showCompanyTaxCode: true,
  showCompanyAddress: true,
  showCompanyPhone: true,
  showCompanyBankAccount: true,
};

/**
 * Default visibility settings for customer information
 */
export const DEFAULT_CUSTOMER_VISIBILITY: CustomerVisibility = {
  customerName: false,
  customerTaxCode: false,
  customerAddress: false,
  customerPhone: false,
  customerEmail: false,
  paymentMethod: false,
};

/**
 * Default invoice symbol
 */
export const DEFAULT_INVOICE_SYMBOL: InvoiceSymbol = {
  invoiceType: '1', // HĐ điện tử GTGT
  taxCode: 'C', // Có mã CQT
  year: new Date().getFullYear().toString().slice(-2), // Năm hiện tại (2 số cuối)
  invoiceForm: 'T', // Doanh nghiệp
  management: 'AA', // Quản lý mẫu
};

// ==================== CONSTANTS ====================

/**
 * Pagination constants for multi-page invoices
 * Optimized for better space utilization
 */
export const INVOICE_PAGINATION = {
  ROWS_PER_FIRST_PAGE: 18,  // First page: full header + 18 rows (tối ưu không gian)
  ROWS_PER_NEXT_PAGE: 20,    // Subsequent pages: table only + 20 rows (cân đối)
} as const;

/**
 * Default template values
 */
export const TEMPLATE_DEFAULTS = {
  BLANK_ROWS: 8,
  BACKGROUND_FRAME: '/khunghoadon.png',
  LOGO_SIZE: 150,
  INVOICE_TYPE: 'withCode' as const,
} as const;

// ==================== TYPE GUARDS ====================

/**
 * Type guard to check if an item is a ProductItem
 */
export function isProductItem(item: unknown): item is ProductItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'stt' in item &&
    'name' in item &&
    'unit' in item &&
    'quantity' in item &&
    'price' in item &&
    'total' in item
  );
}

/**
 * Type guard to check if an item is an InvoiceItem
 */
export function isInvoiceItem(item: unknown): item is InvoiceItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'unit' in item &&
    'quantity' in item &&
    'total' in item
  );
}
