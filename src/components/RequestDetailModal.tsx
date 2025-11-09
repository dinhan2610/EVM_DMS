import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Fade,
  IconButton,
} from '@mui/material'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined'
import CloseIcon from '@mui/icons-material/Close'

// Import interface type (will use the one from RequestManagement for compatibility)
interface InvoiceRequest {
  id: string
  requestorName: string
  projectName: string
  requestDate: string
  status: 'Pending' | 'Approved' | 'Rejected'
  customerName: string
  customerEmail: string
  customerTaxCode: string
  customerAddress: string
  items: Array<{ description: string; quantity: number; unitPrice: number }>
  supportingDocs: string[]
  notes?: string
}

// Props cho Modal
interface RequestDetailModalProps {
  request: InvoiceRequest | null
  open: boolean
  onClose: () => void
}

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

const getStatusColor = (status: string): 'warning' | 'success' | 'error' | 'default' => {
  switch (status) {
    case 'Pending':
      return 'warning'
    case 'Approved':
      return 'success'
    case 'Rejected':
      return 'error'
    default:
      return 'default'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'Chờ duyệt'
    case 'Approved':
      return 'Đã duyệt'
    case 'Rejected':
      return 'Đã từ chối'
    default:
      return status
  }
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ request, open, onClose }) => {
  if (!request) return null

  const totalAmount = request.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 400 }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
      }}>
      <DialogTitle
        sx={{
          fontWeight: 600,
          color: '#1a1a1a',
          borderBottom: '1px solid #e0e0e0',
          pb: 2,
          pr: 6,
          position: 'relative',
        }}>
        Chi tiết Yêu cầu Xuất hóa đơn
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: '#666',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              color: '#333',
            },
          }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {/* Phần 1: Thông tin chung */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
              Người yêu cầu
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
              {request.requestorName}
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
              Dự án
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
              {request.projectName}
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
              Ngày yêu cầu
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>
              {formatDate(request.requestDate)}
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
              Trạng thái
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={getStatusLabel(request.status)}
                color={getStatusColor(request.status)}
                size="small"
                sx={{ fontWeight: 500 }}
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Phần 2: Thông tin Khách hàng */}
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: '1rem', color: '#1a1a1a' }}>
          Thông tin Khách hàng
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
              Tên khách hàng
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>
              {request.customerName}
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
              Mã số thuế
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>
              {request.customerTaxCode}
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
              Email
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5, color: '#1c84ee' }}>
              {request.customerEmail}
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 100%' }}>
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
              Địa chỉ
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>
              {request.customerAddress}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Phần 3: Danh sách Hàng hóa */}
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: '1rem', color: '#1a1a1a' }}>
          Chi tiết Hàng hóa, Dịch vụ
        </Typography>
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            boxShadow: 'none',
          }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 600, color: '#333', width: 60 }}>STT</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#333' }}>Mô tả</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#333', width: 100 }}>
                  Số lượng
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#333', width: 140 }}>
                  Đơn giá
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#333', width: 140 }}>
                  Thành tiền
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {request.items.map((item, index) => (
                <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                  <TableCell sx={{ color: '#666' }}>{index + 1}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </TableCell>
                </TableRow>
              ))}
              {/* Dòng Tổng cộng */}
              <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                <TableCell colSpan={4} align="right" sx={{ fontWeight: 600, fontSize: '1rem', py: 1.5 }}>
                  Tổng cộng
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '1rem', color: '#22c55e', py: 1.5 }}>
                  {formatCurrency(totalAmount)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 3 }} />

        {/* Phần 4: Tài liệu & Ghi chú */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, fontSize: '1rem', color: '#1a1a1a' }}>
              Tài liệu đính kèm
            </Typography>
            {request.supportingDocs.length > 0 ? (
              <List dense disablePadding>
                {request.supportingDocs.map((doc, index) => (
                  <ListItem key={index} disableGutters sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <DescriptionOutlinedIcon sx={{ color: '#1c84ee', fontSize: '1.25rem' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={doc}
                      primaryTypographyProps={{
                        sx: {
                          color: '#1c84ee',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
                Không có tài liệu đính kèm
              </Typography>
            )}
          </Box>
          <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, fontSize: '1rem', color: '#1a1a1a' }}>
              Ghi chú
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <NotesOutlinedIcon sx={{ color: '#999', fontSize: '1.25rem', mt: 0.25 }} />
              <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6 }}>
                {request.notes || '(Không có ghi chú)'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            minWidth: 120,
            boxShadow: '0 2px 8px rgba(28, 132, 238, 0.24)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(28, 132, 238, 0.32)',
            },
          }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RequestDetailModal
