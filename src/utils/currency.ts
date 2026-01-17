/**
 * Currency Formatting Utilities
 * Shared formatters to avoid code duplication across components
 */

/**
 * Format number as Vietnamese currency (VND)
 * @param amount - The amount to format
 * @param options - Optional formatting options
 * @returns Formatted currency string (e.g., "1.000.000 ₫" or "1M ₫")
 */
export const formatCurrency = (
  amount: number,
  options?: {
    notation?: 'standard' | 'compact'
    minimumFractionDigits?: number
  }
): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    notation: options?.notation || 'standard',
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
  }).format(amount)
}

/**
 * Format number as Vietnamese currency with compact notation (1M, 1B)
 * @param amount - The amount to format
 * @returns Compact formatted string (e.g., "1M ₫", "1,2Tr ₫")
 */
export const formatCurrencyCompact = (amount: number): string => {
  return formatCurrency(amount, { notation: 'compact' })
}

/**
 * Format number as plain currency without compact notation
 * @param amount - The amount to format
 * @returns Standard formatted string (e.g., "1.000.000 ₫")
 */
export const formatCurrencyStandard = (amount: number): string => {
  return formatCurrency(amount, { notation: 'standard' })
}
