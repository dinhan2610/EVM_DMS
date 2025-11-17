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
    },
  },
  
  HTTP_STATUS: {
    OK: 200,
    UNAUTHORIZED: 401,
  },
} as const

export default API_CONFIG
