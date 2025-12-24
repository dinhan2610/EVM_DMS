/**
 * Invoice Status Constants
 * Chuẩn hóa theo nghiệp vụ Hóa đơn điện tử Việt Nam
 * 
 * 📋 PHÂN TÁCH RÕ RÀNG:
 * - Cột "Trạng thái": Hiển thị luồng nghiệp vụ nội bộ (Nháp → Chờ duyệt → Đã duyệt → Chờ ký → Đã ký → Đã phát hành)
 * - Cột "Trạng thái CQT": Hiển thị trạng thái tích hợp với Cơ quan Thuế (TB01-TB12, KQ01-KQ04, etc.)
 */

// ==================== BỘ 1: TRẠNG THÁI QUY TRÌNH NỘI BỘ ====================
/**
 * Internal Workflow Status (Quy trình nội bộ)
 * Hiển thị ở cột "Trạng thái" - Mô tả luồng xử lý hóa đơn trong hệ thống
 * 
 * ⚠️ ĐỒNG BỘ VỚI BACKEND API
 * 
 * 🔄 LUỒNG CHÍNH:
 * 1 (Nháp) → 6 (Chờ duyệt) → 9 (Đã duyệt) → 7 (Chờ ký) → 10 (Đã ký) → 2 (Đã phát hành)
 * 
 * 🔀 LUỒNG PHỤ:
 * - 3 (Bị từ chối): KTT từ chối hóa đơn
 * - 4 (Đã điều chỉnh): Hóa đơn điều chỉnh
 * - 5 (Bị thay thế): Có hóa đơn thay thế
 */
export const INVOICE_INTERNAL_STATUS = {
  // === LUỒNG CHÍNH ===
  DRAFT: 1,             // Bước 1: Nháp - Mới tạo, chưa gửi duyệt
  PENDING_APPROVAL: 6,  // Bước 2: Chờ duyệt - Đã gửi cho KTT duyệt
  APPROVED: 9,          // Bước 3: Đã duyệt - KTT đã phê duyệt ✨ NEW
  PENDING_SIGN: 7,      // Bước 4: Chờ ký - Chờ ký số điện tử
  SIGNED_PENDING_ISSUE: 8, // Bước 5a: Đã ký số - Chờ phát hành ✨ NEW
  SIGNED: 10,           // Bước 5b: Đã ký - Legacy status ✨
  ISSUED: 2,            // Bước 6: Đã phát hành - Hoàn tất (đã/chưa gửi CQT)
  
  // === LUỒNG PHỤ ===
  CANCELLED: 3,         // Bị từ chối - KTT từ chối hóa đơn
  ADJUSTED: 4,          // Đã điều chỉnh - Hóa đơn điều chỉnh
  REPLACED: 5,          // Bị thay thế - Có hóa đơn thay thế mới
} as const;

export type InvoiceInternalStatus = typeof INVOICE_INTERNAL_STATUS[keyof typeof INVOICE_INTERNAL_STATUS];

/**
 * Mapping từ status ID sang label hiển thị
 * 📍 Hiển thị ở cột "Trạng thái"
 */
export const INVOICE_INTERNAL_STATUS_LABELS: Record<number, string> = {
  // Luồng chính
  [INVOICE_INTERNAL_STATUS.DRAFT]: 'Nháp',
  [INVOICE_INTERNAL_STATUS.PENDING_APPROVAL]: 'Chờ duyệt',
  [INVOICE_INTERNAL_STATUS.APPROVED]: 'Đã duyệt',           // ✨ NEW
  [INVOICE_INTERNAL_STATUS.PENDING_SIGN]: 'Chờ ký',
  [INVOICE_INTERNAL_STATUS.SIGNED_PENDING_ISSUE]: 'Đã ký số', // ✨ NEW - Status 8
  [INVOICE_INTERNAL_STATUS.SIGNED]: 'Đã ký',                // ✨ Legacy
  [INVOICE_INTERNAL_STATUS.ISSUED]: 'Đã phát hành',
  
  // Luồng phụ
  [INVOICE_INTERNAL_STATUS.CANCELLED]: 'Bị từ chối',
  [INVOICE_INTERNAL_STATUS.ADJUSTED]: 'Đã điều chỉnh',
  [INVOICE_INTERNAL_STATUS.REPLACED]: 'Bị thay thế',
};

/**
 * Màu sắc cho từng trạng thái nội bộ (MUI Chip colors)
 */
