/**
 * Local Signer Service
 *
 * Giao tiếp với ứng dụng LocalSigner chạy trên máy người dùng
 * API Endpoint: http://127.0.0.1:5001
 *
 * Chức năng:
 * - Ký số liệu bằng certificate USB Token
 * - Hỗ trợ ký đơn lẻ và ký hàng loạt
 */

const LOCAL_SIGNER_URL = 'http://127.0.0.1:5001'

// ============================================================
// 📋 INTERFACES
// ============================================================

/**
 * Request body for /sign endpoint
 */
export interface SignRequest {
  Data: string
}

/**
 * Response from /sign endpoint
 */
export interface SignResponse {
  data: string
  signature: string
  certificateBase64: string
}

/**
 * Response from /sign-batch endpoint
 */
export interface SignBatchResponse {
  certSubject: string
  certificateBase64: string
  results: SignResponse[]
}

/**
 * Error response from local signer
 */
export interface SignError {
  error: string
}

// ============================================================
// 🔧 HELPER FUNCTIONS
// ============================================================

/**
 * Kiểm tra LocalSigner có đang chạy không
 */
export const isLocalSignerRunning = async (): Promise<boolean> => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`${LOCAL_SIGNER_URL}/sign`, {
      method: 'OPTIONS',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response.ok || response.status === 204
  } catch {
    return false
  }
}

// ============================================================
// 🛠️ API FUNCTIONS
// ============================================================

/**
 * Ký dữ liệu bằng certificate của người dùng
 *
 * @param data - Dữ liệu cần ký (thường là SignedInfo XML)
 * @returns Promise<SignResponse> - Chữ ký và certificate base64
 *
 * @example
 * ```typescript
 * const signedInfo = '<SignedInfo>...</SignedInfo>'
 * const result = await signWithLocalCert(signedInfo)
 * console.log(result.signature) // Base64 encoded signature
 * console.log(result.certificateBase64) // X509 certificate
 * ```
 */
export const signWithLocalCert = async (data: string): Promise<SignResponse> => {
  try {
    const response = await fetch(`${LOCAL_SIGNER_URL}/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Data: data } as SignRequest),
    })

    if (!response.ok) {
      const errorData: SignError = await response.json()
      throw new Error(errorData.error || `Ký thất bại (HTTP ${response.status})`)
    }

    const result: SignResponse = await response.json()

    if (import.meta.env.DEV) {
      console.log('[LocalSigner] ✅ Ký thành công:', {
        dataLength: data.length,
        signatureLength: result.signature.length,
      })
    }

    return result
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        'Không thể kết nối đến LocalSigner. Vui lòng kiểm tra:\n' +
          '1. Ứng dụng LocalSigner đã được khởi động\n' +
          '2. USB Token đã được cắm vào máy',
      )
    }

    if (error instanceof Error) {
      throw error
    }

    throw new Error('Lỗi không xác định khi ký số')
  }
}

/**
 * Ký hàng loạt nhiều dữ liệu cùng lúc
 * Chỉ yêu cầu chọn certificate 1 lần cho tất cả
 *
 * @param dataItems - Mảng các dữ liệu cần ký
 * @returns Promise<SignBatchResponse> - Kết quả ký của tất cả items
 *
 * @example
 * ```typescript
 * const items = ['<SignedInfo1>...', '<SignedInfo2>...']
 * const result = await signBatchWithLocalCert(items)
 * console.log(result.certSubject) // Certificate subject name
 * console.log(result.results) // Array of sign results
 * ```
 */
export const signBatchWithLocalCert = async (dataItems: string[]): Promise<SignBatchResponse> => {
  if (!dataItems || dataItems.length === 0) {
    throw new Error('Không có dữ liệu để ký')
  }

  try {
    const response = await fetch(`${LOCAL_SIGNER_URL}/sign-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataItems),
    })

    if (!response.ok) {
      const errorData: SignError = await response.json()
      throw new Error(errorData.error || `Ký hàng loạt thất bại (HTTP ${response.status})`)
    }

    const result: SignBatchResponse = await response.json()

    if (import.meta.env.DEV) {
      console.log('[LocalSigner] ✅ Ký hàng loạt thành công:', {
        totalItems: dataItems.length,
        certSubject: result.certSubject,
      })
    }

    return result
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        'Không thể kết nối đến LocalSigner. Vui lòng kiểm tra:\n' +
          '1. Ứng dụng LocalSigner đã được khởi động\n' +
          '2. USB Token đã được cắm vào máy',
      )
    }

    if (error instanceof Error) {
      throw error
    }

    throw new Error('Lỗi không xác định khi ký hàng loạt')
  }
}

// ============================================================
// 📦 DEFAULT EXPORT
// ============================================================

const localSignerService = {
  isLocalSignerRunning,
  signWithLocalCert,
  signBatchWithLocalCert,
}

export default localSignerService
