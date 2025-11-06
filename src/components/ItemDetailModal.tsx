import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Divider,
  Box,
  Stack,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { IconButton } from '@mui/material'
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
    none: 'Không giảm',
    reduced: 'Giảm một phần',
    exempt: 'Miễn thuế',
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          fontWeight: 600,
          fontSize: '1.25rem',
          borderBottom: '2px solid #e0e0e0',
          pb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Chi tiết Hàng hóa, Dịch vụ
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: '#666',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
          }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Grid container spacing={3}>
          {/* Header - Tên hàng hóa */}
          <Grid item xs={12}>
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
          </Grid>

          {/* Thông tin cơ bản */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#555' }}>
              Thông tin cơ bản
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Mã hàng hoá, dịch vụ
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1c84ee' }}>
                    {item.code}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Nhóm hàng hoá, dịch vụ
                  </Typography>
                  <Box>
                    <Chip
                      label={groupLabels[item.group] || item.group}
                      size="small"
                      sx={{
                        backgroundColor: item.group === 'hang-hoa' ? '#e3f2fd' : '#f3e5f5',
                        color: item.group === 'hang-hoa' ? '#1976d2' : '#7b1fa2',
                        fontWeight: 500,
                      }}
                    />
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Đơn vị tính
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {unitLabels[item.unit] || item.unit}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Ngày tạo
                  </Typography>
                  <Typography variant="body1">
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Thông tin giá & thuế */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#555' }}>
              Giá & Thuế
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
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
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Thuế GTGT (%)
                  </Typography>
                  <Box>
                    <Chip
                      label={item.vatTaxRate}
                      size="medium"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
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
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Giảm trừ thuế GTGT
                  </Typography>
                  <Typography variant="body1">
                    {vatReductionLabels[item.vatReduction] || item.vatReduction}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Mô tả */}
          <Grid item xs={12}>
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
          </Grid>
        </Grid>
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
