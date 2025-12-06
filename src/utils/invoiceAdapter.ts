/**
 * Invoice API Adapter
 * 
 * Chuyển đổi giữa frontend state và backend API schema
 * 
 * ⚠️ Backend API hiện tại có schema đơn giản, thiếu nhiều thông tin:
 * - Không lưu productName, unit, unitPrice
 * - Không lưu discountPercent, discountAmount
 * - Không lưu vatRate (%)
 * - Cần tính amount (chưa VAT) từ totalAfterTax (đã VAT)
 */

// ==================== BACKEND TYPES ====================

export interface BackendInvoiceRequest {
  templateID: number;
  customerID: number;           // Có thể để 0 nếu khách lẻ
  taxCode: string;              // MST khách hàng
  invoiceStatusID: number;      // ⭐ NEW: 1=Nháp, 6=Chờ duyệt
  companyID: number;            // Có thể để 0
  customerName: string;         // Tên khách hàng
  address: string;              // Địa chỉ
  notes: string;                // ⭐ NEW: Ghi chú
  paymentMethod: string;        // ✅ Hình thức thanh toán (VD: "Tiền mặt", "Chuyển khoản")
  items: BackendInvoiceItem[];
  amount: number;               // Tổng tiền hàng (CHƯA VAT)
  taxAmount: number;            // Tổng tiền VAT
  totalAmount: number;          // Tổng cộng thanh toán
  signedBy: number;             // ⭐ NEW: UserID người ký (0 nếu chưa ký)
  minRows: number;              // Số dòng trống tối thiểu
  contactEmail: string;         // Email liên hệ
  contactPerson: string;        // Người liên hệ
  contactPhone: string;         // SĐT liên hệ
}

export interface BackendInvoiceItem {
  productId: number;            // ID sản phẩm (0 nếu không có trong DB)
  productName: string;          // ✅ Tên sản phẩm (NEW!)
  unit: string;                 // ✅ Đơn vị tính (NEW!)
  quantity: number;             // Số lượng
  amount: number;               // Thành tiền CHƯA VAT
  vatAmount: number;            // Tiền VAT
}

export interface BackendInvoiceResponse {
  invoiceID: number;
  invoiceNumber?: string;
  templateID?: number;
  customerName?: string;
  totalAmount?: number;
  createdAt?: string;
  status?: string;
}

// ==================== FRONTEND TYPES ====================

export interface FrontendInvoiceItem {
  id: number;                   // ID nội bộ UI (không gửi BE)
  productId?: number;           // ✅ ID sản phẩm từ DB (nếu chọn từ dropdown)
  stt: number;                  // Số thứ tự
  type: string;                 // "Hàng hóa" | "Dịch vụ"
  code: string;                 // Mã sản phẩm
  name: string;                 // Tên sản phẩm
  unit: string;                 // Đơn vị tính
  quantity: number;             // Số lượng
  priceAfterTax: number;        // Đơn giá (ĐÃ bao gồm VAT)
  discountPercent: number;      // Tỷ lệ chiết khấu (%)
  discountAmount: number;       // Tiền chiết khấu
  totalAfterTax: number;        // Thành tiền (ĐÃ bao gồm VAT, ĐÃ trừ CK)
}

export interface FrontendBuyerInfo {
  customerID?: number;          // ✅ ID customer từ DB (nếu có)
  taxCode?: string;             // MST
  companyCode?: string;         // Mã đơn vị
  companyName: string;          // Tên công ty/cá nhân
  address?: string;             // Địa chỉ
  buyerName?: string;           // Người mua hàng
  email?: string;               // Email
  phone?: string;               // SĐT
  paymentMethod?: string;       // Hình thức thanh toán
}

