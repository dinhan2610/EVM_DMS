// ==================== TYPE DEFINITIONS FOR TEMPLATE EDITOR ====================

// Field trong company info hoặc table column
export interface Field {
  id: string
  label: string
  value?: string
  visible: boolean
  hasCode?: boolean
  hasSettings?: boolean
}

// State tổng hợp cho toàn bộ template
export interface TemplateState {
  templateName: string
  invoiceType: 'withCode' | 'withoutCode'
  invoiceDate: string // ISO date string
  symbol: {
    prefix: string
    year: string
  }
  logo: string | null
  logoSize: number // Logo size in pixels (default: 60)
  background: {
    custom: string | null
    frame: string
  }
  company: {
    name: string
    taxCode: string
    address: string
    phone: string
    bankAccount: string
    fields: Field[]
  }
  table: {
    columns: Field[]
    rowCount: number
    sttTitle: string
    sttContent: string
  }
  modelCode: string
  templateCode: string
  // Quick settings
  settings: {
    numberFont: 'arial' | 'times' | 'courier' | 'calibri'
    showQrCode: boolean
    bilingual: boolean
    visibility: {
      showLogo: boolean
      showCompanyName: boolean
      showCompanyTaxCode: boolean
      showCompanyAddress: boolean
      showCompanyPhone: boolean
      showCompanyBankAccount: boolean
      showSignature: boolean
    }
    customerVisibility: {
      customerName: boolean
      customerTaxCode: boolean
      customerAddress: boolean
      customerPhone: boolean
      customerEmail: boolean
      paymentMethod: boolean
    }
  }
}

// Các loại action để cập nhật state
export type TemplateAction =
  | { type: 'SET_TEMPLATE_NAME'; payload: string }
  | { type: 'SET_INVOICE_TYPE'; payload: 'withCode' | 'withoutCode' }
  | { type: 'SET_INVOICE_DATE'; payload: string }
  | { type: 'SET_SYMBOL_YEAR'; payload: string }
  | { type: 'SET_LOGO'; payload: string | null }
  | { type: 'SET_LOGO_SIZE'; payload: number }
  | { type: 'SET_BACKGROUND_CUSTOM'; payload: string | null }
  | { type: 'SET_BACKGROUND_FRAME'; payload: string }
  | { type: 'SET_COMPANY_NAME'; payload: string }
  | { type: 'SET_COMPANY_FIELD'; payload: { id: string; value: string } }
  | { type: 'TOGGLE_COMPANY_FIELD'; payload: string }
  | { type: 'REORDER_COMPANY_FIELDS'; payload: { startIndex: number; endIndex: number } }
  | { type: 'ADD_COMPANY_FIELD'; payload: { label: string; value: string } }
  | { type: 'DELETE_COMPANY_FIELD'; payload: string }
  | { type: 'TOGGLE_TABLE_COLUMN'; payload: string }
  | { type: 'REORDER_TABLE_COLUMNS'; payload: { startIndex: number; endIndex: number } }
  | { type: 'ADD_TABLE_COLUMN'; payload: { label: string } }
  | { type: 'DELETE_TABLE_COLUMN'; payload: string }
  | { type: 'SET_TABLE_ROW_COUNT'; payload: number }
  | { type: 'SET_STT_TITLE'; payload: string }
  | { type: 'SET_STT_CONTENT'; payload: string }
  | { type: 'LOAD_TEMPLATE'; payload: Partial<TemplateState> }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  // Quick settings actions
  | { type: 'SET_NUMBER_FONT'; payload: 'arial' | 'times' | 'courier' | 'calibri' }
  | { type: 'TOGGLE_QR_CODE' }
  | { type: 'TOGGLE_BILINGUAL' }
  | { type: 'TOGGLE_VISIBILITY'; payload: keyof TemplateState['settings']['visibility'] }
  | { type: 'TOGGLE_CUSTOMER_FIELD'; payload: keyof TemplateState['settings']['customerVisibility'] }
  | { type: 'SET_ALL_CUSTOMER_FIELDS'; payload: boolean }
