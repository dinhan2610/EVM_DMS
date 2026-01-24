import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Autocomplete,
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { uploadMinute, validatePdfFile, UploadMinuteRequest } from '@/services/minuteService'
import invoiceService from '@/services/invoiceService'
import templateService from '@/services/templateService'
import { INVOICE_INTERNAL_STATUS } from '@/constants/invoiceStatus'

interface UploadMinuteDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

// Interface cho invoice option trong dropdown
interface InvoiceOption {
  id: number
  label: string // Format: "KH01/001E - HĐ123456 - 10,000,000₫"
  symbol: string // Ký hiệu hóa đơn (template serial)
  invoiceNumber: number
  totalAmount: number
  statusId: number
}

export default function UploadMinuteDialog({ open, onClose, onSuccess }: UploadMinuteDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Invoice selection state
  const [availableInvoices, setAvailableInvoices] = useState<InvoiceOption[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceOption | null>(null)
  
  // Form state
  const [minuteType, setMinuteType] = useState<number>(1) // 1: Điều chỉnh, 2: Thay thế
  const [description, setDescription] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  /**
   * Load available invoices (ISSUED and ADJUSTED only)
   * Hóa đơn đã phát hành hoặc đã điều chỉnh mới được phép upload biên bản
   */
  useEffect(() => {
    if (open) {
      loadAvailableInvoices()
    }
  }, [open])

  const loadAvailableInvoices = async () => {
    try {
      setLoadingInvoices(true)
      
      // Load invoices and templates in parallel
      const [allInvoices, allTemplates] = await Promise.all([
        invoiceService.getAllInvoices(),
        templateService.getAllTemplates(),
      ])
      
      // Create template map for quick lookup (templateID -> serial)
      const templateMap = new Map(
        allTemplates.map(t => [t.templateID, t.serial])
      )
      
      // Filter: Chỉ lấy hóa đơn ĐÃ PHÁT HÀNH (2) hoặc ĐÃ ĐIỀU CHỈNH (4)
      const eligibleInvoices = allInvoices.filter(inv => 
        inv.invoiceStatusID === INVOICE_INTERNAL_STATUS.ISSUED ||
        inv.invoiceStatusID === INVOICE_INTERNAL_STATUS.ADJUSTED
      )
      
      // Map to dropdown options
      const options: InvoiceOption[] = eligibleInvoices.map(inv => {
        const symbol = templateMap.get(inv.templateID) || 'N/A'
        const formattedAmount = inv.totalAmount.toLocaleString('vi-VN') + '₫'
        
        return {
          id: inv.invoiceID,
          label: `${symbol} - HĐ${inv.invoiceNumber} - ${formattedAmount}`,
          symbol,
          invoiceNumber: inv.invoiceNumber,
          totalAmount: inv.totalAmount,
          statusId: inv.invoiceStatusID,
        }
      })
      
      // Sort by invoice number descending (newest first)
      options.sort((a, b) => b.invoiceNumber - a.invoiceNumber)
      
      setAvailableInvoices(options)
      console.log('📋 [UploadMinuteDialog] Loaded eligible invoices:', {
        total: allInvoices.length,
        eligible: options.length,
        templates: allTemplates.length,
      })
    } catch (err) {
      console.error('Failed to load invoices:', err)
      setError('Không thể tải danh sách hóa đơn')
    } finally {
      setLoadingInvoices(false)
    }
  }

  /**
   * Handle file selection
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setFileError(null)
    
    if (!file) {
      setSelectedFile(null)
      return
    }

    // Validate file
    const validationError = validatePdfFile(file)
    if (validationError) {
      setFileError(validationError)
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  /**
   * Validate form before submit
   */
  const validateForm = (): string | null => {
    if (!selectedInvoice) {
      return 'Vui lòng chọn hóa đơn'
    }

    if (!description.trim()) {
      return 'Vui lòng nhập mô tả'
    }

    if (description.length > 500) {
      return 'Mô tả không được vượt quá 500 ký tự'
    }

    if (!selectedFile) {
      return 'Vui lòng chọn file PDF'
    }

    return null
  }

  /**
   * Handle form submit
   */
  const handleSubmit = async () => {
    setError(null)

    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!selectedFile || !selectedInvoice) return

    try {
      setLoading(true)

      const uploadData: UploadMinuteRequest = {
        invoiceId: selectedInvoice.id,
        minuteType,
        description: description.trim(),
        pdfFile: selectedFile,
      }

      await uploadMinute(uploadData)

      // Success - reset form and close
      handleClose()
      onSuccess()
    } catch (err) {
      console.error('Upload minute error:', err)
      setError(err instanceof Error ? err.message : 'Lỗi không xác định khi upload')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Reset form and close dialog
   */
  const handleClose = () => {
    if (loading) return
    
    setSelectedInvoice(null)
    setMinuteType(1)
    setDescription('')
    setSelectedFile(null)
    setFileError(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadFileIcon color="primary" />
          <Typography variant="h6" component="span">
            Upload Biên Bản
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Invoice Selection Dropdown */}
          <Autocomplete
            options={availableInvoices}
            value={selectedInvoice}
            onChange={(_, newValue) => setSelectedInvoice(newValue)}
            loading={loadingInvoices}
            disabled={loading || loadingInvoices}
            getOptionLabel={(option) => option.label}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {option.symbol}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      HĐ{option.invoiceNumber}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                    {option.totalAmount.toLocaleString('vi-VN')}₫
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Chọn Hóa Đơn"
                required
                placeholder="Tìm kiếm hóa đơn..."
                helperText={
                  loadingInvoices 
                    ? 'Đang tải danh sách...' 
                    : availableInvoices.length === 0
                    ? 'Không có hóa đơn đủ điều kiện (chỉ hóa đơn đã phát hành hoặc đã điều chỉnh)'
                    : `${availableInvoices.length} hóa đơn khả dụng`
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingInvoices ? <LinearProgress sx={{ width: 20 }} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            noOptionsText="Không tìm thấy hóa đơn"
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />

          {/* Minute Type */}
          <FormControl fullWidth required>
            <InputLabel>Loại Biên Bản</InputLabel>
            <Select
              value={minuteType}
              label="Loại Biên Bản"
              onChange={(e) => setMinuteType(Number(e.target.value))}
              disabled={loading}
            >
              <MenuItem value={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="1" size="small" color="warning" />
                  <span>Điều Chỉnh</span>
                </Box>
              </MenuItem>
              <MenuItem value={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="2" size="small" color="info" />
                  <span>Thay Thế</span>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Description */}
          <TextField
            label="Mô Tả / Lý Do"
            fullWidth
            required
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            placeholder="Nhập lý do điều chỉnh/thay thế hóa đơn..."
            helperText={`${description.length}/500 ký tự`}
            inputProps={{ maxLength: 500 }}
          />

          {/* File Upload */}
          <Box>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              disabled={loading}
              startIcon={<PictureAsPdfIcon />}
              sx={{ 
                py: 1.5,
                textTransform: 'none',
                justifyContent: 'flex-start',
              }}
            >
              {selectedFile ? 'Thay đổi file PDF' : 'Chọn file PDF'}
              <input
                type="file"
                hidden
                accept="application/pdf"
                onChange={handleFileChange}
              />
            </Button>

            {selectedFile && (
              <Box sx={{ mt: 1.5, p: 2, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PictureAsPdfIcon color="error" fontSize="small" />
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                    {selectedFile.name}
                  </Typography>
                  <Chip 
                    label={`${(selectedFile.size / 1024).toFixed(2)} KB`} 
                    size="small" 
                    color="success"
                  />
                </Box>
              </Box>
            )}

            {fileError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {fileError}
              </Alert>
            )}

            {!selectedFile && !fileError && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Chỉ chấp nhận file PDF, tối đa 10MB
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          sx={{ textTransform: 'none' }}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !selectedFile}
          sx={{ textTransform: 'none', minWidth: 100 }}
        >
          {loading ? 'Đang upload...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
