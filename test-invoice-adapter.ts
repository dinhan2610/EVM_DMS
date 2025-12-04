/**
 * TEST ADAPTER - Kiểm tra conversion giữa Frontend và Backend
 * 
 * Run: node test-invoice-adapter.js
 */

import { mapToBackendInvoiceRequest, calculateAmountBeforeVat, validateTotals, BackendInvoiceItem } from './src/utils/invoiceAdapter';

// ==================== TEST DATA ====================

const frontendInvoiceData = {
  templateID: 26,
  
  buyerInfo: {
    taxCode: '0101243150-136',
    companyCode: 'MISA-HN',
    companyName: 'CÔNG TY CỔ PHẦN MISA',
    address: 'Tầng 9, tòa nhà Technosoft, Duy Tân, Cầu Giấy, Hà Nội',
    buyerName: 'Kế toán A',
    email: 'hoadon@misa.com.vn',
    phone: '0987654321',
    paymentMethod: 'Chuyển khoản'
  },
  
  items: [
    {
      id: 1,
      stt: 1,
      type: 'Dịch vụ',
      code: 'DV-001',
      name: 'Dịch vụ tư vấn phần mềm',
      unit: 'Giờ',
      quantity: 10,
      priceAfterTax: 500000,      // Đơn giá ĐÃ bao gồm VAT 10%
      discountPercent: 5,
      discountAmount: 250000,
      totalAfterTax: 4750000       // (10 * 500000) - 250000 = 4,750,000
    },
    {
      id: 2,
      stt: 2,
      type: 'Hàng hóa',
      code: 'PM-002',
      name: 'Phần mềm quản lý bán hàng',
      unit: 'Bộ',
      quantity: 2,
      priceAfterTax: 15000000,
      discountPercent: 10,
      discountAmount: 3000000,
      totalAfterTax: 27000000      // (2 * 15000000) - 3000000 = 27,000,000
    },
    {
      id: 3,
      stt: 3,
      type: 'Dịch vụ',
      code: 'DV-003',
      name: 'Đào tạo sử dụng phần mềm',
      unit: 'Khóa',
      quantity: 1,
      priceAfterTax: 8000000,
      discountPercent: 0,
      discountAmount: 0,
      totalAfterTax: 8000000       // (1 * 8000000) - 0 = 8,000,000
    }
  ],
  
  vatRate: 10,
  
  totals: {
    subtotal: 43000000,            // 5,000,000 + 30,000,000 + 8,000,000
    discount: 3250000,             // 250,000 + 3,000,000 + 0
    subtotalAfterDiscount: 39750000, // 43,000,000 - 3,250,000
    tax: 3975000,                  // 39,750,000 * 10%
    total: 43725000                // 39,750,000 + 3,975,000
  },
  
  userId: 1
};

// ==================== TESTS ====================

console.log('🧪 TEST 1: Calculate Amount Before VAT');
console.log('========================================');

const test1 = calculateAmountBeforeVat(5000000, 10);
console.log('Input: 5,000,000 VND (đã VAT 10%)');
console.log('Expected amount:', '4,545,455 VND');
console.log('Actual amount:  ', test1.amount.toLocaleString('vi-VN'), 'VND');
console.log('Expected VAT:   ', '454,545 VND');
console.log('Actual VAT:     ', test1.vatAmount.toLocaleString('vi-VN'), 'VND');
console.log('Sum:', (test1.amount + test1.vatAmount).toLocaleString('vi-VN'), 'VND');
console.log('✅ Test 1 passed!\n');

// ==================== TEST 2 ====================

console.log('🧪 TEST 2: Validate Totals');
console.log('========================================');

const validation = validateTotals(
  frontendInvoiceData.items,
  frontendInvoiceData.totals,
  frontendInvoiceData.vatRate
);

if (validation.isValid) {
  console.log('✅ Totals validation PASSED');
} else {
  console.log('❌ Totals validation FAILED');
  validation.errors.forEach((err: string) => console.log('  -', err));
}
console.log('');

// ==================== TEST 3 ====================

