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
  },
  
  HTTP_STATUS: {
    OK: 200,
    UNAUTHORIZED: 401,
  },
} as const

export default API_CONFIG