export const INVOICE_INTERNAL_STATUS_COLORS: Record<number, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  // Luồng chính
  [INVOICE_INTERNAL_STATUS.DRAFT]: 'default',           // Xám - Nháp
  [INVOICE_INTERNAL_STATUS.PENDING_APPROVAL]: 'warning', // Vàng - Chờ duyệt
  [INVOICE_INTERNAL_STATUS.APPROVED]: 'info',           // Xanh dương - Đã duyệt ✨
  [INVOICE_INTERNAL_STATUS.PENDING_SIGN]: 'primary',    // Xanh primary - Chờ ký
  [INVOICE_INTERNAL_STATUS.SIGNED_PENDING_ISSUE]: 'secondary', // Tím - Đã ký số ✨ NEW
  [INVOICE_INTERNAL_STATUS.SIGNED]: 'secondary',        // Tím - Đã ký ✨
  [INVOICE_INTERNAL_STATUS.ISSUED]: 'success',          // Xanh lá - Đã phát hành
  
  // Luồng phụ
  [INVOICE_INTERNAL_STATUS.CANCELLED]: 'error',         // Đỏ - Bị từ chối
  [INVOICE_INTERNAL_STATUS.ADJUSTED]: 'info',           // Xanh dương - Đã điều chỉnh
  [INVOICE_INTERNAL_STATUS.REPLACED]: 'secondary',      // Tím - Bị thay thế
};

// ==================== BỘ 2: TRẠNG THÁI TÍCH HỢP CQT ====================
/**
 * Tax Authority Integration Status (Trạng thái tích hợp Cơ quan Thuế)
 * 📍 Hiển thị ở cột "Trạng thái CQT"
 * 
 * ⚠️ QUAN TRỌNG: 
 * - Các trạng thái này KHÔNG hiển thị ở cột "Trạng thái" (Internal Status)
 * - Dùng để theo dõi quá trình tích hợp với hệ thống CQT
 * - Bao gồm cả các mã lỗi TB01-TB12, KQ01-KQ04
 * 
 * Dựa trên API GET /api/TaxApiStatus
 */

// ===== NHÓM 1: TRẠNG THÁI XỬ LÝ CHUNG =====
export const TAX_STATUS = {
  // Trạng thái xử lý CQT
  NOT_SENT: 0,          // Chưa gửi CQT (mặc định)
  PENDING: 1,           // Đang gửi CQT
  RECEIVED: 2,          // CQT đã tiếp nhận
  REJECTED: 3,          // CQT từ chối
  APPROVED: 4,          // CQT đã cấp mã ✅
  FAILED: 5,            // Lỗi hệ thống khi gửi
  PROCESSING: 6,        // Đang xử lý
  NOT_FOUND: 7,         // Không tìm thấy hóa đơn
  
  // ===== NHÓM 2: TRẠNG THÁI TIẾP NHẬN (TB - Thông báo) =====
  TB01: 10,             // TB01: Tiếp nhận hợp lệ ✅
  TB02: 11,             // TB02: Sai định dạng XML/XSD ❌
  TB03: 12,             // TB03: Chữ ký số không hợp lệ ❌
  TB04: 13,             // TB04: MST không đúng ❌
  TB05: 14,             // TB05: Thiếu thông tin bắt buộc ❌
  TB06: 15,             // TB06: Sai định dạng dữ liệu ❌
  TB07: 16,             // TB07: Trùng hóa đơn ❌
  TB08: 17,             // TB08: Hóa đơn không được cấp mã ❌
  TB09: 18,             // TB09: Không tìm thấy HĐ tham chiếu ❌
  TB10: 19,             // TB10: Thông tin hàng hóa không hợp lệ ❌
  TB11: 20,             // TB11: Bản PDF sai cấu trúc ❌
  TB12: 21,             // TB12: Lỗi kỹ thuật hệ thống thuế ❌
  
  // ===== NHÓM 3: TRẠNG THÁI KẾT QUẢ (KQ - Kết quả) =====
  KQ01: 30,             // KQ01: Đã cấp mã CQT ✅
  KQ02: 31,             // KQ02: Bị từ chối khi cấp mã ❌
  KQ03: 32,             // KQ03: Chưa có kết quả
  KQ04: 33,             // KQ04: Không tìm thấy hóa đơn
} as const;

export type TaxStatus = typeof TAX_STATUS[keyof typeof TAX_STATUS];

/**
 * Mapping từ tax status ID sang label hiển thị (đầy đủ)
 * 📍 Hiển thị ở cột "Trạng thái CQT"
 */
