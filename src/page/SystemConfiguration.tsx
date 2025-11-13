import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Checkbox,
  Stack,
  Divider,
  Alert,
  Snackbar,
  InputAdornment,
  IconButton,
  Chip,
} from '@mui/material'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import IntegrationInstructionsOutlinedIcon from '@mui/icons-material/IntegrationInstructionsOutlined'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'

// Interfaces
interface CompanyInfo {
  companyName: string
  taxCode: string
  address: string
  phone: string
  email: string
  bankAccount: string
  bankName: string
}

interface ApiConfig {
  isSandbox: boolean
  apiUrl: string
  apiKey: string
  secretKey: string
}

interface EmailConfig {
  smtpHost: string
  smtpPort: string
  username: string
  password: string
  useSSL: boolean
}

// Initial States
const initialCompanyInfo: CompanyInfo = {
  companyName: 'Công ty TNHH Công nghệ ABC',
  taxCode: '0123456789',
  address: '123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM',
  phone: '0901234567',
  email: 'contact@abc-tech.com',
  bankAccount: '1234567890',
  bankName: 'Vietcombank - Chi nhánh TP.HCM',
}

const initialApiConfig: ApiConfig = {
  isSandbox: true,
  apiUrl: 'https://api-sandbox.vnpt-invoice.com.vn',
  apiKey: '',
  secretKey: '',
}

const initialEmailConfig: EmailConfig = {
  smtpHost: 'smtp.gmail.com',
  smtpPort: '587',
  username: '',
  password: '',
  useSSL: true,
}

