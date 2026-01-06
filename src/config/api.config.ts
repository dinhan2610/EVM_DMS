export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  TOKEN_KEY: 'eims_access_token',
  REFRESH_TOKEN_KEY: 'eims_refresh_token',
  
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/Auth/login',
      LOGOUT: '/Auth/logout',
      REFRESH: '/Auth/refresh',
      REGISTER: '/Auth/register',
    },
    USER: {
      USERS: '/User/users',
      ACTIVE_USERS: '/User/active',
      INACTIVE_USERS: '/User/inactive',
      USER_DETAIL: (userId: number) => `/User/${userId}`,
      ACTIVATE: (userId: number) => `/User/admin/${userId}/active`,
      DEACTIVATE: (userId: number) => `/User/admin/${userId}/inactive`,
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
    },
    INVOICE: {
      CREATE: '/Invoice',
      GET_ALL: '/Invoice',
      GET_BY_ID: (id: number) => `/Invoice/${id}`,
      UPDATE: (id: number) => `/Invoice/${id}`,
      DELETE: (id: number) => `/Invoice/${id}`,
      SIGN: (id: number) => `/Invoice/${id}/sign`,
      SEND_EMAIL: (id: number) => `/Invoice/${id}/send-email`,
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
    },
  },
  
  HTTP_STATUS: {
    OK: 200,
    UNAUTHORIZED: 401,
  },
} as const

export default API_CONFIG
