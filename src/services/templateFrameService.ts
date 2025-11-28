import axios, { AxiosError } from 'axios'
import API_CONFIG from '@/config/api.config'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Template Frame Response từ API
 */
export interface TemplateFrameApiResponse {
  frameID: number
  frameName: string
  imageUrl: string
}

/**
 * Template Frame cho UI (đã map từ API response)
 */
export interface TemplateFrame {
  id: number
  name: string
  imageUrl: string
  imagePath: string // For backward compatibility with existing code
  category: 'GTGT' | 'Banhang' | 'Universal'
  description: string
  recommended?: boolean
}

/**
 * API Error Response Structure
 */
interface ApiErrorResponse {
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string[]>
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Lấy Authorization Headers với Bearer Token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem(API_CONFIG.TOKEN_KEY)
  if (!token) {
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại')
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'accept': '*/*'
  }
}

/**
 * Xử lý lỗi API và trả về message phù hợp
 */
const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>
    
    if (axiosError.response) {
      const { status, data } = axiosError.response
      
      switch (status) {
        case 400:
          if (data.errors) {
            const errorMessages = Object.values(data.errors).flat()
            return errorMessages.join(', ')
          }
          return data.detail || 'Dữ liệu không hợp lệ'
        
        case 401:
          // Clear tokens and redirect to login
          localStorage.removeItem(API_CONFIG.TOKEN_KEY)
          localStorage.removeItem(API_CONFIG.REFRESH_TOKEN_KEY)
          setTimeout(() => {
            window.location.href = '/auth/sign-in'
          }, 1500)
          return 'Phiên đăng nhập hết hạn. Đang chuyển về trang đăng nhập...'
        
        case 403:
          return 'Bạn không có quyền thực hiện thao tác này'
        
        case 404:
          return 'Không tìm thấy dữ liệu'
        
        case 500:
          return data.detail || 'Lỗi máy chủ. Vui lòng thử lại sau'
        
        default:
          return data.detail || 'Có lỗi xảy ra. Vui lòng thử lại'
      }
    }
    
    if (axiosError.request) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng'
    }
  }
  
  return 'Lỗi không xác định'
}

/**
 * Sanitize và validate image URL từ API
 * Fix các lỗi phổ biến như double extension (.pngg, .jpgg)
 */
const sanitizeImageUrl = (url: string): string => {
  if (!url) return ''
  
  // Fix double extension issue (e.g., .pngg -> .png, .jpgg -> .jpg)
  let sanitizedUrl = url
    .replace(/\.png{2,}/gi, '.png')  // .pngg, .pnggg -> .png
    .replace(/\.jpg{2,}/gi, '.jpg')  // .jpgg, .jpggg -> .jpg
    .replace(/\.jpeg{2,}/gi, '.jpeg') // .jpegg -> .jpeg
    .replace(/\.webp{2,}/gi, '.webp') // .webpg -> .webp
    .replace(/\.gif{2,}/gi, '.gif')   // .giff -> .gif
  
  // Remove trailing special characters
  sanitizedUrl = sanitizedUrl.replace(/[^a-zA-Z0-9]$/, '')
  
  // Validate URL format
  try {
    new URL(sanitizedUrl)
    return sanitizedUrl
  } catch {
    console.warn(`Invalid image URL: ${url}`)
    return url // Return original if validation fails
  }
}

/**
 * Map API response thành UI-friendly format
 * Tự động phân loại category dựa trên frameID
 */
const mapApiResponseToTemplateFrame = (apiFrame: TemplateFrameApiResponse): TemplateFrame => {
  // Sanitize image URL to fix backend issues
  const cleanImageUrl = sanitizeImageUrl(apiFrame.imageUrl)
  
  // Tự động phân loại category dựa trên frameID
  let category: 'GTGT' | 'Banhang' | 'Universal' = 'Universal'
  let description = 'Mẫu hóa đơn đa năng'
  let recommended = false

  // Logic phân loại dựa trên frameID (có thể điều chỉnh theo yêu cầu)
  if (apiFrame.frameID >= 1 && apiFrame.frameID <= 4) {
    category = 'GTGT'
    description = `Mẫu hóa đơn GTGT ${apiFrame.frameID === 1 ? 'tiêu chuẩn' : 'cải tiến'}`
    if (apiFrame.frameID === 1) recommended = true
  } else if (apiFrame.frameID >= 5 && apiFrame.frameID <= 7) {
    category = 'Banhang'
    description = `Mẫu hóa đơn bán hàng ${apiFrame.frameID === 5 ? 'đơn giản' : 'chi tiết'}`
    if (apiFrame.frameID === 5) recommended = true
  } else {
    category = 'Universal'
    description = 'Mẫu hóa đơn đa năng cho mọi loại'
  }

  return {
    id: apiFrame.frameID,
    name: apiFrame.frameName,
    imageUrl: cleanImageUrl,
    imagePath: cleanImageUrl, // For backward compatibility
    category,
    description,
    recommended,
  }
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

const templateFrameService = {
  /**
   * Lấy tất cả Template Frames
   * GET /api/TemplateFrame
   */
  async getAllTemplateFrames(): Promise<TemplateFrame[]> {
    try {
      const response = await axios.get<TemplateFrameApiResponse[]>(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE_FRAME.GET_ALL}`,
        {
          headers: getAuthHeaders(),
          timeout: API_CONFIG.TIMEOUT,
        }
      )
      
      // Map API response to UI format
      return response.data.map(mapApiResponseToTemplateFrame)
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  /**
   * Lấy Template Frame theo ID
   * GET /api/TemplateFrame/{id}
   */
  async getTemplateFrameById(frameId: number): Promise<TemplateFrame> {
    try {
      const response = await axios.get<TemplateFrameApiResponse>(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE_FRAME.GET_BY_ID(frameId)}`,
        {
          headers: getAuthHeaders(),
          timeout: API_CONFIG.TIMEOUT,
        }
      )
      
      // Map API response to UI format
      return mapApiResponseToTemplateFrame(response.data)
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
}

export default templateFrameService

