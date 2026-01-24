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

// ==================== HELPER FUNCTIONS ====================

/**
 * ✅ Map payment method giữa English (backend) và Vietnamese (frontend)
 */
const PAYMENT_METHOD_MAP: Record<string, string> = {
  // Backend English → Frontend Vietnamese
  'Cash': 'Tiền mặt',
  'Banking': 'Chuyển khoản',
  'DebtOffset': 'Đổi trừ công nợ',
  'Other': 'Khác',
  // Frontend Vietnamese → Backend English (reverse)
  'Tiền mặt': 'Cash',
  'Chuyển khoản': 'Banking',
  'Đổi trừ công nợ': 'DebtOffset',
  'Khác': 'Other'
};

/**
 * Map payment method từ bất kỳ format nào sang Vietnamese (frontend)
 */
export function mapPaymentMethodToVietnamese(method: string): string {
  return PAYMENT_METHOD_MAP[method] || method || 'Tiền mặt';
}

/**
 * Map payment method từ Vietnamese (frontend) sang English (backend)
 */
export function mapPaymentMethodToEnglish(method: string): string {
  return PAYMENT_METHOD_MAP[method] || method || 'Cash';
}

// ==================== BACKEND TYPES ====================

/**
 * ⚠️ CREATE Invoice Request - Full fields
 * Dùng cho POST /api/Invoice
 */
export interface BackendInvoiceRequest {
  templateID: number;
  customerID: number;           // ✅ PascalCase (backend đã fix collision)
  taxCode: string;              // MST khách hàng
  invoiceStatusID: number;      // 1=Nháp, 6=Chờ duyệt
  companyID: number;            // ID công ty
  salesID?: number;             // ✅ Optional: ID sales (chỉ gửi khi tạo từ prefill)
  customerName: string;         // Tên khách hàng
  address: string;              // Địa chỉ
  notes: string;                // Ghi chú
  paymentMethod: string;        // Hình thức thanh toán
  items: BackendInvoiceItem[];
  amount: number;               // Tổng tiền hàng (CHƯA VAT)
  taxAmount: number;            // Tổng tiền VAT
  totalAmount: number;          // Tổng cộng thanh toán
  performedBy: number;          // 🆕 UserID người thực hiện (thay signedBy)
  minRows: number;              // Số dòng trống tối thiểu
  contactEmail: string;         // Email liên hệ
  contactPerson: string;        // Người liên hệ
  contactPhone: string;         // SĐT liên hệ
  requestID?: number;           // 🆕 Optional: Link với Invoice Request
}

/**
 * ✅ UPDATE Draft Invoice Request - Simplified
 * Dùng cho PUT /api/Invoice/draft/{id}
 */
export interface BackendDraftInvoiceRequest {
  CustomerID: number;           // ✅ C# backend property (uppercase 'ID')
  taxCode: string;              // MST khách hàng
  customerName: string;         // Tên khách hàng
  address: string;              // Địa chỉ
  notes: string;                // Ghi chú
  paymentMethod: string;        // Hình thức thanh toán
  items: BackendInvoiceItem[];
  amount: number;               // Tổng tiền hàng (CHƯA VAT)
  taxAmount: number;            // Tổng tiền VAT
  totalAmount: number;          // Tổng cộng thanh toán
  minRows: number;              // Số dòng trống tối thiểu
  contactEmail: string;         // Email liên hệ
  contactPerson: string;        // Người liên hệ
  contactPhone: string;         // SĐT liên hệ
  signedBy: number;             // UserID người ký (0 nếu chưa ký)
}

export interface BackendInvoiceItem {
  productId: number;            // ID sản phẩm (0 nếu không có trong DB)
  productName: string;          // Tên sản phẩm
  unit: string;                 // Đơn vị tính
  quantity: number;             // Số lượng
  amount: number;               // Thành tiền CHƯA VAT
  vatAmount: number;            // Tiền VAT
}

export interface BackendInvoiceResponse {
  invoiceID: number;
  invoiceNumber?: number;        // ✅ FIX: Backend trả về kiểu number, không phải string
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
  vatRate?: number;             // ✅ Thuế suất GTGT của sản phẩm (0, 5, 8, 10)
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
  totals: FrontendTotals
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
  
