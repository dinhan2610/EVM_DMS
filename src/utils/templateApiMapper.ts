/**
 * Template API Mapper Utilities
 * 
 * Functions to map between:
 * 1. Template Editor State <-> API Request Schema
 * 2. API Response Schema <-> Template Editor State
 * 
 * This ensures 100% compatibility with the actual API structure.
 */

import type { LayoutDefinitionRequest, LayoutDefinitionResponse } from '@/types/templateApi'

// ==================== EDITOR STATE TYPE ====================

/**
 * Template Editor State (internal representation)
 * This matches the structure used in TemplateEditor.tsx
 */
export interface TemplateEditorState {
  table?: {
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
  company?: {
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
  settings?: {
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
  modelCode?: string
  background?: {
    frame: string
    custom: string | null
  }
  invoiceDate?: string
  templateCode?: string
}

// ==================== MAPPER FUNCTIONS ====================

/**
 * ⚠️ TEMPORARY TEST: Map to OLD API schema (4 fields only)
 * Use this to test if BE expects the old schema
 */
export function mapEditorStateToOldApiRequest(editorState: TemplateEditorState): any {
  return {
    displaySettings: {
      showLogo: editorState.settings?.visibility?.showLogo ?? true,
      showCompanyName: editorState.settings?.visibility?.showCompanyName ?? true,
      showTaxCode: editorState.settings?.visibility?.showCompanyTaxCode ?? false,
      showAddress: editorState.settings?.visibility?.showCompanyAddress ?? true,
      showPhone: editorState.settings?.visibility?.showCompanyPhone ?? true,
      showBankAccount: editorState.settings?.visibility?.showCompanyBankAccount ?? true,
      showSignature: editorState.settings?.visibility?.showSignature ?? true,
      showQrCode: editorState.settings?.showQrCode ?? true,
      isBilingual: editorState.settings?.bilingual ?? false,
    },
    customerSettings: {
      showName: editorState.settings?.customerVisibility?.customerName ?? false,
      showTaxCode: editorState.settings?.customerVisibility?.customerTaxCode ?? false,
      showAddress: editorState.settings?.customerVisibility?.customerAddress ?? false,
      showPhone: editorState.settings?.customerVisibility?.customerPhone ?? false,
      showEmail: editorState.settings?.customerVisibility?.customerEmail ?? false,
      showPaymentMethod: editorState.settings?.customerVisibility?.paymentMethod ?? false,
    },
    tableSettings: {
      minRows: editorState.table?.rowCount ?? 5,
    },
    style: {
      colorTheme: 'default',
      fontFamily: editorState.settings?.numberFont ?? 'arial',
    },
  }
}

/**
 * Map from Template Editor State to API Request Schema
 * 
 * ✅ Returns FULL editor state for 100% data preservation
 * 
 * @param editorState - The current state from TemplateEditor
 * @returns Full LayoutDefinition object matching LayoutDefinitionResponse schema
 */
export function mapEditorStateToApiRequest(editorState: TemplateEditorState): any {
  // ✅ FULL SCHEMA - Preserves ALL data including company info
  return {
    table: editorState.table || {
      columns: [],
      rowCount: 5,
      sttTitle: 'STT',
      sttContent: '[STT]',
    },
    company: editorState.company || {
      name: '',
      phone: '',
      fields: [],
      address: '',
      taxCode: '',
      bankAccount: '',
    },
    settings: {
      bilingual: editorState.settings?.bilingual ?? false,
      numberFont: editorState.settings?.numberFont ?? 'arial',
      showQrCode: editorState.settings?.showQrCode ?? true,
      visibility: {
        showLogo: editorState.settings?.visibility?.showLogo ?? true,
        showSignature: editorState.settings?.visibility?.showSignature ?? true,
        showCompanyName: editorState.settings?.visibility?.showCompanyName ?? true,
        showCompanyPhone: editorState.settings?.visibility?.showCompanyPhone ?? true,
        showCompanyAddress: editorState.settings?.visibility?.showCompanyAddress ?? true,
        showCompanyTaxCode: editorState.settings?.visibility?.showCompanyTaxCode ?? false,
        showCompanyBankAccount: editorState.settings?.visibility?.showCompanyBankAccount ?? true,
      },
      customerVisibility: {
        customerName: editorState.settings?.customerVisibility?.customerName ?? false,
        customerEmail: editorState.settings?.customerVisibility?.customerEmail ?? false,
        customerPhone: editorState.settings?.customerVisibility?.customerPhone ?? false,
        paymentMethod: editorState.settings?.customerVisibility?.paymentMethod ?? false,
        customerAddress: editorState.settings?.customerVisibility?.customerAddress ?? false,
        customerTaxCode: editorState.settings?.customerVisibility?.customerTaxCode ?? false,
      },
    },
    modelCode: editorState.modelCode || '',
    background: editorState.background || {
      frame: '',
      custom: null,
    },
    invoiceDate: editorState.invoiceDate || new Date().toISOString(),
    templateCode: editorState.templateCode || '',
  }
}

/**
 * Map from API Response Schema to Template Editor State
 * 
 * This function converts the API response structure back to the
 * internal editor state format for editing existing templates.
 * 
 * @param apiResponse - The layoutDefinition from API response (parsed from JSON string)
 * @returns Partial TemplateEditorState for editor
 * 
 * @example
 * const layoutDef = JSON.parse(template.layoutDefinition)
 * const editorState = mapApiResponseToEditorState(layoutDef)
 * // Load into TemplateEditor
 */
export function mapApiResponseToEditorState(apiResponse: LayoutDefinitionResponse): TemplateEditorState {
  return {
    table: apiResponse.table,
    company: apiResponse.company,
    settings: apiResponse.settings,
    modelCode: apiResponse.modelCode,
    background: apiResponse.background,
    invoiceDate: apiResponse.invoiceDate,
    templateCode: apiResponse.templateCode,
  }
}

/**
 * Map from API Request Schema to Editor State
 * 
 * This is useful when you want to preview what the API request
 * will look like in the editor format.
 * 
 * @param apiRequest - The API request object
 * @returns Partial TemplateEditorState
 */
export function mapApiRequestToEditorState(apiRequest: LayoutDefinitionRequest): Partial<TemplateEditorState> {
  return {
    settings: {
      bilingual: apiRequest.displaySettings.isBilingual,
      numberFont: apiRequest.style.fontFamily,
      showQrCode: apiRequest.displaySettings.showQrCode,
      visibility: {
        showLogo: apiRequest.displaySettings.showLogo,
        showSignature: apiRequest.displaySettings.showSignature,
        showCompanyName: apiRequest.displaySettings.showCompanyName,
        showCompanyPhone: apiRequest.displaySettings.showPhone,
        showCompanyAddress: apiRequest.displaySettings.showAddress,
        showCompanyTaxCode: apiRequest.displaySettings.showTaxCode,
        showCompanyBankAccount: apiRequest.displaySettings.showBankAccount,
      },
      customerVisibility: {
        customerName: apiRequest.customerSettings.showName,
        customerEmail: apiRequest.customerSettings.showEmail,
        customerPhone: apiRequest.customerSettings.showPhone,
        paymentMethod: apiRequest.customerSettings.showPaymentMethod,
        customerAddress: apiRequest.customerSettings.showAddress,
        customerTaxCode: apiRequest.customerSettings.showTaxCode,
      },
    },
    table: {
      columns: [], // Will be filled from full editor state
      rowCount: apiRequest.tableSettings.minRows,
      sttTitle: 'STT',
      sttContent: '[STT]',
    },
  }
}

/**
 * Merge API Request settings with full Editor State
 * 
 * This preserves the full editor state (table, company, etc.)
 * while updating only the settings that come from API request.
 * 
 * @param editorState - Current full editor state
 * @param apiRequest - API request with new settings
 * @returns Merged editor state
 */
export function mergeApiRequestWithEditorState(
  editorState: TemplateEditorState,
  apiRequest: LayoutDefinitionRequest
): TemplateEditorState {
  const partialState = mapApiRequestToEditorState(apiRequest)
  
  return {
    ...editorState,
    settings: {
      ...editorState.settings,
      ...partialState.settings,
    } as TemplateEditorState['settings'],
    table: {
      ...editorState.table,
      rowCount: apiRequest.tableSettings.minRows,
    } as TemplateEditorState['table'],
  }
}

// ==================== VALIDATION HELPERS ====================

/**
 * Validate if editor state has all required fields for API request
 * 
 * @param editorState - Editor state to validate
 * @returns Object with isValid flag and error messages
 */
export function validateEditorStateForApi(editorState: TemplateEditorState): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!editorState.settings) {
    errors.push('Settings are required')
  }

  if (!editorState.table || !editorState.table.rowCount) {
    errors.push('Table configuration is required')
  }

  if (editorState.table && editorState.table.rowCount < 1) {
    errors.push('Table must have at least 1 row')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate if API request has all required fields
 * 
 * @param apiRequest - API request to validate
 * @returns Object with isValid flag and error messages
 */
export function validateApiRequest(apiRequest: LayoutDefinitionRequest): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!apiRequest.displaySettings) {
    errors.push('displaySettings is required')
  }

  if (!apiRequest.customerSettings) {
    errors.push('customerSettings is required')
  }

  if (!apiRequest.tableSettings) {
    errors.push('tableSettings is required')
  }

  if (!apiRequest.style) {
    errors.push('style is required')
  }

  if (apiRequest.tableSettings && apiRequest.tableSettings.minRows < 1) {
    errors.push('minRows must be at least 1')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Safely parse layoutDefinition JSON string from API response
 * 
 * @param jsonString - The JSON string from API
 * @returns Parsed LayoutDefinitionResponse or null if invalid
 */
export function parseLayoutDefinition(jsonString: string): LayoutDefinitionResponse | null {
  try {
    const parsed = JSON.parse(jsonString)
    
    // Basic validation
    if (typeof parsed !== 'object' || parsed === null) {
      console.error('[parseLayoutDefinition] Invalid JSON structure')
      return null
    }

    return parsed as LayoutDefinitionResponse
  } catch (error) {
    console.error('[parseLayoutDefinition] Failed to parse JSON:', error)
    return null
  }
}

/**
 * Safely stringify layoutDefinition for API update
 * 
 * @param layoutDef - The layout definition object
 * @returns JSON string or empty string if invalid
 */
export function stringifyLayoutDefinition(layoutDef: LayoutDefinitionResponse): string {
  try {
    return JSON.stringify(layoutDef)
  } catch (error) {
    console.error('[stringifyLayoutDefinition] Failed to stringify:', error)
    return ''
  }
}

/**
 * Create a complete LayoutDefinitionResponse from editor state
 * This is used when updating an existing template
 * 
 * @param editorState - Full editor state
 * @returns Complete LayoutDefinitionResponse
 */
export function createLayoutDefinitionResponse(editorState: TemplateEditorState): LayoutDefinitionResponse {
  return {
    table: editorState.table || {
      columns: [],
      rowCount: 5,
      sttTitle: 'STT',
      sttContent: '[STT]',
    },
    company: editorState.company || {
      name: '',
      phone: '',
      fields: [],
      address: '',
      taxCode: '',
      bankAccount: '',
    },
    settings: editorState.settings || {
      bilingual: false,
      numberFont: 'arial',
      showQrCode: true,
      visibility: {
        showLogo: true,
        showSignature: true,
        showCompanyName: true,
        showCompanyPhone: true,
        showCompanyAddress: true,
        showCompanyTaxCode: false,
        showCompanyBankAccount: true,
      },
      customerVisibility: {
        customerName: false,
        customerEmail: false,
        customerPhone: false,
        paymentMethod: false,
        customerAddress: false,
        customerTaxCode: false,
      },
    },
    modelCode: editorState.modelCode || '01GTKT',
    background: editorState.background || {
      frame: '',
      custom: null,
    },
    invoiceDate: editorState.invoiceDate || new Date().toISOString(),
    templateCode: editorState.templateCode || '',
  }
}