export const TAX_STATUS_LABELS: Record<number, string> = {
  // Trạng thái mặc định
  [TAX_STATUS.NOT_SENT]: 'Chưa gửi CQT',
  
  // Nhóm xử lý chung
  [TAX_STATUS.PENDING]: 'Đang gửi CQT',
  [TAX_STATUS.RECEIVED]: 'CQT đã tiếp nhận',
  [TAX_STATUS.REJECTED]: 'CQT từ chối',
  [TAX_STATUS.APPROVED]: '✅ CQT đã cấp mã',
  [TAX_STATUS.FAILED]: '❌ Lỗi gửi CQT',
  [TAX_STATUS.PROCESSING]: 'Đang xử lý',
  [TAX_STATUS.NOT_FOUND]: 'Không tìm thấy hóa đơn',
  
  // Nhóm thông báo tiếp nhận (TB)
  [TAX_STATUS.TB01]: '✅ TB01: Tiếp nhận hợp lệ',
  [TAX_STATUS.TB02]: '❌ TB02: Sai định dạng XML',
  [TAX_STATUS.TB03]: '❌ TB03: Chữ ký không hợp lệ',
  [TAX_STATUS.TB04]: '❌ TB04: MST không đúng',
  [TAX_STATUS.TB05]: '❌ TB05: Thiếu thông tin',
  [TAX_STATUS.TB06]: '❌ TB06: Sai định dạng dữ liệu',
  [TAX_STATUS.TB07]: '❌ TB07: Trùng hóa đơn',
  [TAX_STATUS.TB08]: '❌ TB08: Không được cấp mã',
  [TAX_STATUS.TB09]: '❌ TB09: Không tìm thấy HĐ tham chiếu',
  [TAX_STATUS.TB10]: '❌ TB10: Thông tin hàng hóa sai',
  [TAX_STATUS.TB11]: '❌ TB11: Bản PDF sai cấu trúc',
  [TAX_STATUS.TB12]: '❌ TB12: Lỗi hệ thống CQT',
  
  // Nhóm kết quả (KQ)
  [TAX_STATUS.KQ01]: '✅ KQ01: Đã cấp mã CQT',
  [TAX_STATUS.KQ02]: '❌ KQ02: Bị từ chối cấp mã',
  [TAX_STATUS.KQ03]: 'KQ03: Chưa có kết quả',
  [TAX_STATUS.KQ04]: 'KQ04: Không tìm thấy',
};

/**
 * Mapping màu sắc theo mức độ nghiêm trọng
 * 📍 Màu sắc cho Chip ở cột "Trạng thái CQT"
 */
export const TAX_STATUS_COLORS: Record<number, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  // Trạng thái mặc định
  [TAX_STATUS.NOT_SENT]: 'default',       // Xám - Chưa gửi
  
  // Nhóm xử lý chung
  [TAX_STATUS.PENDING]: 'warning',        // Vàng - Đang gửi
  [TAX_STATUS.RECEIVED]: 'info',          // Xanh dương - Đã tiếp nhận
  [TAX_STATUS.REJECTED]: 'error',         // Đỏ - Từ chối
  [TAX_STATUS.APPROVED]: 'success',       // Xanh lá - Đã cấp mã
  [TAX_STATUS.FAILED]: 'error',           // Đỏ - Lỗi gửi
  [TAX_STATUS.PROCESSING]: 'warning',     // Vàng - Đang xử lý
  [TAX_STATUS.NOT_FOUND]: 'default',      // Xám - Không tìm thấy
  
  // Nhóm thông báo tiếp nhận (TB)
  [TAX_STATUS.TB01]: 'success',           // Xanh - Tiếp nhận hợp lệ
  [TAX_STATUS.TB02]: 'error',             // Đỏ - Lỗi XML
  [TAX_STATUS.TB03]: 'error',             // Đỏ - Lỗi chữ ký
  [TAX_STATUS.TB04]: 'error',             // Đỏ - Lỗi MST
  [TAX_STATUS.TB05]: 'error',             // Đỏ - Thiếu thông tin
  [TAX_STATUS.TB06]: 'error',             // Đỏ - Sai định dạng
  [TAX_STATUS.TB07]: 'error',             // Đỏ - Trùng hóa đơn
  [TAX_STATUS.TB08]: 'error',             // Đỏ - Không được cấp mã
  [TAX_STATUS.TB09]: 'error',             // Đỏ - Không tìm thấy tham chiếu
  [TAX_STATUS.TB10]: 'error',             // Đỏ - Thông tin sai
  [TAX_STATUS.TB11]: 'error',             // Đỏ - PDF sai
  [TAX_STATUS.TB12]: 'error',             // Đỏ - Lỗi kỹ thuật
  
  // Nhóm kết quả (KQ)
  [TAX_STATUS.KQ01]: 'success',           // Xanh - Đã cấp mã
  [TAX_STATUS.KQ02]: 'error',             // Đỏ - Bị từ chối
  [TAX_STATUS.KQ03]: 'warning',           // Vàng - Chưa có kết quả
  [TAX_STATUS.KQ04]: 'default',           // Xám - Không tìm thấy
};

/**
 * Kiểm tra trạng thái có phải là lỗi không
 */