  // 4. ✅ Validate tax (tính từng item với vatRate riêng)
  const calculatedTax = items.reduce((sum, item) => {
    const itemSubtotal = item.totalAfterTax; // Thành tiền sau CK, chưa VAT
    const itemVatRate = item.vatRate || 0;
    const itemTax = Math.round(itemSubtotal * (itemVatRate / 100));
    return sum + itemTax;
  }, 0);
  
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
 * ✅ Mỗi sản phẩm có thuế suất VAT riêng (item.vatRate)
 * 
 * @param templateID - ID template được chọn
 * @param buyerInfo - Thông tin người mua
 * @param items - Danh sách sản phẩm/dịch vụ (mỗi item có vatRate riêng)
 * @param totals - Tổng tiền đã tính
 * @param paymentMethod - Hình thức thanh toán ("Tiền mặt", "Chuyển khoản", "Thẻ", v.v.)
 * @param minRows - Số dòng trống tối thiểu (mặc định 5)
 * @param invoiceStatusID - Trạng thái hóa đơn (1=Nháp, 6=Chờ duyệt)
 * @param notes - Ghi chú
 * @param signedBy - UserID người TẠO INVOICE trong hệ thống (performedBy - luôn là currentUserId)
 *                   Mục đích: Audit trail, accountability, permission check
 * @param salesID - UserID Sale tạo INVOICE REQUEST ban đầu (CHỈ khi tạo từ request, undefined = không gửi)
 *                  Mục đích: Tính commission, sales performance, filter by sale
 * @param requestID - ID của Invoice Request (CHỉ khi tạo từ request, null = không gửi)
 *                    Mục đích: Link invoice với request, update request status
 * @param invoiceType - Loại hóa đơn ('B2B' hoặc 'B2C') để xử lý contactPerson chính xác
 * @returns Backend request object
 */
export function mapToBackendInvoiceRequest(
  templateID: number,
  buyerInfo: FrontendBuyerInfo,
  items: FrontendInvoiceItem[],
  totals: FrontendTotals,
  paymentMethod: string = "Tiền mặt",
  minRows: number = 5,
  invoiceStatusID: number = 1,
  notes: string = '',
  signedBy: number = 0,                 // performedBy - Người tạo invoice (Audit/Legal)
  salesID?: number,                     // Sale tạo request (Business/Commission) - Optional
  requestID: number | null = null,      // Link với request - Optional
  invoiceType: 'B2B' | 'B2C' = 'B2B'    // ✅ Loại hóa đơn
): BackendInvoiceRequest {
  
  // Validate totals trước khi gửi
  const validation = validateTotals(items, totals);
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
    // ✅ Tính VAT = amount × (vatRate của sản phẩm / 100)
    const itemVatRate = item.vatRate || 0;  // Lấy VAT rate từ item, default 0
    const vatAmount = Math.round(amount * (itemVatRate / 100));
    
    return {
      productId: item.productId || 0,  // ✅ Dùng productId từ item, hoặc 0 nếu nhập tự do
      productName: item.name,          // ✅ Tên sản phẩm
      unit: item.unit,                 // ✅ Đơn vị tính
      quantity: item.quantity,         // ✅ Số lượng
      amount: amount,                  // ✅ Tiền chưa VAT (đã trừ chiết khấu)
      vatAmount: vatAmount             // ✅ Tiền VAT tính từ amount × vatRate của sản phẩm
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
  });
  
  // 🔍 Log buyerInfo để debug
  console.log('👤 Buyer Info:', {
    customerID: buyerInfo.customerID,
    taxCode: buyerInfo.taxCode,
    companyName: buyerInfo.companyName,
    address: buyerInfo.address,
    buyerName: buyerInfo.buyerName,  // ✅ CHECK: Người mua hàng
    email: buyerInfo.email,
    phone: buyerInfo.phone,
  });
  
  // ✅ CRITICAL: Logic phân biệt 2 mode tạo hóa đơn
  // 
  // MODE 1: TẠO TRỰC TIẾP (Accountant tự tạo)
  //   - salesID = undefined     → KHÔNG gửi lên backend
  //   - requestID = null        → KHÔNG gửi lên backend
  //   - performedBy = currentUserId (Accountant)
  //   → Backend: Invoice độc lập, không link với Sale/Request
  // 
  // MODE 2: TẠO TỪ REQUEST (Sale tạo request → Accountant xử lý)
  //   - salesID = 5 (Sale ID)   → GỬI để tính commission cho Sale
  //   - requestID = 123         → GỬI để link invoice với request
  //   - performedBy = currentUserId (Accountant)
  //   → Backend: Link invoice với request, update request status, lưu salesID
  
  // ✅ LOGIC: Xử lý contactPerson theo loại hóa đơn
  // - B2B (Doanh nghiệp): contactPerson = buyerInfo.buyerName (Người mua hàng, có thể trống)
  // - B2C (Bán lẻ): contactPerson = buyerInfo.companyName (Tên Khách Hàng, cùng giá trị với customerName)
  const contactPersonValue = invoiceType === 'B2B' 
    ? (buyerInfo.buyerName || '')              // B2B: Người đại diện/kế toán (không bắt buộc)
    : (buyerInfo.companyName || 'Khách hàng'); // B2C: Tên khách hàng cá nhân
  
  console.log('👤 [ADAPTER] contactPerson logic:', {
    invoiceType,
    buyerName: buyerInfo.buyerName,
    companyName: buyerInfo.companyName,
    contactPersonValue,
  });
  
  const payload = {
    templateID,
    customerID: buyerInfo.customerID || 0,
    taxCode: buyerInfo.taxCode || 'N/A',
    invoiceStatusID,
    companyID: 1,
    customerName: buyerInfo.companyName || 'Khách hàng',
    address: buyerInfo.address || 'Chưa cập nhật',
    notes: notes || '',
    paymentMethod: paymentMethod,
    items: backendItems,
    amount: totalAmountBeforeVat,
    taxAmount: totalVatAmount,
    totalAmount: totals.total,
    performedBy: signedBy,            // ✅ Người TẠO INVOICE (Audit/Legal) - LUÔN CÓ
    minRows: minRows,
    contactEmail: buyerInfo.email || 'noreply@company.com',
    contactPerson: contactPersonValue, // ✅ Logic đã tối ưu theo B2B/B2C
    contactPhone: buyerInfo.phone || '0000000000',
  };
  
  // ✅ CHỈ thêm salesID nếu có giá trị (tạo từ request - để tính commission)
  if (salesID !== undefined) {
    if (salesID > 0) {
      Object.assign(payload, { salesID });
      console.log('✅ [ADAPTER] Added salesID to payload:', salesID, '(Sale nhận commission)');
    }
  }
  
  // ✅ CHỈ thêm requestID nếu có giá trị (tạo từ request - để link)
  if (requestID !== null) {
    if (requestID > 0) {
      Object.assign(payload, { requestID });
      console.log('✅ [ADAPTER] Added requestID to payload:', requestID, '(Link với request)');
    }
  }
  
  return payload;
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
    invoiceNumber: response.invoiceNumber ? String(response.invoiceNumber) : `INV-${response.invoiceID}`,
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
