/**
 * Template API Type Definitions
 *
 * This file contains type definitions that match 100% with the actual API schema.
 * Separated from internal template editor types for clarity.
 *
 * API Endpoint: POST /api/InvoiceTemplate
 * API Endpoint: GET /api/InvoiceTemplate
 * API Endpoint: PUT /api/InvoiceTemplate/{id}
 */

// ==================== API REQUEST SCHEMA ====================

/**
 * Layout Definition for API Request (POST/PUT)
 * This is the structure the API expects when creating/updating templates
 */
export interface LayoutDefinitionRequest {
  displaySettings: {
    showLogo: boolean
    showCompanyName: boolean
    showTaxCode: boolean
    showAddress: boolean
    showPhone: boolean
    showBankAccount: boolean
    showSignature: boolean
    showQrCode: boolean
    isBilingual: boolean
  }
  customerSettings: {
    showName: boolean
    showTaxCode: boolean
    showAddress: boolean
    showPhone: boolean
    showEmail: boolean
    showPaymentMethod: boolean
  }
  tableSettings: {
    minRows: number
  }
  style: {
    colorTheme: string
    fontFamily: string
  }
}

/**
 * Create Template Request Body
 *
 * ✅ AXIOS HANDLES SERIALIZATION
 * Send layoutDefinition as object, Axios will stringify entire body
 */
export interface CreateTemplateApiRequest {
  templateName: string
  serialID: number
  templateTypeID: number
  layoutDefinition: LayoutDefinitionRequest | LayoutDefinitionResponse | Record<string, unknown> // ✅ Object (Axios will stringify)
  templateFrameID: number
  logoUrl: string | null
  renderedHtml?: string // ✅ Template HTML for PDF generation
}

/**
 * Update Template Request Body
 *
 * ✅ CRITICAL: Backend expects layoutDefinition as OBJECT (same as CREATE)
 * Axios will automatically stringify the entire request body
 * Do NOT manually stringify layoutDefinition
 */
export interface UpdateTemplateApiRequest {
  templateID: number
  templateName: string
  layoutDefinition: LayoutDefinitionRequest | LayoutDefinitionResponse | Record<string, unknown> // ✅ OBJECT (Axios will stringify) - NOT string!
  templateFrameID: number
  logoUrl: string | null
  isActive: boolean
  renderedHtml?: string // ✅ Template HTML for PDF generation
}

// ==================== API RESPONSE SCHEMA ====================

/**
 * Layout Definition from API Response (GET)
 * This is the structure stored in the database and returned by the API
 */
export interface LayoutDefinitionResponse {
  table: {
    columns: Array<{
      id: string
      label: string
      hasCode: boolean
      visible: boolean
    }>
    rowCount: number
    sttTitle: string
    sttContent: string
  }
  company: {
    name: string
    phone: string
    fields: Array<{
      id: string
      label: string
      value: string
      visible: boolean
    }>
    address: string
    taxCode: string
    bankAccount: string
  }
  settings: {
    bilingual: boolean
    numberFont: string
    showQrCode: boolean
    visibility: {
      showLogo: boolean
      showSignature: boolean
      showCompanyName: boolean
      showCompanyPhone: boolean
      showCompanyAddress: boolean
      showCompanyTaxCode: boolean
      showCompanyBankAccount: boolean
    }
    customerVisibility: {
      customerName: boolean
      customerEmail: boolean
      customerPhone: boolean
      paymentMethod: boolean
      customerAddress: boolean
      customerTaxCode: boolean
    }
  }
  modelCode: string
  background: {
    frame: string
    custom: string | null
  }
  invoiceDate: string
  templateCode: string
}

/**
 * Template Response from API (Both List and Detail)
 */
export interface TemplateApiResponse {
  templateID: number
  templateName: string
  isActive: boolean
  serialID: number
  serial: string
  templateTypeID: number
  templateTypeName: string
  templateFrameID: number
  frameUrl: string | null
  logoUrl: string | null
  layoutDefinition: string // ✅ JSON STRING in response
}

// ==================== HELPER TYPES ====================

/**
 * Parsed Template Response (with layoutDefinition as object)
 */
export interface ParsedTemplateResponse extends Omit<TemplateApiResponse, 'layoutDefinition'> {
  layoutDefinition: LayoutDefinitionResponse
}

/**
 * Template Type IDs
 */
export enum TemplateTypeID {
  WithCode = 1, // Hóa đơn có mã CQT
  WithoutCode = 2, // Hóa đơn không mã CQT
}

/**
 * Default values for layout definition request
 */
export const DEFAULT_LAYOUT_DEFINITION_REQUEST: LayoutDefinitionRequest = {
  displaySettings: {
    showLogo: true,
    showCompanyName: true,
    showTaxCode: false,
    showAddress: true,
    showPhone: true,
    showBankAccount: true,
    showSignature: true,
    showQrCode: true,
    isBilingual: false,
  },
  customerSettings: {
    showName: false,
    showTaxCode: false,
    showAddress: false,
    showPhone: false,
    showEmail: false,
    showPaymentMethod: false,
  },
  tableSettings: {
    minRows: 5,
  },
  style: {
    colorTheme: 'default',
    fontFamily: 'arial',
  },
}

// ==================== TYPE GUARDS ====================

/**
 * Check if a value is a valid LayoutDefinitionRequest
 */
export function isLayoutDefinitionRequest(value: unknown): value is LayoutDefinitionRequest {
  if (typeof value !== 'object' || value === null) return false

  const obj = value as Record<string, unknown>

  return 'displaySettings' in obj && 'customerSettings' in obj && 'tableSettings' in obj && 'style' in obj
}

/**
 * Check if a value is a valid LayoutDefinitionResponse
 */
export function isLayoutDefinitionResponse(value: unknown): value is LayoutDefinitionResponse {
  if (typeof value !== 'object' || value === null) return false

  const obj = value as Record<string, unknown>

  return 'table' in obj && 'company' in obj && 'settings' in obj && 'modelCode' in obj
}
