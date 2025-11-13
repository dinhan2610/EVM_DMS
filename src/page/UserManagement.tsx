import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
  Switch,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import SearchIcon from '@mui/icons-material/Search'
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined'
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'

// Interface: User
export interface User {
  id: string
  fullName: string
  email: string
  role: 'Admin' | 'Accountant' | 'PM'
  status: 'Active' | 'Inactive'
  joinDate: string
}

// Mock Data
const mockUsers: User[] = [
  {
    id: '1',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@company.com',
    role: 'Admin',
    status: 'Active',
    joinDate: '2023-01-15',
  },
  {
    id: '2',
    fullName: 'Trần Thị Bình',
    email: 'binh.tran@company.com',
    role: 'Accountant',
    status: 'Active',
    joinDate: '2023-03-20',
  },
  {
    id: '3',
    fullName: 'Lê Hoàng Cường',
    email: 'cuong.le@company.com',
    role: 'PM',
    status: 'Active',
    joinDate: '2023-05-10',
  },
  {
    id: '4',
    fullName: 'Phạm Mai Dung',
    email: 'dung.pham@company.com',
    role: 'Accountant',
    status: 'Inactive',
    joinDate: '2023-07-05',
  },
  {
    id: '5',
    fullName: 'Vũ Quang Hải',
    email: 'hai.vu@company.com',
    role: 'PM',
    status: 'Active',
    joinDate: '2023-09-12',
  },
  {
    id: '6',
    fullName: 'Đỗ Thị Lan',
    email: 'lan.do@company.com',
    role: 'Accountant',
    status: 'Active',
    joinDate: '2023-11-01',
  },
  {
    id: '7',
    fullName: 'Bùi Minh Tuấn',
    email: 'tuan.bui@company.com',
    role: 'Admin',
    status: 'Active',
    joinDate: '2024-01-18',
  },
  {
    id: '8',
    fullName: 'Hoàng Thu Hà',
    email: 'ha.hoang@company.com',
    role: 'PM',
    status: 'Inactive',
    joinDate: '2024-03-25',
  },
]

// Initial Form State
const initialFormState: Omit<User, 'id' | 'joinDate'> = {
  fullName: '',
  email: '',
  role: 'Accountant',
  status: 'Active',
}

