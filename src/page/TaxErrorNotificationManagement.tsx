import { useState, useMemo, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SendIcon from '@mui/icons-material/Send'
import DownloadIcon from '@mui/icons-material/Download'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import CancelIcon from '@mui/icons-material/Cancel'
import { Link, useNavigate } from 'react-router-dom'
import Spinner from '@/components/Spinner'
import TaxErrorNotificationFilter, { TaxErrorNotificationFilterState } from '../components/TaxErrorNotificationFilter'
import {
  ITaxErrorNotification,
  NotificationType,
  NotificationStatus,
  getNotificationTypeLabel,
  getNotificationTypeColor,
  getNotificationStatusLabel,
  getNotificationStatusColor,
  needsAttention,
  formatCurrency,
  formatDate,
} from '@/types/taxErrorNotification'

// ============================================================================
// MOCK DATA
// ============================================================================

const generateMockData = (): ITaxErrorNotification[] => {
  return [
    {
      id: 1,
      sentDate: new Date('2026-01-08T10:30:00'),
      messageId: 'TB04-20260108-001',
      invoiceRef: '00000045',
      invoiceId: 131,
      invoiceSymbol: 'C25TAA',
      invoiceDate: '2026-01-07',
      taxAuthority: 'Cục Thuế TP. Hà Nội',
      type: NotificationType.CANCEL,
      reason: 'Khách hàng yêu cầu hủy do phát sinh sai sót trong nội dung hóa đơn',
      status: NotificationStatus.ACCEPTED,
      cqtResponse: 'Đã tiếp nhận thông báo. Mã xác nhận: ACK-20260108-001',
      notificationCode: 'TB04/001/2026',
      xmlPath: '/uploads/notifications/TB04_001_2026.xml',
      customerName: 'Công ty TNHH ABC Technology',
      totalAmount: 121000000,
    },
    {
      id: 2,
      sentDate: new Date('2026-01-08T14:15:00'),
      messageId: 'TB04-20260108-002',
      invoiceRef: '00000042',
      invoiceId: 128,
      invoiceSymbol: 'C25TAA',
      invoiceDate: '2026-01-06',
      taxAuthority: 'Cục Thuế TP. Hồ Chí Minh',
      type: NotificationType.ADJUST,
      reason: 'Điều chỉnh giá trị hóa đơn do sai sót nhập liệu',
      status: NotificationStatus.REJECTED,
      cqtResponse: 'Từ chối tiếp nhận: Thiếu chữ ký số hợp lệ trên file XML. Vui lòng ký lại và gửi lại.',
      notificationCode: 'TB04/002/2026',
      xmlPath: '/uploads/notifications/TB04_002_2026.xml',
      customerName: 'Công ty CP XYZ Solutions',
      totalAmount: 85000000,
    },
    {
      id: 3,
      sentDate: new Date('2026-01-09T09:45:00'),
      messageId: 'TB04-20260109-003',
      invoiceRef: '00000043',
      invoiceId: 129,
      invoiceSymbol: 'C25TAA',
      invoiceDate: '2026-01-08',
      taxAuthority: 'Cục Thuế TP. Đà Nẵng',
      type: NotificationType.REPLACE,
      reason: 'Thay thế hóa đơn do phát sinh sai sót về thông tin người mua',
      status: NotificationStatus.SENDING,
      cqtResponse: null,
      notificationCode: 'TB04/003/2026',
      xmlPath: '/uploads/notifications/TB04_003_2026.xml',
      customerName: 'Doanh nghiệp Tư nhân DEF',
      totalAmount: 54000000,
    },
    {
      id: 4,
      sentDate: new Date('2026-01-09T11:20:00'),
      messageId: 'TB04-20260109-004',
      invoiceRef: '00000044',
      invoiceId: 130,
      invoiceSymbol: 'C25TAA',
      invoiceDate: '2026-01-08',
      taxAuthority: 'Cục Thuế TP. Hà Nội',
      type: NotificationType.EXPLAIN,
      reason: 'Giải trình về việc hóa đơn được ký sau thời hạn quy định do sự cố hệ thống',
      status: NotificationStatus.PENDING,
      cqtResponse: null,
      notificationCode: 'TB04/004/2026',
      xmlPath: null,
      customerName: 'Công ty TNHH GHI Logistics',
      totalAmount: 96000000,
    },
    {
      id: 5,
      sentDate: new Date('2026-01-09T15:00:00'),
      messageId: 'TB04-20260109-005',
      invoiceRef: '00000041',
      invoiceId: 127,
      invoiceSymbol: 'C25TAA',
      invoiceDate: '2026-01-05',
      taxAuthority: 'Cục Thuế TP. Hồ Chí Minh',
      type: NotificationType.CANCEL,
      reason: 'Hủy hóa đơn do giao dịch không phát sinh',
      status: NotificationStatus.ERROR,
      cqtResponse: 'Lỗi kết nối đến máy chủ CQT. Mã lỗi: ERR_CONNECTION_TIMEOUT',
      notificationCode: 'TB04/005/2026',
      xmlPath: '/uploads/notifications/TB04_005_2026.xml',
      customerName: 'Tập đoàn JKL Group',
      totalAmount: 230000000,
    },
    {
      id: 6,
      sentDate: new Date('2026-01-07T08:30:00'),
      messageId: 'TB04-20260107-001',
      invoiceRef: '00000038',
      invoiceId: 124,
      invoiceSymbol: 'C25TAA',
      invoiceDate: '2026-01-04',
      taxAuthority: 'Cục Thuế TP. Hà Nội',
      type: NotificationType.ADJUST,
      reason: 'Điều chỉnh thuế suất VAT từ 8% lên 10%',
      status: NotificationStatus.ACCEPTED,
      cqtResponse: 'Đã tiếp nhận thông báo. Mã xác nhận: ACK-20260107-001',
      notificationCode: 'TB04/006/2026',
      xmlPath: '/uploads/notifications/TB04_006_2026.xml',
      customerName: 'Công ty CP MNO Trading',
      totalAmount: 145000000,
    },
  ]
}

// ============================================================================
// ACTIONS MENU COMPONENT
// ============================================================================

interface NotificationActionsMenuProps {
  notification: ITaxErrorNotification
  onView: (id: string | number) => void
  onEdit: (id: string | number) => void
  onResend: (id: string | number) => void
  onDownload: (id: string | number) => void
}

const NotificationActionsMenu = ({ 
  notification, 
  onView, 
  onEdit, 
  onResend, 
  onDownload 
}: NotificationActionsMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const canEdit = needsAttention(notification.status)
  const canResend = needsAttention(notification.status)
  const canDownload = notification.xmlPath !== null && notification.status === NotificationStatus.ACCEPTED

  const menuItems = [
    {
      label: 'Xem chi tiết',
      icon: <VisibilityOutlinedIcon fontSize="small" />,
      enabled: true,
      action: () => {
        onView(notification.id)
        handleClose()
      },
      color: 'primary.main',
      tooltip: 'Xem thông tin chi tiết thông báo',
    },
    {
      label: 'Sửa & Gửi lại',
      icon: <EditOutlinedIcon fontSize="small" />,
      enabled: canEdit,
      action: () => {
        onEdit(notification.id)
        handleClose()
      },
      color: 'warning.main',
      tooltip: canEdit 
        ? 'Chỉnh sửa và gửi lại thông báo bị từ chối'
        : 'Chỉ có thể sửa thông báo bị từ chối hoặc lỗi',
    },
    {
      label: 'Gửi lại CQT',
      icon: <SendIcon fontSize="small" />,
      enabled: canResend,
      action: () => {
        onResend(notification.id)
        handleClose()
      },
      color: 'success.main',
      tooltip: canResend
        ? 'Gửi lại thông báo đến Cơ quan Thuế'
        : 'Chỉ có thể gửi lại thông báo bị từ chối hoặc lỗi',
    },
    { divider: true },
    {
      label: 'Tải về XML',
      icon: <DownloadIcon fontSize="small" />,
      enabled: canDownload,
      action: () => {
        onDownload(notification.id)
        handleClose()
      },
      color: 'info.main',
      tooltip: canDownload
        ? 'Tải xuống file XML thông báo'
        : 'Chỉ có thể tải file XML của thông báo đã được tiếp nhận',
    },
  ]

  return (
    <>
      <Tooltip title="Thao tác" arrow placement="left">
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{
            color: 'text.secondary',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'action.hover',
              color: 'primary.main',
              transform: 'scale(1.1)',
            },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        TransitionProps={{
          timeout: 250,
        }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              minWidth: 240,
              borderRadius: 2.5,
              mt: 0.5,
              overflow: 'visible',
              filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))',
              border: '1px solid',
              borderColor: 'divider',
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
                borderLeft: '1px solid',
                borderTop: '1px solid',
                borderColor: 'divider',
              },
            },
          },
        }}
      >
        {menuItems.map((item, index) => {
          if ('divider' in item) {
            return <Divider key={`divider-${index}`} sx={{ my: 1 }} />
          }

          return (
            <MenuItem
              key={item.label}
              onClick={item.enabled ? item.action : undefined}
              disabled={!item.enabled}
              sx={{
                py: 1.25,
                px: 2.5,
                gap: 1.5,
                transition: 'all 0.2s ease',
                '&:hover': item.enabled ? {
                  backgroundColor: 'action.hover',
                  transform: 'translateX(4px)',
                } : {},
                '&.Mui-disabled': {
                  opacity: 0.4,
                },
                cursor: item.enabled ? 'pointer' : 'not-allowed',
              }}
            >
              <ListItemIcon
                sx={{
                  color: item.enabled ? item.color : 'text.disabled',
                  minWidth: 28,
                  transition: 'color 0.2s ease',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: item.enabled ? 500 : 400,
                  letterSpacing: '0.01em',
                  color: item.enabled ? 'text.primary' : 'text.disabled',
                }}
              />
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TaxErrorNotificationManagement = () => {
  const navigate = useNavigate()
  
  // State management
  const [notifications, setNotifications] = useState<ITaxErrorNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter state
  const [filters, setFilters] = useState<TaxErrorNotificationFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    status: [],
    type: [],
    taxAuthority: '',
  })

  // Load notifications (mock data)
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const mockData = generateMockData()
        setNotifications(mockData)
      } catch (err) {
        console.error('Failed to load notifications:', err)
        setError('Không thể tải danh sách thông báo sai sót')
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [])

  // Filter logic
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications]

    // Search text filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      filtered = filtered.filter(
        (n) =>
          n.invoiceRef.toLowerCase().includes(searchLower) ||
          n.messageId.toLowerCase().includes(searchLower) ||
          n.customerName.toLowerCase().includes(searchLower) ||
          n.notificationCode.toLowerCase().includes(searchLower)
      )
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter((n) => dayjs(n.sentDate).isAfter(filters.dateFrom))
    }
    if (filters.dateTo) {
      filtered = filtered.filter((n) => dayjs(n.sentDate).isBefore(filters.dateTo))
    }

    // Status filter
    if (filters.status.length > 0) {
      const statusIds = filters.status.map((s: string) => {
        const statusMap: Record<string, NotificationStatus> = {
          'Chờ gửi': NotificationStatus.PENDING,
          'Đang gửi': NotificationStatus.SENDING,
          'CQT Tiếp nhận': NotificationStatus.ACCEPTED,
          'CQT Từ chối': NotificationStatus.REJECTED,
          'Lỗi': NotificationStatus.ERROR,
        }
        return statusMap[s]
      })
      filtered = filtered.filter((n) => statusIds.includes(n.status))
    }

    // Type filter
    if (filters.type.length > 0) {
      const typeIds = filters.type.map((t: string) => {
        const typeMap: Record<string, NotificationType> = {
          'Hủy': NotificationType.CANCEL,
          'Điều chỉnh': NotificationType.ADJUST,
          'Thay thế': NotificationType.REPLACE,
          'Giải trình': NotificationType.EXPLAIN,
        }
        return typeMap[t]
      })
      filtered = filtered.filter((n) => typeIds.includes(n.type))
    }

    // Tax authority filter
    if (filters.taxAuthority) {
      filtered = filtered.filter((n) => n.taxAuthority === filters.taxAuthority)
    }

    return filtered
  }, [notifications, filters])

  // Action handlers
  const handleView = (id: string | number) => {
    console.log('View notification:', id)
    // Navigate to detail page
    navigate(`/tax-error-notifications/${id}`)
  }

  const handleEdit = (id: string | number) => {
    console.log('Edit notification:', id)
    // Navigate to edit page
    navigate(`/tax-error-notifications/${id}/edit`)
  }

  const handleResend = (id: string | number) => {
    console.log('Resend notification:', id)
    // Implement resend logic
    alert(`Đang gửi lại thông báo #${id} đến Cơ quan Thuế...`)
  }

  const handleDownload = (id: string | number) => {
    console.log('Download XML:', id)
    const notification = notifications.find((n) => n.id === id)
    if (notification?.xmlPath) {
      // Implement download logic
      window.open(notification.xmlPath, '_blank')
    }
  }

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'sentDate',
      headerName: 'Ngày gửi',
      flex: 1,
      minWidth: 160,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: '0.875rem', 
            fontWeight: 500,
            color: '#546e7a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          {formatDate(params.value as Date)}
        </Typography>
      ),
    },
    {
      field: 'messageId',
      headerName: 'Mã thông báo',
      flex: 1,
      minWidth: 180,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="Mã giao dịch T-VAN" arrow placement="top">
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#1976d2',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            {params.value as string}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'invoiceRef',
      headerName: 'Số hoá đơn',
      flex: 1,
      minWidth: 140,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const invoiceId = params.row.invoiceId as number
        const invoiceSymbol = params.row.invoiceSymbol as string
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Tooltip 
              title={
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                    Hóa đơn gốc
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    Số: {params.value as string}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    Ký hiệu: {invoiceSymbol}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#90caf9' }}>
                    👉 Click để xem chi tiết
                  </Typography>
                </Box>
              }
              arrow 
              placement="top"
            >
              <Link
                to={`/invoices/${invoiceId}`}
                style={{
                  textDecoration: 'none',
                  color: '#1976d2',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#1565c0'
                  e.currentTarget.style.textDecoration = 'underline'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#1976d2'
                  e.currentTarget.style.textDecoration = 'none'
                }}
              >
                {params.value as string}
              </Link>
            </Tooltip>
          </Box>
        )
      },
    },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1.5,
      minWidth: 220,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value as string} arrow placement="top">
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#2c3e50',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            {params.value as string}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'type',
      headerName: 'Loại TB',
      flex: 1,
      minWidth: 160,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const type = params.value as NotificationType
        const label = getNotificationTypeLabel(type)
        const color = getNotificationTypeColor(type)
        
        const iconMap = {
          [NotificationType.CANCEL]: '❌',
          [NotificationType.ADJUST]: '📝',
          [NotificationType.REPLACE]: '🔄',
          [NotificationType.EXPLAIN]: '📋',
        }
        
        return (
          <Chip
            icon={<span style={{ fontSize: '1rem' }}>{iconMap[type]}</span>}
            label={label}
            color={color}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.8rem',
              height: 28,
              '& .MuiChip-icon': {
                marginLeft: '8px',
              },
            }}
          />
        )
      },
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      flex: 1,
      minWidth: 150,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value as NotificationStatus
        const label = getNotificationStatusLabel(status)
        const color = getNotificationStatusColor(status)
        const cqtResponse = params.row.cqtResponse as string | null
        const hasError = needsAttention(status)
        
        const iconMap = {
          [NotificationStatus.PENDING]: <HourglassEmptyIcon fontSize="small" />,
          [NotificationStatus.SENDING]: <SendIcon fontSize="small" />,
          [NotificationStatus.ACCEPTED]: <CheckCircleOutlineIcon fontSize="small" />,
          [NotificationStatus.REJECTED]: <CancelIcon fontSize="small" />,
          [NotificationStatus.ERROR]: <ErrorOutlineIcon fontSize="small" />,
        }
        
        const tooltipContent = (
          <Box sx={{ maxWidth: 400 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              Trạng thái: {label}
            </Typography>
            {cqtResponse && (
              <>
                <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.2)' }} />
                <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.9)' }}>
                  {hasError ? '⚠️ Chi tiết lỗi:' : '✅ Phản hồi CQT:'}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    mt: 0.5,
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                    color: hasError ? '#ffeb3b' : 'rgba(255,255,255,0.95)',
                  }}
                >
                  {cqtResponse}
                </Typography>
              </>
            )}
          </Box>
        )
        
        const chipElement = (
          <Chip
            icon={iconMap[status]}
            label={label}
            color={color}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: cqtResponse ? 'help' : 'default',
              ...(hasError && {
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.8 },
                },
              }),
            }}
          />
        )
        
        return cqtResponse ? (
          <Tooltip 
            title={tooltipContent} 
            arrow 
            placement="top"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  '& .MuiTooltip-arrow': {
                    color: 'rgba(0, 0, 0, 0.9)',
                  },
                },
              },
            }}
          >
            <span>{chipElement}</span>
          </Tooltip>
        ) : chipElement
      },
    },
    {
      field: 'totalAmount',
      headerName: 'Số tiền',
      flex: 1,
      minWidth: 140,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#1976d2',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          {formatCurrency(params.value as number)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      flex: 0.5,
      minWidth: 100,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <NotificationActionsMenu
          notification={params.row as ITaxErrorNotification}
          onView={handleView}
          onEdit={handleEdit}
          onResend={handleResend}
          onDownload={handleDownload}
        />
      ),
    },
  ]

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spinner />
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            border: '1px solid #ef5350',
            backgroundColor: '#ffebee',
            borderRadius: 2,
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 64, color: '#ef5350', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2, color: '#c62828' }}>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()}
          >
            Thử lại
          </Button>
        </Paper>
      </Box>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              mb: 1,
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Quản lý Thông báo sai sót
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
            Mẫu 04/SS-HĐĐT - Thông báo sai sót hóa đơn điện tử gửi Cơ quan Thuế
          </Typography>
        </Box>

        {/* Filter */}
        <TaxErrorNotificationFilter
          onFilterChange={setFilters}
          onReset={() => setFilters({
            searchText: '',
            dateFrom: null,
            dateTo: null,
            status: [],
            type: [],
            taxAuthority: '',
          })}
        />

        {/* Data Table */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}
        >
          <DataGrid
            rows={filteredNotifications}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
              sorting: {
                sortModel: [{ field: 'sentDate', sort: 'desc' }],
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f5f5',
                borderBottom: '2px solid #e0e0e0',
                fontWeight: 700,
                fontSize: '0.875rem',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
                fontSize: '0.875rem',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f8f9fa',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '2px solid #e0e0e0',
                backgroundColor: '#fafafa',
              },
            }}
          />
        </Paper>
      </Box>
    </LocalizationProvider>
  )
}

export default TaxErrorNotificationManagement