export interface FrontendTotals {
  subtotal: number;             // Tổng tiền hàng (chưa thuế, chưa CK)
  discount: number;             // Tổng chiết khấu
  subtotalAfterDiscount: number;// Tổng sau CK (chưa thuế)
  tax: number;                  // Tiền thuế VAT
  total: number;                // Tổng thanh toán
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Tính amount (chưa VAT) và vatAmount từ giá đã bao gồm VAT
 * 
 * @param totalAfterTax - Thành tiền đã bao gồm VAT
 * @param vatRate - Thuế suất VAT (0, 5, 10)
 * @returns { amount, vatAmount }
 * 
 * @example
 * calculateAmountBeforeVat(5000000, 10)
 * // => { amount: 4545455, vatAmount: 454545 }
 */
export function calculateAmountBeforeVat(
  totalAfterTax: number,
  vatRate: number
): { amount: number; vatAmount: number } {
  // Công thức: amount = totalAfterTax / (1 + vatRate/100)
  const amount = Math.round(totalAfterTax / (1 + vatRate / 100));
  const vatAmount = totalAfterTax - amount;
  
  return { amount, vatAmount };
}

/**
 * Validate totals calculation
 * ✅ UPDATED: Prices are BEFORE VAT (calculateAfterTax = false)
 */
export function validateTotals(
  items: FrontendInvoiceItem[],
  totals: FrontendTotals,
  vatRate: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 1. Validate subtotal BEFORE discount (prices are BEFORE VAT)
  const calculatedSubtotalBeforeDiscount = items.reduce((sum, item) => {
    return sum + (item.quantity * item.priceAfterTax); // priceAfterTax is actually BEFORE VAT
  }, 0);
  
  // 2. Validate discount
  const calculatedDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0);
  
  if (Math.abs(calculatedDiscount - totals.discount) > 1) {
    errors.push(`Discount mismatch: expected ${calculatedDiscount}, got ${totals.discount}`);
  }
  
  // 3. Validate subtotal AFTER discount (still BEFORE VAT)
  const calculatedSubtotalAfterDiscount = calculatedSubtotalBeforeDiscount - calculatedDiscount;
  
  if (Math.abs(calculatedSubtotalAfterDiscount - totals.subtotalAfterDiscount) > 1) {
    errors.push(`SubtotalAfterDiscount mismatch: expected ${calculatedSubtotalAfterDiscount}, got ${totals.subtotalAfterDiscount}`);
  }
  
  // 4. Validate tax (calculated from subtotal BEFORE VAT)
  const calculatedTax = Math.round(calculatedSubtotalAfterDiscount * (vatRate / 100));
  
  if (Math.abs(calculatedTax - totals.tax) > 1) {
    errors.push(`Tax mismatch: expected ${calculatedTax}, got ${totals.tax}`);
  }
  
  // 5. Validate total (subtotal + tax)
  const calculatedTotal = calculatedSubtotalAfterDiscount + calculatedTax;
  
