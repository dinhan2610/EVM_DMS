import React, { useState, useMemo, useEffect } from 'react'
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
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material'
import { usePageTitle } from '@/hooks/usePageTitle'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined'
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import userService, { UserApiResponse } from '@/services/userService'
import UserFilter, { UserFilterState } from '@/components/UserFilter'

// Interface: User (mapped from API)
export interface User {
  id: number
  fullName: string
  email: string
  phoneNumber: string
  role: string
  status: 'Active' | 'Inactive'
  joinDate: string
}

// Helper function to map API response to User interface
const mapApiResponseToUser = (apiUser: UserApiResponse): User => {
  // Generate a temporary ID if userID is missing (for newly created users)
  const id = apiUser.userID || Date.now()
  
  return {
    id,
    fullName: apiUser.fullName || '',
    email: apiUser.email || '',
    phoneNumber: apiUser.phoneNumber || '',
    role: apiUser.roleName || '',
    status: apiUser.isActive ? 'Active' : 'Inactive',
    joinDate: apiUser.createdAt ? new Date(apiUser.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  }
}

// Initial Form State
interface UserFormData {
  fullName: string
  email: string
  phoneNumber: string
  role: string
  status: 'Active' | 'Inactive'
}

const initialFormState: UserFormData = {
  fullName: '',
  email: '',
  phoneNumber: '',
  role: 'Admin', // Mặc định: Admin
  status: 'Active',
}

const UserManagement = () => {
  usePageTitle('Quản lý người dùng')
  
  // Theme & Responsive
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // State
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false) // ✅ Loading riêng cho actions
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>(initialFormState)
  const [sendInviteEmail, setSendInviteEmail] = useState(true)

  // Reset Password States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null)

  // Toggle Status Modal States
  const [confirmToggleModalOpen, setConfirmToggleModalOpen] = useState(false)
  const [selectedUserForToggle, setSelectedUserForToggle] = useState<User | null>(null)
  const [deactivationReason, setDeactivationReason] = useState('')

  // User Detail Modal States
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserApiResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // ✅ NEW: UserFilter state (professional filter component)
  const [filters, setFilters] = useState<UserFilterState>({
    searchText: '',
    roles: [],
    status: 'all',
    dateFrom: null,
    dateTo: null,
  })

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

  // ✅ Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('eims_access_token')
    if (!token) {
      setSnackbar({
        open: true,
        message: 'Vui lòng đăng nhập để tiếp tục',
        severity: 'error',
      })
      setTimeout(() => {
        window.location.href = '/auth/sign-in'
      }, 1500)
    }
  }, [])

  // Fetch users from API - Smart filtering based on status
  const fetchUsers = React.useCallback(async () => {
    setLoading(true)
    try {
      let response
      
      // ✅ Smart API call based on filter
      switch (filters.status) {
        case 'active':
          response = await userService.getActiveUsers(1, 100)
          break
        case 'inactive':
          response = await userService.getInactiveUsers(1, 100)
          break
        default:
          response = await userService.getUsers(1, 100)
      }
      
      const mappedUsers = response.items.map(mapApiResponseToUser)
      setUsers(mappedUsers)
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Không thể tải danh sách người dùng',
        severity: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [filters.status])

  // ✅ Re-fetch when status filter changes
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Filtered Data - Filter based on UserFilter criteria
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 1. Search text (name, email, phone) - Optimized with trim & normalize
      const matchesSearch = !filters.searchText || (() => {
        const searchLower = filters.searchText.toLowerCase().trim()
        if (!searchLower) return true
        
        const fullNameMatch = (user.fullName?.toLowerCase() || '').includes(searchLower)
        const emailMatch = (user.email?.toLowerCase() || '').includes(searchLower)
        // Phone search: remove spaces/dashes for flexible matching
        const userPhone = (user.phoneNumber || '').replace(/[\s-]/g, '')
        const searchPhone = searchLower.replace(/[\s-]/g, '')
        const phoneMatch = userPhone.includes(searchPhone)
        
        return fullNameMatch || emailMatch || phoneMatch
      })()
      
      // 2. Filter by role
      let matchesRole = filters.roles.length === 0 // If no roles selected, show all
      if (!matchesRole) {
        const userRoleLower = (user.role || '').toLowerCase()
        matchesRole = filters.roles.some(role => userRoleLower === role.toLowerCase())
      }
      
      // 3. Filter by status (Active/Inactive)
      let matchesStatus = true
      if (filters.status !== 'all') {
        if (filters.status === 'active') {
          matchesStatus = user.status === 'Active'
        } else if (filters.status === 'inactive') {
          matchesStatus = user.status === 'Inactive'
        }
      }
      
      // 4. Date range filter (join date)
      let matchesDateRange = true
      if (filters.dateFrom || filters.dateTo) {
        const userDate = new Date(user.joinDate)
        if (filters.dateFrom && userDate < filters.dateFrom.toDate()) {
          matchesDateRange = false
        }
        if (filters.dateTo && userDate > filters.dateTo.toDate()) {
          matchesDateRange = false
        }
      }
      
      return matchesSearch && matchesRole && matchesStatus && matchesDateRange
    })
  }, [users, filters])

  // Handlers
  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        status: user.status,
      })
    } else {
      setEditingUser(null)
      setFormData(initialFormState)
      setSendInviteEmail(true)
    }
    setActionLoading(false) // ✅ Reset loading state khi mở modal
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
    setFormData(initialFormState)
    setSendInviteEmail(true)
    setActionLoading(false) // ✅ Reset loading state khi đóng modal
  }

  const handleSaveUser = async () => {
    // Validation
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phoneNumber.trim()) {
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

    // Phone validation (basic)
    const phoneRegex = /^[0-9]{10,11}$/
    if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
      setSnackbar({
        open: true,
        message: 'Số điện thoại không hợp lệ! (10-11 số)',
        severity: 'error',
      })
      return
    }

    setActionLoading(true) // ✅ Chỉ loading action, không block UI
    try {
      if (editingUser) {
        // Note: API doesn't support update, so we handle status change separately
        setSnackbar({
          open: true,
          message: 'Chức năng cập nhật thông tin người dùng chưa được hỗ trợ',
          severity: 'info',
        })
      } else {
        // Create new user
        const createData = {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          roleName: formData.role,
        }
        
        // ✅ Call API to create user
        await userService.createUser(createData)
        
        // ✅ Reload fresh data from server
        await fetchUsers()
        
        setSnackbar({
          open: true,
          message: sendInviteEmail
            ? `Thêm người dùng "${formData.fullName}" thành công! Email mời đã được gửi.`
            : `Thêm người dùng "${formData.fullName}" thành công!`,
          severity: 'success',
        })
      }

      handleCloseModal()
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Không thể lưu người dùng',
        severity: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStatus = (userId: number) => {
    const user = users.find((u) => u.id === userId)
    if (user) {
      setSelectedUserForToggle(user)
      setDeactivationReason('')
      setActionLoading(false) // ✅ Reset loading state khi mở modal
      setConfirmToggleModalOpen(true)
    }
  }

  const handleCloseToggleModal = () => {
    setConfirmToggleModalOpen(false)
    setSelectedUserForToggle(null)
    setDeactivationReason('')
    setActionLoading(false) // ✅ Reset loading state khi đóng modal
  }

  // ✅ Handle View User Detail
  const handleViewDetail = async (userId: number) => {
    setIsDetailModalOpen(true)
    setDetailLoading(true)
    try {
      const userDetail = await userService.getUserDetail(userId)
      setSelectedUserDetail(userDetail)
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Không thể tải thông tin người dùng',
        severity: 'error',
      })
      setIsDetailModalOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedUserDetail(null)
  }

  const handleConfirmToggleStatus = async () => {
    if (!selectedUserForToggle) return

    // Validate deactivation reason if deactivating
    if (selectedUserForToggle.status === 'Active' && !deactivationReason.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng nhập lý do khóa tài khoản!',
        severity: 'error',
      })
      return
    }

    setActionLoading(true)
    
    // ✅ OPTIMISTIC UPDATE: Cập nhật UI ngay lập tức
    const newStatus: 'Active' | 'Inactive' = selectedUserForToggle.status === 'Active' ? 'Inactive' : 'Active'
    const previousUsers = [...users] // Backup để rollback nếu lỗi
    const userToToggle = selectedUserForToggle // Save reference
    const reasonToSave = deactivationReason // Save reason
    
    // Cập nhật UI ngay (optimistic)
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userToToggle.id
          ? { ...user, status: newStatus }
          : user
      )
    )
    
    try {
      if (userToToggle.status === 'Active') {
        // Deactivate user
        await userService.deactivateUser(userToToggle.id, reasonToSave)
        setSnackbar({
          open: true,
          message: `Đã vô hiệu hóa tài khoản "${userToToggle.fullName}"`,
          severity: 'info',
        })
      } else {
        // Activate user
        await userService.activateUser(userToToggle.id)
        setSnackbar({
          open: true,
          message: `Đã kích hoạt tài khoản "${userToToggle.fullName}"`,
          severity: 'success',
        })
      }
      
      // ✅ API thành công - Đóng modal với flushSync để force immediate update
      setActionLoading(false)
      
      // Use setTimeout to ensure state updates are flushed
      setTimeout(() => {
        setConfirmToggleModalOpen(false)
        setSelectedUserForToggle(null)
        setDeactivationReason('')
      }, 0)
      
    } catch (error) {
      // ❌ ROLLBACK: Khôi phục lại state cũ nếu API fail
      setUsers(previousUsers)
      setActionLoading(false)
      
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Không thể thay đổi trạng thái người dùng',
        severity: 'error',
      })
    }
  }

  const handleFormChange = (field: keyof UserFormData, value: string) => {
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

  const handleConfirmResetPassword = async () => {
    if (!selectedUserForReset) return

    setActionLoading(true)
    
    try {
      // Call API to reset password
      await userService.resetPassword(selectedUserForReset.email)
      
      setSnackbar({
        open: true,
        message: `✅ Đã gửi email đặt lại mật khẩu cho ${selectedUserForReset.fullName}`,
        severity: 'success',
      })
      
      handleCloseResetModal()
    } catch (error) {
      console.error('Reset password error:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Không thể đặt lại mật khẩu',
        severity: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Helper function to get role color (Tối ưu cho 3 vai trò - Backend roles)
  const getRoleColor = (role: string): 'error' | 'success' | 'info' => {
    const roleLower = role.toLowerCase()
    // HOD (Kế toán trưởng) - Màu đỏ (cao nhất)
    if (roleLower === 'hod' || roleLower.includes('trưởng')) return 'error'
    // Accountant (Kế toán) - Màu xanh lá
    if (roleLower === 'accountant' || roleLower === 'kế toán') return 'success'
    // Staff (Nhân viên bán hàng) - Màu xanh dương
    if (roleLower === 'staff' || roleLower.includes('bán hàng')) return 'info'
    // Default
    return 'success'
  }

  // Helper function to get role label (Tối ưu cho 3 vai trò - Backend roles)
  const getRoleLabel = (role: string): string => {
    const roleLower = role.toLowerCase()
    // Mapping các tên role từ API sang tiếng Việt
    if (roleLower === 'hod') return 'Kế toán trưởng'
    if (roleLower === 'accountant') return 'Kế toán'
    if (roleLower === 'staff') return 'Nhân viên bán hàng'
    // Trả về role gốc nếu không match
    return role
  }

  // DataGrid Columns
  const columns: GridColDef[] = [
    {
      field: 'fullName',
      headerName: 'Họ và Tên',
      flex: 1,
      minWidth: 180,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<User>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', pl: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: '#2c3e50',
              fontSize: '0.875rem',
            }}
          >
            {params.row.fullName}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.2,
      minWidth: 220,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<User>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', pl: 1 }}>
          <Tooltip title={params.row.email} arrow placement="top">
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                color: '#546e7a',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {params.row.email}
            </Typography>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'phoneNumber',
      headerName: 'Số điện thoại',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<User>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.875rem',
              color: '#2c3e50',
              fontWeight: 500,
            }}
          >
            {params.row.phoneNumber}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'role',
      headerName: 'Vai trò',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<User>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Chip
            label={getRoleLabel(params.row.role)}
            color={getRoleColor(params.row.role)}
            size="small"
            sx={{ 
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 28,
              borderRadius: '20px',
            }}
          />
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<User>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Chip
            label={params.row.status === 'Active' ? 'Hoạt động' : 'Vô hiệu'}
            color={params.row.status === 'Active' ? 'success' : 'default'}
            size="small"
            variant={params.row.status === 'Active' ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 28,
              borderRadius: '20px',
            }}
          />
        </Box>
      ),
    },
    {
      field: 'joinDate',
      headerName: 'Ngày tham gia',
      type: 'date',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (value) => {
        return value ? new Date(value) : null
      },
      renderCell: (params: GridRenderCellParams<User>) => {
        try {
          const date = new Date(params.row.joinDate)
          const formattedDate = isNaN(date.getTime()) ? '-' : date.toLocaleDateString('vi-VN')
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  color: '#546e7a',
                  fontWeight: 500,
                }}
              >
                {formattedDate}
              </Typography>
            </Box>
          )
        } catch {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>-</Typography>
            </Box>
          )
        }
      },
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      type: 'actions',
      width: 200,
      align: 'center',
      headerAlign: 'center',
      getActions: (params) => [
        <Tooltip title="Xem chi tiết" key="view">
          <IconButton
            size="small"
            color="info"
            onClick={() => handleViewDetail(params.row.id)}
          >
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>,
        <Tooltip title="Chỉnh sửa" key="edit">
          <span>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenModal(params.row)}
              disabled
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
          Quản lý Người dùng
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Quản lý tài khoản và phân quyền người dùng trong hệ thống
        </Typography>
      </Box>

      {/* ✅ NEW: Professional User Filter Component */}
      <UserFilter
        onFilterChange={(newFilters) => setFilters(newFilters)}
        onReset={() => {
          setFilters({
            searchText: '',
            roles: [],
            status: 'all',
            dateFrom: null,
            dateTo: null,
          })
        }}
        onAddUser={() => handleOpenModal()}
      />

        {/* DataGrid */}
        <Paper
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            position: 'relative',
          }}
        >
          {/* ✅ Chỉ hiển thị loading khi fetch initial data */}
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 1000,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            loading={loading} // ✅ Chỉ loading khi fetch
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
                minHeight: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              },
              '& .MuiTablePagination-root': {
                overflow: 'visible',
              },
              '& .MuiTablePagination-toolbar': {
                flexWrap: 'nowrap',
                minHeight: '52px',
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                margin: 0,
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
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      🔐 Cấp tài khoản cho nhân viên nội bộ
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Mật khẩu mặc định sẽ được tạo tự động và gửi qua email cho nhân viên.
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
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  type="tel"
                  size="small"
                  margin="dense"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                  placeholder="0123456789"
                  disabled={!!editingUser}
                  helperText={editingUser ? 'Số điện thoại không thể thay đổi sau khi tạo' : 'Nhập 10-11 số'}
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
                          Quản trị viên
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Full quyền quản trị hệ thống, quản lý người dùng
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="HOD">
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Kế toán trưởng
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Duyệt và ký số hóa đơn, quản lý hoạt động kế toán
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="Accountant">
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Kế toán
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Quản lý danh sách hóa đơn, tạo và xử lý chứng từ
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="Sale">
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Nhân viên bán hàng
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Quản lý khách hàng, tạo yêu cầu xuất hóa đơn
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
              disabled={actionLoading}
              startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : null}
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
              {actionLoading ? 'Đang xử lý...' : (editingUser ? 'Cập nhật' : 'Thêm mới')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* User Detail Modal */}
        <Dialog
          open={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          maxWidth="md"
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
              bgcolor: 'primary.lighter',
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
                bgcolor: 'primary.main',
                color: 'white',
              }}
            >
              <VisibilityOutlinedIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              Thông tin chi tiết người dùng
            </Typography>
          </DialogTitle>

          <Divider />

          <DialogContent sx={{ p: 3 }}>
            {detailLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            ) : selectedUserDetail ? (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: 'grey.50',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mb: 1, display: 'block' }}>
                      ID Người dùng
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'monospace', color: 'primary.main' }}>
                      #{selectedUserDetail.userID}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: 'grey.50',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mb: 1, display: 'block' }}>
                      Trạng thái
                    </Typography>
                    <Chip
                      label={selectedUserDetail.isActive ? 'Hoạt động' : 'Vô hiệu'}
                      color={selectedUserDetail.isActive ? 'success' : 'default'}
                      size="medium"
                      sx={{ fontWeight: 600 }}
                    />
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: 'grey.50',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mb: 1, display: 'block' }}>
                      Họ và Tên
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                      {selectedUserDetail.fullName}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: 'grey.50',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mb: 1, display: 'block' }}>
                      Email
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main', wordBreak: 'break-all' }}>
                      {selectedUserDetail.email}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: 'grey.50',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mb: 1, display: 'block' }}>
                      Số điện thoại
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                      {selectedUserDetail.phoneNumber}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: 'grey.50',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mb: 1, display: 'block' }}>
                      Vai trò
                    </Typography>
                    <Chip
                      label={
                        selectedUserDetail.roleName === 'HOD' 
                          ? 'Kế toán trưởng' 
                          : selectedUserDetail.roleName === 'Accountant' 
                          ? 'Kế toán' 
                          : 'Nhân viên bán hàng'
                      }
                      color={
                        selectedUserDetail.roleName === 'HOD' 
                          ? 'error' 
                          : selectedUserDetail.roleName === 'Accountant' 
                          ? 'success' 
                          : 'info'
                      }
                      size="medium"
                      sx={{ fontWeight: 600 }}
                    />
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: 'grey.50',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mb: 1, display: 'block' }}>
                      Ngày tham gia
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedUserDetail.createdAt ? new Date(selectedUserDetail.createdAt).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : '-'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            ) : null}
          </DialogContent>

          <Divider />

          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={handleCloseDetailModal}
              variant="contained"
              color="primary"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 4,
              }}
            >
              Đóng
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                      Người dùng
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                    {selectedUserForReset?.fullName}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <EmailOutlinedIcon sx={{ fontSize: 16, color: 'action.active' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                      Email nhận liên kết
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9375rem', color: 'primary.main' }}>
                    {selectedUserForReset?.email}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <VpnKeyOutlinedIcon sx={{ fontSize: 16, color: 'action.active' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                      Vai trò
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedUserForReset?.role === 'Admin' ? 'Quản trị viên' : selectedUserForReset?.role === 'Accountant' ? 'Kế toán' : 'Quản lý Dự án'}
                    size="small"
                    color={selectedUserForReset?.role === 'Admin' ? 'error' : selectedUserForReset?.role === 'Accountant' ? 'success' : 'info'}
                    sx={{ fontWeight: 600, fontSize: '0.8125rem' }}
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
              disabled={actionLoading}
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
              disabled={actionLoading}
              startIcon={actionLoading ? <CircularProgress size={20} /> : <EmailOutlinedIcon />}
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
              {actionLoading ? 'Đang gửi...' : 'Gửi Email Đặt lại'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toggle Status Confirmation Dialog */}
        <Dialog
          open={confirmToggleModalOpen}
          onClose={actionLoading ? undefined : handleCloseToggleModal}
          disableEscapeKeyDown={actionLoading}
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

            {/* Admin Notes Field - Only show when deactivating */}
            {selectedUserForToggle?.status === 'Active' && (
              <Box sx={{ mt: 2.5 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Lý do khóa tài khoản"
                  placeholder="Nhập lý do vô hiệu hóa tài khoản (bắt buộc)..."
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                  required
                  error={!deactivationReason.trim() && deactivationReason !== ''}
                  helperText="Vui lòng nhập lý do để tiếp tục"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            )}
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
              disabled={actionLoading}
              startIcon={
                actionLoading ? <CircularProgress size={16} color="inherit" /> :
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
              {actionLoading ? 'Đang xử lý...' : (selectedUserForToggle?.status === 'Active' ? 'Vô hiệu hóa' : 'Kích hoạt')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
}

export default UserManagement

