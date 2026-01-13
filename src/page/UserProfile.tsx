import { useState, useMemo, useEffect } from 'react'
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
  LinearProgress,
  Tooltip,
  alpha,
  CircularProgress,
} from '@mui/material'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import authService from '@/services/authService'
import userService, { UserProfile as UserProfileData } from '@/services/userService'

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface ProfileForm {
  fullName: string
  phoneNumber: string
  evidenceStoragePath: string
}

// Password strength calculator
const calculatePasswordStrength = (password: string): { strength: number; label: string; color: string } => {
  if (!password) return { strength: 0, label: '', color: '#e0e0e0' }
  
  let strength = 0
  
  // Length check
  if (password.length >= 8) strength += 20
  if (password.length >= 12) strength += 10
  
  // Character variety checks
  if (/[a-z]/.test(password)) strength += 20
  if (/[A-Z]/.test(password)) strength += 20
  if (/[0-9]/.test(password)) strength += 15
  if (/[^a-zA-Z0-9]/.test(password)) strength += 15
  
  // Determine label and color
  if (strength < 40) return { strength, label: 'Yếu', color: '#ef5f5f' }
  if (strength < 60) return { strength, label: 'Trung bình', color: '#ff9800' }
  if (strength < 80) return { strength, label: 'Tốt', color: '#1976d2' }
  return { strength, label: 'Rất tốt', color: '#2e7d32' }
}

