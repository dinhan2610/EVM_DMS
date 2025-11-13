import { useReducer, useCallback } from 'react'
import { TemplateState, TemplateAction } from '@/types/templateEditor'

// ==================== TEMPLATE REDUCER ====================

const templateReducer = (state: TemplateState, action: TemplateAction): TemplateState => {
  switch (action.type) {
    case 'SET_TEMPLATE_NAME':
      return { ...state, templateName: action.payload }
    
    case 'SET_INVOICE_TYPE': {
      const newType = action.payload
      const newModelCode = newType === 'withCode' ? '01GTKT' : '02GTTT'
      return { ...state, invoiceType: newType, modelCode: newModelCode }
    }
    
    case 'SET_INVOICE_DATE':
      return { ...state, invoiceDate: action.payload }
    
    case 'SET_SYMBOL_YEAR': {
      const newYear = action.payload
      const newTemplateCode = `${state.symbol.prefix}${newYear}`
      return {
        ...state,
        symbol: { ...state.symbol, year: newYear },
        templateCode: newTemplateCode,
      }
    }
    
    case 'SET_LOGO':
      // Cleanup old blob URL if exists
      if (state.logo && state.logo.startsWith('blob:')) {
        URL.revokeObjectURL(state.logo)
      }
      return { ...state, logo: action.payload }
    
    case 'SET_LOGO_SIZE':
      return { ...state, logoSize: action.payload }
    
    case 'SET_BACKGROUND_CUSTOM':
      if (state.background.custom && state.background.custom.startsWith('blob:')) {
        URL.revokeObjectURL(state.background.custom)
      }
      return { ...state, background: { ...state.background, custom: action.payload } }
    
    case 'SET_BACKGROUND_FRAME':
      return { ...state, background: { ...state.background, frame: action.payload } }
    
    case 'SET_COMPANY_NAME':
      return { ...state, company: { ...state.company, name: action.payload } }
    
    case 'SET_COMPANY_FIELD':
      return {
        ...state,
        company: {
          ...state.company,
          fields: state.company.fields.map((f) =>
            f.id === action.payload.id ? { ...f, value: action.payload.value } : f
          ),
        },
      }
    
    case 'TOGGLE_COMPANY_FIELD':
      return {
        ...state,
        company: {
          ...state.company,
          fields: state.company.fields.map((f) =>
            f.id === action.payload ? { ...f, visible: !f.visible } : f
          ),
        },
      }
    
    case 'REORDER_COMPANY_FIELDS': {
      const newFields = Array.from(state.company.fields)
      const [removed] = newFields.splice(action.payload.startIndex, 1)
      newFields.splice(action.payload.endIndex, 0, removed)
      return { ...state, company: { ...state.company, fields: newFields } }
    }
    
    case 'ADD_COMPANY_FIELD': {
      const newField = {
        id: `field-${Date.now()}`,
        label: action.payload.label,
        value: action.payload.value,
        visible: true,
      }
      return {
        ...state,
        company: { ...state.company, fields: [...state.company.fields, newField] },
      }
    }
    
    case 'DELETE_COMPANY_FIELD':
      return {
        ...state,
        company: {
          ...state.company,
          fields: state.company.fields.filter((f) => f.id !== action.payload),
        },
      }
    
    case 'TOGGLE_TABLE_COLUMN':
      return {
        ...state,
        table: {
          ...state.table,
          columns: state.table.columns.map((c) =>
            c.id === action.payload ? { ...c, visible: !c.visible } : c
          ),
        },
      }
    
    case 'REORDER_TABLE_COLUMNS': {
      const newColumns = Array.from(state.table.columns)
      const [removed] = newColumns.splice(action.payload.startIndex, 1)
      newColumns.splice(action.payload.endIndex, 0, removed)
      return { ...state, table: { ...state.table, columns: newColumns } }
    }
    
    case 'ADD_TABLE_COLUMN': {
      const newColumn = {
        id: `column-${Date.now()}`,
        label: action.payload.label,
        visible: true,
        hasCode: false,
        hasSettings: false,
      }
      return {
        ...state,
        table: { ...state.table, columns: [...state.table.columns, newColumn] },
      }
    }
    
    case 'DELETE_TABLE_COLUMN':
      return {
        ...state,
        table: {
          ...state.table,
          columns: state.table.columns.filter((c) => c.id !== action.payload),
        },
      }
    
    case 'SET_TABLE_ROW_COUNT':
      return { ...state, table: { ...state.table, rowCount: action.payload } }
    
    case 'SET_STT_TITLE':
      return { ...state, table: { ...state.table, sttTitle: action.payload } }
    
    case 'SET_STT_CONTENT':
      return { ...state, table: { ...state.table, sttContent: action.payload } }
    
    case 'LOAD_TEMPLATE':
      return { ...state, ...action.payload }
    
    // Quick settings actions
    case 'SET_NUMBER_FONT':
      return { ...state, settings: { ...state.settings, numberFont: action.payload } }
    
    case 'TOGGLE_QR_CODE':
      return { ...state, settings: { ...state.settings, showQrCode: !state.settings.showQrCode } }
    
    case 'TOGGLE_BILINGUAL':
      return { ...state, settings: { ...state.settings, bilingual: !state.settings.bilingual } }
    
    case 'TOGGLE_VISIBILITY':
      return {
        ...state,
        settings: {
          ...state.settings,
          visibility: {
            ...state.settings.visibility,
            [action.payload]: !state.settings.visibility[action.payload],
          },
        },
      }
    
    case 'TOGGLE_CUSTOMER_FIELD':
      return {
        ...state,
        settings: {
          ...state.settings,
          customerVisibility: {
            ...state.settings.customerVisibility,
            [action.payload]: !state.settings.customerVisibility[action.payload],
          },
        },
      }
    
    case 'SET_ALL_CUSTOMER_FIELDS':
      return {
        ...state,
        settings: {
          ...state.settings,
          customerVisibility: {
            customerName: action.payload,
            customerTaxCode: action.payload,
            customerAddress: action.payload,
            customerPhone: action.payload,
            customerEmail: action.payload,
            paymentMethod: action.payload,
          },
        },
      }
    
    default:
      return state
  }
}

// ==================== HISTORY STATE INTERFACE ====================

interface HistoryState {
  past: TemplateState[]
  present: TemplateState
  future: TemplateState[]
}

// ==================== HISTORY REDUCER ====================

const historyReducer = (
  state: HistoryState,
  action: TemplateAction | { type: 'UNDO' } | { type: 'REDO' }
): HistoryState => {
  switch (action.type) {
    case 'UNDO': {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      const newPast = state.past.slice(0, state.past.length - 1)
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      }
    }
    
    case 'REDO': {
      if (state.future.length === 0) return state
      const next = state.future[0]
      const newFuture = state.future.slice(1)
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      }
    }
    
    default: {
      const newPresent = templateReducer(state.present, action as TemplateAction)
      if (newPresent === state.present) return state
      
      return {
        past: [...state.past, state.present],
        present: newPresent,
        future: [], // Clear future khi có action mới
      }
    }
  }
}

// ==================== CUSTOM HOOK ====================

export const useTemplateReducer = (initialState: TemplateState) => {
  const [history, setHistory] = useReducer(historyReducer, {
    past: [],
    present: initialState,
    future: [],
  })

  const dispatch = useCallback(
    (action: TemplateAction | { type: 'UNDO' } | { type: 'REDO' }) => {
      setHistory(action)
    },
    []
  )

  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  return {
    state: history.present,
    dispatch,
    canUndo,
    canRedo,
  }
}
