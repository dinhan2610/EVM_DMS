import { useState, useMemo } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import AddNewItemModal, { ItemFormData } from '../components/AddNewItemModal'

// Interface cho Item trong danh sách
interface Item extends ItemFormData {
  id: number
  createdAt: string
  status: 'active' | 'inactive'
}

const ItemsManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([
    // Dữ liệu mẫu
    {
      id: 1,
      code: 'SP001',
      name: 'Laptop Dell Inspiron 15',
      group: 'hang-hoa',
      unit: 'chiec',
      salesPrice: 15000000,
      priceIncludesTax: false,
      vatTaxRate: '10%',
      discountRate: 5,
      discountAmount: 750000,
      vatReduction: 'none',
      description: 'Laptop Dell Inspiron 15, Intel Core i5, RAM 8GB, SSD 256GB',
      createdAt: '2025-01-15',
      status: 'active',
    },
    {
      id: 2,
      code: 'DV001',
      name: 'Dịch vụ bảo trì phần mềm',
      group: 'dich-vu',
      unit: 'thang',
      salesPrice: 5000000,
      priceIncludesTax: true,
      vatTaxRate: '10%',
      discountRate: 0,
      discountAmount: 0,
      vatReduction: 'none',
      description: 'Dịch vụ bảo trì, nâng cấp phần mềm hàng tháng',
      createdAt: '2025-02-01',
      status: 'active',
    },
    {
      id: 3,
      code: 'SP002',
      name: 'Chuột không dây Logitech',
      group: 'hang-hoa',
      unit: 'cai',
      salesPrice: 350000,
      priceIncludesTax: false,
      vatTaxRate: '10%',
      discountRate: 10,
      discountAmount: 35000,
      vatReduction: 'none',
      description: 'Chuột không dây Logitech MX Master 3',
      createdAt: '2025-03-10',
      status: 'active',
    },
  ])
  const [searchText, setSearchText] = useState('')

  // Hàm mở modal
  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  // Hàm đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  // Hàm lưu item mới
  const handleSaveItem = (data: ItemFormData) => {
    const newItem: Item = {
      ...data,
      id: items.length + 1,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
    }
    setItems((prev) => [newItem, ...prev])
    console.log('Đã thêm item mới:', newItem)
  }

  // Hàm xóa item
  const handleDeleteItem = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  // Hàm sửa item (placeholder)
  const handleEditItem = (id: number) => {
    console.log('Edit item:', id)
    // TODO: Implement edit functionality
    alert('Chức năng sửa đang được phát triển')
  }

  // Filter items theo search
  const filteredItems = useMemo(() => {
    if (!searchText) return items
    return items.filter(
      (item) =>
        item.code.toLowerCase().includes(searchText.toLowerCase()) ||
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.description.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [items, searchText])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  // Columns definition
  const columns: GridColDef[] = [
    {
      field: 'code',
      headerName: 'Mã',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1c84ee' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'name',
      headerName: 'Tên hàng hóa / Dịch vụ',
      flex: 1,
      minWidth: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
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
      headerName: 'Nhóm',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const groupLabels: Record<string, string> = {
          'hang-hoa': 'Hàng hóa',
          'dich-vu': 'Dịch vụ',
          'tai-san': 'Tài sản',
          'nguyen-vat-lieu': 'Nguyên vật liệu',
        }
        return (
          <Chip
            label={groupLabels[params.value] || params.value}
            size="small"
            sx={{
              backgroundColor: params.value === 'hang-hoa' ? '#e3f2fd' : '#f3e5f5',
              color: params.value === 'hang-hoa' ? '#1976d2' : '#7b1fa2',
              fontWeight: 500,
            }}
          />
        )
      },
    },
    {
      field: 'unit',
      headerName: 'Đơn vị',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'salesPrice',
      headerName: 'Giá bán',
      width: 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#22c55e' }}>
          {formatCurrency(params.value)}
        </Typography>
      ),
    },
    {
      field: 'vatTaxRate',
      headerName: 'Thuế VAT',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} size="small" color="default" sx={{ fontWeight: 500 }} />
      ),
    },
    {
      field: 'discountRate',
      headerName: 'Chiết khấu',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ color: params.value > 0 ? '#ef5f5f' : '#999' }}>
          {params.value}%
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value === 'active' ? 'Hoạt động' : 'Ngừng'}
          size="small"
          color={params.value === 'active' ? 'success' : 'default'}
          sx={{ fontWeight: 500 }}
        />
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
        <Stack direction="row" spacing={0.5}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleEditItem(params.row.id)}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(28, 132, 238, 0.08)',
              },
            }}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteItem(params.row.id)}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(239, 95, 95, 0.08)',
              },
            }}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
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

        {/* Search & Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
            Tìm kiếm
          </Typography>
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
                backgroundColor: '#fff',
              },
            }}
          />
        </Paper>

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
          <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Danh sách Hàng hóa, Dịch vụ
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
              Tổng số: <strong>{filteredItems.length}</strong> sản phẩm/dịch vụ
            </Typography>
          </Box>
          <DataGrid
            rows={filteredItems}
            columns={columns}
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
        </Paper>

        {/* Modal */}
        <AddNewItemModal open={isModalOpen} onClose={handleCloseModal} onSave={handleSaveItem} />
      </Box>
    </Box>
  )
}

export default ItemsManagement
