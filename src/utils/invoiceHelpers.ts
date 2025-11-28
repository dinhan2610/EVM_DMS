/**
 * Invoice Helper Utilities
 * 
 * Centralized utility functions for invoice operations used across:
 * - CreateInvoice.tsx
 * - CreateVatInvoice.tsx
 * - CreateAdjustmentInvoice.tsx
 * - CreateReplacementInvoice.tsx
 * - InvoiceManagement.tsx
 * - ItemsManagement.tsx
 * - Various modal components
 * 
 * Benefits:
 * - Single source of truth for invoice calculations
 * - Consistent formatting across the application
 * - Easier testing and maintenance
 * - Reduced code duplication
 */

import type { InvoiceItem, ProductItem } from '@/types/invoiceTemplate';

// ==================== CURRENCY FORMATTING ====================

/**
 * Format a number as Vietnamese currency (VND)
 * 
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "1.000.000 ₫")
 * 
 * @example
 * formatCurrency(1000000) // "1.000.000 ₫"
 * formatCurrency(500) // "500 ₫"
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Format a number as Vietnamese currency without the symbol
 * 
 * @param amount - The amount to format
 * @returns Formatted number string (e.g., "1.000.000")
 * 
 * @example
 * formatNumber(1000000) // "1.000.000"
 */
export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

/**
 * Parse a formatted currency string back to a number
 * 
 * @param formattedAmount - The formatted currency string
 * @returns The numeric value
 * 
 * @example
 * parseCurrency("1.000.000 ₫") // 1000000
 */
export const parseCurrency = (formattedAmount: string): number => {
  const cleanedString = formattedAmount.replace(/[^\d]/g, '');
  return parseInt(cleanedString, 10) || 0;
};

// ==================== CALCULATION FUNCTIONS ====================

/**
 * Calculate subtotal from an array of invoice items
 * 
 * @param items - Array of invoice items
 * @returns Subtotal amount
 * 
 * @example
 * calculateSubtotal([
 *   { id: 1, quantity: 2, unitPrice: 1000, total: 2000 },
 *   { id: 2, quantity: 1, unitPrice: 3000, total: 3000 }
 * ]) // 5000
 */
export const calculateSubtotal = (items: InvoiceItem[]): number => {
  return items.reduce((sum, item) => sum + (item.total || 0), 0);
};

/**
 * Calculate tax amount (VAT) from subtotal
 * 
 * @param subtotal - The subtotal amount
 * @param taxRate - Tax rate (default: 0.1 for 10%)
 * @returns Tax amount
 * 
 * @example
 * calculateTax(10000) // 1000 (10% VAT)
 * calculateTax(10000, 0.08) // 800 (8% VAT)
 */
export const calculateTax = (subtotal: number, taxRate: number = 0.1): number => {
  return subtotal * taxRate;
};

/**
 * Calculate total amount (subtotal + tax)
 * 
 * @param subtotal - The subtotal amount
 * @param taxRate - Tax rate (default: 0.1 for 10%)
 * @returns Total amount including tax
 * 
 * @example
 * calculateTotal(10000) // 11000
 */
export const calculateTotal = (subtotal: number, taxRate: number = 0.1): number => {
  return subtotal + calculateTax(subtotal, taxRate);
};

/**
 * Calculate all invoice amounts (subtotal, tax, total)
 * 
 * @param items - Array of invoice items
 * @param taxRate - Tax rate (default: 0.1 for 10%)
 * @returns Object containing subtotal, taxAmount, and totalAmount
 * 
 * @example
 * calculateInvoiceAmounts([
 *   { id: 1, quantity: 2, unitPrice: 1000, total: 2000 },
 *   { id: 2, quantity: 1, unitPrice: 3000, total: 3000 }
 * ])
 * // { subtotal: 5000, taxAmount: 500, totalAmount: 5500 }
 */
export const calculateInvoiceAmounts = (
  items: InvoiceItem[],
  taxRate: number = 0.1
): {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
} => {
  const subtotal = calculateSubtotal(items);
  const taxAmount = calculateTax(subtotal, taxRate);
  const totalAmount = subtotal + taxAmount;

  return {
    subtotal,
    taxAmount,
    totalAmount,
  };
};

/**
 * Calculate item total (quantity * unit price)
 * 
 * @param quantity - Item quantity
 * @param unitPrice - Unit price
 * @returns Total amount for the item
 * 
 * @example
 * calculateItemTotal(5, 1000) // 5000
 */
export const calculateItemTotal = (quantity: number, unitPrice: number): number => {
  return quantity * unitPrice;
};

/**
 * Calculate discount amount from percentage
 * 
 * @param amount - Original amount
 * @param discountPercent - Discount percentage (e.g., 10 for 10%)
 * @returns Discount amount
 * 
 * @example
 * calculateDiscountAmount(10000, 10) // 1000
 */
export const calculateDiscountAmount = (amount: number, discountPercent: number): number => {
  return (amount * discountPercent) / 100;
};

/**
 * Calculate amount after discount
 * 
 * @param amount - Original amount
 * @param discountPercent - Discount percentage
 * @returns Amount after discount
 * 
 * @example
 * calculateAmountAfterDiscount(10000, 10) // 9000
 */
export const calculateAmountAfterDiscount = (amount: number, discountPercent: number): number => {
  return amount - calculateDiscountAmount(amount, discountPercent);
};

/**
 * Calculate total discount from items
 * 
 * @param items - Array of invoice items with discount information
 * @returns Total discount amount
 * 
 * @example
 * calculateTotalDiscount([
 *   { id: 1, discountAmount: 100 },
 *   { id: 2, discountAmount: 200 }
 * ]) // 300
 */
