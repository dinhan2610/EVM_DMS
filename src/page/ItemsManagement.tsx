import { useState, useMemo, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Stack,
  Grid,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import AddNewItemModal, { ItemFormData } from '../components/AddNewItemModal'
import ItemDetailModal from '../components/ItemDetailModal'
import { useProducts } from '@/hooks/useProducts'
import productService from '@/services/productService'
import type { CreateProductRequest, UpdateProductRequest } from '@/services/productService'

// Interface cho Item trong danh sách (giữ tương thích với UI cũ)
export interface Item extends ItemFormData {
  id: number
  categoryID?: number
  createdAt: string
  status: 'active' | 'inactive'
}

const ItemsManagement = () => {
  const { products, loading, error } = useProducts()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [searchText, setSearchText] = useState('')
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [viewingItem, setViewingItem] = useState<Item | null>(null)
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [selectedItemForToggle, setSelectedItemForToggle] = useState<Item | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Sync products từ API vào items state
  useEffect(() => {
    if (products.length > 0) {
      setItems(products as Item[])
    }
  }, [products])

  // Hàm mở modal thêm mới
  const handleOpenModal = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  // Hàm đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
  }

  // Hàm lưu item (thêm mới hoặc cập nhật)
  const handleSaveItem = async (data: ItemFormData) => {
    setSaving(true)
    setActionError(null)

    try {
      // Parse vatTaxRate từ "10%" thành số 10
      const vatRate = parseFloat(data.vatTaxRate.replace('%', ''))

      if (editingItem) {
        // Chế độ Edit: Gọi API PUT
        const updateRequest: UpdateProductRequest = {
          code: data.code,
          name: data.name,
          categoryID: data.categoryID || editingItem.categoryID || 1,
          unit: data.unit,
          basePrice: data.salesPrice,
          vatRate: vatRate,
          description: data.description,
          isActive: editingItem.status === 'active',
        }

        await productService.updateProduct(editingItem.id, updateRequest)
        
        // Cập nhật optimistic UI: Update item ngay lập tức với data từ form
        setItems((prev) =>
          prev.map((item) =>
            item.id === editingItem.id
              ? {
                  ...item,
                  code: data.code,
                  name: data.name,
                  categoryID: data.categoryID || editingItem.categoryID || 1,
                  unit: data.unit,
                  salesPrice: data.salesPrice,
                  vatTaxRate: data.vatTaxRate,
                  description: data.description,
                }
              : item
          )
        )
      } else {
        // Chế độ Add: Gọi API POST
        const createRequest: CreateProductRequest = {
          code: data.code,
          name: data.name,
          categoryID: data.categoryID || 1,
          unit: data.unit,
          basePrice: data.salesPrice,
          vatRate: vatRate,
          description: data.description,
          isActive: true,
        }

        const response = await productService.createProduct(createRequest)
        
        // Thêm item mới vào đầu danh sách ngay lập tức
        const newItem: Item = {
          id: response.productID,
          code: response.code,
          name: response.name,
          group: 'hang-hoa',
          categoryID: response.categoryID,
          unit: response.unit,
          salesPrice: response.basePrice,
          vatTaxRate: `${response.vatRate}%`,
          discountRate: 0,
          discountAmount: 0,
          description: response.description,
          status: response.isActive ? 'active' : 'inactive',
          createdAt: response.createdDate,
        }
        setItems((prev) => [newItem, ...prev])
      }

      handleCloseModal()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Lỗi khi lưu sản phẩm')
    } finally {
      setSaving(false)
    }
  }

  // Toggle Status Handlers
  const handleOpenConfirmModal = (item: Item) => {
    setSelectedItemForToggle(item)
    setConfirmModalOpen(true)
  }

  const handleCloseConfirmModal = () => {
    setSelectedItemForToggle(null)
    setConfirmModalOpen(false)
  }

  const handleConfirmToggleStatus = async () => {
    if (!selectedItemForToggle) return

    setSaving(true)
    setActionError(null)

    try {
      const newStatus = selectedItemForToggle.status === 'active' ? 'inactive' : 'active'
      const vatRate = parseFloat(selectedItemForToggle.vatTaxRate.replace('%', ''))

      const updateRequest: UpdateProductRequest = {
        code: selectedItemForToggle.code,
        name: selectedItemForToggle.name,
        categoryID: selectedItemForToggle.categoryID || 1,
        unit: selectedItemForToggle.unit,
        basePrice: selectedItemForToggle.salesPrice,
        vatRate: vatRate,
        description: selectedItemForToggle.description,
        isActive: newStatus === 'active',
      }

      await productService.updateProduct(selectedItemForToggle.id, updateRequest)
      
      // Cập nhật optimistic UI: Update status ngay lập tức
      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItemForToggle.id
            ? { ...item, status: newStatus }
            : item
        )
      )
      
      handleCloseConfirmModal()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái')
    } finally {
      setSaving(false)
    }
  }

  // Hàm sửa item
  const handleEditItem = (id: number) => {
    const item = items.find((item) => item.id === id)
    if (item) {
      setEditingItem(item)
      setIsModalOpen(true)
    }
  }

  // Hàm xem chi tiết
  const handleViewDetails = (item: Item) => {
    setViewingItem(item)
  }

  // Hàm đóng modal xem chi tiết
  const handleCloseViewModal = () => {
    setViewingItem(null)
  }

  // Filter items theo search
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Lọc theo Nhóm
        if (groupFilter === 'all') return true
        return item.group === groupFilter
      })
      .filter((item) => {
        // Lọc theo SearchText
        if (!searchText) return true
        return (
          item.code.toLowerCase().includes(searchText.toLowerCase()) ||
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.description.toLowerCase().includes(searchText.toLowerCase())
        )
      })
  }, [items, searchText, groupFilter])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  // Columns definition
  const columns: GridColDef[] = [
    {
      field: 'stt',
      headerName: 'STT',
      width: 70,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const index = filteredItems.findIndex((item) => item.id === params.row.id)
        return (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '100%',
              height: '100%'
            }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500, 
                color: '#666'
              }}>
              {index + 1}
            </Typography>
          </Box>
        )
      },
    },
    {
      field: 'code',
      headerName: 'Mã hàng hoá, dịch vụ',
      width: 160,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
          <Typography
            variant="body2"
            onClick={() => handleViewDetails(params.row)}
            sx={{
              fontWeight: 600,
              color: '#1c84ee',
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline',
                color: '#0d6efd',
              },
            }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'name',
      headerName: 'Tên hàng hoá, dịch vụ',
      flex: 1,
      minWidth: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            py: 1,
          }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {params.value}
          </Typography>
          {params.row.description && (
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
              {params.row.description.length > 50
                ? params.row.description.substring(0, 50) + '...'
                : params.row.description}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'group',
      headerName: 'Nhóm hàng hoá, dịch vụ',
      width: 180,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const groupLabels: Record<string, string> = {
          'hang-hoa': 'Hàng hóa',
          'dich-vu': 'Dịch vụ',
          'tai-san': 'Tài sản',
          'nguyen-vat-lieu': 'Nguyên vật liệu',
        }
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}>
            <Chip
              label={groupLabels[params.value] || params.value}
              size="small"
              sx={{
                backgroundColor: params.value === 'hang-hoa' ? '#e3f2fd' : '#f3e5f5',
                color: params.value === 'hang-hoa' ? '#1976d2' : '#7b1fa2',
                fontWeight: 500,
              }}
            />
          </Box>
        )
      },
    },
    {
      field: 'unit',
      headerName: 'Đơn vị tính',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'salesPrice',
      headerName: 'Giá bán',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#22c55e' }}>
            {formatCurrency(params.value)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'vatTaxRate',
      headerName: 'Thuế GTGT (%)',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
          <Chip label={params.value} size="small" color="default" sx={{ fontWeight: 500 }} />
        </Box>
      ),
    },
    {
      field: 'discountRate',
      headerName: 'Tỷ lệ CK (%)',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
          <Typography variant="body2" sx={{ color: params.value > 0 ? '#ef5f5f' : '#999' }}>
            {params.value}%
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack 
          direction="row" 
          spacing={0.5} 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          {/* Edit Button */}
          <Tooltip title="Chỉnh sửa">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleEditItem(params.row.id)}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(28, 132, 238, 0.08)',
                },
              }}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {/* Toggle Status Button */}
          <Tooltip title={params.row.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}>
            <IconButton
              size="small"
              color={params.row.status === 'active' ? 'error' : 'success'}
              onClick={() => handleOpenConfirmModal(params.row as Item)}
              sx={{
                '&:hover': {
                  backgroundColor: params.row.status === 'active' 
                    ? 'rgba(239, 95, 95, 0.08)' 
                    : 'rgba(34, 197, 94, 0.08)',
                },
              }}
            >
              {params.row.status === 'active' ? (
                <LockOutlinedIcon fontSize="small" />
              ) : (
                <LockOpenOutlinedIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ]

  return (
    <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
              Quản lý Hàng hóa, Dịch vụ
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Quản lý danh sách sản phẩm, dịch vụ của doanh nghiệp
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(28, 132, 238, 0.24)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(28, 132, 238, 0.32)',
              },
            }}>
            Thêm mới
          </Button>
        </Box>

        {/* Data Table */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>
          {/* Error Alert */}
          {actionError && (
            <Alert severity="error" onClose={() => setActionError(null)} sx={{ m: 2 }}>
              {actionError}
            </Alert>
          )}

          {/* Search Section */}
          <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <TextField
                fullWidth
                size="small"
                label="Tìm kiếm theo mã, tên hoặc mô tả"
                variant="outlined"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Nhập từ khóa tìm kiếm..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#999' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  maxWidth: 500,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fafafa',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#fff',
                    },
                  },
                }}
              />
              
              {/* Group Filter */}
              <FormControl size="small" sx={{ minWidth: 220, width: { xs: '100%', md: 'auto' } }}>
                <InputLabel>Lọc theo Nhóm</InputLabel>
                <Select
                  value={groupFilter}
                  label="Lọc theo Nhóm"
                  onChange={(e) => setGroupFilter(e.target.value)}
                  sx={{
                    backgroundColor: '#fafafa',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#fff',
                    },
                  }}
                >
                  <MenuItem value="all">Tất cả Nhóm</MenuItem>
                  <MenuItem value="hang-hoa">Hàng hóa</MenuItem>
                  <MenuItem value="dich-vu">Dịch vụ</MenuItem>
                  <MenuItem value="tai-san">Tài sản</MenuItem>
                  <MenuItem value="nguyen-vat-lieu">Nguyên vật liệu</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading && items.length === 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Table Section */}
          {!loading || items.length > 0 ? (
            <DataGrid
              rows={filteredItems}
              columns={columns}
              loading={loading}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              pageSizeOptions={[5, 10, 25, 50]}
              disableRowSelectionOnClick
              sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e0e0e0',
                fontWeight: 600,
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f8f9fa',
              },
            }}
            autoHeight
          />
          ) : null}
        </Paper>

        {/* Modal thêm/sửa */}
        <AddNewItemModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveItem}
          initialData={editingItem}
        />

        {/* Modal xem chi tiết */}
        <ItemDetailModal item={viewingItem} open={!!viewingItem} onClose={handleCloseViewModal} />

        {/* Toggle Status Confirmation Dialog */}
        <Dialog
          open={confirmModalOpen}
          onClose={handleCloseConfirmModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              fontWeight: 600,
              p: 3,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: selectedItemForToggle?.status === 'active' ? 'error.lighter' : 'success.lighter',
              }}
            >
              <WarningAmberOutlinedIcon 
                sx={{ 
                  fontSize: 28, 
                  color: selectedItemForToggle?.status === 'active' ? 'error.main' : 'success.main' 
                }} 
              />
            </Box>
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              Xác nhận thay đổi trạng thái
            </Typography>
          </DialogTitle>

          <Divider />

          <DialogContent sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ mb: 2.5 }}>
              Bạn có chắc chắn muốn{' '}
              <strong>
                {selectedItemForToggle?.status === 'active' ? 'vô hiệu hóa' : 'kích hoạt'}
              </strong>{' '}
              sản phẩm/dịch vụ sau?
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                mb: 2.5,
              }}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Mã sản phẩm/dịch vụ
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontFamily: 'monospace', color: 'primary.main' }}>
                    {selectedItemForToggle?.code}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Tên sản phẩm/dịch vụ
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {selectedItemForToggle?.name}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Nhóm
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={
                        selectedItemForToggle?.group === 'hang-hoa' 
                          ? 'Hàng hóa' 
                          : selectedItemForToggle?.group === 'dich-vu'
                          ? 'Dịch vụ'
                          : selectedItemForToggle?.group === 'tai-san'
                          ? 'Tài sản'
                          : 'Nguyên vật liệu'
                      }
                      size="small"
                      sx={{
                        backgroundColor: selectedItemForToggle?.group === 'hang-hoa' ? '#e3f2fd' : '#f3e5f5',
                        color: selectedItemForToggle?.group === 'hang-hoa' ? '#1976d2' : '#7b1fa2',
                        fontWeight: 500,
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Alert 
              severity={selectedItemForToggle?.status === 'active' ? 'warning' : 'info'}
              sx={{ borderRadius: 2 }}
            >
              <Typography variant="body2">
                {selectedItemForToggle?.status === 'active' ? (
                  <>
                    Sản phẩm/Dịch vụ sẽ <strong>không thể được chọn</strong> khi tạo hóa đơn mới sau khi bị vô hiệu hóa.
                  </>
                ) : (
                  <>
                    Sản phẩm/Dịch vụ sẽ có thể <strong>được chọn trở lại</strong> khi tạo hóa đơn sau khi được kích hoạt.
                  </>
                )}
              </Typography>
            </Alert>
          </DialogContent>

          <Divider />

          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button
              onClick={handleCloseConfirmModal}
              color="inherit"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmToggleStatus}
              variant="contained"
              color={selectedItemForToggle?.status === 'active' ? 'error' : 'success'}
              disabled={saving}
              startIcon={
                selectedItemForToggle?.status === 'active' ? 
                <LockOutlinedIcon /> : 
                <LockOpenOutlinedIcon />
              }
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              {saving ? 'Đang xử lý...' : (selectedItemForToggle?.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  )
}

export default ItemsManagement