const UserProfile = () => {
  // Profile state
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    fullName: '',
    phoneNumber: '',
    evidenceStoragePath: '',
  })
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  
  // Tab and messaging state
  const [currentTab, setCurrentTab] = useState<string>('details')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  
  // Password state
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  // Fetch profile on component mount
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true)
      setError('') // Clear previous errors
      const data = await userService.getProfile()
      setProfile(data)
      setProfileForm({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        evidenceStoragePath: data.evidenceStoragePath || '',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải thông tin cá nhân'
      setError(errorMessage)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Calculate password strength
  const passwordStrength = useMemo(
    () => calculatePasswordStrength(passwordForm.newPassword),
    [passwordForm.newPassword]
  )

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue)
    setError('')
    setSuccess('')
    // Cancel edit mode when switching tabs
    if (isEditMode) {
      setIsEditMode(false)
      // Reset form to profile data
      if (profile) {
        setProfileForm({
          fullName: profile.fullName,
          phoneNumber: profile.phoneNumber,
          evidenceStoragePath: profile.evidenceStoragePath || '',
        })
      }
    }
  }

  // Profile handlers
  const handleEditClick = () => {
    setIsEditMode(true)
    setError('')
    setSuccess('')
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setError('')
    setSuccess('')
    // Reset form to profile data
    if (profile) {
      setProfileForm({
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        evidenceStoragePath: profile.evidenceStoragePath || '',
      })
    }
  }

  const handleProfileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError('')
  }

  const handleSaveProfile = async () => {
    setError('')
    setSuccess('')
    
    // Validation
    if (!profileForm.fullName.trim()) {
      setError('Họ và tên không được để trống')
      return
    }

    if (!profileForm.phoneNumber.trim()) {
      setError('Số điện thoại không được để trống')
      return
    }

    // Basic phone validation (Vietnamese format)
    const phoneRegex = /^[0-9]{10,11}$/
    if (!phoneRegex.test(profileForm.phoneNumber.replace(/[\s-]/g, ''))) {
      setError('Số điện thoại không hợp lệ (10-11 chữ số)')
      return
    }

    try {
      setIsSavingProfile(true)
      const updatedProfile = await userService.updateProfile({
        fullName: profileForm.fullName.trim(),
        phoneNumber: profileForm.phoneNumber.trim(),
        evidenceStoragePath: profileForm.evidenceStoragePath.trim() || null,
      })
      
      setProfile(updatedProfile)
      setIsEditMode(false)
      setSuccess('✓ Thông tin cá nhân đã được cập nhật thành công!')

      // Auto hide success message
      setTimeout(() => {
        setSuccess('')
      }, 5000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể cập nhật thông tin'
      setError(errorMessage)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError('')
  }

  const handleSubmitPassword = async () => {
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    // Validation
    if (!passwordForm.currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại')
      setIsSubmitting(false)
      return
    }

    if (!passwordForm.newPassword) {
      setError('Vui lòng nhập mật khẩu mới')
      setIsSubmitting(false)
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự')
      setIsSubmitting(false)
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Mật khẩu mới không khớp!')
      setIsSubmitting(false)
      return
    }

    if (passwordStrength.strength < 40) {
      setError('Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.')
      setIsSubmitting(false)
      return
    }

    try {
      // Call API to change password
      const response = await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })

      console.log('✅ Password changed successfully:', response)

      // Reset form on success
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setShowPassword({ current: false, new: false, confirm: false })
      setSuccess('✓ Mật khẩu đã được cập nhật thành công!')

      // Optional: Auto hide success message after 5 seconds
      setTimeout(() => {
        setSuccess('')
      }, 5000)
    } catch (err) {
      console.error('❌ Change password error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <PageBreadcrumb title="Trang cá nhân" subName="Cài đặt" />
      <PageMetaData title="Trang cá nhân" />

      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Main Content */}
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fafafa' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              sx={{
                px: 3,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  minHeight: 64,
                  color: 'text.secondary',
                  transition: 'all 0.2s',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: alpha('#1976d2', 0.04),
                  },
                  '&.Mui-selected': {
                    color: 'primary.main',
                  },
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
              }}
            >
              <Tab
                icon={<IconifyIcon icon="iconamoon:profile-duotone" style={{ fontSize: '1.25rem' }} />}
                iconPosition="start"
                label="Thông tin cá nhân"
                value="details"
              />
              <Tab
                icon={<IconifyIcon icon="iconamoon:lock-duotone" style={{ fontSize: '1.25rem' }} />}
                iconPosition="start"
                label="Đổi mật khẩu"
                value="password"
              />
            </Tabs>
          </Box>

          {/* Tab Panel 1: Personal Information */}
          {currentTab === 'details' && (
            <Box sx={{ p: 3 }}>
              {/* Loading State */}
              {isLoadingProfile ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : !profile ? (
                <Alert severity="error">Không thể tải thông tin cá nhân. Vui lòng thử lại.</Alert>
              ) : (
                <>
                  {/* Header with Edit Button */}
                  <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                        Thông tin cá nhân
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {isEditMode ? 'Chỉnh sửa thông tin tài khoản của bạn' : 'Xem và quản lý thông tin tài khoản của bạn'}
                      </Typography>
                    </Box>
                    
                    {!isEditMode && (
                      <Button
                        variant="outlined"
                        startIcon={<IconifyIcon icon="iconamoon:edit-duotone" />}
                        onClick={handleEditClick}
                        sx={{
                          textTransform: 'none',
                          borderRadius: 2,
                          fontWeight: 600,
                        }}
                      >
                        Chỉnh sửa
                      </Button>
                    )}
                  </Box>

                  {/* Success/Error Messages */}
                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                      {error}
                    </Alert>
                  )}
                  {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                      {success}
                    </Alert>
                  )}

                  <Grid container spacing={2}>
                    {/* Full Name - EDITABLE */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      {isEditMode ? (
                        <TextField
                          fullWidth
                          label="Họ và Tên"
                          name="fullName"
                          value={profileForm.fullName}
                          onChange={handleProfileChange}
                          required
                          InputProps={{
                            startAdornment: (
                              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                <IconifyIcon icon="iconamoon:profile-circle-duotone" style={{ fontSize: '1.3rem', color: '#1976d2' }} />
                              </Box>
                            ),
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: '#fafafa',
                            border: '1px solid #e0e0e0',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: '#f5f5f5',
                              borderColor: '#1976d2',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                bgcolor: alpha('#1976d2', 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 1.5,
                                flexShrink: 0,
                              }}
                            >
                              <IconifyIcon icon="iconamoon:profile-circle-duotone" style={{ fontSize: '1.3rem', color: '#1976d2' }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.7rem' }}>
                                Họ và Tên
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {profile?.fullName || 'Đang tải...'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </Grid>

                    {/* Email - READ ONLY */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: '#fafafa',
                          border: '1px solid #e0e0e0',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                            borderColor: isEditMode ? '#9e9e9e' : '#1976d2',
                          },
                          opacity: isEditMode ? 0.6 : 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 2,
                              bgcolor: alpha('#2e7d32', 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 1.5,
                              flexShrink: 0,
                            }}
                          >
                            <IconifyIcon icon="iconamoon:email-duotone" style={{ fontSize: '1.3rem', color: '#2e7d32' }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.7rem' }}>
                                Email
                              </Typography>
                              {isEditMode && (
                                <Tooltip title="Email không thể thay đổi">
                                  <IconifyIcon icon="iconamoon:lock-duotone" style={{ fontSize: '0.8rem', color: '#9e9e9e' }} />
                                </Tooltip>
                              )}
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {profile?.email || 'Đang tải...'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Role - READ ONLY */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: '#fafafa',
                          border: '1px solid #e0e0e0',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                            borderColor: isEditMode ? '#9e9e9e' : '#1976d2',
                          },
                          opacity: isEditMode ? 0.6 : 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 2,
                              bgcolor: alpha('#ff9800', 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 1.5,
                              flexShrink: 0,
                            }}
                          >
                            <IconifyIcon icon="iconamoon:shield-yes-duotone" style={{ fontSize: '1.3rem', color: '#ff9800' }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.7rem' }}>
                                Vai trò
                              </Typography>
                              {isEditMode && (
                                <Tooltip title="Vai trò chỉ được thay đổi bởi Admin">
                                  <IconifyIcon icon="iconamoon:lock-duotone" style={{ fontSize: '0.8rem', color: '#9e9e9e' }} />
                                </Tooltip>
                              )}
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {profile?.roleName || 'Đang tải...'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Phone - EDITABLE */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      {isEditMode ? (
                        <TextField
                          fullWidth
                          label="Số điện thoại"
                          name="phoneNumber"
                          value={profileForm.phoneNumber}
                          onChange={handleProfileChange}
                          required
                          placeholder="0123456789"
                          InputProps={{
                            startAdornment: (
                              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                                <IconifyIcon icon="iconamoon:phone-duotone" style={{ fontSize: '1.3rem', color: '#9c27b0' }} />
                              </Box>
                            ),
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: '#fafafa',
                            border: '1px solid #e0e0e0',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: '#f5f5f5',
                              borderColor: '#1976d2',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                bgcolor: alpha('#9c27b0', 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 1.5,
                                flexShrink: 0,
                              }}
                            >
                              <IconifyIcon icon="iconamoon:phone-duotone" style={{ fontSize: '1.3rem', color: '#9c27b0' }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.7rem' }}>
                                Số điện thoại
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {profile?.phoneNumber || 'Đang tải...'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </Grid>

                    {/* Status - READ ONLY */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: '#fafafa',
                          border: '1px solid #e0e0e0',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                            borderColor: isEditMode ? '#9e9e9e' : '#1976d2',
                          },
                          opacity: isEditMode ? 0.6 : 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 2,
                              bgcolor: alpha(profile?.isActive ? '#2e7d32' : '#ef5f5f', 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 1.5,
                              flexShrink: 0,
                            }}
                          >
                            <IconifyIcon 
                              icon={profile?.isActive ? "iconamoon:check-circle-duotone" : "iconamoon:close-circle-duotone"} 
                              style={{ fontSize: '1.3rem', color: profile?.isActive ? '#2e7d32' : '#ef5f5f' }} 
                            />
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.7rem' }}>
                              Trạng thái
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: profile?.isActive ? '#2e7d32' : '#ef5f5f' }}>
                              {profile?.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Join Date - READ ONLY */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: '#fafafa',
                          border: '1px solid #e0e0e0',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                            borderColor: isEditMode ? '#9e9e9e' : '#1976d2',
                          },
                          opacity: isEditMode ? 0.6 : 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 2,
                              bgcolor: alpha('#f59e0b', 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 1.5,
                              flexShrink: 0,
                            }}
                          >
                            <IconifyIcon icon="iconamoon:calendar-duotone" style={{ fontSize: '1.3rem', color: '#f59e0b' }} />
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.7rem' }}>
                              Ngày tham gia
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : 'Đang tải...'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Edit Mode Action Buttons */}
                  {isEditMode && (
                    <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        onClick={handleCancelEdit}
                        disabled={isSavingProfile}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: 2,
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        startIcon={isSavingProfile ? <CircularProgress size={16} /> : <IconifyIcon icon="iconamoon:check-duotone" />}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: 2,
                          bgcolor: '#1976d2',
                          '&:hover': {
                            bgcolor: '#1565c0',
                          },
                        }}
                      >
                        {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </Box>
                  )}

                  {/* Info Notice */}
                  {!isEditMode && (
                    <Box
                      sx={{
                        mt: 2.5,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha('#2196f3', 0.08),
                        border: `1px solid ${alpha('#2196f3', 0.2)}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <IconifyIcon icon="iconamoon:information-circle-duotone" style={{ fontSize: '1.5rem', color: '#2196f3', flexShrink: 0 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1565c0', mb: 0.5 }}>
                            Lưu ý
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                            Để thay đổi email, vai trò hoặc trạng thái tài khoản, vui lòng liên hệ với Admin.
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}

          {/* Tab Panel 2: Change Password */}
          {currentTab === 'password' && (
            <Box sx={{ p: 4 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                  Đổi mật khẩu
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Cập nhật mật khẩu của bạn để bảo mật tài khoản tốt hơn
                </Typography>
              </Box>

              <Divider sx={{ mb: 4 }} />

              <Stack spacing={3} sx={{ maxWidth: 650 }}>
                {error && (
                  <Alert
                    severity="error"
                    icon={<IconifyIcon icon="iconamoon:close-circle-1-duotone" style={{ fontSize: '1.5rem' }} />}
                    sx={{
                      borderRadius: 2,
                      '& .MuiAlert-message': { width: '100%' },
                    }}
                  >
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert
                    severity="success"
                    icon={<IconifyIcon icon="iconamoon:check-circle-1-duotone" style={{ fontSize: '1.5rem' }} />}
                    sx={{
                      borderRadius: 2,
                      '& .MuiAlert-message': { width: '100%' },
                    }}
                  >
                    {success}
                  </Alert>
                )}

                {/* Current Password */}
                <Box>
                  <TextField
                    fullWidth
                    required
                    type={showPassword.current ? 'text' : 'password'}
                    name="currentPassword"
                    label="Mật khẩu hiện tại"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1.5, display: 'flex', color: 'text.secondary' }}>
                          <IconifyIcon icon="iconamoon:lock-duotone" style={{ fontSize: '1.25rem' }} />
                        </Box>
                      ),
                      endAdornment: (
                        <Tooltip title={showPassword.current ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                          <Box
                            onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}
                            sx={{
                              cursor: 'pointer',
                              display: 'flex',
                              color: 'text.secondary',
                              '&:hover': { color: 'primary.main' },
                            }}
                          >
                            <IconifyIcon
                              icon={showPassword.current ? 'iconamoon:eye-off-duotone' : 'iconamoon:eye-duotone'}
                              style={{ fontSize: '1.25rem' }}
                            />
                          </Box>
                        </Tooltip>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: alpha('#1976d2', 0.02),
                        },
                        '&.Mui-focused': {
                          bgcolor: 'background.paper',
                        },
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                    Nhập mật khẩu hiện tại của bạn để xác thực
                  </Typography>
                </Box>

                {/* New Password */}
                <Box>
                  <TextField
                    fullWidth
                    required
                    type={showPassword.new ? 'text' : 'password'}
                    name="newPassword"
                    label="Mật khẩu mới"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    disabled={isSubmitting}
                    error={!!passwordForm.newPassword && passwordStrength.strength < 40}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1.5, display: 'flex', color: 'text.secondary' }}>
                          <IconifyIcon icon="iconamoon:lock-duotone" style={{ fontSize: '1.25rem' }} />
                        </Box>
                      ),
                      endAdornment: (
                        <Tooltip title={showPassword.new ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                          <Box
                            onClick={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}
                            sx={{
                              cursor: 'pointer',
                              display: 'flex',
                              color: 'text.secondary',
                              '&:hover': { color: 'primary.main' },
                            }}
                          >
                            <IconifyIcon
                              icon={showPassword.new ? 'iconamoon:eye-off-duotone' : 'iconamoon:eye-duotone'}
                              style={{ fontSize: '1.25rem' }}
                            />
                          </Box>
                        </Tooltip>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: alpha('#1976d2', 0.02),
                        },
                        '&.Mui-focused': {
                          bgcolor: 'background.paper',
                        },
                      },
                    }}
                  />

                  {/* Password Strength Indicator */}
                  {passwordForm.newPassword && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Độ mạnh mật khẩu
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: passwordStrength.color,
                          }}
                        >
                          {passwordStrength.label}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={passwordStrength.strength}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(passwordStrength.color, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: passwordStrength.color,
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                  )}

                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                    Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
                  </Typography>
                </Box>

                {/* Confirm Password */}
                <Box>
                  <TextField
                    fullWidth
                    required
                    type={showPassword.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    label="Xác nhận mật khẩu mới"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    disabled={isSubmitting}
                    error={
                      !!passwordForm.confirmPassword &&
                      !!passwordForm.newPassword &&
                      passwordForm.confirmPassword !== passwordForm.newPassword
                    }
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1.5, display: 'flex', color: 'text.secondary' }}>
                          <IconifyIcon icon="iconamoon:lock-duotone" style={{ fontSize: '1.25rem' }} />
                        </Box>
                      ),
                      endAdornment: (
                        <Tooltip title={showPassword.confirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                          <Box
                            onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                            sx={{
                              cursor: 'pointer',
                              display: 'flex',
                              color: 'text.secondary',
                              '&:hover': { color: 'primary.main' },
                            }}
                          >
                            <IconifyIcon
                              icon={showPassword.confirm ? 'iconamoon:eye-off-duotone' : 'iconamoon:eye-duotone'}
                              style={{ fontSize: '1.25rem' }}
                            />
                          </Box>
                        </Tooltip>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: alpha('#1976d2', 0.02),
                        },
                        '&.Mui-focused': {
                          bgcolor: 'background.paper',
                        },
                      },
                    }}
                  />
                  {passwordForm.confirmPassword && passwordForm.newPassword && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: passwordForm.confirmPassword === passwordForm.newPassword ? '#2e7d32' : '#ef5f5f',
                        mt: 1,
                        display: 'flex',
                        alignItems: 'center',
                        fontWeight: 500,
                      }}
                    >
                      <IconifyIcon
                        icon={
                          passwordForm.confirmPassword === passwordForm.newPassword
                            ? 'iconamoon:check-circle-1-duotone'
                            : 'iconamoon:close-circle-1-duotone'
                        }
                        style={{ fontSize: '1rem', marginRight: 4 }}
                      />
                      {passwordForm.confirmPassword === passwordForm.newPassword
                        ? 'Mật khẩu khớp'
                        : 'Mật khẩu không khớp'}
                    </Typography>
                  )}
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmitPassword}
                    disabled={isSubmitting}
                    startIcon={
                      isSubmitting ? null : <IconifyIcon icon="iconamoon:check-circle-1-duotone" style={{ fontSize: '1.25rem' }} />
                    }
                    sx={{
                      minWidth: 180,
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(25, 118, 210, 0.35)',
                      },
                    }}
                  >
                    {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật Mật khẩu'}
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
                      setShowPassword({ current: false, new: false, confirm: false })
                    }}
                    disabled={isSubmitting}
                    sx={{ fontWeight: 600 }}
                  >
                    Hủy bỏ
                  </Button>
                </Box>

                {/* Security Tips */}
                <Box
                  sx={{
                    mt: 3,
                    p: 3,
                    bgcolor: alpha('#ff9800', 0.08),
                    borderRadius: 2,
                    border: `1px solid ${alpha('#ff9800', 0.2)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'start' }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: alpha('#ff9800', 0.15),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        flexShrink: 0,
                      }}
                    >
                      <IconifyIcon icon="iconamoon:shield-yes-duotone" style={{ fontSize: '1.5rem', color: '#ff9800' }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#f57c00' }}>
                        💡 Hướng dẫn tạo mật khẩu mạnh
                      </Typography>
                      <Stack spacing={0.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconifyIcon
                            icon="iconamoon:check-duotone"
                            style={{ fontSize: '1rem', color: '#2e7d32', marginRight: 8 }}
                          />
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Sử dụng <strong>ít nhất 8-12 ký tự</strong>
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconifyIcon
                            icon="iconamoon:check-duotone"
                            style={{ fontSize: '1rem', color: '#2e7d32', marginRight: 8 }}
                          />
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Kết hợp <strong>chữ hoa, chữ thường, số</strong> và <strong>ký tự đặc biệt</strong>
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconifyIcon
                            icon="iconamoon:check-duotone"
                            style={{ fontSize: '1rem', color: '#2e7d32', marginRight: 8 }}
                          />
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Tránh sử dụng <strong>thông tin cá nhân</strong> dễ đoán (tên, ngày sinh, số điện thoại)
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconifyIcon
                            icon="iconamoon:check-duotone"
                            style={{ fontSize: '1rem', color: '#2e7d32', marginRight: 8 }}
                          />
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Không sử dụng lại <strong>mật khẩu đã dùng ở hệ thống khác</strong>
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Box>
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
