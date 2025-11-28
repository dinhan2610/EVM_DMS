import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
} from '@mui/material'

interface AddFieldDialogProps {
  open: boolean
  type: 'field' | 'column'
  onClose: () => void
  onSubmit: (label: string, value?: string) => void
}

export const AddFieldDialog: React.FC<AddFieldDialogProps> = ({
  open,
  type,
  onClose,
  onSubmit,
}) => {
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    if (!label.trim()) return
    onSubmit(label.trim(), type === 'field' ? value.trim() : undefined)
    // Reset form
    setLabel('')
    setValue('')
    onClose()
  }

  const handleClose = () => {
    setLabel('')
    setValue('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
        {type === 'field' ? '📝 Thêm Trường Thông Tin Mới' : '📊 Thêm Cột Bảng Mới'}
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Tên hiển thị *"
            placeholder={type === 'field' ? 'Ví dụ: Người đại diện' : 'Ví dụ: Mã đơn hàng'}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            fullWidth
            autoFocus
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.875rem',
              },
            }}
          />
          
          {type === 'field' && (
            <TextField
              label="Giá trị mặc định"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.875rem',
                },
              }}
            />
          )}
          
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            💡 <strong>Lưu ý:</strong> Sau khi thêm, bạn có thể chỉnh sửa, sắp xếp lại hoặc xóa trường này bất kỳ lúc nào.
          </Typography>
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!label.trim()}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)' },
          }}
        >
          Thêm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