const UserManagement = () => {
  // Theme & Responsive
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // State
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<Omit<User, 'id' | 'joinDate'>>(initialFormState)
  const [sendInviteEmail, setSendInviteEmail] = useState(true)

  // Reset Password States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null)

  // Toggle Status Modal States
  const [confirmToggleModalOpen, setConfirmToggleModalOpen] = useState(false)
  const [selectedUserForToggle, setSelectedUserForToggle] = useState<User | null>(null)

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Filtered Data
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  // Handlers
  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
      })
    } else {
      setEditingUser(null)
      setFormData(initialFormState)
      setSendInviteEmail(true)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
    setFormData(initialFormState)
    setSendInviteEmail(true)
  }

  const handleSaveUser = () => {
    // Validation
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc!',
        severity: 'error',
      })
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setSnackbar({
        open: true,
        message: 'Email không hợp lệ!',
        severity: 'error',
      })
      return
    }

    if (editingUser) {
      // Update existing user
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUser.id
            ? { ...user, ...formData }
            : user
        )
      )
      setSnackbar({
        open: true,
        message: `Cập nhật người dùng "${formData.fullName}" thành công!`,
        severity: 'success',
      })
    } else {
      // Add new user
      const newUser: User = {
        id: (users.length + 1).toString(),
        ...formData,
        joinDate: new Date().toISOString().split('T')[0],
      }
      setUsers((prev) => [...prev, newUser])
      setSnackbar({
        open: true,
        message: sendInviteEmail
          ? `Thêm người dùng "${formData.fullName}" thành công! Email mời đã được gửi.`
          : `Thêm người dùng "${formData.fullName}" thành công!`,
        severity: 'success',
      })
    }

    handleCloseModal()
  }

  const handleToggleStatus = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (user) {
      setSelectedUserForToggle(user)
      setConfirmToggleModalOpen(true)
    }
  }

  const handleCloseToggleModal = () => {
    setConfirmToggleModalOpen(false)
    setSelectedUserForToggle(null)
  }

  const handleConfirmToggleStatus = () => {
    if (!selectedUserForToggle) return

    setUsers((prev) =>
      prev.map((user) =>
        user.id === selectedUserForToggle.id
          ? {
              ...user,
              status: user.status === 'Active' ? 'Inactive' : 'Active',
            }
          : user
      )
    )

    const newStatus = selectedUserForToggle.status === 'Active' ? 'Inactive' : 'Active'
    setSnackbar({
      open: true,
      message: `Đã ${newStatus === 'Active' ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản "${selectedUserForToggle.fullName}"`,
      severity: 'info',
    })

    handleCloseToggleModal()
  }

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Reset Password Handlers
  const handleOpenResetModal = (user: User) => {
    setSelectedUserForReset(user)
    setIsResetModalOpen(true)
  }

  const handleCloseResetModal = () => {
    setSelectedUserForReset(null)
    setIsResetModalOpen(false)
  }

  const handleConfirmResetPassword = () => {
    if (!selectedUserForReset) return

    // Simulate API call
    console.log('Sending reset password email to:', selectedUserForReset.email)
    
    setSnackbar({
      open: true,
      message: `Đã gửi email đặt lại mật khẩu cho ${selectedUserForReset.fullName}`,
      severity: 'success',
    })
    
    handleCloseResetModal()
  }

  // DataGrid Columns
  const columns: GridColDef[] = [
    {
      field: 'fullName',
      headerName: 'Họ và Tên',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.2,
      minWidth: 220,
    },
    {
      field: 'role',
      headerName: 'Vai trò',
      width: 140,
      renderCell: (params: GridRenderCellParams<User>) => {
        const roleColors: Record<User['role'], 'error' | 'success' | 'info'> = {
          Admin: 'error',
          Accountant: 'success',
          PM: 'info',
        }
        const roleLabels: Record<User['role'], string> = {
          Admin: 'Quản trị viên',
          Accountant: 'Kế toán',
          PM: 'PM/Sales',
        }
        return (
          <Chip
            label={roleLabels[params.row.role]}
            color={roleColors[params.row.role]}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        )
      },
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 130,
      renderCell: (params: GridRenderCellParams<User>) => {
        return (
          <Chip
            label={params.row.status === 'Active' ? 'Hoạt động' : 'Vô hiệu'}
            color={params.row.status === 'Active' ? 'success' : 'default'}
            size="small"
            variant={params.row.status === 'Active' ? 'filled' : 'outlined'}
          />
        )
      },
    },
    {
      field: 'joinDate',
      headerName: 'Ngày tham gia',
      type: 'date',
      width: 140,
      valueGetter: (value) => {
        return value ? new Date(value) : null
      },
      renderCell: (params: GridRenderCellParams<User>) => {
        return new Date(params.row.joinDate).toLocaleDateString('vi-VN')
      },
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      type: 'actions',
      width: 150,
      getActions: (params) => [
        <Tooltip title="Chỉnh sửa" key="edit">
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenModal(params.row)}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>,
        <Tooltip title="Đặt lại mật khẩu" key="reset">
          <IconButton
            size="small"
            color="warning"
            onClick={() => handleOpenResetModal(params.row)}
          >
            <VpnKeyOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>,
        <Tooltip
          title={params.row.status === 'Active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
          key="toggle"
        >
          <IconButton
            size="small"
            color={params.row.status === 'Active' ? 'error' : 'success'}
            onClick={() => handleToggleStatus(params.row.id)}
          >
            {params.row.status === 'Active' ? (
              <LockOutlinedIcon fontSize="small" />
            ) : (
              <LockOpenOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>,
      ],
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
            Quản lý Người dùng
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý tài khoản và phân quyền người dùng trong hệ thống
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 3,
            py: 1,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
            },
          }}
        >
          Thêm Người dùng
        </Button>
      </Box>

      {/* Toolbar - Filters */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm kiếm theo Tên hoặc Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
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
          <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Lọc theo Vai trò</InputLabel>
              <Select
                value={roleFilter}
                label="Lọc theo Vai trò"
                onChange={(e) => setRoleFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">Tất cả vai trò</MenuItem>
                <MenuItem value="Admin">Quản trị viên</MenuItem>
                <MenuItem value="Accountant">Kế toán</MenuItem>
                <MenuItem value="PM">PM/Sales</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Lọc theo Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                label="Lọc theo Trạng thái"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">Tất cả trạng thái</MenuItem>
                <MenuItem value="Active">Hoạt động</MenuItem>
                <MenuItem value="Inactive">Vô hiệu</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

        {/* DataGrid */}
        <Paper
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'action.hover',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'grey.50',
                borderBottom: 2,
                borderColor: 'divider',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: 2,
                borderColor: 'divider',
              },
            }}
          />
        </Paper>

        {/* Modal - Add/Edit User */}
        <Dialog
          open={isModalOpen}
          onClose={handleCloseModal}
          fullScreen={isMobile}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 3 },
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontWeight: 600,
              p: { xs: 2, sm: 3 },
            }}
          >
            <PersonAddOutlinedIcon color="primary" />
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              {editingUser ? 'Chỉnh sửa Người dùng' : 'Thêm Người dùng mới'}
            </Typography>
          </DialogTitle>

          <Divider />

          <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2.5}>
              {/* Alert hiển thị đầu tiên khi Thêm mới */}
              {!editingUser && (
                <Grid size={{ xs: 12 }}>
                  <Alert severity="info" sx={{ borderRadius: 2, mb: 1 }}>
                    <Typography variant="body2">
                      Mật khẩu mặc định sẽ được tạo tự động và gửi qua email cho người dùng.
                    </Typography>
                  </Alert>
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <TextField
                  autoFocus
                  fullWidth
                  label="Họ và Tên"
                  type="text"
                  size="small"
                  margin="dense"
                  required
                  value={formData.fullName}
                  onChange={(e) => handleFormChange('fullName', e.target.value)}
                  placeholder="Nhập họ và tên đầy đủ"
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
                  label="Email"
                  type="email"
                  size="small"
                  margin="dense"
                  required
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  placeholder="example@company.com"
                  disabled={!!editingUser}
                  helperText={editingUser ? 'Email không thể thay đổi sau khi tạo' : ''}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth required size="small" margin="dense">
                  <InputLabel>Vai trò</InputLabel>
                  <Select
                    value={formData.role}
                    label="Vai trò"
                    onChange={(e) => handleFormChange('role', e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="Admin">
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Admin
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Quản trị viên - Toàn quyền hệ thống
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="Accountant">
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Accountant
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Kế toán - Quản lý hoá đơn
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="PM">
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          PM
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Project Manager/Sales - Quản lý dự án
                        </Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Switch: Chỉ hiện khi Sửa */}
              {editingUser && (
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
                        <Switch
                          checked={formData.status === 'Active'}
                          onChange={(e) =>
                            handleFormChange('status', e.target.checked ? 'Active' : 'Inactive')
                          }
                          color="success"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Trạng thái: {formData.status === 'Active' ? 'Hoạt động' : 'Vô hiệu'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formData.status === 'Active'
                              ? 'Người dùng có thể đăng nhập và sử dụng hệ thống'
                              : 'Người dùng không thể đăng nhập vào hệ thống'}
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Grid>
              )}

              {/* Checkbox: Chỉ hiện khi Thêm mới */}
              {!editingUser && (
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
                          checked={sendInviteEmail}
                          onChange={(e) => setSendInviteEmail(e.target.checked)}
                          color="primary"
                          defaultChecked
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Tự động gửi email mời và kích hoạt
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Hệ thống sẽ gửi email chứa thông tin đăng nhập và link kích hoạt tài khoản
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>

          <Divider />

          <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1 }}>
            <Button
              onClick={handleCloseModal}
              color="inherit"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveUser}
              variant="contained"
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
              {editingUser ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogActions>
        </Dialog>

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

        {/* Reset Password Confirmation Dialog */}
        <Dialog
          open={isResetModalOpen}
          onClose={handleCloseResetModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              fontWeight: 600,
              p: 3,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'warning.lighter',
              }}
            >
              <WarningAmberOutlinedIcon sx={{ fontSize: 28, color: 'warning.main' }} />
            </Box>
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              Xác nhận Đặt lại Mật khẩu
            </Typography>
          </DialogTitle>

          <Divider />

          <DialogContent sx={{ p: 3 }}>
            <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
              <Typography variant="body2">
                Email chứa liên kết đặt lại mật khẩu sẽ được gửi đến địa chỉ email của người dùng.
              </Typography>
            </Alert>

            <Box
              sx={{
                bgcolor: 'grey.50',
                p: 2.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Người dùng
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedUserForReset?.fullName}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailOutlinedIcon sx={{ fontSize: 16, color: 'action.active' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Email nhận liên kết
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                    {selectedUserForReset?.email}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <VpnKeyOutlinedIcon sx={{ fontSize: 16, color: 'action.active' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Vai trò
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedUserForReset?.role === 'Admin' ? 'Quản trị viên' : selectedUserForReset?.role === 'Accountant' ? 'Kế toán' : 'Quản lý Dự án'}
                    size="small"
                    color={selectedUserForReset?.role === 'Admin' ? 'error' : selectedUserForReset?.role === 'Accountant' ? 'success' : 'info'}
                    sx={{ fontWeight: 500 }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
              * Liên kết đặt lại mật khẩu có hiệu lực trong 24 giờ.
            </Typography>
          </DialogContent>

          <Divider />

          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button
              onClick={handleCloseResetModal}
              color="inherit"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmResetPassword}
              variant="contained"
              color="warning"
              startIcon={<EmailOutlinedIcon />}
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
              Gửi Email Đặt lại
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toggle Status Confirmation Dialog */}
        <Dialog
          open={confirmToggleModalOpen}
          onClose={handleCloseToggleModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              fontWeight: 600,
              p: 3,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: selectedUserForToggle?.status === 'Active' ? 'error.lighter' : 'success.lighter',
              }}
            >
              <WarningAmberOutlinedIcon 
                sx={{ 
                  fontSize: 28, 
                  color: selectedUserForToggle?.status === 'Active' ? 'error.main' : 'success.main' 
                }} 
              />
            </Box>
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              Xác nhận thay đổi trạng thái
            </Typography>
          </DialogTitle>

          <Divider />

          <DialogContent sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ mb: 2.5 }}>
              Bạn có chắc chắn muốn{' '}
              <strong>
                {selectedUserForToggle?.status === 'Active' ? 'vô hiệu hóa' : 'kích hoạt'}
              </strong>{' '}
              tài khoản người dùng sau?
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                mb: 2.5,
              }}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Tên người dùng
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {selectedUserForToggle?.fullName}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Email
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontFamily: 'monospace', color: 'primary.main' }}>
                    {selectedUserForToggle?.email}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Vai trò
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={
                        selectedUserForToggle?.role === 'Admin' 
                          ? 'Quản trị viên' 
                          : selectedUserForToggle?.role === 'Accountant' 
                          ? 'Kế toán' 
                          : 'Quản lý Dự án'
                      }
                      size="small"
                      color={
                        selectedUserForToggle?.role === 'Admin' 
                          ? 'error' 
                          : selectedUserForToggle?.role === 'Accountant' 
                          ? 'success' 
                          : 'info'
                      }
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Alert 
              severity={selectedUserForToggle?.status === 'Active' ? 'warning' : 'info'}
              sx={{ borderRadius: 2 }}
            >
              <Typography variant="body2">
                {selectedUserForToggle?.status === 'Active' ? (
                  <>
                    Người dùng sẽ <strong>không thể đăng nhập</strong> và truy cập hệ thống sau khi bị vô hiệu hóa.
                  </>
                ) : (
                  <>
                    Người dùng sẽ có thể <strong>đăng nhập trở lại</strong> và truy cập hệ thống sau khi được kích hoạt.
                  </>
                )}
              </Typography>
            </Alert>
          </DialogContent>

          <Divider />

          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button
              onClick={handleCloseToggleModal}
              color="inherit"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmToggleStatus}
              variant="contained"
              color={selectedUserForToggle?.status === 'Active' ? 'error' : 'success'}
              startIcon={
                selectedUserForToggle?.status === 'Active' ? 
                <LockOutlinedIcon /> : 
                <LockOpenOutlinedIcon />
              }
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
              {selectedUserForToggle?.status === 'Active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
}

export default UserManagement

