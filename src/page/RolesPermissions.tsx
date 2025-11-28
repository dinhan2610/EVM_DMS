import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Checkbox,
  FormControlLabel,
  Button,
  Stack,
  Divider,
  Alert,
  Tooltip,
  CircularProgress,
  Chip,
  alpha,
} from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import PersonIcon from '@mui/icons-material/Person'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import SecurityIcon from '@mui/icons-material/Security'
import SaveIcon from '@mui/icons-material/Save'
import RestoreIcon from '@mui/icons-material/Restore'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

// Định nghĩa các quyền
type PermissionKey =
  // Quyền xem hóa đơn
  | 'invoice_view_all' // Xem tất cả hóa đơn
  | 'invoice_view_own' // Chỉ xem hóa đơn của mình
  | 'invoice_view_related' // Xem hóa đơn liên quan (bán hàng xem HĐ họ yêu cầu)
  // Quyền quản lý hóa đơn
  | 'invoice_create'
  | 'invoice_edit'
  | 'invoice_approve'
  | 'invoice_sign'
  | 'invoice_cancel'
  | 'invoice_config'
  // Quyền yêu cầu hóa đơn
  | 'request_create' // Tạo yêu cầu xuất HĐ (Bán hàng)
  | 'request_reissue' // Yêu cầu cấp lại HĐ (Khách hàng)
  | 'request_view_all' // Xem tất cả yêu cầu
  | 'request_view_own' // Xem yêu cầu của mình
  | 'request_process' // Xử lý yêu cầu (Kế toán)
  // Quyền báo cáo
  | 'report_view_all'
  | 'report_view_own'
  | 'report_export'
  // Quyền dữ liệu
  | 'data_customer'
  | 'data_product'
  // Quyền quản trị
  | 'admin_users'
  | 'admin_config'
  | 'admin_logs'

type Role = 'Admin' | 'Ketoantruong' | 'Ketoan' | 'Banhang' | 'Khachhang'

// Cấu trúc nhóm quyền
interface PermissionGroup {
  id: string
  name: string
  description: string
  permissions: {
    key: PermissionKey
    label: string
    description: string
    dangerous?: boolean
  }[]
}

// Dữ liệu mẫu cho các quyền
const mockPermissions: Record<Role, Record<PermissionKey, boolean>> = {
  Admin: {
    // Toàn quyền
    invoice_view_all: true,
    invoice_view_own: true,
    invoice_view_related: true,
    invoice_create: true,
    invoice_edit: true,
    invoice_approve: true,
    invoice_sign: true,
    invoice_cancel: true,
    invoice_config: true,
    request_create: true,
    request_reissue: true,
    request_view_all: true,
    request_view_own: true,
    request_process: true,
    report_view_all: true,
    report_view_own: true,
    report_export: true,
    data_customer: true,
    data_product: true,
    admin_users: true,
    admin_config: true,
    admin_logs: true,
  },
  Ketoantruong: {
    // Kế toán trưởng - Quản lý toàn bộ
    invoice_view_all: true,
    invoice_view_own: true,
    invoice_view_related: true,
    invoice_create: true,
    invoice_edit: true,
    invoice_approve: true, // Quyền phê duyệt
    invoice_sign: true,
    invoice_cancel: true,
    invoice_config: false,
    request_create: false,
    request_reissue: false,
    request_view_all: true,
    request_view_own: true,
    request_process: true, // Xử lý yêu cầu
    report_view_all: true,
    report_view_own: true,
    report_export: true,
    data_customer: true, // Quản lý khách hàng
    data_product: true, // Quản lý sản phẩm
    admin_users: false,
    admin_config: false,
    admin_logs: true,
  },
  Ketoan: {
    // Kế toán - Xử lý hóa đơn hàng ngày
    invoice_view_all: true,
    invoice_view_own: true,
    invoice_view_related: true,
    invoice_create: true,
    invoice_edit: true,
    invoice_approve: false, // Không phê duyệt
    invoice_sign: true,
    invoice_cancel: false,
    invoice_config: false,
    request_create: false,
    request_reissue: false,
    request_view_all: true,
    request_view_own: true,
    request_process: true, // Xử lý yêu cầu từ Bán hàng/Khách hàng
    report_view_all: false,
    report_view_own: true,
    report_export: false,
    data_customer: false,
    data_product: false,
    admin_users: false,
    admin_config: false,
    admin_logs: false,
  },
  Banhang: {
    // Bán hàng - Tạo yêu cầu và xem HĐ liên quan
    invoice_view_all: false,
    invoice_view_own: false,
    invoice_view_related: true, // Xem HĐ họ yêu cầu
    invoice_create: false,
    invoice_edit: false,
    invoice_approve: false,
    invoice_sign: false,
    invoice_cancel: false,
    invoice_config: false,
    request_create: true, // Tạo yêu cầu xuất HĐ
    request_reissue: false,
    request_view_all: false,
    request_view_own: true, // Xem yêu cầu của mình
    request_process: false,
    report_view_all: false,
    report_view_own: true, // Xem báo cáo của mình
    report_export: false,
    data_customer: false,
    data_product: false,
    admin_users: false,
    admin_config: false,
    admin_logs: false,
  },
  Khachhang: {
    // Khách hàng - Chỉ xem HĐ và yêu cầu cấp lại
    invoice_view_all: false,
    invoice_view_own: true, // Xem HĐ của họ
    invoice_view_related: false,
    invoice_create: false,
    invoice_edit: false,
    invoice_approve: false,
    invoice_sign: false,
    invoice_cancel: false,
    invoice_config: false,
    request_create: false,
    request_reissue: true, // Yêu cầu cấp lại HĐ
    request_view_all: false,
    request_view_own: true, // Xem yêu cầu cấp lại của họ
    request_process: false,
    report_view_all: false,
    report_view_own: true, // Xem lịch sử HĐ của họ
    report_export: false,
    data_customer: false,
    data_product: false,
    admin_users: false,
    admin_config: false,
    admin_logs: false,
  },
}

