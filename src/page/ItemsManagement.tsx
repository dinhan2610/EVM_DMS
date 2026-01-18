import { useState, useMemo, useEffect } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
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
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import AddNewItemModal, { ItemFormData } from '../components/AddNewItemModal'
import ItemDetailModal from '../components/ItemDetailModal'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
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
  usePageTitle('Quản lý hàng hóa')
  
  const { products, loading, error } = useProducts()
  const { categories } = useCategories()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [searchText, setSearchText] = useState('')
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [viewingItem, setViewingItem] = useState<Item | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all')
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
      
      // Toast notification thành công với gradient xanh dương
      if (editingItem) {
        toast.success(
          `Cập nhật sản phẩm "${data.name}" thành công!`,
          {
            position: 'top-right',
            autoClose: 3000,
            style: {
              background: 'linear-gradient(135deg, #1c84ee 0%, #0d6efd 100%)',
              color: '#fff',
            },
            progressStyle: {
              background: 'rgba(255, 255, 255, 0.7)',
            },
          }
        )
      } else {
        toast.success(
          `Thêm mới sản phẩm "${data.name}" thành công!`,
          {
            position: 'top-right',
            autoClose: 3000,
            style: {
              background: 'linear-gradient(135deg, #1c84ee 0%, #0d6efd 100%)',
              color: '#fff',
            },
            progressStyle: {
              background: 'rgba(255, 255, 255, 0.7)',
            },
          }
        )
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi lưu sản phẩm'
      setActionError(errorMessage)
      
      // Toast thông báo lỗi
      toast.error(
        `✗ ${errorMessage}`,
        {
          position: 'top-right',
          autoClose: 4000,
        }
      )
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
      const isActive = newStatus === 'active'
      const productName = selectedItemForToggle.name

      // Sử dụng API PATCH chuyên dụng - tối ưu hơn nhiều so với PUT toàn bộ sản phẩm
      await productService.toggleProductStatus(selectedItemForToggle.id, isActive)
      
      // Cập nhật optimistic UI: Update status ngay lập tức
      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItemForToggle.id
            ? { ...item, status: newStatus }
            : item
        )
      )
      
      // Hiển thị toast notification với màu sắc đồng bộ
      if (isActive) {
        toast.success(
          `Sản phẩm "${productName}" đã được kích hoạt thành công!`,
          {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            style: {
              background: 'linear-gradient(135deg, #1c84ee 0%, #0d6efd 100%)',
              color: '#fff',
            },
            progressStyle: {
              background: 'rgba(255, 255, 255, 0.7)',
            },
          }
        )
      } else {
        toast.warning(
          `Sản phẩm "${productName}" đã bị vô hiệu hóa!`,
          {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            style: {
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#fff',
            },
            progressStyle: {
              background: 'rgba(255, 255, 255, 0.7)',
            },
          }
        )
      }
      
      handleCloseConfirmModal()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái'
      setActionError(errorMessage)
      
      // Toast thông báo lỗi
      toast.error(
        `✗ ${errorMessage}`,
        {
          position: 'top-right',
          autoClose: 4000,
        }
      )
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

  // Hàm lấy tên category từ categoryID
  const getCategoryName = (categoryID?: number) => {
    if (!categoryID) return 'Chưa phân loại'
    const category = categories.find((cat) => cat.id === categoryID)
    return category?.name || 'Chưa xác định'
  }

  // Filter items theo search
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Lọc theo Danh mục
        if (categoryFilter === 'all') return true
        return item.categoryID === categoryFilter
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
  }, [items, searchText, categoryFilter])

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
      field: 'categoryID',
      headerName: 'Danh mục',
      width: 200,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const categoryName = getCategoryName(params.value)
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
              label={categoryName}
              size="small"
              sx={{
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
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
              
              {/* Category Filter */}
              <FormControl size="small" sx={{ minWidth: 220, width: { xs: '100%', md: 'auto' } }}>
                <InputLabel>Lọc theo Danh mục</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Lọc theo Danh mục"
                  onChange={(e) => setCategoryFilter(e.target.value as number | 'all')}
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
                  <MenuItem value="all">Tất cả Danh mục</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
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
          onClose={!saving ? handleCloseConfirmModal : undefined}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              fontWeight: 600,
              pb: 2,
              pt: 2.5,
              px: 3,
              borderBottom: '1px solid #e8ecef',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                background: selectedItemForToggle?.status === 'active'
                  ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                  : 'linear-gradient(135deg, #1c84ee 0%, #0d6efd 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: selectedItemForToggle?.status === 'active' 
                  ? '0 4px 12px rgba(251, 191, 36, 0.3)' 
                  : '0 4px 12px rgba(28, 132, 238, 0.3)',
              }}
            >
              {selectedItemForToggle?.status === 'active' ? (
                <LockOutlinedIcon sx={{ fontSize: 20 }} />
              ) : (
                <LockOpenOutlinedIcon sx={{ fontSize: 20 }} />
              )}
            </Box>
            <Typography variant="h6" component="span" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1.125rem' }}>
              Xác nhận thay đổi trạng thái
            </Typography>
          </DialogTitle>

          <Divider sx={{ borderColor: '#e8ecef' }} />

          <DialogContent sx={{ pt: 3, pb: 2.5, px: 3, backgroundColor: '#fafbfc' }}>
            <Typography variant="body1" sx={{ mb: 2.5, color: '#374151', lineHeight: 1.6 }}>
              Bạn có chắc chắn muốn{' '}
              <strong
                style={{
                  color: selectedItemForToggle?.status === 'active' ? '#f59e0b' : '#1c84ee',
                  fontWeight: 700,
                }}
              >
                {selectedItemForToggle?.status === 'active' ? 'vô hiệu hóa' : 'kích hoạt'}
              </strong>{' '}
              sản phẩm/dịch vụ sau?
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: '#fff',
                border: '2px solid',
                borderColor: '#e0e0e0',
                borderRadius: 2,
                mb: 2.5,
              }}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                    Mã sản phẩm/dịch vụ
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontFamily: 'monospace', color: '#1c84ee', fontWeight: 600, fontSize: '0.9375rem' }}>
                    {selectedItemForToggle?.code}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                    Tên sản phẩm/dịch vụ
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5, color: '#1a1a1a' }}>
                    {selectedItemForToggle?.name}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
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
                        fontWeight: 600,
                        borderRadius: 1.5,
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Alert 
              severity={selectedItemForToggle?.status === 'active' ? 'warning' : 'info'}
              icon={
                selectedItemForToggle?.status === 'active' ? 
                <LockOutlinedIcon fontSize="inherit" /> : 
                <LockOpenOutlinedIcon fontSize="inherit" />
              }
              sx={{ 
                borderRadius: 2,
                border: '1px solid',
                borderColor: selectedItemForToggle?.status === 'active' ? '#fbbf24' : '#3b82f6',
                bgcolor: selectedItemForToggle?.status === 'active' ? '#fffbeb' : '#eff6ff',
                '& .MuiAlert-icon': {
                  fontSize: '1.25rem',
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
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

          <Divider sx={{ borderColor: '#e8ecef' }} />

          <DialogActions sx={{ p: 3, gap: 1.5, bgcolor: '#fafbfc' }}>
            <Button
              onClick={handleCloseConfirmModal}
              disabled={saving}
              variant="outlined"
              color="inherit"
              sx={{
                minWidth: 90,
                height: 38,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#6c757d',
                borderColor: '#dee2e6',
                borderWidth: '1.5px',
                '&:hover': {
                  borderColor: '#adb5bd',
                  borderWidth: '1.5px',
                  backgroundColor: '#e9ecef',
                },
                '&:disabled': {
                  borderColor: '#e9ecef',
                  color: '#adb5bd',
                },
              }}
            >
              Hủy
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              onClick={handleConfirmToggleStatus}
              variant="contained"
              disabled={saving}
              startIcon={
                saving ? (
                  <CircularProgress size={18} sx={{ color: 'white' }} />
                ) : selectedItemForToggle?.status === 'active' ? (
                  <LockOutlinedIcon sx={{ fontSize: 20 }} />
                ) : (
                  <LockOpenOutlinedIcon sx={{ fontSize: 20 }} />
                )
              }
              sx={{
                minWidth: 140,
                height: 38,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.9375rem',
                fontWeight: 600,
                background: selectedItemForToggle?.status === 'active'
                  ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                  : 'linear-gradient(135deg, #1c84ee 0%, #0d6efd 100%)',
                boxShadow: selectedItemForToggle?.status === 'active' 
                  ? '0 4px 12px rgba(251, 191, 36, 0.3)' 
                  : '0 4px 12px rgba(28, 132, 238, 0.3)',
                '&:hover': {
                  background: selectedItemForToggle?.status === 'active'
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)',
                  boxShadow: selectedItemForToggle?.status === 'active' 
                    ? '0 6px 16px rgba(251, 191, 36, 0.4)' 
                    : '0 6px 16px rgba(28, 132, 238, 0.4)',
                },
                '&:disabled': {
                  background: '#e9ecef',
                  color: '#adb5bd',
                  boxShadow: 'none',
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
