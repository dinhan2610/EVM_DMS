import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Divider,
  Box,
  Stack,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { Item } from '../page/ItemsManagement'

interface ItemDetailModalProps {
  item: Item | null
  open: boolean
  onClose: () => void
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, open, onClose }) => {
  if (!item) return null

  const groupLabels: Record<string, string> = {
    'hang-hoa': 'Hàng hóa',
    'dich-vu': 'Dịch vụ',
    'tai-san': 'Tài sản',
    'nguyen-vat-lieu': 'Nguyên vật liệu',
  }

  const unitLabels: Record<string, string> = {
    chiec: 'Chiếc',
    cai: 'Cái',
    thang: 'Tháng',
    hop: 'Hộp',
    kg: 'Kilogram',
    lit: 'Lít',
    goi: 'Gói',
    bo: 'Bộ',
  }

  const vatReductionLabels: Record<string, string> = {
    'khong-giam': 'Không giảm',
    'giam-50': 'Giảm 50%',
    'giam-100': 'Giảm 100%',
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, color: '#1a1a1a', borderBottom: '1px solid #e0e0e0' }}>
        Chi tiết Hàng hóa, Dịch vụ
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
            color: '#666',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
          }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Stack spacing={3}>
          {/* Header - Tên hàng hóa */}
          <Box
            sx={{
              p: 2,
              bgcolor: '#f5f9ff',
              borderRadius: 1,
              borderLeft: '4px solid #1976d2',
            }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Tên Hàng hóa, Dịch vụ
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1c1c1c' }}>
              {item.name}
            </Typography>
          </Box>

          {/* Thông tin cơ bản */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#555' }}>
              Thông tin cơ bản
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Mã hàng hoá, dịch vụ
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1c84ee' }}>
                    {item.code}
                  </Typography>
                </Stack>
              </Box>

              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Nhóm hàng hoá, dịch vụ
                  </Typography>
                  <Chip
                    label={groupLabels[item.group] || item.group}
                    size="small"
                    sx={{
                      backgroundColor: item.group === 'hang-hoa' ? '#e3f2fd' : '#f3e5f5',
                      color: item.group === 'hang-hoa' ? '#1976d2' : '#7b1fa2',
                      fontWeight: 500,
                      maxWidth: 'fit-content',
                    }}
                  />
                </Stack>
              </Box>

              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Đơn vị tính
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {unitLabels[item.unit] || item.unit}
                  </Typography>
                </Stack>
              </Box>

              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Ngày tạo
                  </Typography>
                  <Typography variant="body1">
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Thông tin giá & thuế */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#555' }}>
              Giá & Thuế
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Giá bán
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#22c55e' }}>
                    {formatCurrency(item.salesPrice)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.priceIncludesTax ? '(Đã bao gồm thuế)' : '(Chưa bao gồm thuế)'}
                  </Typography>
                </Stack>
              </Box>

              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Thuế GTGT (%)
                  </Typography>
                  <Chip
                    label={item.vatTaxRate}
                    size="medium"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600, maxWidth: 'fit-content' }}
                  />
                </Stack>
              </Box>

              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Tỷ lệ CK (%)
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: item.discountRate > 0 ? '#ef5f5f' : '#999',
                    }}>
                    {item.discountRate}%
                  </Typography>
                  {item.discountRate > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Số tiền CK: {formatCurrency(item.discountAmount)}
                    </Typography>
                  )}
                </Stack>
              </Box>

              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Giảm trừ thuế GTGT
                  </Typography>
                  <Typography variant="body1">
                    {vatReductionLabels[item.vatReduction] || item.vatReduction}
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Mô tả */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#555' }}>
              Mô tả
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: '#fafafa',
                borderRadius: 1,
                border: '1px solid #e0e0e0',
              }}>
              <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.7 }}>
                {item.description || '(Không có mô tả)'}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="contained" color="primary" sx={{ minWidth: 100 }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ItemDetailModal
