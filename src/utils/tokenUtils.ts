/**
 * Token Utilities
 * Helper functions để xử lý JWT token
 */

// ✅ Import API_CONFIG để dùng đúng token key
import { API_CONFIG } from '@/config/api.config';

/**
 * JWT Payload interface
 * Định nghĩa cấu trúc của JWT token payload
 */
interface JwtPayload {
  sub?: string;           // User ID (JWT standard claim)
  Sub?: string;           // User ID (alternative casing)
  userId?: string;        // User ID (custom claim)
  UserId?: string;        // User ID (alternative casing)
  email?: string;         // Email
  name?: string;          // User name
  role?: string;          // User role
  Role?: string;          // User role (alternative casing)
  exp?: number;           // Expiration time (seconds since epoch)
  nbf?: number;           // Not before time
  iat?: number;           // Issued at time
  jti?: string;           // JWT ID
  iss?: string;           // Issuer
  aud?: string;           // Audience
  [key: string]: unknown; // Allow other custom claims
}

/**
 * Decode JWT token payload (không verify signature)
 * @param token - JWT token string
 * @returns Decoded payload object hoặc null nếu lỗi
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode base64url
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (error) {
    console.error('[tokenUtils] Error decoding token:', error);
    return null;
  }
}

/**
 * Lấy userId từ JWT token trong localStorage
 * @returns userId (number) hoặc null nếu không tìm thấy
 */
export function getUserIdFromToken(): number | null {
  try {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    if (!token) {
      console.warn('[tokenUtils] No token found in localStorage (key:', API_CONFIG.TOKEN_KEY, ')');
      return null;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
      console.error('[tokenUtils] Failed to decode token');
      return null;
    }

    // JWT standard claim "sub" thường chứa user ID
    const userId = payload.sub || payload.Sub || payload.userId || payload.UserId;
    
    if (userId) {
      const parsedId = parseInt(userId, 10);
      console.log('[tokenUtils] Extracted userId from token:', parsedId);
      return parsedId;
    }

    console.warn('[tokenUtils] No userId found in token payload:', payload);
    return null;
  } catch (error) {
    console.error('[tokenUtils] Error getting userId from token:', error);
    return null;
  }
}

/**
 * Lấy role từ JWT token
 * @returns role string hoặc null
 */
export function getRoleFromToken(): string | null {
  try {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    if (!token) return null;

    const payload = decodeJwtPayload(token);
    if (!payload) return null;

    return payload.role || payload.Role || null;
  } catch (error) {
    console.error('[tokenUtils] Error getting role from token:', error);
    return null;
  }
}

/**
 * Check token còn hiệu lực không
 * @returns true nếu token còn hợp lệ
 */
export function isTokenValid(): boolean {
  try {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    if (!token) return false;

    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return false;

    // Check expiration (exp là timestamp tính bằng giây)
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch (error) {
    return false;
  }
}
