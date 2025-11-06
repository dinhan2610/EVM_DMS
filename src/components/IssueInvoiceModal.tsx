import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Button,
  Checkbox,
  FormControlLabel,
  Divider,
  Stack,
  Select,
  MenuItem,
  Chip,
} from '@mui/material'
import {
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  Publish as PublishIcon,
  Visibility as VisibilityIcon,
  Image as ImageIcon,
} from '@mui/icons-material'

// Props interface
interface IssueInvoiceModalProps {
  open: boolean
  onClose: () => void
  onIssue: (data: IssueData) => void
  invoiceData?: {
    invoiceNumber?: string
    serialNumber?: string
    date?: string
    customerName?: string
    totalAmount?: string
  }
}

interface IssueData {
  recipientName: string
  email: string
  ccEmails: string[]
  bccEmails: string[]
  attachments: File[]
  sendToCustomer: boolean
  disableSms: boolean
  autoSendOnlyWithEmail: boolean
  language: string
}

const IssueInvoiceModal: React.FC<IssueInvoiceModalProps> = ({
  open,
  onClose,
  onIssue,
  invoiceData = {
    invoiceNumber: 'INV-2024-001',
    serialNumber: '1K24TXN',
    date: '05/11/2024',
    customerName: 'CÔNG TY CỔ PHẦN MISA',
    totalAmount: '50.000.000',
  },
}) => {
  // State management
  const [recipientName, setRecipientName] = useState('Kế toán A')
  const [email, setEmail] = useState('hoadon@example.com')
  const [sendToCustomer, setSendToCustomer] = useState(true)
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [disableSms, setDisableSms] = useState(false)
  const [autoSendOnlyWithEmail, setAutoSendOnlyWithEmail] = useState(false)
  const [language, setLanguage] = useState('vi')

  // Handlers
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles = Array.from(files).filter((file) => file.size <= 5 * 1024 * 1024) // Max 5MB
      setAttachments([...attachments, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleIssue = () => {
    const data: IssueData = {
      recipientName: sendToCustomer ? recipientName : '',
      email: sendToCustomer ? email : '',
      ccEmails: [],
      bccEmails: [],
      attachments,
      sendToCustomer,
      disableSms,
      autoSendOnlyWithEmail,
      language,
    }
    onIssue(data)
    onClose()
  }

  const handlePreview = () => {
    console.log('Preview invoice template')
    // TODO: Implement preview functionality
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* Header */}
      <DialogTitle
        sx={{
          fontWeight: 600,
          fontSize: '1.25rem',
          color: '#1a1a1a',
          py: 2.5,
          px: 3,
          borderBottom: '1px solid #e0e0e0',
        }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PublishIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Phát hành hóa đơn
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              color: '#666',
              '&:hover': { backgroundColor: '#f5f5f5' },
            }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Invoice Information Summary */}
        <Box
          sx={{
            backgroundColor: '#f8f9fa',
            borderRadius: 2,
            p: 2.5,
            mb: 3,
            border: '1px solid #e9ecef',
          }}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {/* Left Column: Invoice Details */}
            <Box sx={{ flex: '1 1 55%', minWidth: 250 }}>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90 }}>
                    Ký hiệu:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {invoiceData.serialNumber}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90 }}>
                    Số hóa đơn:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {invoiceData.invoiceNumber}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90 }}>
                    Ngày HĐ:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {invoiceData.date}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90 }}>
                    Khách hàng:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {invoiceData.customerName}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Right Column: Total Amount */}
            <Box sx={{ flex: '1 1 40%', minWidth: 200 }}>
              <Box
                sx={{
                  textAlign: 'right',
                  backgroundColor: '#fff',
                  borderRadius: 1.5,
                  p: 2,
                  border: '1px solid #e3f2fd',
                }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Tổng tiền thanh toán
                </Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {invoiceData.totalAmount} VNĐ
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Customer Notification Form */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Left Column: Form Inputs */}
          <Box sx={{ flex: '1 1 55%', minWidth: 300 }}>
            <Stack spacing={2.5}>
              {/* Send to Customer Toggle */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sendToCustomer}
                    onChange={(e) => setSendToCustomer(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Gửi hóa đơn cho khách hàng
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (Nếu không tích sẽ chỉ phát hành mà không gửi)
                    </Typography>
                  </Box>
                }
              />

              {/* Recipient Name Input */}
              <TextField
                size="small"
                fullWidth
                label="Tên người nhận"
                placeholder="Nhập tên người nhận"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                disabled={!sendToCustomer}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputBase-root.Mui-disabled': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
              />

              {/* Email Input */}
              <TextField
                size="small"
                fullWidth
                label="Email"
                placeholder="example@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!sendToCustomer}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        onClick={() => setShowCc(!showCc)}
                        disabled={!sendToCustomer}
                        sx={{
                          textTransform: 'none',
                          color: showCc ? 'primary.main' : 'text.secondary',
                          minWidth: 35,
                          fontWeight: showCc ? 600 : 400,
                        }}>
                        Cc
                      </Button>
                      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                      <Button
                        size="small"
                        onClick={() => setShowBcc(!showBcc)}
                        disabled={!sendToCustomer}
                        sx={{
                          textTransform: 'none',
                          color: showBcc ? 'primary.main' : 'text.secondary',
                          minWidth: 40,
                          fontWeight: showBcc ? 600 : 400,
                        }}>
                        Bcc
                      </Button>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiInputBase-root.Mui-disabled': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
              />

              {/* Cc Field */}
              {showCc && sendToCustomer && (
                <TextField
                  size="small"
                  fullWidth
                  label="Cc (Carbon Copy)"
                  placeholder="Nhập email Cc, phân cách bằng dấu phẩy"
                  helperText="Người nhận sẽ thấy danh sách Cc"
                />
              )}

              {/* Bcc Field */}
              {showBcc && sendToCustomer && (
                <TextField
                  size="small"
                  fullWidth
                  label="Bcc (Blind Carbon Copy)"
                  placeholder="Nhập email Bcc, phân cách bằng dấu phẩy"
                  helperText="Người nhận sẽ không thấy danh sách Bcc"
                />
              )}
            </Stack>
          </Box>

          {/* Right Column: Illustration */}
          <Box sx={{ flex: '1 1 40%', minWidth: 200 }}>
            <Box
              sx={{
                height: '100%',
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                borderRadius: 2,
                border: '2px dashed #81c784',
                color: '#2e7d32',
                p: 3,
              }}>
              <ImageIcon sx={{ fontSize: 60, opacity: 0.6, mb: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                Hóa đơn sẽ được phát hành lên CQT
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Attachment & Options */}
        <Stack spacing={2}>
          {/* File Attachment */}
          <Box>
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={<AttachFileIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                borderStyle: 'dashed',
                color: '#1976d2',
                borderColor: '#90caf9',
                '&:hover': {
                  borderColor: '#1976d2',
                  backgroundColor: '#e3f2fd',
                },
              }}>
              Đính kèm tệp tin
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (Tối đa 5MB)
              </Typography>
              <input type="file" hidden multiple onChange={handleFileChange} />
            </Button>

            {/* Display attached files */}
            {attachments.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }} useFlexGap>
                {attachments.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    onDelete={() => handleRemoveFile(index)}
                    size="small"
                    sx={{ maxWidth: 200 }}
                  />
                ))}
              </Stack>
            )}
          </Box>

          {/* SMS Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={disableSms}
                onChange={(e) => setDisableSms(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="body2">Hủy thông báo SMS phát hành hóa đơn cho khách hàng</Typography>}
          />

          {/* Auto Send Only With Email Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={autoSendOnlyWithEmail}
                onChange={(e) => setAutoSendOnlyWithEmail(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2">
                Chỉ tự động gửi email cho khách hàng có email được thiết lập
              </Typography>
            }
          />

          {/* Language Selection & Preview */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{
              pt: 1,
              flexWrap: 'wrap',
            }}
            useFlexGap>
            <Typography variant="body2" fontWeight={500}>
              Gửi Email bằng ngôn ngữ:
            </Typography>
            <Select
              size="small"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              sx={{ minWidth: 140 }}>
              <MenuItem value="vi">Tiếng Việt</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </Select>
            <Button
              variant="text"
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={handlePreview}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
              }}>
              Xem trước
            </Button>
          </Stack>
        </Stack>
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
        }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{
            textTransform: 'none',
            minWidth: 100,
            fontWeight: 500,
            borderColor: '#d0d0d0',
            color: '#666',
            '&:hover': {
              borderColor: '#999',
              backgroundColor: '#f5f5f5',
            },
          }}>
          Hủy bỏ
        </Button>
        <Button
          onClick={handleIssue}
          variant="contained"
          color="success"
          startIcon={<PublishIcon />}
          sx={{
            textTransform: 'none',
            minWidth: 120,
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(46,125,50,0.2)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(46,125,50,0.3)',
            },
          }}>
          Phát hành
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default IssueInvoiceModal