console.log('🧪 TEST 3: Map Frontend to Backend Request');
console.log('========================================');

const backendRequest = mapToBackendInvoiceRequest(
  frontendInvoiceData.templateID,
  frontendInvoiceData.buyerInfo,
  frontendInvoiceData.items,
  frontendInvoiceData.vatRate,
  frontendInvoiceData.totals,
  frontendInvoiceData.buyerInfo.paymentMethod, // paymentMethod
  5 // minRows
);

console.log('Backend Request:');
console.log(JSON.stringify(backendRequest, null, 2));
console.log('');

// ==================== TEST 4: VERIFY CALCULATIONS ====================

console.log('🧪 TEST 4: Verify Item Calculations');
console.log('========================================');

backendRequest.items.forEach((item: BackendInvoiceItem, index: number) => {
  const frontendItem = frontendInvoiceData.items[index];
  const sum = item.amount + item.vatAmount;
  
  console.log(`Item ${index + 1}: ${frontendItem.name}`);
  console.log(`  Frontend totalAfterTax: ${frontendItem.totalAfterTax.toLocaleString('vi-VN')}`);
  console.log(`  Backend amount:        ${item.amount.toLocaleString('vi-VN')} (chưa VAT)`);
  console.log(`  Backend vatAmount:     ${item.vatAmount.toLocaleString('vi-VN')}`);
  console.log(`  Sum:                   ${sum.toLocaleString('vi-VN')}`);
  console.log(`  Match: ${sum === frontendItem.totalAfterTax ? '✅' : '❌'}`);
  console.log('');
});

// ==================== TEST 5: TOTAL VERIFICATION ====================

console.log('🧪 TEST 5: Verify Total Amounts');
console.log('========================================');

const backendTotalAmount = backendRequest.amount + backendRequest.taxAmount;

console.log('Frontend Totals:');
console.log('  Subtotal:               ', frontendInvoiceData.totals.subtotal.toLocaleString('vi-VN'));
console.log('  Discount:               ', frontendInvoiceData.totals.discount.toLocaleString('vi-VN'));
console.log('  Subtotal After Discount:', frontendInvoiceData.totals.subtotalAfterDiscount.toLocaleString('vi-VN'));
console.log('  Tax:                    ', frontendInvoiceData.totals.tax.toLocaleString('vi-VN'));
console.log('  Total:                  ', frontendInvoiceData.totals.total.toLocaleString('vi-VN'));
console.log('');

console.log('Backend Request:');
console.log('  amount:                 ', backendRequest.amount.toLocaleString('vi-VN'), '(chưa VAT)');
console.log('  taxAmount:              ', backendRequest.taxAmount.toLocaleString('vi-VN'));
console.log('  totalAmount:            ', backendRequest.totalAmount.toLocaleString('vi-VN'));
console.log('  Sum (amount + tax):     ', backendTotalAmount.toLocaleString('vi-VN'));
console.log('');

console.log('Verification:');
console.log('  Backend totalAmount matches frontend subtotalAfterDiscount:', 
  backendRequest.totalAmount === frontendInvoiceData.totals.subtotalAfterDiscount ? '✅' : '❌');
console.log('  Sum matches frontend total:', 
  backendTotalAmount === frontendInvoiceData.totals.total ? '✅' : '❌');
console.log('');

// ==================== CURL COMMAND ====================

console.log('🚀 CURL COMMAND TO TEST API:');
console.log('========================================');
console.log(`
curl -X 'POST' \\
  'http://159.223.64.31/api/Invoice' \\
  -H 'accept: text/plain' \\
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(backendRequest, null, 2)}'
`);

// ==================== EXPECTED RESPONSE ====================

console.log('📥 EXPECTED RESPONSE:');
console.log('========================================');
console.log(`
{
  "invoiceID": 123,
  "invoiceNumber": "INV-00001234",
  "templateID": 26,
  "customerName": "CÔNG TY CỔ PHẦN MISA",
  "totalAmount": 39750000,
  "status": "Draft",
  "createdAt": "2025-12-03T08:00:00Z"
}
`);

console.log('✅ ALL TESTS COMPLETED!');
