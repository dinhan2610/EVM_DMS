import { useState, useMemo, useEffect } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
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
import React from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SendIcon from '@mui/icons-material/Send'
import DownloadIcon from '@mui/icons-material/Download'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { useNavigate } from 'react-router-dom'
import Spinner from '@/components/Spinner'
import TaxErrorNotificationFilter, { TaxErrorNotificationFilterState } from '../components/TaxErrorNotificationFilter'
import TaxErrorNotificationDetailModal from '@/components/TaxErrorNotificationDetailModal'
import taxErrorNotificationService from '@/services/taxErrorNotificationService'
import { adaptNotificationList } from '@/adapters/taxErrorNotificationAdapter'
import {
  ITaxErrorNotification,
  NotificationType,
  NotificationStatus,
  getNotificationTypeLabel,
  getNotificationTypeColor,
  getNotificationTypeCustomColor,
  getNotificationStatusLabel,
  getNotificationStatusColor,
  needsAttention,
  formatCurrency,
  formatDate,
} from '@/types/taxErrorNotification'

// ============================================================================
// INVOICE NUMBER CELL COMPONENT
// ============================================================================

interface InvoiceNumberCellProps {
  notificationId: number
  invoiceNumber: string
  invoiceSymbol: string
}

const InvoiceNumberCell: React.FC<InvoiceNumberCellProps> = ({ 
  notificationId, 
  invoiceNumber, 
  invoiceSymbol 
}) => {
  const navigate = useNavigate()
  const [isNavigating, setIsNavigating] = useState(false)
  
  const handleInvoiceClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    try {
      setIsNavigating(true)
      console.log(`[🔍 Notification ${notificationId}] Fetching detail to get invoiceId...`)
      
      // Fetch notification detail to get real invoiceId
      const detail = await taxErrorNotificationService.getNotificationById(notificationId)
      
      if (!detail.details || detail.details.length === 0) {
        console.error(`[❌ Notification ${notificationId}] No invoice details found`)
        alert('⚠️ Không tìm thấy hóa đơn liên kết')
        return
      }
      
      const invoiceId = detail.details[0].invoiceId
      console.log(`[✅ Notification ${notificationId}] Found invoiceId: ${invoiceId}`)
      
      // Navigate to invoice detail
      navigate(`/invoices/${invoiceId}`)
      
    } catch (error) {
      console.error(`[❌ Notification ${notificationId}] Failed to fetch:`, error)
      alert('⚠️ Không thể tải thông tin hóa đơn')
    } finally {
      setIsNavigating(false)
    }
  }
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        width: '100%',
      }}
    >
      <Tooltip 
        title={
          <Box>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
              Hóa đơn gốc
            </Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
              Số: {invoiceNumber}
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
        <Typography
          component="a"
          onClick={handleInvoiceClick}
          sx={{
            textDecoration: 'none',
            color: isNavigating ? '#90caf9' : '#1976d2',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: isNavigating ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: isNavigating ? 0.6 : 1,
            '&:hover': {
              color: '#1565c0',
              textDecoration: 'underline',
            },
          }}
        >
          {isNavigating ? '⏳ Đang tải...' : invoiceNumber}
        </Typography>
      </Tooltip>
    </Box>
  )
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
  
  // Calculate pending notifications count (DRAFT or SENT)
  const pendingCount = useMemo(() => {
    return notifications.filter(n => 
      n.status === NotificationStatus.DRAFT || 
      n.status === NotificationStatus.SENT
    ).length
  }, [notifications])
  
  // Set title with pending count
  usePageTitle('Thông báo sai sót CQT', pendingCount)
  
  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null)
  
  // 📊 Pagination state (controlled model)
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  })
  const [totalCount, setTotalCount] = useState(0)
  
  // Filter state
  const [filters, setFilters] = useState<TaxErrorNotificationFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    status: [],
    type: [],
    taxAuthority: '',
  })

  // Load notifications from REAL API
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // ✅ REAL API CALL - Convert 0-based page to 1-based for API
        const response = await taxErrorNotificationService.getNotifications(
          paginationModel.page + 1,
          paginationModel.pageSize
        )
        
        // ✅ MAP backend response to UI format using adapter
        const adaptedNotifications = adaptNotificationList(response.items)
        
        setNotifications(adaptedNotifications)
        setTotalCount(response.totalCount)
        
        console.log('✅ Loaded notifications:', adaptedNotifications.length, 'of', response.totalCount)
      } catch (err) {
        console.error('❌ Failed to load notifications:', err)
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách thông báo sai sót')
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [paginationModel.page, paginationModel.pageSize])

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
          'Nháp': NotificationStatus.DRAFT,
          'Đã ký': NotificationStatus.SIGNED,
          'Đã gửi': NotificationStatus.SENT,
          'CQT Tiếp nhận': NotificationStatus.ACCEPTED,
          'CQT Từ chối': NotificationStatus.REJECTED,
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
    setSelectedNotificationId(Number(id))
    setDetailModalOpen(true)
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.875rem', 
              fontWeight: 500,
              color: '#546e7a',
            }}
          >
            {formatDate(params.value as Date)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'messageId',
      headerName: 'Mã thông báo',
      flex: 1.2,
      minWidth: 450,
      sortable: true,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="Mã giao dịch T-VAN" arrow placement="top">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              height: '100%',
              pl: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#1976d2',
                letterSpacing: '0.02em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {params.value as string}
            </Typography>
          </Box>
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
      renderCell: (params: GridRenderCellParams) => (
        <InvoiceNumberCell
          notificationId={params.row.id as number}
          invoiceNumber={params.value as string}
          invoiceSymbol={params.row.invoiceSymbol as string}
        />
      ),
    },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1.5,
      minWidth: 250,
      sortable: true,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value as string} arrow placement="top">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              height: '100%',
              pl: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#2c3e50',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {params.value as string}
            </Typography>
          </Box>
        </Tooltip>
      ),
    },
    {
      field: 'type',
      headerName: 'Loại TB',
      flex: 1,
      minWidth: 140,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const type = params.value as NotificationType
        const label = getNotificationTypeLabel(type)
        const color = getNotificationTypeColor(type)
        const customColor = getNotificationTypeCustomColor(type)
        const reason = params.row.reason as string
        
        // Tooltip content với reason
        const tooltipContent = reason ? (
          <Box sx={{ maxWidth: 400 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              {label}
            </Typography>
            <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.2)' }} />
            <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.9)' }}>
              📝 Lý do:
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                mt: 0.5,
                fontStyle: 'italic',
                lineHeight: 1.4,
                color: 'rgba(255,255,255,0.95)',
              }}
            >
              {reason}
            </Typography>
          </Box>
        ) : null
        
        const chipElement = (
          <Chip
            label={label}
            color={customColor ? undefined : color}
            size="small"
            variant="filled"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 28,
              borderRadius: '20px',
              minWidth: 100,
              cursor: reason ? 'help' : 'default',
              ...(customColor && {
                bgcolor: customColor.bgcolor,
                color: customColor.color,
                border: `1px solid ${customColor.borderColor}`,
              }),
              '& .MuiChip-label': {
                px: 1.5,
              },
            }}
          />
        )
        
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            {tooltipContent ? (
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
            ) : chipElement}
          </Box>
        )
      },
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      flex: 1,
      minWidth: 130,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value as NotificationStatus
        const label = getNotificationStatusLabel(status)
        const color = getNotificationStatusColor(status)
        const cqtResponse = params.row.cqtResponse as string | null
        const hasError = needsAttention(status)
        
        const tooltipContent = cqtResponse ? (
          <Box sx={{ maxWidth: 400 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              Trạng thái: {label}
            </Typography>
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
          </Box>
        ) : null
        
        const chipElement = (
          <Chip
            label={label}
            color={color}
            size="small"
            variant="filled"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 28,
              borderRadius: '20px',  // ✅ Bo tròn mượt mà - đồng bộ với Invoice Management
              minWidth: 95,
              cursor: cqtResponse ? 'help' : 'default',
              '& .MuiChip-label': {
                px: 1.5,
              },
              ...(hasError && {
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.85 },
                },
              }),
            }}
          />
        )
        
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            {tooltipContent ? (
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
            ) : chipElement}
          </Box>
        )
      },
    },
    {
      field: 'totalAmount',
      headerName: 'Số tiền',
      flex: 1,
      minWidth: 140,
      sortable: true,
      align: 'right',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            width: '100%',
            height: '100%',
            pr: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#1976d2',
              letterSpacing: '0.02em',
            }}
          >
            {formatCurrency(params.value as number)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      flex: 0.5,
      minWidth: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const notification = params.row as ITaxErrorNotification
        const canDownload = notification.xmlPath !== null && notification.status === NotificationStatus.ACCEPTED
        
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              width: '100%',
              height: '100%',
            }}
          >
            {/* View Detail Icon */}
            <Tooltip title="Xem chi tiết" arrow placement="top">
              <IconButton
                size="small"
                onClick={() => handleView(notification.id)}
                sx={{
                  color: '#1976d2',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* Download PDF Icon */}
            <Tooltip 
              title={canDownload ? 'Tải về XML' : 'Chỉ tải được file của thông báo đã tiếp nhận'} 
              arrow 
              placement="top"
            >
              <span>
                <IconButton
                  size="small"
                  onClick={() => canDownload && handleDownload(notification.id)}
                  disabled={!canDownload}
                  sx={{
                    color: canDownload ? '#0288d1' : 'rgba(0, 0, 0, 0.26)',
                    transition: 'all 0.2s ease',
                    '&:hover': canDownload ? {
                      backgroundColor: 'rgba(2, 136, 209, 0.08)',
                      transform: 'scale(1.1)',
                    } : {},
                    '&.Mui-disabled': {
                      color: 'rgba(0, 0, 0, 0.26)',
                    },
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            
            {/* More Actions Menu */}
            <NotificationActionsMenu
              notification={notification}
              onView={handleView}
              onEdit={handleEdit}
              onResend={handleResend}
              onDownload={handleDownload}
            />
          </Box>
        )
      },
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
          totalResults={totalCount}
          filteredResults={filteredNotifications.length}
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
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            rowCount={totalCount}
            paginationMode="server"
            disableRowSelectionOnClick
            autoHeight
            initialState={{
              sorting: {
                sortModel: [{ field: 'sentDate', sort: 'desc' }],
              },
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f5f5',
                borderBottom: '2px solid #e0e0e0',
                fontWeight: 700,
                fontSize: '0.875rem',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
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
                minHeight: '56px',
                padding: '8px 16px',
              },
              '& .MuiTablePagination-root': {
                overflow: 'visible',
              },
              '& .MuiTablePagination-toolbar': {
                minHeight: '56px',
                paddingLeft: '16px',
                paddingRight: '8px',
                flexWrap: 'nowrap',
              },
              '& .MuiTablePagination-selectLabel': {
                margin: 0,
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#666',
              },
              '& .MuiTablePagination-displayedRows': {
                margin: 0,
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#666',
              },
              '& .MuiTablePagination-select': {
                paddingTop: '8px',
                paddingBottom: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
              },
              '& .MuiTablePagination-actions': {
                marginLeft: '20px',
                '& .MuiIconButton-root': {
                  padding: '8px',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  },
                  '&.Mui-disabled': {
                    opacity: 0.3,
                  },
                },
              },
            }}
          />
        </Paper>

        {/* Detail Modal */}
        <TaxErrorNotificationDetailModal
          open={detailModalOpen}
          notificationId={selectedNotificationId}
          onClose={() => {
            setDetailModalOpen(false)
            setSelectedNotificationId(null)
          }}
        />
      </Box>
    </LocalizationProvider>
  )
}

export default TaxErrorNotificationManagement
