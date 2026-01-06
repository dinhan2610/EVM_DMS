/**
 * Invoice Type Badge Component
 * Hiển thị badge màu sắc theo loại hóa đơn
 */

import { Chip, type ChipProps } from '@mui/material'
import { INVOICE_TYPE, getInvoiceTypeLabel, getInvoiceTypeColor } from '@/services/invoiceService'

interface InvoiceTypeBadgeProps {
  invoiceType: number
  size?: ChipProps['size']
  variant?: ChipProps['variant']
}

/**
 * Badge hiển thị loại hóa đơn với màu sắc tương ứng:
 * - Gốc: Mặc định (xám)
 * - Điều chỉnh: Warning (vàng)
 * - Thay thế: Info (xanh dương)
 * - Hủy: Error (đỏ)
 * - Giải trình: Secondary (tím)
 */
export default function InvoiceTypeBadge({ 
  invoiceType, 
  size = 'small',
  variant = 'filled'
}: InvoiceTypeBadgeProps) {
  const label = getInvoiceTypeLabel(invoiceType)
  const colorName = getInvoiceTypeColor(invoiceType)
  
  // Map color names to MUI chip colors
  const color: ChipProps['color'] = 
    colorName === 'warning' ? 'warning' :
    colorName === 'error' ? 'error' :
    colorName === 'info' ? 'info' :
    colorName === 'secondary' ? 'secondary' :
    'default'
  
  // Hide badge for original invoices (loại gốc không cần badge)
  if (invoiceType === INVOICE_TYPE.ORIGINAL) {
    return null
  }
  
  return (
    <Chip 
      label={label}
      color={color}
      size={size}
      variant={variant}
      sx={{ 
        fontWeight: 500,
        fontSize: size === 'small' ? '0.75rem' : '0.875rem'
      }}
    />
  )
}