const SystemConfiguration = () => {
  // State: Current Tab
  const [currentTab, setCurrentTab] = useState<'company' | 'integrations' | 'notifications'>('company')

  // State: Forms
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo)
  const [apiConfig, setApiConfig] = useState<ApiConfig>(initialApiConfig)
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(initialEmailConfig)

  // State: Password Visibility
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [showEmailPassword, setShowEmailPassword] = useState(false)

  // State: Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Handlers: Company Info
  const handleCompanyInfoChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveCompanyInfo = () => {
    // Validation
    if (!companyInfo.companyName.trim() || !companyInfo.taxCode.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng điền đầy đủ Tên công ty và Mã số thuế!',
        severity: 'error',
      })
      return
    }

    // Save logic here
    setSnackbar({
      open: true,
      message: 'Đã lưu thông tin doanh nghiệp thành công!',
      severity: 'success',
    })
  }

  // Handlers: API Config
  const handleApiConfigChange = (field: keyof ApiConfig, value: string | boolean) => {
    setApiConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveApiConfig = () => {
    if (!apiConfig.apiUrl.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng nhập API URL!',
        severity: 'error',
      })
      return
    }

    setSnackbar({
      open: true,
      message: 'Đã lưu cấu hình API thành công!',
      severity: 'success',
    })
  }

  const handleTestConnection = () => {
    if (!apiConfig.apiUrl.trim() || !apiConfig.apiKey.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng điền đầy đủ thông tin API để kiểm tra!',
        severity: 'error',
      })
      return
    }

    // Simulate API test
    setTimeout(() => {
      setSnackbar({
        open: true,
        message: 'Kết nối thành công với máy chủ CQT!',
        severity: 'success',
      })
    }, 1000)
  }

  // Handlers: Email Config
  const handleEmailConfigChange = (field: keyof EmailConfig, value: string | boolean) => {
    setEmailConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveEmailConfig = () => {
    if (!emailConfig.smtpHost.trim() || !emailConfig.username.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng điền đầy đủ thông tin máy chủ SMTP!',
        severity: 'error',
      })
      return
    }

    setSnackbar({
      open: true,
      message: 'Đã lưu cấu hình email thành công!',
      severity: 'success',
    })
  }

  const handleSendTestEmail = () => {
    if (!emailConfig.smtpHost.trim() || !emailConfig.username.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng lưu cấu hình trước khi gửi email thử nghiệm!',
        severity: 'error',
      })
      return
    }

    // Simulate email sending
    setTimeout(() => {
      setSnackbar({
        open: true,
        message: 'Email thử nghiệm đã được gửi thành công!',
        severity: 'success',
      })
    }, 1000)
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
          Cấu hình Hệ thống
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Quản lý thông tin doanh nghiệp, tích hợp API và cấu hình thông báo
        </Typography>
      </Box>

      {/* Tabs Navigation */}
      <Paper
        sx={{
          mb: 3,
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              minHeight: 64,
              py: 2,
            },
          }}
        >
          <Tab
            value="company"
            icon={<BusinessOutlinedIcon />}
            iconPosition="start"
            label="Thông tin Doanh nghiệp"
          />
          <Tab
            value="integrations"
            icon={<IntegrationInstructionsOutlinedIcon />}
            iconPosition="start"
            label="Tích hợp API"
          />
          <Tab
            value="notifications"
            icon={<NotificationsOutlinedIcon />}
            iconPosition="start"
            label="Thông báo"
          />
        </Tabs>
      </Paper>

      {/* Tab Panel 1: Company Info */}
      {currentTab === 'company' && (
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessOutlinedIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Thông tin Doanh nghiệp
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Thông tin này sẽ hiển thị trên hoá đơn điện tử và các tài liệu chính thức.
          </Alert>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Tên công ty"
                required
                value={companyInfo.companyName}
                onChange={(e) => handleCompanyInfoChange('companyName', e.target.value)}
                placeholder="VD: Công ty TNHH ABC Technology"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Mã số thuế"
                required
                value={companyInfo.taxCode}
                onChange={(e) => handleCompanyInfoChange('taxCode', e.target.value)}
                placeholder="VD: 0123456789"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Địa chỉ"
                value={companyInfo.address}
                onChange={(e) => handleCompanyInfoChange('address', e.target.value)}
                placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
                multiline
                rows={2}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Điện thoại"
                value={companyInfo.phone}
                onChange={(e) => handleCompanyInfoChange('phone', e.target.value)}
                placeholder="VD: 0901234567"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Email liên hệ"
                type="email"
                value={companyInfo.email}
                onChange={(e) => handleCompanyInfoChange('email', e.target.value)}
                placeholder="VD: contact@company.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Số tài khoản"
                value={companyInfo.bankAccount}
                onChange={(e) => handleCompanyInfoChange('bankAccount', e.target.value)}
                placeholder="VD: 1234567890"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Ngân hàng"
                value={companyInfo.bankName}
                onChange={(e) => handleCompanyInfoChange('bankName', e.target.value)}
                placeholder="VD: Vietcombank - Chi nhánh TP.HCM"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveOutlinedIcon />}
              onClick={handleSaveCompanyInfo}
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
              Lưu thông tin
            </Button>
          </Box>
        </Paper>
      )}

      {/* Tab Panel 2: API Integrations */}
      {currentTab === 'integrations' && (
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <IntegrationInstructionsOutlinedIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Cấu hình API Cơ quan Thuế (CQT)
            </Typography>
            <Chip
              label={apiConfig.isSandbox ? 'Sandbox' : 'Production'}
              size="small"
              color={apiConfig.isSandbox ? 'warning' : 'success'}
              sx={{ ml: 'auto' }}
            />
          </Box>

          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              Lưu ý bảo mật
            </Typography>
            <Typography variant="caption">
              API Key và Secret Key là thông tin nhạy cảm. Không chia sẻ với bất kỳ ai.
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={apiConfig.isSandbox}
                  onChange={(e) => {
                    handleApiConfigChange('isSandbox', e.target.checked)
                    handleApiConfigChange(
                      'apiUrl',
                      e.target.checked
                        ? 'https://api-sandbox.vnpt-invoice.com.vn'
                        : 'https://api.vnpt-invoice.com.vn'
                    )
                  }}
                  color="warning"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Sử dụng môi trường Sandbox (Thử nghiệm)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Bật để sử dụng môi trường test, tắt để sử dụng môi trường production
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Stack spacing={2.5}>
            <TextField
              fullWidth
              size="small"
              label="API URL"
              required
              value={apiConfig.apiUrl}
              onChange={(e) => handleApiConfigChange('apiUrl', e.target.value)}
              placeholder="https://api.vnpt-invoice.com.vn"
              helperText="URL của API Cơ quan Thuế"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              fullWidth
              size="small"
              label="API Key"
              type={showApiKey ? 'text' : 'password'}
              required
              value={apiConfig.apiKey}
              onChange={(e) => handleApiConfigChange('apiKey', e.target.value)}
              placeholder="Nhập API Key từ Cơ quan Thuế"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowApiKey(!showApiKey)}
                      edge="end"
                      size="small"
                    >
                      {showApiKey ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              fullWidth
              size="small"
              label="Secret Key"
              type={showSecretKey ? 'text' : 'password'}
              required
              value={apiConfig.secretKey}
              onChange={(e) => handleApiConfigChange('secretKey', e.target.value)}
              placeholder="Nhập Secret Key từ Cơ quan Thuế"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      edge="end"
                      size="small"
                    >
                      {showSecretKey ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveOutlinedIcon />}
              onClick={handleSaveApiConfig}
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
              Lưu Cấu hình API
            </Button>
            <Button
              variant="outlined"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={handleTestConnection}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
              }}
            >
              Kiểm tra kết nối
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Tab Panel 3: Notifications */}
      {currentTab === 'notifications' && (
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsOutlinedIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Cấu hình Máy chủ Email (SMTP)
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Cấu hình máy chủ SMTP để gửi email thông báo tự động cho khách hàng và người dùng.
          </Alert>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Máy chủ SMTP"
                required
                value={emailConfig.smtpHost}
                onChange={(e) => handleEmailConfigChange('smtpHost', e.target.value)}
                placeholder="smtp.gmail.com"
                helperText="VD: smtp.gmail.com, smtp.outlook.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Port"
                type="number"
                required
                value={emailConfig.smtpPort}
                onChange={(e) => handleEmailConfigChange('smtpPort', e.target.value)}
                placeholder="587"
                helperText="Port thông dụng: 587 (TLS), 465 (SSL)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Tên đăng nhập (Email)"
                type="email"
                required
                value={emailConfig.username}
                onChange={(e) => handleEmailConfigChange('username', e.target.value)}
                placeholder="your-email@gmail.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Mật khẩu"
                type={showEmailPassword ? 'text' : 'password'}
                required
                value={emailConfig.password}
                onChange={(e) => handleEmailConfigChange('password', e.target.value)}
                placeholder="Mật khẩu ứng dụng"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowEmailPassword(!showEmailPassword)}
                        edge="end"
                        size="small"
                      >
                        {showEmailPassword ? (
                          <VisibilityOffOutlinedIcon />
                        ) : (
                          <VisibilityOutlinedIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={emailConfig.useSSL}
                      onChange={(e) => handleEmailConfigChange('useSSL', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Sử dụng SSL/TLS
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Khuyến nghị bật để bảo mật kết nối email
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveOutlinedIcon />}
              onClick={handleSaveEmailConfig}
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
              Lưu Cấu hình Email
            </Button>
            <Button
              variant="outlined"
              startIcon={<SendOutlinedIcon />}
              onClick={handleSendTestEmail}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
              }}
            >
              Gửi email thử nghiệm
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default SystemConfiguration
