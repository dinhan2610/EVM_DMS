import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import LinkIcon from '@mui/icons-material/Link';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { getInvoiceTypeLabel, getInvoiceTypeColor } from '../../services/invoiceService';
import type { PendingInvoice } from '../../types/dashboard.types';

interface ApprovalQueueProps {
  invoices: PendingInvoice[];
  onBulkApprove?: (ids: string[]) => void;
  onQuickView?: (invoice: PendingInvoice) => void;
}

const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ invoices, onBulkApprove, onQuickView }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(invoices.map((inv) => inv.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = () => {
    if (onBulkApprove) {
      onBulkApprove(selected);
      setSelected([]);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid #f1f5f9' }}>
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', mb: 0.5 }}>
              Hóa đơn chờ ký duyệt
              <Chip
                label={invoices.length}
                size="small"
                sx={{
                  ml: 1.5,
                  bgcolor: '#fef2f2',
                  color: '#dc2626',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
              />
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
              Cần xử lý trong ngày hôm nay
            </Typography>
          </Box>

          {selected.length > 0 && (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={handleBulkApprove}
              sx={{
                bgcolor: '#10b981',
                color: '#fff',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#059669',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                },
              }}
            >
              Duyệt {selected.length} hóa đơn
            </Button>
          )}
        </Box>

        {/* Table */}
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < invoices.length}
                    checked={invoices.length > 0 && selected.length === invoices.length}
                    onChange={handleSelectAll}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '12px', color: '#64748b' }}>
                  Khách hàng
                </TableCell>
                <TableCell align="right" sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '12px', color: '#64748b' }}>
                  Số tiền
                </TableCell>
                <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '12px', color: '#64748b' }}>
                  Người tạo
                </TableCell>
                <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '12px', color: '#64748b' }}>
                  Thời gian
                </TableCell>
                <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '12px', color: '#64748b' }}>
                  Loại
                </TableCell>
                <TableCell align="center" sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '12px', color: '#64748b' }}>
                  Thao tác
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  hover
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: '#f8fafc',
                    },
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(invoice.id)}
                      onChange={() => handleSelect(invoice.id)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#1e293b', fontSize: '13px' }}>
                      {invoice.customer}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#1e293b', fontSize: '13px' }}>
                      {formatCurrency(invoice.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
                      {invoice.createdBy}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '12px' }}>
                      {formatDistanceToNow(invoice.createdDate, {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const invoiceType = invoice.invoiceType
                      const originalInvoiceID = invoice.originalInvoiceID
                      const originalInvoiceNumber = invoice.originalInvoiceNumber
                      const originalInvoiceSignDate = invoice.originalInvoiceSignDate
                      const originalInvoiceSymbol = invoice.originalInvoiceSymbol
                      const adjustmentReason = invoice.adjustmentReason
                      const replacementReason = invoice.replacementReason
                      const cancellationReason = invoice.cancellationReason
                      const explanationText = invoice.explanationText
                      const label = getInvoiceTypeLabel(invoiceType)
                      const color = getInvoiceTypeColor(invoiceType)
                      
                      // Badge color mapping
                      const badgeColorMap: Record<string, { bg: string; text: string; border: string }> = {
                        'default': { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
                        'warning': { bg: '#fef3c7', text: '#f59e0b', border: '#fcd34d' },
                        'info': { bg: '#dbeafe', text: '#3b82f6', border: '#93c5fd' },
                        'error': { bg: '#fee2e2', text: '#ef4444', border: '#fca5a5' },
                        'secondary': { bg: '#f3e8ff', text: '#9c27b0', border: '#d8b4fe' },
                      }
                      const badgeColors = badgeColorMap[color] || badgeColorMap['default']
                      
                      // Format date helper
                      const formatDate = (dateStr?: string | null): string | null => {
                        if (!dateStr) return null
                        try {
                          return dayjs(dateStr).format('DD/MM/YYYY')
                        } catch {
                          return null
                        }
                      }
                      
                      // Build tooltip for adjustment/replacement invoices
                      const isLinkedInvoice = invoiceType === 2 || invoiceType === 3 || invoiceType === 4 || invoiceType === 5
                      
                      let tooltipContent: React.ReactNode = null
                      if (isLinkedInvoice) {
                        const actionText = 
                          invoiceType === 2 ? '📝 Hóa đơn điều chỉnh' :
                          invoiceType === 3 ? '🔄 Hóa đơn thay thế' :
                          invoiceType === 4 ? '❌ Hóa đơn hủy' :
                          invoiceType === 5 ? '📋 Hóa đơn giải trình' : ''
                        
                        // Get relevant reason based on invoice type
                        const reason = 
                          invoiceType === 2 ? adjustmentReason :
                          invoiceType === 3 ? replacementReason :
                          invoiceType === 4 ? cancellationReason :
                          invoiceType === 5 ? explanationText : null
                        
                        const formattedDate = formatDate(originalInvoiceSignDate)
                        
                        tooltipContent = (
                          <Box sx={{ py: 1, px: 0.5, minWidth: 280, maxWidth: 420 }}>
                            {/* Header */}
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 700, 
                                mb: 1.5, 
                                pb: 0.75,
                                borderBottom: '1px solid rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              {actionText}
                            </Typography>
                            
                            {/* Original Invoice Info - Always show if it's a linked invoice */}
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', mb: 0.75 }}>
                                Liên quan đến hóa đơn:
                              </Typography>
                              {originalInvoiceNumber && originalInvoiceNumber > 0 ? (
                                <Typography variant="body2" sx={{ fontSize: '13px', mb: 0.4, pl: 1 }}>
                                  • Số HĐ: <strong>{originalInvoiceNumber}</strong>
                                </Typography>
                              ) : (
                                <Typography variant="body2" sx={{ fontSize: '13px', mb: 0.4, pl: 1, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                                  • Số HĐ: <em>Chưa cấp số</em>
                                </Typography>
                              )}
                              {originalInvoiceSymbol && (
                                <Typography variant="body2" sx={{ fontSize: '13px', mb: 0.4, pl: 1 }}>
                                  • Ký hiệu: <strong>{originalInvoiceSymbol}</strong>
                                </Typography>
                              )}
                              {formattedDate && (
                                <Typography variant="body2" sx={{ fontSize: '13px', pl: 1 }}>
                                  • Ngày ký: <strong>{formattedDate}</strong>
                                </Typography>
                              )}
                            </Box>
                            
                            {/* Reason */}
                            {reason && (
                              <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', mb: 0.75 }}>
                                  Lý do:
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: '12.5px', 
                                    fontStyle: 'italic',
                                    pl: 1,
                                    color: 'rgba(255,255,255,0.95)',
                                    lineHeight: 1.5,
                                  }}
                                >
                                  "{reason}"
                                </Typography>
                              </Box>
                            )}
                            
                            {/* Action hint */}
                            <Box sx={{ mt: 0.75, pt: 0.75, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontSize: '11px', 
                                  fontStyle: 'italic',
                                  color: 'rgba(255,255,255,0.7)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                {originalInvoiceID ? '💡 Click để xem chi tiết hóa đơn gốc' : 'ℹ️ Chưa liên kết hóa đơn gốc'}
                              </Typography>
                            </Box>
                          </Box>
                        )
                      }
                      
                      // If not linked to original invoice, show simple badge
                      if (!isLinkedInvoice) {
                        return (
                          <Chip
                            label={label}
                            size="small"
                            sx={{
                              bgcolor: badgeColors.bg,
                              color: badgeColors.text,
                              fontWeight: 600,
                              fontSize: '11px',
                              height: 24,
                              borderRadius: '16px',
                              border: `1px solid ${badgeColors.border}`,
                            }}
                          />
                        )
                      }
                      
                      // If has original invoice, make it clickable with icon
                      if (originalInvoiceID && tooltipContent) {
                        return (
                          <Tooltip 
                            title={tooltipContent}
                            arrow
                            placement="top"
                          >
                            <Box
                              component={Link}
                              to={`/invoices/${originalInvoiceID}`}
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.75,
                                textDecoration: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                padding: '5px 12px',
                                borderRadius: '16px',
                                bgcolor: badgeColors.bg,
                                border: `1px solid ${badgeColors.border}`,
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: `0 4px 12px ${badgeColors.border}`,
                                  bgcolor: badgeColors.bg,
                                },
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  color: badgeColors.text,
                                  fontWeight: 600,
                                  fontSize: '11px',
                                  lineHeight: 1.2,
                                }}
                              >
                                {label}
                              </Typography>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                                  backdropFilter: 'blur(4px)',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                }}
                              >
                                <LinkIcon 
                                  sx={{ 
                                    fontSize: 14, 
                                    color: '#1976d2',
                                  }} 
                                />
                              </Box>
                            </Box>
                          </Tooltip>
                        )
                      }
                      
                      // Show badge with disabled icon if no originalInvoiceID
                      return (
                        <Tooltip 
                          title={tooltipContent}
                          arrow
                          placement="top"
                        >
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.75,
                              padding: '5px 12px',
                              borderRadius: '16px',
                              bgcolor: badgeColors.bg,
                              border: `1px solid ${badgeColors.border}`,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: badgeColors.text,
                                fontWeight: 600,
                                fontSize: '11px',
                                lineHeight: 1.2,
                              }}
                            >
                              {label}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                bgcolor: 'rgba(200, 200, 200, 0.5)',
                                backdropFilter: 'blur(4px)',
                              }}
                            >
                              <LinkIcon 
                                sx={{ 
                                  fontSize: 14, 
                                  color: '#9e9e9e',
                                  opacity: 0.6,
                                }} 
                              />
                            </Box>
                          </Box>
                        </Tooltip>
                      )
                    })()}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Xem trước">
                      <IconButton
                        size="small"
                        onClick={() => onQuickView && onQuickView(invoice)}
                        sx={{
                          color: '#64748b',
                          '&:hover': {
                            color: '#3b82f6',
                            bgcolor: '#eff6ff',
                          },
                        }}
                      >
                        <VisibilityIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer */}
        {invoices.length === 0 && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
              Không có hóa đơn chờ duyệt
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Tất cả hóa đơn đã được xử lý
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ApprovalQueue;
