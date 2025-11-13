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
  Grid,
  Autocomplete,
  Divider,
  Stack,
  Alert,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import SearchIcon from '@mui/icons-material/Search'
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined'

import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'

// Interface
export interface AuditLog {
  id: string
  timestamp: string
  userName: string
  userEmail: string
  actionType: 'LOGIN' | 'INVOICE_CREATE' | 'INVOICE_SIGN' | 'USER_UPDATE' | 'USER_DELETE' | 'SETTINGS_CHANGE' | 'LOGOUT'
  description: string
  ipAddress: string
  severity: 'INFO' | 'WARN' | 'ERROR'
  details?: Record<string, unknown>
}

// Mock Data
const mockLogs: AuditLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2024-11-13T09:15:23Z',
    userName: 'Nguyễn Văn An',
    userEmail: 'an.nguyen@company.com',
    actionType: 'LOGIN',
    description: 'Đăng nhập thành công vào hệ thống',
    ipAddress: '192.168.1.100',
    severity: 'INFO',
    details: {
      browser: 'Chrome 119.0',
      os: 'Windows 10',
      location: 'Ho Chi Minh City, Vietnam',
    },
  },
  {
    id: 'LOG-002',
    timestamp: '2024-11-13T09:30:45Z',
    userName: 'Trần Thị Bình',
    userEmail: 'binh.tran@company.com',
    actionType: 'INVOICE_CREATE',
    description: 'Tạo mới hoá đơn INV-2024-001',
    ipAddress: '192.168.1.105',
    severity: 'INFO',
    details: {
      invoiceNumber: 'INV-2024-001',
      customerName: 'Công ty ABC',
      amount: 15000000,
      taxCode: '0123456789',
    },
  },
  {
    id: 'LOG-003',
    timestamp: '2024-11-13T10:05:12Z',
    userName: 'Lê Hoàng Cường',
    userEmail: 'cuong.le@company.com',
    actionType: 'INVOICE_SIGN',
    description: 'Ký số hoá đơn INV-2024-001',
    ipAddress: '192.168.1.110',
    severity: 'INFO',
    details: {
      invoiceNumber: 'INV-2024-001',
      signatureMethod: 'USB Token',
      certificateSerial: 'CERT-12345678',
    },
  },
  {
    id: 'LOG-004',
    timestamp: '2024-11-13T10:45:33Z',
    userName: 'Phạm Mai Dung',
    userEmail: 'dung.pham@company.com',
    actionType: 'USER_UPDATE',
    description: 'Cập nhật thông tin người dùng: Vũ Quang Hải',
    ipAddress: '192.168.1.115',
    severity: 'WARN',
    details: {
      targetUser: 'Vũ Quang Hải',
      targetEmail: 'hai.vu@company.com',
      changedFields: ['role', 'status'],
      oldRole: 'PM',
      newRole: 'Accountant',
    },
  },
  {
    id: 'LOG-005',
    timestamp: '2024-11-13T11:20:18Z',
    userName: 'Nguyễn Văn An',
    userEmail: 'an.nguyen@company.com',
    actionType: 'USER_DELETE',
    description: 'Xoá người dùng: Hoàng Thu Hà',
    ipAddress: '192.168.1.100',
    severity: 'ERROR',
    details: {
      deletedUser: 'Hoàng Thu Hà',
      deletedEmail: 'ha.hoang@company.com',
      reason: 'User request',
    },
  },
  {
    id: 'LOG-006',
    timestamp: '2024-11-13T13:15:42Z',
    userName: 'Đỗ Thị Lan',
    userEmail: 'lan.do@company.com',
    actionType: 'SETTINGS_CHANGE',
    description: 'Thay đổi cấu hình API CQT',
    ipAddress: '192.168.1.120',
    severity: 'WARN',
    details: {
      section: 'API Integration',
      changedSettings: ['apiUrl', 'apiKey'],
      environment: 'Sandbox',
    },
  },
  {
    id: 'LOG-007',
    timestamp: '2024-11-13T14:30:55Z',
    userName: 'Bùi Minh Tuấn',
    userEmail: 'tuan.bui@company.com',
    actionType: 'INVOICE_CREATE',
    description: 'Tạo mới hoá đơn INV-2024-002',
    ipAddress: '192.168.1.125',
    severity: 'INFO',
    details: {
      invoiceNumber: 'INV-2024-002',
      customerName: 'Công ty XYZ',
      amount: 25000000,
      taxCode: '0987654321',
    },
  },
  {
    id: 'LOG-008',
    timestamp: '2024-11-13T15:45:20Z',
    userName: 'Trần Thị Bình',
    userEmail: 'binh.tran@company.com',
    actionType: 'LOGOUT',
    description: 'Đăng xuất khỏi hệ thống',
    ipAddress: '192.168.1.105',
    severity: 'INFO',
    details: {
      sessionDuration: '6h 14m',
    },
  },
]

