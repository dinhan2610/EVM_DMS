import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from '@mui/material'
import { Visibility as VisibilityIcon } from '@mui/icons-material'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { RecentInvoice } from '@/types/dashboard.types'
import { useNavigate } from 'react-router-dom'
import { formatCurrencyStandard } from '@/utils/currency'

interface RecentInvoicesTableProps {
  invoices: RecentInvoice[]
}

const RecentInvoicesTable: React.FC<RecentInvoicesTableProps> = ({ invoices }) => {
  const navigate = useNavigate()

  const getStatusConfig = (statusName: string) => {
    const statusMap: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
      'Issued': { label: 'Đã phát hành', color: 'success' },
      'AdjustmentInProcess': { label: 'Đang điều chỉnh', color: 'warning' },
      'Replaced': { label: 'Đã thay thế', color: 'info' },
      'Cancelled': { label: 'Đã hủy', color: 'error' },
      'Pending': { label: 'Chờ duyệt', color: 'warning' },
    }
    return statusMap[statusName] || { label: statusName, color: 'default' }
  }

  const getPaymentStatusConfig = (paymentStatus: string) => {
    const statusMap: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
      'Paid': { label: 'Đã thanh toán', color: 'success' },
      'Unpaid': { label: 'Chưa thanh toán', color: 'error' },
      'PartiallyPaid': { label: 'Thanh toán 1 phần', color: 'warning' },
    }
    return statusMap[paymentStatus] || { label: paymentStatus, color: 'default' }
  }

  const handleViewInvoice = (invoiceId: number) => {
    navigate(`/invoices/${invoiceId}`)
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Hóa đơn gần đây
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {invoices.length} hóa đơn mới nhất
            </Typography>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Số HĐ
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Khách hàng
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Ngày tạo
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Số tiền
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Trạng thái
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Thanh toán
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Thao tác
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => {
                const statusConfig = getStatusConfig(invoice.statusName)
                const paymentConfig = getPaymentStatusConfig(invoice.paymentStatus)
                
                return (
                  <TableRow
                    key={invoice.invoiceId}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      cursor: 'pointer',
                    }}
                    onClick={() => handleViewInvoice(invoice.invoiceId)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        #{invoice.invoiceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {invoice.customerName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {formatCurrencyStandard(invoice.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={statusConfig.label}
                        color={statusConfig.color}
                        size="small"
                        sx={{ minWidth: 120 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={paymentConfig.label}
                        color={paymentConfig.color}
                        size="small"
                        variant="outlined"
                        sx={{ minWidth: 140 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewInvoice(invoice.invoiceId)
                        }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {invoices.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              Không có hóa đơn nào
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentInvoicesTable
