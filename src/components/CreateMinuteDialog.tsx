/**
 * @fileoverview CreateMinuteDialog - Modal tạo Biên Bản Điều Chỉnh/Thay Thế
 * @description Optimized modal cho việc tạo Minute từ InvoiceDetail page
 * - InvoiceId đã được truyền sẵn (không cần chọn)
 * - UI/UX tối ưu với drag-drop file upload
 * - Real-time validation
 * 
 * API: POST /api/Minute (multipart/form-data)
 * - InvoiceId: number
 * - MinuteType: 1=Điều chỉnh, 2=Thay thế
 * - Description: string
 * - PdfFile: File
 */

import { useState, useRef, useCallback } from 'react'
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
  Paper,
  Stack,
  IconButton,
  FormHelperText,
  Tooltip,
  Fade,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material'
import {
  UploadFile as UploadFileIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  InfoOutlined as InfoOutlinedIcon,
  Description as DescriptionIcon,
  FindReplace as FindReplaceIcon,
  Restore as RestoreIcon,
  Send as SendIcon,
} from '@mui/icons-material'
import { uploadMinute } from '@/services/minuteService'

// ============================================================
// 📋 INTERFACES
// ============================================================

interface CreateMinuteDialogProps {
  /** Modal open state */
  open: boolean
  /** Callback when modal closes */
  onClose: () => void
  /** Callback when upload success */
  onSuccess: () => void
  /** Invoice ID to create minute for */
  invoiceId: number
  /** Invoice number for display */
  invoiceNumber?: number
  /** Invoice symbol for display */
  invoiceSymbol?: string
}

// MinuteType enum mapping
const MINUTE_TYPE = {
  ADJUSTMENT: 1, // Điều chỉnh
  REPLACEMENT: 2, // Thay thế
} as const

type MinuteTypeValue = typeof MINUTE_TYPE[keyof typeof MINUTE_TYPE]

interface MinuteTypeOption {
  value: MinuteTypeValue
  label: string
  description: string
  icon: React.ReactNode
  color: 'warning' | 'info'
}

const MINUTE_TYPE_OPTIONS: MinuteTypeOption[] = [
  {
    value: MINUTE_TYPE.ADJUSTMENT,
    label: 'Điều Chỉnh',
    description: 'Lập biên bản điều chỉnh hóa đơn khi có sai sót về số liệu',
    icon: <FindReplaceIcon fontSize="small" />,
    color: 'warning',
  },
  {
    value: MINUTE_TYPE.REPLACEMENT,
    label: 'Thay Thế',
    description: 'Lập biên bản thay thế hóa đơn khi có sai sót nghiêm trọng',
    icon: <RestoreIcon fontSize="small" />,
    color: 'info',
  },
]

// File constraints
const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_FILE_TYPES = ['application/pdf']

// ============================================================
// 🎨 COMPONENT
// ============================================================