  if (Math.abs(calculatedTotal - totals.total) > 1) {
    errors.push(`Total mismatch: expected ${calculatedTotal}, got ${totals.total}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ==================== MAIN ADAPTER FUNCTION ====================

/**
 * Chuyển đổi frontend state sang backend request
 * 
 * ✅ CẬP NHẬT: API đã bổ sung productName, unit, paymentMethod
 * 
 * @param templateID - ID template được chọn
 * @param buyerInfo - Thông tin người mua
 * @param items - Danh sách sản phẩm/dịch vụ
 * @param vatRate - Thuế suất VAT (0, 5, 10)
 * @param totals - Tổng tiền đã tính
 * @param userId - ID người tạo hóa đơn (từ token)
 * @param paymentMethod - Hình thức thanh toán ("Tiền mặt", "Chuyển khoản", "Thẻ", v.v.)
 * @param minRows - Số dòng trống tối thiểu (mặc định 5)
 * @returns Backend request object
 */
export function mapToBackendInvoiceRequest(
  templateID: number,
  buyerInfo: FrontendBuyerInfo,
  items: FrontendInvoiceItem[],
  vatRate: number,
  totals: FrontendTotals,
  paymentMethod: string = "Tiền mặt",  // ✅ Hình thức thanh toán
  minRows: number = 5,
  invoiceStatusID: number = 1,          // ⭐ NEW: 1=Nháp, 6=Chờ duyệt
  notes: string = '',                   // ⭐ NEW: Ghi chú
  signedBy: number = 0                  // ⭐ NEW: UserID người ký (0=chưa ký)
): BackendInvoiceRequest {
  
  // Validate totals trước khi gửi
  const validation = validateTotals(items, totals, vatRate);
  if (!validation.isValid) {
    console.warn('⚠️ Totals validation failed:', validation.errors);
    // Có thể throw error hoặc cảnh báo
  }
  
  // Chuyển đổi items
  // ⚠️ QUAN TRỌNG: Với CreateVatInvoice, calculateAfterTax = false
  // => priceAfterTax là giá CHƯA thuế, totalAfterTax cũng CHƯA thuế
  // => Không cần chia ngược, chỉ cần tính VAT trực tiếp
  const backendItems: BackendInvoiceItem[] = items.map(item => {
    // item.totalAfterTax đã là số tiền CHƯA VAT (sau chiết khấu)
    const amount = Math.round(item.totalAfterTax);
    // Tính VAT = amount × (vatRate/100)
    const vatAmount = Math.round(amount * (vatRate / 100));
    
    return {
      productId: item.productId || 0,  // ✅ Dùng productId từ item, hoặc 0 nếu nhập tự do
      productName: item.name,          // ✅ Tên sản phẩm
      unit: item.unit,                 // ✅ Đơn vị tính
      quantity: item.quantity,
      amount: amount,                  // Tiền chưa VAT (đã trừ chiết khấu)
      vatAmount: vatAmount             // Tiền VAT tính từ amount
    };
  });
  
  // ✅ Sử dụng totals từ frontend (đã tính đúng)
  const totalAmountBeforeVat = totals.subtotalAfterDiscount; // Tổng sau CK, chưa VAT
  const totalVatAmount = totals.tax;                         // Tổng VAT
  
  // Log để debug
  console.log('📊 Invoice Mapping:', {
    frontendTotal: totals.total,
    backendTotalAmount: totals.total,  // ✅ Backend totalAmount = tổng cuối cùng
    backendAmount: totalAmountBeforeVat,
    backendTaxAmount: totalVatAmount,
    itemsCount: items.length,
    vatRate: vatRate
  });
  
  return {
    templateID,
    customerID: buyerInfo.customerID || 0,  // ✅ Dùng customer ID từ DB, hoặc 0 nếu khách lẻ
    taxCode: buyerInfo.taxCode || 'N/A',
    invoiceStatusID,                  // ⭐ NEW: 1=Nháp, 6=Chờ duyệt
    companyID: 1,                     // ✅ Backend yêu cầu companyID = 1 (hardcoded)
    customerName: buyerInfo.companyName || 'Khách hàng',
    address: buyerInfo.address || 'Chưa cập nhật',
    notes,                            // ⭐ NEW: Ghi chú
    paymentMethod: paymentMethod,     // ✅ Hình thức thanh toán
    items: backendItems,
    amount: totalAmountBeforeVat,     // Tổng tiền chưa VAT
    taxAmount: totalVatAmount,        // Tổng tiền VAT
    totalAmount: totals.total,        // ✅ Tổng thanh toán cuối cùng (đã bao gồm VAT)
    signedBy,                         // ⭐ NEW: UserID người ký (0=chưa ký)
    minRows: minRows,
    contactEmail: buyerInfo.email || 'noreply@company.com',
    contactPerson: buyerInfo.buyerName || '',  // ✅ Để trống nếu không nhập
    contactPhone: buyerInfo.phone || '0000000000'
  };
}

/**
 * Parse backend response to frontend format (if needed)
 */
export function mapFromBackendInvoiceResponse(
  response: BackendInvoiceResponse
): {
  invoiceID: number;
  invoiceNumber: string;
  status: string;
  createdAt: string;
} {
  return {
    invoiceID: response.invoiceID,
    invoiceNumber: response.invoiceNumber || `INV-${response.invoiceID}`,
    status: response.status || 'Draft',
    createdAt: response.createdAt || new Date().toISOString()
  };
}

// ==================== EXPORTS ====================

export default {
  mapToBackendInvoiceRequest,
  mapFromBackendInvoiceResponse,
  calculateAmountBeforeVat,
  validateTotals,
};