export const calculateTotalDiscount = (items: InvoiceItem[]): number => {
  return items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
};

// ==================== ITEM MANIPULATION ====================

/**
 * Generate a unique ID for invoice items
 * 
 * @param prefix - Prefix for the ID (default: 'item')
 * @returns Unique ID string
 * 
 * @example
 * generateItemId() // "item-1234567890"
 * generateItemId('product') // "product-1234567890"
 */
export const generateItemId = (prefix: string = 'item'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create an initial invoice item with default values
 * 
 * @param overrides - Optional property overrides
 * @returns New invoice item with default values
 * 
 * @example
 * createInitialItem() 
 * // { id: 'item-...', description: '', quantity: 1, unitPrice: 0, total: 0, ... }
 */
export const createInitialItem = (overrides?: Partial<InvoiceItem>): InvoiceItem => {
  return {
    id: generateItemId(),
    description: '',
    name: '',
    unit: '',
    quantity: 1,
    unitPrice: 0,
    price: 0,
    total: 0,
    ...overrides,
  };
};

/**
 * Update an invoice item and recalculate its total
 * 
 * @param item - The item to update
 * @param updates - Properties to update
 * @returns Updated item with recalculated total
 * 
 * @example
 * updateItemWithTotal(
 *   { id: 1, quantity: 1, unitPrice: 1000, total: 1000 },
 *   { quantity: 5 }
 * )
 * // { id: 1, quantity: 5, unitPrice: 1000, total: 5000 }
 */
export const updateItemWithTotal = (
  item: InvoiceItem,
  updates: Partial<InvoiceItem>
): InvoiceItem => {
  const updatedItem = { ...item, ...updates };

  // Recalculate total if quantity or price changed
  const quantity = updatedItem.quantity || 0;
  const price = updatedItem.unitPrice || updatedItem.price || 0;

  updatedItem.total = calculateItemTotal(quantity, price);

  return updatedItem;
};

// ==================== VALIDATION ====================

/**
 * Validate if invoice item has required fields
 * 
 * @param item - Invoice item to validate
 * @returns True if item is valid
 * 
 * @example
 * isValidItem({ id: 1, quantity: 1, unitPrice: 100 }) // true
 * isValidItem({ id: 1, quantity: 0 }) // false
 */
export const isValidItem = (item: InvoiceItem): boolean => {
  return (
    Boolean(item.id) &&
    item.quantity > 0 &&
    (item.unitPrice || item.price || 0) > 0
  );
};

/**
 * Validate if all items in an invoice are valid
 * 
 * @param items - Array of invoice items
 * @returns True if all items are valid
 */
export const areAllItemsValid = (items: InvoiceItem[]): boolean => {
  return items.length > 0 && items.every(isValidItem);
};

// ==================== PRODUCT CONVERSION ====================

/**
 * Convert InvoiceItem to ProductItem format
 * 
 * @param item - Invoice item to convert
 * @param stt - Sequential number (STT)
 * @returns Product item
 * 
 * @example
 * convertToProductItem({ id: 1, name: 'Product A', quantity: 2, price: 1000 }, 1)
 * // { stt: 1, name: 'Product A', unit: '', quantity: 2, price: 1000, total: 2000 }
 */
export const convertToProductItem = (item: InvoiceItem, stt: number): ProductItem => {
  const unitPrice = item.unitPrice || item.price || 0;
  const quantity = item.quantity || 0;
  
  return {
    stt,
    name: item.name || item.description || '',
    unit: item.unit || '',
    quantity,
    unitPrice,
    total: item.total || (quantity * unitPrice),
  };
};

/**
 * Convert array of InvoiceItems to ProductItems
 * 
 * @param items - Array of invoice items
 * @returns Array of product items
 */
export const convertToProductItems = (items: InvoiceItem[]): ProductItem[] => {
  return items.map((item, index) => convertToProductItem(item, index + 1));
};

// ==================== DATE HELPERS ====================

/**
 * Format date for invoice display
 * 
 * @param date - Date to format (Date object or ISO string)
 * @returns Formatted date string (e.g., "13/11/2025")
 * 
 * @example
 * formatInvoiceDate(new Date('2025-11-13')) // "13/11/2025"
 */
export const formatInvoiceDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Get current date in ISO format for invoice
 * 
 * @returns Current date as ISO string
 */
export const getCurrentInvoiceDate = (): string => {
  return new Date().toISOString();
};

// ==================== MOCK DATA HELPERS ====================

/**
 * Generate mock invoice items for testing
 * 
 * @param count - Number of items to generate
 * @returns Array of mock invoice items
 */
export const generateMockItems = (count: number = 3): InvoiceItem[] => {
  const mockProducts = [
    { name: 'Dịch vụ tư vấn', unit: 'Giờ', price: 500000 },
    { name: 'Phần mềm quản lý', unit: 'Bộ', price: 10000000 },
    { name: 'Thiết kế website', unit: 'Dự án', price: 20000000 },
    { name: 'Bảo trì hệ thống', unit: 'Tháng', price: 3000000 },
    { name: 'Đào tạo nhân viên', unit: 'Khóa', price: 5000000 },
  ];

  return Array.from({ length: count }, (_, index) => {
    const mockProduct = mockProducts[index % mockProducts.length];
    const quantity = Math.floor(Math.random() * 5) + 1;
    const total = quantity * mockProduct.price;

    return {
      id: generateItemId(),
      name: mockProduct.name,
      unit: mockProduct.unit,
      quantity,
      unitPrice: mockProduct.price,
      price: mockProduct.price,
      total,
    };
  });
};
