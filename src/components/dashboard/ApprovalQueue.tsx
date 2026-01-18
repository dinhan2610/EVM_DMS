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
      setSelected(invoices.map((inv) => String(inv.invoiceId)));
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
                  Thời gian chờ
                </TableCell>
                <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '12px', color: '#64748b' }}>
                  Ưu tiên
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
              {invoices.map((invoice) => {
                const invoiceIdStr = String(invoice.invoiceId);
                return (
                <TableRow
                  key={invoice.invoiceId}
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
                      checked={selected.includes(invoiceIdStr)}
                      onChange={() => handleSelect(invoiceIdStr)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#1e293b', fontSize: '13px' }}>
                      {invoice.customerName}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#1e293b', fontSize: '13px' }}>
                      {formatCurrency(invoice.totalAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px', mb: 0.25 }}>
                        {invoice.daysWaiting} ngày
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '11px' }}>
                        ({invoice.hoursWaiting.toFixed(1)}h)
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.priority}
                      size="small"
                      sx={{
                        bgcolor: invoice.priority === 'Critical' ? '#fee2e2' : 
                                 invoice.priority === 'High' ? '#fef3c7' : '#e0f2fe',
                        color: invoice.priority === 'Critical' ? '#dc2626' : 
                               invoice.priority === 'High' ? '#f59e0b' : '#0284c7',
                        fontWeight: 700,
                        fontSize: '11px',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const { invoiceType, typeName, typeColor, typeBackgroundColor, reason, reasonType, originalInvoiceNumber } = invoice
                      
                      // Build tooltip for linked invoices
                      const isLinkedInvoice = invoiceType !== 1
                      
                      
                      let tooltipContent: React.ReactNode = null
                      if (isLinkedInvoice) {
                        const iconMap: Record<string, string> = {
                          'adjustment': '📝',
                          'replacement': '🔄',
                          'cancellation': '❌',
                          'explanation': '📋',
                          'general': '📄',
                        }
                        const icon = iconMap[reasonType] || '📄'
                        
                        tooltipContent = (
                          <Box sx={{ py: 1, px: 0.5, minWidth: 240, maxWidth: 380 }}>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 700, 
                                mb: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              {icon} {typeName}
                            </Typography>
                            
                            {reason && (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontSize: '12px', 
                                  fontStyle: 'italic',
                                  color: 'rgba(255,255,255,0.9)',
                                  lineHeight: 1.5,
                                }}
                              >
                                {reason}
                              </Typography>
                            )}
                            
                            {originalInvoiceNumber && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  display: 'block',
                                  mt: 1,
                                  pt: 0.75,
                                  borderTop: '1px solid rgba(255,255,255,0.2)',
                                  fontSize: '11px', 
                                  color: 'rgba(255,255,255,0.7)',
                                }}
                              >
                                Liên quan: HĐ số {originalInvoiceNumber}
                              </Typography>
                            )}
                          </Box>
                        )
                      }
                      
                      // If not linked to original invoice, show simple badge
                      if (!isLinkedInvoice) {
                        return (
                          <Chip
                            label={typeName}
                            size="small"
                            sx={{
                              bgcolor: typeBackgroundColor,
                              color: typeColor,
                              fontWeight: 600,
                              fontSize: '11px',
                              height: 24,
                              borderRadius: '16px',
                              border: `1px solid ${typeColor}30`,
                            }}
                          />
                        )
                      }
                      
                      // Linked invoice: show tooltip and link icon
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
                              bgcolor: typeBackgroundColor,
                              border: `1px solid ${typeColor}30`,
                              cursor: originalInvoiceNumber ? 'pointer' : 'default',
                              transition: 'all 0.2s ease',
                              '&:hover': originalInvoiceNumber ? {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 12px ${typeColor}30`,
                              } : {},
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: typeColor,
                                fontWeight: 600,
                                fontSize: '11px',
                                lineHeight: 1.2,
                              }}
                            >
                              {typeName}
                            </Typography>
                            {originalInvoiceNumber && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  bgcolor: `${typeColor}20`,
                                }}
                              >
                                <LinkIcon 
                                  sx={{ 
                                    fontSize: 14, 
                                    color: typeColor,
                                  }} 
                                />
                              </Box>
                            )}
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
              )})}
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
