import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  Stack,
  Alert,
  Divider,
  Avatar,
  Chip,
} from '@mui/material'
import { Card, CardBody } from 'react-bootstrap'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

// Mock Auth Hook - Trong thực tế sẽ lấy từ AuthContext
const useAuth = () => ({
  user: {
    name: 'Ngô Đăng Hà An',
    email: 'anndh2@fe.edu.vn',
    role: 'Supervisor',
    avatar: '',
    phone: '+84 123 456 789',
    department: 'Phòng Kế toán',
    joinDate: '01/01/2023',
  },
})

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const UserProfile = () => {
  const { user } = useAuth()
  const [currentTab, setCurrentTab] = useState<string>('details')
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue)
    setError('')
    setSuccess('')
  }

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError('')
  }

  const handleSubmitPassword = () => {
    setError('')
    setSuccess('')

    // Validation
    if (!passwordForm.currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại')
      return
    }

    if (!passwordForm.newPassword) {
      setError('Vui lòng nhập mật khẩu mới')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Mật khẩu mới không khớp!')
      return
    }

    // Simulate API call
    console.log('Submitting password change:', passwordForm)

    // Reset form on success
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setSuccess('Mật khẩu đã được cập nhật thành công!')
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'error'
      case 'Supervisor':
        return 'warning'
      case 'Accountant':
        return 'primary'
      case 'Sales':
        return 'success'
      default:
        return 'default'
    }
  }

  return (
    <>
      <PageBreadcrumb title="Trang cá nhân" subName="Pages" />
      <PageMetaData title="Trang cá nhân" />

      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* User Header Card */}
        <Card className="mb-4">
          <CardBody>
            <div className="d-flex align-items-center">
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  mr: 3,
                }}
              >
                {user.name.charAt(0)}
              </Avatar>
              <div className="flex-grow-1">
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
                  {user.name}
                </Typography>
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <div className="d-flex align-items-center text-muted">
                    <IconifyIcon icon="iconamoon:email-duotone" className="me-2" />
                    <span>{user.email}</span>
                  </div>
                  <Chip
                    label={user.role}
                    color={getRoleBadgeColor(user.role)}
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Main Content */}
        <Paper elevation={2}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              sx={{
                px: 3,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                },
              }}
            >
              <Tab
                icon={<IconifyIcon icon="iconamoon:profile-duotone" />}
                iconPosition="start"
                label="Thông tin cá nhân"
                value="details"
              />
              <Tab
                icon={<IconifyIcon icon="iconamoon:lock-duotone" />}
                iconPosition="start"
                label="Đổi mật khẩu"
                value="password"
              />
            </Tabs>
          </Box>

          {/* Tab Panel 1: Personal Information */}
          {currentTab === 'details' && (
            <Box sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Thông tin cá nhân
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Họ và Tên"
                    value={user.name}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <IconifyIcon icon="iconamoon:profile-circle-duotone" className="me-2 text-muted" />
                      ),
                    }}
                    variant="outlined"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={user.email}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <IconifyIcon icon="iconamoon:email-duotone" className="me-2 text-muted" />
                      ),
                    }}
                    variant="outlined"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Vai trò"
                    value={user.role}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <IconifyIcon icon="iconamoon:shield-yes-duotone" className="me-2 text-muted" />
                      ),
                    }}
                    variant="outlined"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Số điện thoại"
                    value={user.phone}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <IconifyIcon icon="iconamoon:phone-duotone" className="me-2 text-muted" />
                      ),
                    }}
                    variant="outlined"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Phòng ban"
                    value={user.department}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <IconifyIcon icon="iconamoon:category-duotone" className="me-2 text-muted" />
                      ),
                    }}
                    variant="outlined"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Ngày tham gia"
                    value={user.joinDate}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <IconifyIcon icon="iconamoon:calendar-duotone" className="me-2 text-muted" />
                      ),
                    }}
                    variant="outlined"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, p: 3, bgcolor: 'info.lighter', borderRadius: 1 }}>
                <div className="d-flex align-items-start">
                  <IconifyIcon icon="iconamoon:information-circle-duotone" className="text-info me-2 fs-24" />
                  <div>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Lưu ý
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Để cập nhật thông tin cá nhân, vui lòng liên hệ với quản trị viên hệ thống.
                    </Typography>
                  </div>
                </div>
              </Box>
            </Box>
          )}

          {/* Tab Panel 2: Change Password */}
          {currentTab === 'password' && (
            <Box sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                Đổi mật khẩu
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Cập nhật mật khẩu của bạn để bảo mật tài khoản
              </Typography>
              <Divider sx={{ mb: 4 }} />

              <Stack spacing={3} sx={{ maxWidth: 600 }}>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}

                <TextField
                  fullWidth
                  required
                  type="password"
                  name="currentPassword"
                  label="Mật khẩu hiện tại"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  InputProps={{
                    startAdornment: (
                      <IconifyIcon icon="iconamoon:lock-duotone" className="me-2 text-muted" />
                    ),
                  }}
                  helperText="Nhập mật khẩu hiện tại của bạn"
                />

                <TextField
                  fullWidth
                  required
                  type="password"
                  name="newPassword"
                  label="Mật khẩu mới"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  InputProps={{
                    startAdornment: (
                      <IconifyIcon icon="iconamoon:lock-duotone" className="me-2 text-muted" />
                    ),
                  }}
                  helperText="Mật khẩu phải có ít nhất 8 ký tự"
                />

                <TextField
                  fullWidth
                  required
                  type="password"
                  name="confirmPassword"
                  label="Xác nhận mật khẩu mới"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  error={!!error && error.includes('không khớp')}
                  InputProps={{
                    startAdornment: (
                      <IconifyIcon icon="iconamoon:lock-duotone" className="me-2 text-muted" />
                    ),
                  }}
                  helperText="Nhập lại mật khẩu mới để xác nhận"
                />

                <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmitPassword}
                    startIcon={<IconifyIcon icon="iconamoon:check-circle-1-duotone" />}
                  >
                    Cập nhật Mật khẩu
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => {
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      })
                      setError('')
                      setSuccess('')
                    }}
                  >
                    Hủy bỏ
                  </Button>
                </Box>

                <Box sx={{ mt: 3, p: 3, bgcolor: 'warning.lighter', borderRadius: 1 }}>
                  <div className="d-flex align-items-start">
                    <IconifyIcon icon="iconamoon:shield-yes-duotone" className="text-warning me-2 fs-24" />
                    <div>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Hướng dẫn tạo mật khẩu mạnh:
                      </Typography>
                      <ul className="mb-0" style={{ paddingLeft: '1.25rem' }}>
                        <li>
                          <Typography variant="body2" color="text.secondary">
                            Sử dụng ít nhất 8 ký tự
                          </Typography>
                        </li>
                        <li>
                          <Typography variant="body2" color="text.secondary">
                            Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt
                          </Typography>
                        </li>
                        <li>
                          <Typography variant="body2" color="text.secondary">
                            Tránh sử dụng thông tin cá nhân dễ đoán
                          </Typography>
                        </li>
                        <li>
                          <Typography variant="body2" color="text.secondary">
                            Không sử dụng mật khẩu đã dùng ở hệ thống khác
                          </Typography>
                        </li>
                      </ul>
                    </div>
                  </div>
                </Box>
              </Stack>
            </Box>
          )}
        </Paper>
      </Box>
    </>
  )
}

export default UserProfile
