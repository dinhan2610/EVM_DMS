import { useState } from 'react'
import { Box, Button, Typography, Paper, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AddNewItemModal, { ItemFormData } from '../components/AddNewItemModal'

/**
 * Demo page để test component AddNewItemModal
 * Trang này có thể được xóa sau khi đã tích hợp vào trang chính
 */
const AddNewItemModalDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savedItems, setSavedItems] = useState<ItemFormData[]>([])

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleSaveItem = (data: ItemFormData) => {
    console.log('Dữ liệu đã lưu:', data)
    setSavedItems((prev) => [...prev, data])
  }

  return (
    <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
            Demo: Modal Thêm mới Hàng hóa, Dịch vụ
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Click nút bên dưới để mở modal thêm mới
          </Typography>
        </Box>

        {/* Button to open modal */}
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
            Thêm mới hàng hóa, dịch vụ
          </Button>
        </Paper>

        {/* Display saved items */}
        {savedItems.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Danh sách hàng hóa đã thêm ({savedItems.length})
            </Typography>
            <Stack spacing={2}>
              {savedItems.map((item, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    backgroundColor: '#f8f9fa',
                  }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3 }}>
                    {item.code} - {item.name}
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Nhóm: {item.group || 'Chưa chọn'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Đơn vị: {item.unit}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Giá bán: {item.salesPrice.toLocaleString('vi-VN')} VNĐ
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Thuế VAT: {item.vatTaxRate}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Chiết khấu: {item.discountRate}% ({item.discountAmount.toLocaleString('vi-VN')} VNĐ)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Sau thuế: {item.priceIncludesTax ? 'Có' : 'Không'}
                    </Typography>
                  </Box>
                  {item.description && (
                    <Typography variant="body2" sx={{ color: '#666', mt: 1, fontStyle: 'italic' }}>
                      Mô tả: {item.description}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Stack>
          </Paper>
        )}

        {/* Modal Component */}
        <AddNewItemModal open={isModalOpen} onClose={handleCloseModal} onSave={handleSaveItem} />
      </Box>
    </Box>
  )
}

export default AddNewItemModalDemo
