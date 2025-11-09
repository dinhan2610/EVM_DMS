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
  Divider,
  Stack,
  Chip,
} from '@mui/material'
import {
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  Email as EmailIcon,
  Send as SendIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material'

// Props interface
interface SendInvoiceEmailModalProps {
  open: boolean
  onClose: () => void
  onSend: (data: EmailData) => void
  invoiceData?: {
    invoiceNumber?: string
    serialNumber?: string
    date?: string
    customerName?: string
    totalAmount?: string
  }
}

interface EmailData {
  recipientName: string
  email: string
  ccEmails: string[]
  bccEmails: string[]
  attachments: File[]
  includeXml: boolean
  disableSms: boolean
  language: string
}

const SendInvoiceEmailModal: React.FC<SendInvoiceEmailModalProps> = ({
  open,
  onClose,
  onSend,
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
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  

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

  const handleSend = () => {
    const data: EmailData = {
      recipientName,
      email,
      ccEmails: [],
      bccEmails: [],
      attachments,
      includeXml: false,
      disableSms: false,
      language: 'vi',
    }
    onSend(data)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} fullWidth sx={{ '& .MuiDialog-paper': { maxWidth: 700 } }}>
      {/* Header */}
      <DialogTitle
        sx={{
          fontWeight: 600,
          fontSize: '1.25rem',
          color: '#1a1a1a',
          py: 2,
          px: 3,
          borderBottom: '1px solid #e0e0e0',
        }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5}}>
            <EmailIcon sx={{ color: '#1976d2', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Gửi hóa đơn nháp cho khách hàng
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

      <DialogContent sx={{ p: 2.5, pt: 2 }}>
        {/* Invoice Information Summary */}
        <Box
          sx={{
            backgroundColor: '#f8f9fa',
            borderRadius: 2,
            p: 1.5,
            mb: 2,
            border: '1px solid #e9ecef',
            marginTop: '10px',
          }}>
          <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
            {/* Left Column: Invoice Details */}
            <Box sx={{ flex: '1 1 55%', minWidth: 250 }}>
              <Stack spacing={0.5}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 85, fontSize: '0.8125rem' }}>
                    Ký hiệu:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                    {invoiceData.serialNumber}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 85, fontSize: '0.8125rem' }}>
                    Số hóa đơn:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                    {invoiceData.invoiceNumber}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 85, fontSize: '0.8125rem' }}>
                    Ngày HĐ:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                    {invoiceData.date}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 85, fontSize: '0.8125rem' }}>
                    Khách hàng:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                    {invoiceData.customerName}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Right Column: Total Amount */}
            <Box sx={{ flex: '1 1 15%', minWidth: 150 }}>
              <Box
                sx={{
                  textAlign: 'right',
                  backgroundColor: '#fff',
                  borderRadius: 1.5,
                  p: 1.25,
                  border: '1px solid #e3f2fd',
                }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.25, display: 'block', fontSize: '0.7rem' }}>
                  Tổng tiền thanh toán
                </Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ fontSize: '1.2rem' }}>
                  {invoiceData.totalAmount} VNĐ
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Email Form */}
        <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
          {/* Left Column: Form Inputs */}
          <Box sx={{ flex: '1 1 55%', minWidth: 300, marginTop: '7px' }}>
            <Stack spacing={4.5}>
              {/* Recipient Name Input */}
              <TextField
                size="small"
                fullWidth
                label="Tên người nhận"
                placeholder="Nhập tên người nhận"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                InputLabelProps={{
                  sx: { fontSize: '0.8125rem' },
                }}
                inputProps={{
                  sx: { fontSize: '0.8125rem', py: 0.75 },
                }}
              />

              {/* Email Input */}
              <TextField
                size="small"
                fullWidth
                required
                label="Email người nhận"
                placeholder="example@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputLabelProps={{
                  sx: { fontSize: '0.8125rem' },
                }}
                inputProps={{
                  sx: { fontSize: '0.8125rem', py: 0.75 },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        onClick={() => setShowCc(!showCc)}
                        sx={{
                          textTransform: 'none',
                          color: showCc ? 'primary.main' : 'text.secondary',
                          minWidth: 35,
                          fontWeight: showCc ? 600 : 400,
                          fontSize: '0.75rem',
                        }}>
                        Cc
                      </Button>
                      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                      <Button
                        size="small"
                        onClick={() => setShowBcc(!showBcc)}
                        sx={{
                          textTransform: 'none',
                          color: showBcc ? 'primary.main' : 'text.secondary',
                          minWidth: 40,
                          fontWeight: showBcc ? 600 : 400,
                          fontSize: '0.75rem',
                        }}>
                        Bcc
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Cc Field */}
              {showCc && (
                <TextField
                  size="small"
                  fullWidth
                  label="Cc (Carbon Copy)"
                  placeholder="Nhập email Cc, phân cách bằng dấu phẩy"
                  helperText="Người nhận sẽ thấy danh sách Cc"
                  InputLabelProps={{
                    sx: { fontSize: '0.8125rem' },
                  }}
                  inputProps={{
                    sx: { fontSize: '0.8125rem', py: 0.75 },
                  }}
                />
              )}

              {/* Bcc Field */}
              {showBcc && (
                <TextField
                  size="small"
                  fullWidth
                  label="Bcc (Blind Carbon Copy)"
                  placeholder="Nhập email Bcc, phân cách bằng dấu phẩy"
                  helperText="Người nhận sẽ không thấy danh sách Bcc"
                  InputLabelProps={{
                    sx: { fontSize: '0.8125rem' },
                  }}
                  inputProps={{
                    sx: { fontSize: '0.8125rem', py: 0.75 },
                  }}
                />
              )}
            </Stack>
          </Box>

          {/* Right Column: Illustration */}
          <Box sx={{ flex: '1 1 ', minWidth: 220 }}>
            <Box
              sx={{
                height: '70%',
                minHeight: 110,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}>
              <Box
                component="img"
                src="/decor_form.png"
                alt="Email Invoice Illustration"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  borderRadius: 2,
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
               
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Attachment & Options */}
        <Stack spacing={1.5}>
          {/* File Attachment */}
          <Box>
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={<AttachFileIcon sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                borderStyle: 'dashed',
                color: '#1976d2',
                borderColor: '#90caf9',
                fontSize: '0.8125rem',
                px: 1.5,
                py: 0.5,
                '&:hover': {
                  borderColor: '#1976d2',
                  backgroundColor: '#e3f2fd',
                },
              }}>
              Đính kèm tệp tin
              <Typography variant="caption" color="text.secondary" sx={{ ml: 0.75, fontSize: '0.7rem' }}>
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

          {/* SMS Setup Notification */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              pt: 0.5,
            }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(25, 118, 210, 0.2)',
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': {
                    boxShadow: '0 0 8px rgba(25, 118, 210, 0.2)',
                  },
                  '50%': {
                    boxShadow: '0 0 12px rgba(25, 118, 210, 0.4)',
                  },
                },
              }}>
              <InfoIcon sx={{ color: '#1976d2', fontSize: 13 }} />
            </Box>
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.6rem' }}>
              Hãy{' '}
              <Typography
                component="span"
                sx={{
                  color: '#1976d2',
                  fontWeight: 600,
                  fontSize: '0.6rem',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}>
                Thiết lập dịch vụ SMS
              </Typography>{' '}
              để có thể gửi tin nhắn cho khách hàng
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
          justifyContent: 'flex-end',
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
          onClick={handleSend}
          variant="contained"
          color="primary"
          startIcon={<SendIcon />}
          sx={{
            textTransform: 'none',
            minWidth: 120,
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(25,118,210,0.2)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(25,118,210,0.3)',
            },
          }}>
          Gửi Email
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SendInvoiceEmailModal