// Định nghĩa các nhóm quyền
const permissionGroups: PermissionGroup[] = [
  {
    id: 'invoice_view',
    name: 'Quyền Xem Hóa đơn',
    description: 'Phạm vi xem hóa đơn theo vai trò',
    permissions: [
      {
        key: 'invoice_view_all',
        label: 'Xem Tất cả Hóa đơn',
        description: 'Xem toàn bộ hóa đơn trong hệ thống (Kế toán, KTT)',
      },
      {
        key: 'invoice_view_own',
        label: 'Xem Hóa đơn Của Mình',
        description: 'Khách hàng chỉ xem được hóa đơn thuộc tài khoản của họ',
      },
      {
        key: 'invoice_view_related',
        label: 'Xem Hóa đơn Liên quan',
        description: 'Bán hàng xem được hóa đơn từ yêu cầu họ tạo',
      },
    ],
  },
  {
    id: 'invoice_manage',
    name: 'Quản lý Hóa đơn',
    description: 'Quyền tạo, sửa, phê duyệt và xử lý hóa đơn',
    permissions: [
      {
        key: 'invoice_create',
        label: 'Tạo Hóa đơn',
        description: 'Cho phép tạo hóa đơn mới từ yêu cầu hoặc trực tiếp',
      },
      {
        key: 'invoice_edit',
        label: 'Sửa Hóa đơn',
        description: 'Chỉnh sửa thông tin hóa đơn trước khi ký',
      },
      {
        key: 'invoice_approve',
        label: 'Phê duyệt Hóa đơn',
        description: 'Quyền phê duyệt hóa đơn quan trọng (Kế toán trưởng)',
      },
      {
        key: 'invoice_sign',
        label: 'Ký số Hóa đơn',
        description: 'Ký số điện tử và phát hành hóa đơn',
      },
      {
        key: 'invoice_cancel',
        label: 'Hủy/Điều chỉnh Hóa đơn',
        description: 'Xử lý hủy, điều chỉnh, thay thế hóa đơn',
        dangerous: true,
      },
      {
        key: 'invoice_config',
        label: 'Cấu hình Mẫu Hóa đơn',
        description: 'Quản lý mẫu hóa đơn và cấu hình hệ thống',
        dangerous: true,
      },
    ],
  },
  {
    id: 'request',
    name: 'Yêu cầu Hóa đơn',
    description: 'Quyền tạo và xử lý yêu cầu xuất/cấp lại hóa đơn',
    permissions: [
      {
        key: 'request_create',
        label: 'Tạo Yêu cầu Xuất HĐ',
        description: 'Bán hàng tạo yêu cầu xuất hóa đơn cho khách hàng (Màn hình 17)',
      },
      {
        key: 'request_reissue',
        label: 'Yêu cầu Cấp lại HĐ',
        description: 'Khách hàng yêu cầu cấp lại hóa đơn bị mất/hỏng',
      },
      {
        key: 'request_view_all',
        label: 'Xem Tất cả Yêu cầu',
        description: 'Xem toàn bộ yêu cầu trong hệ thống (Kế toán)',
      },
      {
        key: 'request_view_own',
        label: 'Xem Yêu cầu Của Mình',
        description: 'Chỉ xem yêu cầu do mình tạo',
      },
      {
        key: 'request_process',
        label: 'Xử lý Yêu cầu',
        description: 'Kế toán xử lý yêu cầu: duyệt/từ chối/xuất hóa đơn',
      },
    ],
  },
  {
    id: 'report',
    name: 'Báo cáo & Thống kê',
    description: 'Quyền xem và xuất báo cáo',
    permissions: [
      {
        key: 'report_view_all',
        label: 'Xem Báo cáo Toàn công ty',
        description: 'Truy cập báo cáo doanh thu, công nợ toàn hệ thống (KTT)',
      },
      {
        key: 'report_view_own',
        label: 'Xem Báo cáo Cá nhân',
        description: 'Xem lịch sử hóa đơn/giao dịch của mình',
      },
      {
        key: 'report_export',
        label: 'Xuất Báo cáo',
        description: 'Cho phép xuất báo cáo ra Excel/PDF',
      },
    ],
  },
  {
    id: 'data',
    name: 'Quản lý Dữ liệu Nguồn',
    description: 'Quyền quản lý khách hàng và sản phẩm',
    permissions: [
      {
        key: 'data_customer',
        label: 'Quản lý Khách hàng',
        description: 'CRUD danh sách khách hàng (Màn hình 21)',
      },
      {
        key: 'data_product',
        label: 'Quản lý Sản phẩm/Dịch vụ',
        description: 'CRUD danh sách sản phẩm/dịch vụ (Màn hình 22)',
      },
    ],
  },
  {
    id: 'admin',
    name: 'Quản trị Hệ thống',
    description: 'Quyền quản trị viên - yêu cầu cẩn trọng khi cấp phát',
    permissions: [
      {
        key: 'admin_users',
        label: 'Quản lý Người dùng',
        description: 'Tạo, sửa, xóa tài khoản và phân quyền',
        dangerous: true,
      },
      {
        key: 'admin_config',
        label: 'Cấu hình Hệ thống',
        description: 'Thiết lập cấu hình toàn hệ thống, API, tích hợp',
        dangerous: true,
      },
      {
        key: 'admin_logs',
        label: 'Xem Nhật ký Hệ thống',
        description: 'Truy cập log audit và lịch sử hoạt động',
      },
    ],
  },
]

