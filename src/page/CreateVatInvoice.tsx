import React, { useState, useCallback } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  Stack,
  Checkbox,
  FormControlLabel,
  IconButton,
  Divider,
  InputAdornment,
} from '@mui/material'
import {
  HelpOutline,
  Info,
  Public,
  VerifiedUser,
  ExpandMore,
  Settings,
  Send,
  Visibility,
  Close,
  Save,
  Publish,
} from '@mui/icons-material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

// Interface cho hàng hóa/dịch vụ
interface InvoiceItem {
  id: number
  stt: number
  type: string
  code: string
  name: string
  unit: string
  quantity: number
  priceAfterTax: number
  totalAfterTax: number
}

const CreateVatInvoice: React.FC = () => {
  const [isPaid, setIsPaid] = useState(false)
  const [showTypeColumn, setShowTypeColumn] = useState(true)
  const [calculateAfterTax, setCalculateAfterTax] = useState(true)

  // State quản lý danh sách hàng hóa
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 1,
      stt: 1,
      type: 'Hàng hóa, dịch vụ',
      code: '',
      name: '',
      unit: '',
      quantity: 1,
      priceAfterTax: 0,
      totalAfterTax: 0,
    },
  ])

  // Thêm hàng mới
  const handleAddRow = () => {
    const newId = items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1
    const newItem: InvoiceItem = {
      id: newId,
      stt: items.length + 1,
      type: 'Hàng hóa, dịch vụ',
      code: '',
      name: '',
      unit: '',
      quantity: 1,
      priceAfterTax: 0,
      totalAfterTax: 0,
    }
    setItems([...items, newItem])
  }

  // Tính toán tổng tiền
  const calculateTotals = (currentItems: InvoiceItem[]) => {
    const total = currentItems.reduce((sum, item) => sum + item.totalAfterTax, 0)
    return {
      subtotal: Math.round(total / 1.1),
      tax: Math.round(total - total / 1.1),
      total: Math.round(total),
    }
  }

  // Xử lý cập nhật hàng
  const processRowUpdate = useCallback(
    (newRow: InvoiceItem, oldRow: InvoiceItem) => {
      const updatedRow = { ...newRow }

      // Tự động tính thành tiền
      if (newRow.quantity !== oldRow.quantity || newRow.priceAfterTax !== oldRow.priceAfterTax) {
        updatedRow.totalAfterTax = newRow.quantity * newRow.priceAfterTax
      }

      const updatedItems = items.map((item) => (item.id === newRow.id ? updatedRow : item))
      setItems(updatedItems)

      return updatedRow
    },
    [items]
  )

  const totals = calculateTotals(items)

  // Định nghĩa columns cho DataGrid
  const columns: GridColDef[] = [
    {
      field: 'stt',
      headerName: 'STT',
      width: 60,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{params.value}</Typography>
        </Box>
      ),
    },
    ...(showTypeColumn
      ? [
          {
            field: 'type',
            headerName: 'Tính chất HHDV',
            width: 160,
            editable: true,
            align: 'left' as const,
            headerAlign: 'left' as const,
            renderCell: (params: GridRenderCellParams) => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%', pl: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{params.value || ''}</Typography>
                <Info sx={{ fontSize: 16, color: '#1976d2', cursor: 'pointer' }} />
              </Box>
            ),
          },
        ]
      : []),
    {
      field: 'code',
      headerName: 'Mã hàng',
      width: 120,
      editable: true,
      align: 'left' as const,
      headerAlign: 'left' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%', pl: 1 }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{params.value || ''}</Typography>
          <Info sx={{ fontSize: 16, color: '#1976d2', cursor: 'pointer' }} />
        </Box>
      ),
    },
    {
      field: 'name',
      headerName: 'Tên hàng hóa/Dịch vụ',
      flex: 1,
      minWidth: 200,
      editable: true,
      align: 'left' as const,
      headerAlign: 'left' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pl: 1 }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{params.value || ''}</Typography>
        </Box>
      ),
    },
    {
      field: 'unit',
      headerName: 'ĐVT',
      width: 80,
      editable: true,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{params.value || ''}</Typography>
        </Box>
      ),
    },
    {
      field: 'quantity',
      headerName: 'Số lượng',
      width: 100,
      type: 'number',
      editable: true,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{params.value || 0}</Typography>
        </Box>
      ),
    },
    {
      field: 'priceAfterTax',
      headerName: calculateAfterTax ? 'Đơn giá sau thuế' : 'Đơn giá',
      width: 140,
      type: 'number',
      editable: true,
      align: 'right' as const,
      headerAlign: 'right' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', pr: 2 }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            {params.value ? Number(params.value).toLocaleString('vi-VN') : '0'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'totalAfterTax',
      headerName: calculateAfterTax ? 'Thành tiền sau thuế' : 'Thành tiền',
      width: 150,
      type: 'number',
      align: 'right' as const,
      headerAlign: 'right' as const,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', pr: 2 }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
            {params.value ? Number(params.value).toLocaleString('vi-VN') : '0'}
          </Typography>
        </Box>
      ),
    },
  ]

  return (
    <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh', pb: 2 }}>
      {/* Header NGOÀI Paper */}
      <Box sx={{ backgroundColor: 'white', borderBottom: '1px solid #e0e0e0', px: 2, py: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Lập hóa đơn
          </Typography>
          <FormControlLabel
            control={<Checkbox checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} size="small" />}
            label={<Typography variant="body2">Đã thanh toán</Typography>}
          />
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ px: 2, pt: 1.5, maxWidth: '1600px', margin: '0 auto' }}>
        <Paper elevation={1} sx={{ p: 2, borderRadius: 1 }}>
          {/* Hướng dẫn lập hóa đơn và Ký hiệu số hoá đơn */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
            {/* Nút hướng dẫn bên trái */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<HelpOutline />}
              sx={{ textTransform: 'none', borderColor: '#1976d2', color: '#1976d2', fontSize: '0.8125rem' }}>
              Hướng dẫn lập hóa đơn
            </Button>

            {/* Ký hiệu số hoá đơn bên phải */}
            <Box
              sx={{
                border: '1px solid #ddd',
                borderRadius: 1,
                p: 1.5,
                backgroundColor: '#fafafa',
                minWidth: 300,
                maxWidth: 350,
              }}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 55, fontSize: '0.8125rem' }}>
                    Ký hiệu:
                  </Typography>
                  <Select size="small" value="1K24TXN" fullWidth variant="outlined" sx={{ fontSize: '0.8125rem' }}>
                    <MenuItem value="1K24TXN">1K24TXN</MenuItem>
                    <MenuItem value="2K24TXN">2K24TXN</MenuItem>
                  </Select>
                  <IconButton size="small">
                    <ExpandMore fontSize="small" />
                  </IconButton>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 55, fontSize: '0.8125rem' }}>
                    Số:
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    disabled
                    placeholder="<Chưa cấp số>"
                    variant="outlined"
                    sx={{ fontSize: '0.8125rem' }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Info fontSize="small" sx={{ color: '#1976d2' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
              </Stack>
            </Box>
          </Stack>

          {/* Layout 2 cột: Thông tin bán/mua */}
          <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
            {/* Cột TRÁI - Thông tin đầy đủ */}
            <Box sx={{ flex: '1 1 100%', minWidth: '500px' }}>
              {/* Tiêu đề hóa đơn */}
              <Typography
                variant="h6"
                align="center"
                sx={{ fontWeight: 700, color: '#d32f2f', mb: 0.5, letterSpacing: 0.5, fontSize: '1.1rem' }}>
                HÓA ĐƠN GIÁ TRỊ GIA TĂNG
              </Typography>
              <Typography variant="caption" align="center" sx={{ mb: 1.5, color: '#666', display: 'block' }}>
                Ngày 5 tháng 11 năm 2024
              </Typography>

              {/* Thông tin đơn vị bán hàng */}
              <Stack spacing={0.8} sx={{ mb: 1.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Đơn vị bán hàng:
                  </Typography>
                  <TextField size="small" fullWidth disabled value="Global Solutions Ltd" variant="standard" sx={{ fontSize: '0.8125rem' }} />
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Mã số thuế:
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {['0', '0', '0', '0', '0', '0', '0', '0', '0', '0'].map((digit, index) => (
                      <TextField
                        key={index}
                        size="small"
                        disabled
                        value={digit}
                        variant="outlined"
                        sx={{
                          width: 32,
                          '& .MuiInputBase-input': {
                            textAlign: 'center',
                            padding: '6px 0',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          },
                        }}
                      />
                    ))}
                    <Typography variant="caption" sx={{ mx: 0.5, fontSize: '0.875rem', fontWeight: 500 }}>
                      -
                    </Typography>
                    {['0', '0', '0'].map((digit, index) => (
                      <TextField
                        key={`suffix-${index}`}
                        size="small"
                        disabled
                        value={digit}
                        variant="outlined"
                        sx={{
                          width: 32,
                          '& .MuiInputBase-input': {
                            textAlign: 'center',
                            padding: '6px 0',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Địa chỉ:
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    disabled
                    value="95 Nguyễn Trãi, Thanh Xuân, Hà Nội"
                    variant="standard"
                    sx={{ fontSize: '0.8125rem' }}
                  />
                </Stack>
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              {/* Thông tin người mua */}
              <Stack spacing={0.8}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    MST người mua:
                  </Typography>
                  <TextField
                    size="small"
                    placeholder="0101243150-136"
                    variant="standard"
                    sx={{ width: 160, fontSize: '0.8125rem' }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" edge="end">
                            <ExpandMore fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button size="small" startIcon={<Public sx={{ fontSize: 16 }} />} sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.25 }}>
                    Lấy thông tin
                  </Button>
                  <Button size="small" startIcon={<VerifiedUser sx={{ fontSize: 16 }} />} sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.25, whiteSpace: 'nowrap' }}>
                    KT tình trạng hoạt động
                  </Button>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Mã đơn vị:
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    variant="standard"
                    sx={{ fontSize: '0.8125rem' }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" edge="end">
                            <ExpandMore fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Tên đơn vị:
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="CÔNG TY CỔ PHẦN MISA"
                    variant="standard"
                    sx={{ fontSize: '0.8125rem' }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" edge="end">
                            <ExpandMore fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Địa chỉ:
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Tầng 9, tòa nhà Technosoft..."
                    variant="standard"
                    sx={{ fontSize: '0.8125rem' }}
                  />
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Người mua hàng:
                  </Typography>
                  <TextField size="small" placeholder="Kế toán A" variant="standard" sx={{ width: 160, fontSize: '0.8125rem' }} />
                  <Typography variant="caption" sx={{ minWidth: 50, fontSize: '0.8125rem' }}>
                    Email:
                  </Typography>
                  <TextField size="small" placeholder="hoadon@gmail.com" variant="standard" sx={{ flex: 1, fontSize: '0.8125rem' }} />
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    Số điện thoại:
                  </Typography>
                  <TextField size="small" variant="standard" sx={{ width: 160, fontSize: '0.8125rem' }} />
                  <Typography variant="caption" sx={{ minWidth: 80, fontSize: '0.8125rem' }}>
                    Hình thức TT:
                  </Typography>
                  <Select size="small" value="TM/CK" variant="standard" sx={{ width: 120, fontSize: '0.8125rem' }}>
                    <MenuItem value="TM/CK">TM/CK</MenuItem>
                    <MenuItem value="TM">Tiền mặt</MenuItem>
                    <MenuItem value="CK">Chuyển khoản</MenuItem>
                  </Select>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 110, fontSize: '0.8125rem' }}>
                    TK ngân hàng:
                  </Typography>
                  <TextField size="small" variant="standard" sx={{ flex: 1, fontSize: '0.8125rem' }} />
                  <Typography variant="caption" sx={{ minWidth: 100, fontSize: '0.8125rem' }}>
                    Tên ngân hàng:
                  </Typography>
                  <TextField size="small" variant="standard" sx={{ flex: 1, fontSize: '0.8125rem' }} />
                </Stack>
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Checkbox options + Loại tiền, Tỷ giá, Chiết khấu */}
          <Stack spacing={1} sx={{ mb: 1.5 }}>
            {/* Dòng 0: Hàng hóa/Dịch vụ */}
            <Typography variant="caption" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Hàng hóa/Dịch vụ
            </Typography>

            {/* Dòng 1: Hiện cột + Loại tiền + Tỷ giá + Chiết khấu */}
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox checked={showTypeColumn} onChange={(e) => setShowTypeColumn(e.target.checked)} size="small" />
                }
                label='Hiện cột "Tính chất HHDV"'
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.8125rem' } }}
              />

              {/* Spacer để đẩy các trường sang phải */}
              <Box sx={{ flex: 1, minWidth: 20 }} />

              {/* Loại tiền */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  Loại tiền:
                </Typography>
                <Select size="small" value="VND" variant="outlined" sx={{ width: 90, fontSize: '0.8125rem' }}>
                  <MenuItem value="VND">VND</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                </Select>
              </Stack>

              {/* Tỷ giá */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  Tỷ giá:
                </Typography>
                <TextField
                  size="small"
                  value="1,00"
                  variant="outlined"
                  sx={{
                    width: 80,
                    fontSize: '0.8125rem',
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                      fontSize: '0.8125rem',
                    },
                  }}
                />
              </Stack>

              {/* Chiết khấu */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  Chiết khấu:
                </Typography>
                <Select size="small" value="none" variant="outlined" sx={{ width: 180, fontSize: '0.8125rem' }}>
                  <MenuItem value="none">Không có chiết khấu</MenuItem>
                  <MenuItem value="percent">Theo phần trăm</MenuItem>
                  <MenuItem value="amount">Theo số tiền</MenuItem>
                </Select>
              </Stack>
            </Stack>

            {/* Dòng 2: Tính số lượng theo đơn giá sau thuế */}
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={calculateAfterTax}
                    onChange={(e) => setCalculateAfterTax(e.target.checked)}
                    size="small"
                  />
                }
                label="Tính số lượng theo đơn giá sau thuế và thành tiền sau thuế"
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.8125rem' } }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={calculateAfterTax}
                    onChange={(e) => setCalculateAfterTax(e.target.checked)}
                    size="small"
                  />
                }
                label="Tính thành tiền sau thuế theo số lượng và đơn giá sau thuế"
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.8125rem' } }}
              />
            </Stack>
          </Stack>

          {/* DataGrid */}
          <Box sx={{ height: 300, width: '100%', mb: 1.5 }}>
            <DataGrid
              rows={items}
              columns={columns}
              processRowUpdate={processRowUpdate}
              onProcessRowUpdateError={(error) => console.error(error)}
              hideFooter
              disableRowSelectionOnClick
              sx={{
                border: '1px solid #e0e0e0',
                '& .MuiDataGrid-cell': {
                  fontSize: '0.8125rem',
                  borderRight: '1px solid #f0f0f0',
                  py: 0.5,
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f5f5',
                  borderBottom: '2px solid #e0e0e0',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  minHeight: '36px !important',
                  maxHeight: '36px !important',
                },
                '& .MuiDataGrid-columnHeader': {
                  borderRight: '1px solid #e0e0e0',
                },
                '& .MuiDataGrid-cell:focus': {
                  outline: '2px solid #1976d2',
                },
                '& .MuiDataGrid-row': {
                  minHeight: '32px !important',
                  maxHeight: '32px !important',
                },
              }}
            />
          </Box>

          {/* Buttons dưới bảng */}
          <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'stretch' }}>
            <Box
              sx={{
                border: '1px solid #ccc',
                borderRadius: 0.5,
                width: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}>
              <Typography variant="caption" sx={{ fontSize: '1rem', color: '#666', lineHeight: 1 }}>
                ⋮
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              sx={{
                textTransform: 'none',
                color: '#1976d2',
                borderColor: '#ccc',
                fontSize: '0.8125rem',
                py: 0.5,
              }}
              onClick={handleAddRow}>
              Thêm dòng
            </Button>
            <Button
              size="small"
              variant="outlined"
              sx={{
                textTransform: 'none',
                color: '#1976d2',
                borderColor: '#ccc',
                fontSize: '0.8125rem',
                py: 0.5,
              }}>
              Thêm ghi chú
            </Button>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          {/* Tổng tiền - Bố cục như hình */}
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Box sx={{ width: 450 }}>
              <Stack spacing={0.8}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" sx={{ fontSize: '0.8125rem' }}>Tiền hàng:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                    {totals.subtotal.toLocaleString('vi-VN')}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="caption" sx={{ fontSize: '0.8125rem' }}>Thuế GTGT:</Typography>
                  <Select size="small" value="10%" variant="standard" sx={{ width: 70, fontSize: '0.8125rem' }}>
                    <MenuItem value="0%">0%</MenuItem>
                    <MenuItem value="5%">5%</MenuItem>
                    <MenuItem value="10%">10%</MenuItem>
                  </Select>
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" sx={{ fontSize: '0.8125rem' }}>Tiền thuế GTGT:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                    {totals.tax.toLocaleString('vi-VN')}
                  </Typography>
                </Stack>

                <Divider />

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    Tổng tiền thanh toán:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    {totals.total.toLocaleString('vi-VN')}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Footer Actions */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {/* Buttons trái */}
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Settings fontSize="small" />}
                sx={{ textTransform: 'none', color: '#666', borderColor: '#ccc', fontSize: '0.8125rem', py: 0.5 }}>
                Thêm trường mở rộng
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Send fontSize="small" />}
                sx={{ textTransform: 'none', color: '#666', borderColor: '#ccc', fontSize: '0.8125rem', py: 0.5 }}>
                Gửi hóa đơn nháp
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Visibility fontSize="small" />}
                sx={{ textTransform: 'none', color: '#666', borderColor: '#ccc', fontSize: '0.8125rem', py: 0.5 }}>
                Xem trước
              </Button>
            </Stack>

            {/* Buttons phải */}
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Close fontSize="small" />}
                sx={{ textTransform: 'none', color: '#666', borderColor: '#ccc', fontSize: '0.8125rem', py: 0.5 }}>
                Hủy bỏ
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<Save fontSize="small" />}
                sx={{ textTransform: 'none', backgroundColor: '#1976d2', fontSize: '0.8125rem', py: 0.5 }}>
                Lưu
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<Publish fontSize="small" />}
                sx={{ textTransform: 'none', backgroundColor: '#2196f3', minWidth: 140, fontSize: '0.8125rem', py: 0.5 }}>
                Lưu và Phát hành
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}

export default CreateVatInvoice