// Unique users for Autocomplete
const uniqueUsers = Array.from(
  new Set(mockLogs.map((log) => ({ name: log.userName, email: log.userEmail })))
).map((user, index) => ({
  id: index,
  label: `${user.name} (${user.email})`,
  name: user.name,
  email: user.email,
}))

const AuditLogsPage = () => {
  // State: Logs
  const [logs] = useState<AuditLog[]>(mockLogs)

  // State: Filters
  const [fromDate, setFromDate] = useState<Dayjs | null>(dayjs().subtract(7, 'day'))
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs())
  const [selectedUser, setSelectedUser] = useState<typeof uniqueUsers[0] | null>(null)
  const [selectedActionType, setSelectedActionType] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('')
  const [searchText, setSearchText] = useState('')

  // State: Detail Modal
  const [viewingLog, setViewingLog] = useState<AuditLog | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const logDate = dayjs(log.timestamp)

      // Filter by date range
      if (fromDate && logDate.isBefore(fromDate, 'day')) return false
      if (toDate && logDate.isAfter(toDate, 'day')) return false

      // Filter by user
      if (selectedUser && log.userEmail !== selectedUser.email) return false

      // Filter by action type
      if (selectedActionType !== 'all' && log.actionType !== selectedActionType) return false

      // Filter by severity
      if (selectedSeverity && log.severity !== selectedSeverity) return false

      // Filter by search text
      if (searchText) {
        const searchLower = searchText.toLowerCase()
        return (
          log.description.toLowerCase().includes(searchLower) ||
          log.userName.toLowerCase().includes(searchLower) ||
          log.userEmail.toLowerCase().includes(searchLower) ||
          log.ipAddress.includes(searchLower)
        )
      }

      return true
    })
  }, [logs, fromDate, toDate, selectedUser, selectedActionType, selectedSeverity, searchText])

  // Handlers
  const handleViewDetails = (log: AuditLog) => {
    setViewingLog(log)
    setIsDetailModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsDetailModalOpen(false)
    setViewingLog(null)
  }

  const handleExportExcel = () => {
    // Export logic here
    alert(`Xuất ${filteredLogs.length} logs ra Excel (chức năng demo)`)
  }

  const handleClearAllFilters = () => {
    setFromDate(dayjs().subtract(7, 'day'))
    setToDate(dayjs())
    setSelectedUser(null)
    setSelectedActionType('all')
    setSelectedSeverity('')
    setSearchText('')
  }

  // Action Type Config
  const actionTypeConfig: Record<
    AuditLog['actionType'],
    { label: string; color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default' }
  > = {
    LOGIN: { label: 'Đăng nhập', color: 'info' },
    LOGOUT: { label: 'Đăng xuất', color: 'default' },
    INVOICE_CREATE: { label: 'Tạo hoá đơn', color: 'success' },
    INVOICE_SIGN: { label: 'Ký hoá đơn', color: 'primary' },
    USER_UPDATE: { label: 'Sửa người dùng', color: 'warning' },
    USER_DELETE: { label: 'Xoá người dùng', color: 'error' },
    SETTINGS_CHANGE: { label: 'Đổi cấu hình', color: 'warning' },
  }

  // Severity Config
  const severityConfig: Record<AuditLog['severity'], { color: 'success' | 'warning' | 'error' }> = {
    INFO: { color: 'success' },
    WARN: { color: 'warning' },
    ERROR: { color: 'error' },
  }

  // DataGrid Columns
  const columns: GridColDef[] = [
    {
      field: 'timestamp',
      headerName: 'Thời gian',
      type: 'dateTime',
      width: 180,
      valueGetter: (value) => {
        return value ? new Date(value) : null
      },
      renderCell: (params: GridRenderCellParams<AuditLog>) => {
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {dayjs(params.row.timestamp).format('DD/MM/YYYY')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dayjs(params.row.timestamp).format('HH:mm:ss')}
            </Typography>
          </Box>
        )
      },
    },
    {
      field: 'userEmail',
      headerName: 'Người dùng',
      width: 220,
      renderCell: (params: GridRenderCellParams<AuditLog>) => {
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {params.row.userName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.userEmail}
            </Typography>
          </Box>
        )
      },
    },
    {
      field: 'severity',
      headerName: 'Mức độ',
      width: 110,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params: GridRenderCellParams<AuditLog>) => {
        const severityLabels = {
          INFO: 'Thông tin',
          WARN: 'Cảnh báo',
          ERROR: 'Lỗi',
        }
        return (
          <Chip
            label={severityLabels[params.row.severity]}
            size="small"
            color={
              params.row.severity === 'ERROR' ? 'error' :
              params.row.severity === 'WARN' ? 'warning' :
              'info'
            }
            sx={{ 
              fontWeight: 600,
              minWidth: 85,
            }}
          />
        )
      },
    },
    {
      field: 'description',
      headerName: 'Hành động',
      flex: 1,
      minWidth: 300,
      renderCell: (params: GridRenderCellParams<AuditLog>) => {
        const severity = severityConfig[params.row.severity]
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: `${severity.color}.main`,
                flexShrink: 0,
              }}
            />
            <Typography variant="body2">{params.row.description}</Typography>
          </Box>
        )
      },
    },
    {
      field: 'actionType',
      headerName: 'Loại',
      width: 150,
      renderCell: (params: GridRenderCellParams<AuditLog>) => {
        const config = actionTypeConfig[params.row.actionType]
        return (
          <Chip
            label={config.label}
            color={config.color}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        )
      },
    },
    {
      field: 'ipAddress',
      headerName: 'Địa chỉ IP',
      width: 140,
      renderCell: (params: GridRenderCellParams<AuditLog>) => {
        return (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {params.row.ipAddress}
          </Typography>
        )
      },
    },
    {
      field: 'actions',
      headerName: 'Chi tiết',
      type: 'actions',
      width: 100,
      getActions: (params) => [
        <Tooltip title="Xem chi tiết" key="view">
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleViewDetails(params.row)}
          >
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>,
      ],
    },
  ]

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <AssignmentOutlinedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              Nhật ký Hệ thống
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tra cứu và theo dõi toàn bộ hoạt động trong hệ thống
            </Typography>
          </Box>
        </Box>

        {/* Filters Paper */}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          

          <Grid container spacing={2}>
            {/* Date Range */}
            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="Từ ngày"
                value={fromDate}
                onChange={(newValue) => setFromDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    InputProps: {
                      startAdornment: <CalendarTodayOutlinedIcon sx={{ mr: 1, fontSize: 20, color: 'action.active' }} />,
                    },
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="Đến ngày"
                value={toDate}
                onChange={(newValue) => setToDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    InputProps: {
                      startAdornment: <CalendarTodayOutlinedIcon sx={{ mr: 1, fontSize: 20, color: 'action.active' }} />,
                    },
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            {/* User Filter */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Autocomplete
                size="small"
                options={uniqueUsers}
                value={selectedUser}
                onChange={(_, newValue) => setSelectedUser(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Lọc theo Người dùng"
                    placeholder="Chọn người dùng"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <PersonOutlineIcon sx={{ ml: 1, mr: 0.5, fontSize: 20, color: 'action.active' }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            {/* Action Type Filter */}
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Lọc theo Loại hành động</InputLabel>
                <Select
                  value={selectedActionType}
                  label="Lọc theo Loại hành động"
                  onChange={(e) => setSelectedActionType(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="LOGIN">Đăng nhập</MenuItem>
                  <MenuItem value="LOGOUT">Đăng xuất</MenuItem>
                  <MenuItem value="INVOICE_CREATE">Tạo hoá đơn</MenuItem>
                  <MenuItem value="INVOICE_SIGN">Ký hoá đơn</MenuItem>
                  <MenuItem value="USER_UPDATE">Sửa người dùng</MenuItem>
                  <MenuItem value="USER_DELETE">Xoá người dùng</MenuItem>
                  <MenuItem value="SETTINGS_CHANGE">Đổi cấu hình</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Severity Filter */}
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Lọc theo Mức độ</InputLabel>
                <Select
                  value={selectedSeverity}
                  label="Lọc theo Mức độ"
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Tất cả Mức độ</MenuItem>
                  <MenuItem value="INFO">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main' }} />
                      <span>Thông tin (INFO)</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="WARN">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                      <span>Cảnh báo (WARN)</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="ERROR">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                      <span>Lỗi (ERROR)</span>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Search */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Tìm kiếm tự do"
                placeholder="Tìm kiếm theo mô tả, tên, email, IP..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            {/* Export Button */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DownloadOutlinedIcon />}
                onClick={handleExportExcel}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  height: '40px',
                }}
              >
                Xuất ra Excel
              </Button>
            </Grid>
          </Grid>

          {/* Filter Summary */}
          {(selectedUser || selectedActionType !== 'all' || selectedSeverity || searchText) && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  Đang lọc:
                </Typography>
                {selectedUser && (
                  <Chip
                    label={`User: ${selectedUser.name}`}
                    size="small"
                    onDelete={() => setSelectedUser(null)}
                  />
                )}
                {selectedActionType !== 'all' && (
                  <Chip
                    label={`Loại: ${actionTypeConfig[selectedActionType as AuditLog['actionType']].label}`}
                    size="small"
                    onDelete={() => setSelectedActionType('all')}
                  />
                )}
                {selectedSeverity && (
                  <Chip
                    label={`Mức độ: ${selectedSeverity === 'INFO' ? 'Thông tin' : selectedSeverity === 'WARN' ? 'Cảnh báo' : 'Lỗi'}`}
                    size="small"
                    color={
                      selectedSeverity === 'ERROR' ? 'error' :
                      selectedSeverity === 'WARN' ? 'warning' :
                      'info'
                    }
                    onDelete={() => setSelectedSeverity('')}
                  />
                )}
                {searchText && (
                  <Chip
                    label={`Tìm kiếm: "${searchText}"`}
                    size="small"
                    onDelete={() => setSearchText('')}
                  />
                )}
                <Button
                  size="small"
                  startIcon={<FilterListOutlinedIcon />}
                  onClick={handleClearAllFilters}
                  sx={{
                    textTransform: 'none',
                    ml: 'auto !important',
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: 'error.lighter',
                    },
                  }}
                >
                  Xóa tất cả bộ lọc
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>

        {/* Results Alert */}
        <Alert
          severity="info"
          sx={{ mb: 2, borderRadius: 2 }}
          icon={<AssignmentOutlinedIcon />}
        >
          <Typography variant="body2">
            Tìm thấy <strong>{filteredLogs.length}</strong> logs từ{' '}
            <strong>{fromDate?.format('DD/MM/YYYY')}</strong> đến{' '}
            <strong>{toDate?.format('DD/MM/YYYY')}</strong>
          </Typography>
        </Alert>

        {/* DataGrid Paper */}
        <Paper
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <DataGrid
            rows={filteredLogs}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
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

        {/* Detail Modal */}
        <Dialog
          open={isDetailModalOpen}
          onClose={handleCloseModal}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
          }}
        >
          {viewingLog && (
            <>
              <DialogTitle
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontWeight: 600,
                  p: 3,
                }}
              >
                <AssignmentOutlinedIcon color="primary" />
                <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                  Chi tiết Log ID: {viewingLog.id}
                </Typography>
                <Chip
                  label={
                    viewingLog.severity === 'INFO' ? 'Thông tin' :
                    viewingLog.severity === 'WARN' ? 'Cảnh báo' :
                    'Lỗi'
                  }
                  color={severityConfig[viewingLog.severity].color}
                  size="small"
                  sx={{ ml: 'auto', fontWeight: 600 }}
                />
              </DialogTitle>

              <Divider />

              <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Thời gian
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {dayjs(viewingLog.timestamp).format('DD/MM/YYYY HH:mm:ss')}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Loại hành động
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={actionTypeConfig[viewingLog.actionType].label}
                        color={actionTypeConfig[viewingLog.actionType].color}
                        size="small"
                      />
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Mức độ
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={
                          viewingLog.severity === 'INFO' ? 'Thông tin' :
                          viewingLog.severity === 'WARN' ? 'Cảnh báo' :
                          'Lỗi'
                        }
                        color={severityConfig[viewingLog.severity].color}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Người thực hiện
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                      {viewingLog.userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {viewingLog.userEmail}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Địa chỉ IP
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontFamily: 'monospace' }}>
                      {viewingLog.ipAddress}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Mô tả
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {viewingLog.description}
                    </Typography>
                  </Grid>

                  {viewingLog.details && (
                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                        Dữ liệu Kỹ thuật (Raw Data)
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: 'grey.50',
                          p: 2,
                          borderRadius: 2,
                          border: 1,
                          borderColor: 'divider',
                          overflow: 'auto',
                          maxHeight: 300,
                        }}
                      >
                        <pre
                          style={{
                            margin: 0,
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            lineHeight: 1.6,
                          }}
                        >
                          {JSON.stringify(viewingLog.details, null, 2)}
                        </pre>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>

              <Divider />

              <DialogActions sx={{ p: 3 }}>
                <Button
                  onClick={handleCloseModal}
                  variant="contained"
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 3,
                  }}
                >
                  Đóng
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}

export default AuditLogsPage
