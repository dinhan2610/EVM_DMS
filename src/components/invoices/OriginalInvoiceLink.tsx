/**
 * Original Invoice Link Component
 * Hiển thị link tới hóa đơn gốc cho các hóa đơn điều chỉnh/thay thế/hủy/giải trình
 */

import { Box, Link, Typography, Chip } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import LinkIcon from '@mui/icons-material/Link'
import DescriptionIcon from '@mui/icons-material/Description'

interface OriginalInvoiceLinkProps {
  originalInvoiceID: number
  originalInvoiceNumber?: number
  variant?: 'compact' | 'full'
}

/**
 * Component hiển thị link tới hóa đơn gốc
 * - Compact: Chỉ hiển thị số HĐ với icon
 * - Full: Hiển thị label + số HĐ + icon link
 */
export default function OriginalInvoiceLink({ 
  originalInvoiceID, 
  originalInvoiceNumber,
  variant = 'full'
}: OriginalInvoiceLinkProps) {
  if (!originalInvoiceID) return null

  const displayNumber = originalInvoiceNumber || originalInvoiceID
  
  if (variant === 'compact') {
    return (
      <Chip
        component={RouterLink}
        to={`/admin/invoices/${originalInvoiceID}`}
        icon={<DescriptionIcon />}
        label={`HĐ gốc: #${displayNumber}`}
        size="small"
        clickable
        color="primary"
        variant="outlined"
        sx={{ 
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'primary.50',
          }
        }}
      />
    )
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        py: 1,
        px: 2,
        backgroundColor: 'grey.50',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'grey.200'
      }}
    >
      <LinkIcon sx={{ color: 'primary.main', fontSize: 20 }} />
      <Typography variant="body2" color="text.secondary">
        Hóa đơn gốc:
      </Typography>
      <Link
        component={RouterLink}
        to={`/admin/invoices/${originalInvoiceID}`}
        sx={{ 
          fontWeight: 600,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          }
        }}
      >
        #{displayNumber}
      </Link>
    </Box>
  )
}