export const isTaxStatusError = (statusId: number): boolean => {
  const errorStatuses: number[] = [
    TAX_STATUS.REJECTED,
    TAX_STATUS.FAILED,
    TAX_STATUS.TB02, TAX_STATUS.TB03, TAX_STATUS.TB04,
    TAX_STATUS.TB05, TAX_STATUS.TB06, TAX_STATUS.TB07,
    TAX_STATUS.TB08, TAX_STATUS.TB09, TAX_STATUS.TB10,
    TAX_STATUS.TB11, TAX_STATUS.TB12, TAX_STATUS.KQ02,
  ];
  return errorStatuses.includes(statusId);
};

/**
 * Kiểm tra trạng thái có phải là thành công không
 */
export const isTaxStatusSuccess = (statusId: number): boolean => {
  const successStatuses: number[] = [
    TAX_STATUS.APPROVED,
    TAX_STATUS.TB01,
    TAX_STATUS.KQ01,
  ];
  return successStatuses.includes(statusId);
};

/**
 * Kiểm tra có thể gửi lại không
 */
export const canRetryTaxSubmit = (statusId: number): boolean => {
  // Có thể gửi lại khi:
  // - Lỗi hệ thống (FAILED)
  // - Bị từ chối (REJECTED, TB02-TB12, KQ02)
  // - Không tìm thấy (NOT_FOUND, KQ04)
  return isTaxStatusError(statusId) || 
         statusId === TAX_STATUS.FAILED ||
         statusId === TAX_STATUS.NOT_FOUND ||
         statusId === TAX_STATUS.KQ04;
};

// ===== LEGACY SUPPORT - Tương thích ngược =====
/**
 * @deprecated Sử dụng TAX_STATUS thay thế
 */
export const TAX_AUTHORITY_STATUS = {
  NOT_SENT: 0,      // Chưa gửi - Hóa đơn chưa gửi lên CQT
  SENDING: 1,       // Đang gửi - Tương đương PENDING
  ACCEPTED: 2,      // Đã cấp mã - Tương đương APPROVED/KQ01
  REJECTED: 3,      // Bị từ chối - Tương đương REJECTED
} as const;

export type TaxAuthorityStatus = typeof TAX_AUTHORITY_STATUS[keyof typeof TAX_AUTHORITY_STATUS];

/**
 * @deprecated Sử dụng TAX_STATUS_LABELS thay thế
 */
export const TAX_AUTHORITY_STATUS_LABELS: Record<number, string> = {
  [TAX_AUTHORITY_STATUS.NOT_SENT]: 'Chưa gửi CQT',
  [TAX_AUTHORITY_STATUS.SENDING]: 'Đang đồng bộ',
  [TAX_AUTHORITY_STATUS.ACCEPTED]: 'Đã cấp mã',
  [TAX_AUTHORITY_STATUS.REJECTED]: 'CQT từ chối',
};

/**
 * @deprecated Sử dụng TAX_STATUS_COLORS thay thế
 */
export const TAX_AUTHORITY_STATUS_COLORS: Record<number, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [TAX_AUTHORITY_STATUS.NOT_SENT]: 'default',
  [TAX_AUTHORITY_STATUS.SENDING]: 'warning',
  [TAX_AUTHORITY_STATUS.ACCEPTED]: 'success',
  [TAX_AUTHORITY_STATUS.REJECTED]: 'error',
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Lấy label của internal status
 */
export const getInternalStatusLabel = (statusId: number): string => {
  return INVOICE_INTERNAL_STATUS_LABELS[statusId] || 'Không xác định';
};

/**
 * Lấy màu của internal status
 */
export const getInternalStatusColor = (statusId: number) => {
  return INVOICE_INTERNAL_STATUS_COLORS[statusId] || 'default';
};

/**
 * Lấy label của tax status (hỗ trợ cả mã cũ và mới)
 */
export const getTaxStatusLabel = (statusId: number | null | undefined): string => {
  if (statusId === null || statusId === undefined) {
    return 'Chưa gửi CQT';
  }
  return TAX_STATUS_LABELS[statusId] || TAX_AUTHORITY_STATUS_LABELS[statusId] || 'Không xác định';
};

/**
 * Lấy màu của tax status (hỗ trợ cả mã cũ và mới)
 */
export const getTaxStatusColor = (statusId: number | null | undefined) => {
  if (statusId === null || statusId === undefined) {
    return 'default';
  }
  return TAX_STATUS_COLORS[statusId] || TAX_AUTHORITY_STATUS_COLORS[statusId] || 'default';
};

// ==================== LEGACY MAPPING (DEPRECATED) ====================
/**
 * @deprecated Use INVOICE_INTERNAL_STATUS_LABELS instead
 * Giữ lại để tương thích với code cũ
 */
export const INVOICE_STATUS: Record<number, string> = {
  1: 'Đã tạo',      // Map sang PENDING_APPROVAL
  2: 'Đã ký',       // Map sang SIGNED
  3: 'Đã gửi',      // Map sang SIGNED + TAX_ACCEPTED
  4: 'Đã hủy',      // Map sang CANCELLED
};
