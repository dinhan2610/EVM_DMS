export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  TOKEN_KEY: 'eims_access_token',
  REFRESH_TOKEN_KEY: 'eims_refresh_token',
  
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/Auth/login',      // ✅ No /api prefix (proxy handles it)
      LOGOUT: '/Auth/logout',    // ✅ No /api prefix (proxy handles it)
      REFRESH: '/Auth/refresh',  // ✅ No /api prefix (proxy handles it)
      REGISTER: '/Auth/register',// ✅ No /api prefix (proxy handles it)
      CHANGE_PASSWORD: '/Auth/change-password', // ✅ POST - Change password (action)
    },
    USER: {
      USERS: '/User/users',
      ACTIVE_USERS: '/User/active',
      INACTIVE_USERS: '/User/inactive',
      USER_DETAIL: (userId: number) => `/User/${userId}`,
      ACTIVATE: (userId: number) => `/User/admin/${userId}/active`,
      DEACTIVATE: (userId: number) => `/User/admin/${userId}/inactive`,
      PROFILE: '/User/profile', // GET - Get current user profile, PUT - Update profile
    },
    TEMPLATE_FRAME: {
      GET_ALL: '/TemplateFrame',
      GET_BY_ID: (frameId: number) => `/TemplateFrame/${frameId}`,
    },
    INVOICE_SYMBOL: {
      PREFIX: '/Prefix',
      SERIAL_STATUS: '/SerialStatus',
      INVOICE_TYPE: '/InvoiceType',
    },
    SERIAL: {
      CREATE: '/Serial',
      GET_ALL: '/Serial',
    },
    TEMPLATE: {
      CREATE: '/InvoiceTemplate',
      GET_ALL: '/InvoiceTemplate',
      GET_BY_ID: (id: number) => `/InvoiceTemplate/${id}`,
      UPDATE: (id: number) => `/InvoiceTemplate/${id}`,
      PREVIEW_HTML: (id: number) => `/InvoiceTemplate/preview-template/${id}`, // ✅ NEW: Get rendered HTML preview
    },
    INVOICE: {
      CREATE: '/Invoice',
      GET_ALL: '/Invoice',
      GET_BY_ID: (id: number) => `/Invoice/${id}`,
      UPDATE: (id: number) => `/Invoice/${id}`,
      DELETE: (id: number) => `/Invoice/${id}`,
      SIGN: (id: number) => `/Invoice/${id}/sign`,
      SEND_EMAIL: (id: number) => `/Email/${id}/send-email`,
      // Invoice Preview & Advanced
      PREVIEW: '/Invoice/preview', // ⭐ Preview invoice before creating
      LOOKUP: (lookupCode: string) => `/Invoice/lookup/${lookupCode}`, // Public lookup
      GET_ORIGINAL: (id: number) => `/Invoice/${id}/original`, // Get invoice before adjustment
      EXPORT_PDF: (id: number) => `/Invoice/${id}/pdf`, // Export PDF
      // Adjustment & Replacement APIs
      ADJUSTMENT: '/Invoice/adjustment',
      REPLACEMENT: '/Invoice/replacement',
      GET_ADJUSTMENTS: (id: number) => `/Invoice/${id}/adjustments`,
      GET_REPLACEMENT_STATUS: (id: number) => `/Invoice/${id}/replacement-status`,
    },
    PAYMENT: {
      CREATE: '/Payment',
      GET_ALL: '/Payment',
      GET_BY_ID: (id: number) => `/Payment/${id}`,
      GET_BY_INVOICE: (invoiceId: number) => `/Payment?InvoiceId=${invoiceId}`,
      GET_BY_CUSTOMER: (customerId: number) => `/Payment?CustomerId=${customerId}`,
      GET_MONTHLY_DEBT: '/Payment/monthly-debt', // GET - Lấy công nợ theo tháng với query params
    },
    FILE: {
      UPLOAD: '/File/upload',
      UPLOAD_XML: '/File/uploadXML',
      UPLOAD_TEMPLATE_IMAGE: '/File/upload-template-image',
      CONVERT_PDF_XML: '/File/convert-pdf-xml',
      GENERATE_XML: (invoiceId: number) => `/File/generate-xml/${invoiceId}`,
      HTML_TO_PDF: '/File/pdf-from-html', // ⭐ Backend HTML → PDF conversion
    },
    TAX: {
      SUBMIT: '/Tax/submit',
      CREATE_FORM04SS: '/Tax/Create-Form04SS-Draft',
      SEND_TO_CQT: (id: number) => `/Tax/${id}/send-form-to-CQT`,
      PREVIEW: (id: number) => `/Tax/${id}/preview`,
      EXPORT_PDF: (id: number) => `/Tax/${id}/pdf`,
    },
  },
  
  HTTP_STATUS: {
    OK: 200,
    UNAUTHORIZED: 401,
  },
} as const

export default API_CONFIG