export default function CreateMinuteDialog({
  open,
  onClose,
  onSuccess,
  invoiceId,
  invoiceNumber,
  invoiceSymbol,
}: CreateMinuteDialogProps) {
  const theme = useTheme()
  
  // Form state
  const [minuteType, setMinuteType] = useState<MinuteTypeValue>(MINUTE_TYPE.ADJUSTMENT)
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ============================================================
  // 📁 FILE HANDLING
  // ============================================================

  /**
   * Validate uploaded file
   */
  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Chỉ chấp nhận file PDF'
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File quá lớn. Tối đa ${MAX_FILE_SIZE_MB}MB`
    }
    
    // Check file extension (double check)
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension !== 'pdf') {
      return 'File phải có đuôi .pdf'
    }
    
    return null
  }, [])

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((file: File) => {
    setFileError(null)
    
    const validationError = validateFile(file)
    if (validationError) {
      setFileError(validationError)
      setSelectedFile(null)
      return
    }
    
    setSelectedFile(file)
    console.log('[CreateMinuteDialog] File selected:', {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type,
    })
  }, [validateFile])

  /**
   * Handle input file change
   */
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Reset input value to allow selecting same file again
    event.target.value = ''
  }

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(true)
  }, [])

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)
  }, [])

  /**
   * Handle drop
   */
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)
    
    const file = event.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  /**
   * Remove selected file
   */
  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFileError(null)
  }

  /**
   * Click to browse files
   */
  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  // ============================================================
  // 📤 FORM SUBMISSION
  // ============================================================

  /**
   * Validate form before submit
   */
  const validateForm = (): string | null => {
    if (!description.trim()) {
      return 'Vui lòng nhập mô tả / lý do'
    }
    
    if (description.length > 500) {
      return 'Mô tả không được vượt quá 500 ký tự'
    }
    
    if (description.trim().length < 10) {
      return 'Mô tả phải có ít nhất 10 ký tự'
    }
    
    if (!selectedFile) {
      return 'Vui lòng chọn file biên bản PDF'
    }
    
    return null
  }

  /**
   * Handle form submit
   */
  const handleSubmit = async () => {
    setError(null)
    
    // Validate
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    
    if (!selectedFile) return
    
    try {
      setLoading(true)
      setUploadProgress(0)
      
      // Simulate upload progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 15
        })
      }, 200)
      
      // Call API
      await uploadMinute({
        invoiceId,
        minuteType,
        description: description.trim(),
        pdfFile: selectedFile,
      })
      
      // Complete progress
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      console.log('[CreateMinuteDialog] ✅ Upload success for invoice:', invoiceId)
      
      // Wait a bit for user to see 100%
      setTimeout(() => {
        handleClose()
        onSuccess()
      }, 500)
      
    } catch (err) {
      console.error('[CreateMinuteDialog] ❌ Upload error:', err)
      setError(err instanceof Error ? err.message : 'Lỗi không xác định khi tạo biên bản')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Reset form and close
   */
  const handleClose = () => {
    if (loading) return
    
    // Reset form
    setMinuteType(MINUTE_TYPE.ADJUSTMENT)
    setDescription('')
    setSelectedFile(null)
    setFileError(null)
    setError(null)
    setIsDragOver(false)
    setUploadProgress(0)
    
    onClose()
  }

  // ============================================================
  // 🎨 RENDER
  // ============================================================

  const selectedTypeOption = MINUTE_TYPE_OPTIONS.find(opt => opt.value === minuteType)
  const isFormValid = description.trim().length >= 10 && selectedFile !== null

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '95vh',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        pb: 1, 
        pt: 2.5, 
        px: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <DescriptionIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              Tạo Biên Bản ĐC/TT
            </Typography>
            {invoiceNumber && (
              <Typography variant="body2" color="text.secondary">
                {invoiceSymbol && `${invoiceSymbol} - `}Hóa đơn #{invoiceNumber}
              </Typography>
            )}
          </Box>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={loading}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Progress bar */}
      {loading && (
        <LinearProgress 
          variant="determinate" 
          value={uploadProgress}
          sx={{ height: 3 }}
        />
      )}

      {/* Content */}
      <DialogContent sx={{ px: 3, py: 2.5, marginTop: 1 }}> 
        {/* Error Alert */}
        <Collapse in={!!error}>
          <Alert 
            severity="error" 
            sx={{ mb: 2.5 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        </Collapse>

        <Stack spacing={2.5}>
          {/* Invoice Info Card */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              borderColor: alpha(theme.palette.primary.main, 0.2),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <InfoOutlinedIcon color="primary" fontSize="small" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Biên bản sẽ được tạo cho hóa đơn:
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {invoiceSymbol && `${invoiceSymbol} - `}
                  {invoiceNumber ? `HĐ #${invoiceNumber}` : `ID: ${invoiceId}`}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Minute Type Selection */}
          <FormControl fullWidth required>
            <InputLabel id="minute-type-label">Loại Biên Bản</InputLabel>
            <Select
              labelId="minute-type-label"
              value={minuteType}
              label="Loại Biên Bản"
              onChange={(e) => setMinuteType(Number(e.target.value) as MinuteTypeValue)}
              disabled={loading}
              renderValue={(value) => {
                const option = MINUTE_TYPE_OPTIONS.find(o => o.value === value)
                if (!option) return ''
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: option.color === 'warning' 
                          ? alpha(theme.palette.warning.main, 0.15)
                          : alpha(theme.palette.info.main, 0.15),
                        color: option.color === 'warning' 
                          ? theme.palette.warning.dark
                          : theme.palette.info.dark,
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      {option.value}
                    </Box>
                    <Typography sx={{ fontWeight: 500 }}>{option.label}</Typography>
                  </Box>
                )
              }}
            >
              {MINUTE_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 0.5 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: option.color === 'warning' 
                          ? alpha(theme.palette.warning.main, 0.15)
                          : alpha(theme.palette.info.main, 0.15),
                        color: option.color === 'warning' 
                          ? theme.palette.warning.dark
                          : theme.palette.info.dark,
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    >
                      {option.value}
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {option.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {selectedTypeOption?.description}
            </FormHelperText>
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
            placeholder="Nhập lý do lập biên bản điều chỉnh/thay thế hóa đơn..."
            helperText={
              <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tối thiểu 10 ký tự</span>
                <span style={{ color: description.length > 500 ? 'red' : 'inherit' }}>
                  {description.length}/500
                </span>
              </Box>
            }
            error={description.length > 500}
            inputProps={{ maxLength: 550 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          {/* File Upload - Drag & Drop Zone */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              File Biên Bản (PDF) <span style={{ color: 'red' }}>*</span>
            </Typography>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="application/pdf"
              onChange={handleFileInputChange}
            />
            
            {/* Drag & Drop Zone */}
            <Paper
              variant="outlined"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={!selectedFile ? handleBrowseClick : undefined}
              sx={{
                p: 3,
                borderRadius: 2,
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: fileError 
                  ? 'error.main'
                  : isDragOver 
                    ? 'primary.main' 
                    : selectedFile 
                      ? 'success.main'
                      : 'divider',
                backgroundColor: fileError
                  ? alpha(theme.palette.error.main, 0.05)
                  : isDragOver 
                    ? alpha(theme.palette.primary.main, 0.08) 
                    : selectedFile
                      ? alpha(theme.palette.success.main, 0.05)
                      : 'transparent',
                cursor: selectedFile ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': selectedFile ? {} : {
                  borderColor: 'primary.main',
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              {!selectedFile ? (
                // Empty state - Upload prompt
                <Stack alignItems="center" spacing={1.5}>
                  <CloudUploadIcon 
                    sx={{ 
                      fontSize: 48, 
                      color: isDragOver ? 'primary.main' : 'text.secondary',
                      transition: 'color 0.2s',
                    }} 
                  />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      {isDragOver ? (
                        <strong>Thả file vào đây</strong>
                      ) : (
                        <>
                          Kéo thả file PDF vào đây hoặc{' '}
                          <Typography 
                            component="span" 
                            color="primary" 
                            sx={{ 
                              fontWeight: 600, 
                              cursor: 'pointer',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            bấm để chọn
                          </Typography>
                        </>
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Chỉ chấp nhận file PDF, tối đa {MAX_FILE_SIZE_MB}MB
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                // File selected state
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1.5,
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PictureAsPdfIcon color="error" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Đổi file">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBrowseClick()
                        }}
                        disabled={loading}
                      >
                        <UploadFileIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa file">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFile()
                        }}
                        disabled={loading}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <CheckCircleIcon color="success" />
                </Box>
              )}
            </Paper>
            
            {/* File Error */}
            {fileError && (
              <Alert severity="error" sx={{ mt: 1.5 }} icon={false}>
                {fileError}
              </Alert>
            )}
          </Box>
        </Stack>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ textTransform: 'none', px: 3 }}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !isFormValid}
          startIcon={loading ? null : <SendIcon />}
          sx={{ 
            textTransform: 'none', 
            minWidth: 140,
            px: 3,
            background: isFormValid
              ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
              : undefined,
            '&:hover': {
              background: isFormValid
                ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                : undefined,
            },
          }}
        >
          {loading ? 'Đang tạo...' : 'Tạo Biên Bản'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