const RolesPermissions: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role>('Ketoantruong')
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>(
    mockPermissions[selectedRole]
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const isRoleReadOnly = useMemo(() => selectedRole === 'Admin', [selectedRole])

  // Giả lập tải dữ liệu khi đổi Role
  useEffect(() => {
    setIsLoading(true)
    setShowSuccess(false)
    // Giả lập API call
    setTimeout(() => {
      setPermissions(mockPermissions[selectedRole])
      setIsLoading(false)
    }, 300)
  }, [selectedRole])

  const handlePermissionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPermissions({
      ...permissions,
      [event.target.name]: event.target.checked,
    })
  }

  // Hàm xử lý "Chọn tất cả" cho một nhóm
  const handleGroupSelectAll = (groupId: string, checked: boolean) => {
    const group = permissionGroups.find((g) => g.id === groupId)
    if (!group) return

    const updatedPermissions = { ...permissions }
    group.permissions.forEach((perm) => {
      updatedPermissions[perm.key] = checked
    })
    setPermissions(updatedPermissions)
  }

  // Kiểm tra trạng thái "Chọn tất cả" của một nhóm
  const getGroupSelectState = (groupId: string) => {
    const group = permissionGroups.find((g) => g.id === groupId)
    if (!group) return { checked: false, indeterminate: false }

    const groupPermKeys = group.permissions.map((p) => p.key)
    const checkedCount = groupPermKeys.filter((key) => permissions[key]).length

    return {
      checked: checkedCount === groupPermKeys.length,
      indeterminate: checkedCount > 0 && checkedCount < groupPermKeys.length,
    }
  }

  // Hàm lưu thay đổi
  const handleSavePermissions = async () => {
    setIsSaving(true)
    // Giả lập API call
    setTimeout(() => {
      setIsSaving(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }, 1000)
  }

  // Hàm khôi phục mặc định
  const handleRestoreDefaults = () => {
    setPermissions(mockPermissions[selectedRole])
    setShowSuccess(false)
  }

  const roles: { key: Role; name: string; icon: React.ReactElement; color: string; description: string }[] = [
    { 
      key: 'Admin', 
      name: 'Administrator', 
      icon: <AdminPanelSettingsIcon />, 
      color: '#ef5f5f',
      description: 'Toàn quyền quản trị hệ thống'
    },
    {
      key: 'Ketoantruong',
      name: 'Kế toán trưởng',
      icon: <SupervisorAccountIcon />,
      color: '#1976d2',
      description: 'Quản lý toàn bộ hóa đơn, phê duyệt, báo cáo'
    },
    { 
      key: 'Ketoan', 
      name: 'Kế toán', 
      icon: <AttachMoneyIcon />, 
      color: '#22c55e',
      description: 'Xử lý hóa đơn hàng ngày, ký số'
    },
    { 
      key: 'Banhang', 
      name: 'Bán hàng (PM/Sales)', 
      icon: <PointOfSaleIcon />, 
      color: '#f97316',
      description: 'Tạo yêu cầu xuất HĐ, xem HĐ liên quan'
    },
    { 
      key: 'Khachhang', 
      name: 'Khách hàng', 
      icon: <PersonIcon />, 
      color: '#9333ea',
      description: 'Xem HĐ của mình, yêu cầu cấp lại'
    },
  ]

  const selectedRoleConfig = roles.find((r) => r.key === selectedRole)

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <SecurityIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight={600}>
            Quản lý Vai trò & Phân quyền
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Cấu hình quyền truy cập cho từng vai trò trong hệ thống. Thay đổi sẽ ảnh hưởng đến tất cả
          người dùng thuộc vai trò được chọn.
        </Typography>
      </Box>

      {/* Success Alert */}
      {showSuccess && (
        <Alert
          severity="success"
          icon={<CheckCircleIcon />}
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setShowSuccess(false)}
        >
          Đã lưu thay đổi quyền cho vai trò <strong>{selectedRoleConfig?.name}</strong> thành công!
        </Alert>
      )}

      {/* Main Content */}
      <Paper elevation={1} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          {/* CỘT TRÁI - Danh sách Vai trò */}
          <Box
            sx={{
              width: { xs: '100%', md: '33.33%' },
              borderRight: { md: '1px solid #e0e0e0' },
              borderBottom: { xs: '1px solid #e0e0e0', md: 'none' },
              p: 2.5,
              minHeight: { md: '70vh' },
              bgcolor: alpha('#f8f9fa', 0.5),
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, px: 1, fontWeight: 600 }}>
              Danh sách Vai trò
            </Typography>
            <List component="nav" sx={{ p: 0 }}>
              {roles.map((role) => (
                <ListItemButton
                  key={role.key}
                  selected={selectedRole === role.key}
                  onClick={() => setSelectedRole(role.key)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    transition: 'all 0.2s ease-in-out',
                    '&.Mui-selected': {
                      bgcolor: alpha(role.color, 0.12),
                      borderLeft: `4px solid ${role.color}`,
                      '&:hover': {
                        bgcolor: alpha(role.color, 0.18),
                      },
                    },
                    '&:hover': {
                      bgcolor: alpha(role.color, 0.08),
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: role.color, minWidth: 40 }}>
                    {role.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={role.name}
                    primaryTypographyProps={{
                      fontWeight: selectedRole === role.key ? 600 : 400,
                      color: selectedRole === role.key ? role.color : 'text.primary',
                    }}
                  />
                  {role.key === 'Admin' && (
                    <Chip
                      label="Mặc định"
                      size="small"
                      sx={{
                        bgcolor: alpha(role.color, 0.15),
                        color: role.color,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    />
                  )}
                </ListItemButton>
              ))}
            </List>
          </Box>

          {/* CỘT PHẢI - Chi tiết Quyền */}
          <Box
            sx={{
              width: { xs: '100%', md: '66.67%' },
              p: 3,
              maxHeight: { md: '70vh' },
              overflowY: 'auto',
            }}
          >
            {/* Role Header */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(selectedRoleConfig?.color || '#000', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {React.cloneElement(selectedRoleConfig?.icon || <></>, {
                  sx: { fontSize: 32, color: selectedRoleConfig?.color },
                })}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={600}>
                  {selectedRoleConfig?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedRoleConfig?.description}
                </Typography>
              </Box>
              {(selectedRole === 'Banhang' || selectedRole === 'Khachhang') && (
                <Chip
                  label={selectedRole === 'Khachhang' ? 'Khách hàng Portal' : 'Nội bộ'}
                  size="small"
                  sx={{
                    bgcolor: alpha(selectedRoleConfig?.color || '#000', 0.15),
                    color: selectedRoleConfig?.color,
                    fontWeight: 600,
                  }}
                />
              )}
            </Stack>

            {isRoleReadOnly && (
              <Alert
                severity="info"
                icon={<AdminPanelSettingsIcon />}
                sx={{ mb: 3, borderRadius: 2 }}
              >
                Vai trò <strong>Administrator</strong> có toàn quyền mặc định và không thể chỉnh sửa.
              </Alert>
            )}

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={40} />
              </Box>
            ) : (
              <>
                {/* Permission Groups */}
                {permissionGroups.map((group, index) => {
                  const groupState = getGroupSelectState(group.id)
                  return (
                    <Paper
                      key={group.id}
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        mt: index === 0 ? 0 : 3,
                        borderRadius: 2,
                        border: group.id === 'admin' ? '1px solid #ef5f5f' : '1px solid #e0e0e0',
                        bgcolor: group.id === 'admin' ? alpha('#ef5f5f', 0.02) : 'transparent',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          boxShadow: 2,
                        },
                      }}
                    >
                      {/* Group Header */}
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Box>
                          <Typography
                            variant="h6"
                            fontWeight={600}
                            color={group.id === 'admin' ? 'error.main' : 'text.primary'}
                          >
                            {group.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            {group.description}
                          </Typography>
                        </Box>
                        <Tooltip title="Chọn/Bỏ chọn tất cả quyền trong nhóm này">
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={groupState.checked}
                                indeterminate={groupState.indeterminate}
                                onChange={(e) => handleGroupSelectAll(group.id, e.target.checked)}
                                disabled={isRoleReadOnly}
                                sx={{
                                  color: group.id === 'admin' ? 'error.main' : 'primary.main',
                                  '&.Mui-checked': {
                                    color: group.id === 'admin' ? 'error.main' : 'primary.main',
                                  },
                                }}
                              />
                            }
                            label={
                              <Typography variant="body2" fontWeight={600}>
                                Chọn tất cả
                              </Typography>
                            }
                            sx={{ mr: 0 }}
                          />
                        </Tooltip>
                      </Stack>

                      <Divider sx={{ mb: 2 }} />

                      {/* Permissions List */}
                      <Stack spacing={2}>
                        {group.permissions.map((perm) => (
                          <Box key={perm.key}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  name={perm.key}
                                  checked={permissions[perm.key]}
                                  onChange={handlePermissionChange}
                                  disabled={isRoleReadOnly}
                                />
                              }
                              label={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  {perm.dangerous && (
                                    <Tooltip title="Quyền quan trọng - Cần cẩn trọng khi cấp phát">
                                      <WarningAmberIcon
                                        fontSize="small"
                                        sx={{ color: 'error.main' }}
                                      />
                                    </Tooltip>
                                  )}
                                  <Typography
                                    fontWeight={500}
                                    color={perm.dangerous ? 'error.main' : 'text.primary'}
                                  >
                                    {perm.label}
                                  </Typography>
                                </Stack>
                              }
                              sx={{ m: 0 }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ pl: 4, display: 'block', mt: 0.5 }}
                            >
                              {perm.description}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  )
                })}

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSavePermissions}
                    disabled={isRoleReadOnly || isSaving}
                    sx={{
                      px: 4,
                      py: 1.2,
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: 2,
                      '&:hover': {
                        boxShadow: 4,
                      },
                    }}
                  >
                    {isSaving ? 'Đang lưu...' : 'Lưu Thay đổi'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    size="large"
                    startIcon={<RestoreIcon />}
                    onClick={handleRestoreDefaults}
                    disabled={isRoleReadOnly || isSaving}
                    sx={{
                      px: 4,
                      py: 1.2,
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: 'none',
                    }}
                  >
                    Khôi phục Mặc định
                  </Button>
                </Stack>
              </>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}

export default RolesPermissions
