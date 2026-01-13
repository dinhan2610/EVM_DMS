import { useState, useMemo, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Pagination,
  Divider,
  Chip,
  Tooltip,
  alpha,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  MarkEmailReadOutlined,
  ErrorOutline,
  PlaylistAddCheck,
  InfoOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
  CheckOutlined,
} from '@mui/icons-material'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import notificationService from '@/services/notificationService'
import { Notification, NotificationType } from '@/services/notificationService'

// Map backend NotificationType to UI type
const mapNotificationType = (type: NotificationType): 'error' | 'new_request' | 'info' | 'success' | 'warning' => {
  switch (type) {
    case NotificationType.ERROR:
      return 'error'
    case NotificationType.NEW_REQUEST:
      return 'new_request'
    case NotificationType.SUCCESS:
      return 'success'
    case NotificationType.WARNING:
      return 'warning'
    case NotificationType.INFO:
    default:
      return 'info'
  }
}

const NOTIFICATIONS_PER_PAGE = 10

// Format date to Vietnamese format
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

// UI Notification interface (mapped from backend Notification)
interface UINotification {
  id: string
  message: string
  timestamp: string
  read: boolean
  type: 'error' | 'new_request' | 'info' | 'success' | 'warning'
}

const AllNotifications = () => {
  // State
  const [notifications, setNotifications] = useState<UINotification[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFilter, setCurrentFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [unreadCount, setUnreadCount] = useState<number>(0)

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)

      // Determine isRead filter based on current filter
      let isReadFilter: boolean | undefined
      if (currentFilter === 'unread') {
        isReadFilter = false
      }
      // Note: Backend doesn't support filtering by notification type via query params
      // We'll filter by type on the frontend if needed

      const response = await notificationService.getNotifications({
        pageIndex: currentPage,
        pageSize: NOTIFICATIONS_PER_PAGE,
        isRead: isReadFilter,
      })

      // Map backend notifications to UI format
      const mappedNotifications: UINotification[] = response.items.map((item: Notification) => ({
        id: item.notificationID.toString(),
        message: item.message,
        timestamp: formatDate(item.createdAt),
        read: item.isRead,
        type: mapNotificationType(item.notificationType),
      }))

      setNotifications(mappedNotifications)
      setTotalPages(response.totalPages)
      setTotalCount(response.totalCount)
    } catch (err) {
      // Show user-friendly error without spamming console
      setError('Không thể tải thông báo. Backend API có thể chưa sẵn sàng hoặc bạn chưa đăng nhập.')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch (err) {
      // Silently fail - just set to 0
      setUnreadCount(0)
    }
  }

  // Initial load and when filter/page changes
  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [currentFilter, currentPage])

  // Handlers
  const handleFilterChange = (_event: React.SyntheticEvent, newValue: string) => {
    setCurrentFilter(newValue)
    setCurrentPage(1) // Reset to page 1 when filter changes
  }

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value)
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(Number(id))
      // Update UI optimistically
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      // Refresh unread count
      await fetchUnreadCount()
    } catch (err) {
      // Silently fail - optimistic update already applied
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      // Refresh notifications and unread count
      await fetchNotifications()
      await fetchUnreadCount()
    } catch (err) {
      // Silently fail - user can retry manually
    }
  }

  // Computed values using useMemo - Frontend filtering for type filters
  const filteredNotifications = useMemo(() => {
    switch (currentFilter) {
      case 'error':
        return notifications.filter((n) => n.type === 'error')
      case 'new_request':
        return notifications.filter((n) => n.type === 'new_request')
      case 'success':
        return notifications.filter((n) => n.type === 'success')
      case 'warning':
        return notifications.filter((n) => n.type === 'warning')
      case 'info':
        return notifications.filter((n) => n.type === 'info')
      default:
        // For 'all' and 'unread', backend already filtered
        return notifications
    }
  }, [notifications, currentFilter])

  const paginatedNotifications = useMemo(() => {
    // If filtering by type on frontend, need to paginate manually
    if (['error', 'new_request', 'success', 'warning', 'info'].includes(currentFilter)) {
      const startIndex = (currentPage - 1) * NOTIFICATIONS_PER_PAGE
      const endIndex = startIndex + NOTIFICATIONS_PER_PAGE
      return filteredNotifications.slice(startIndex, endIndex)
    }
    // For 'all' and 'unread', backend already paginated
    return filteredNotifications
  }, [filteredNotifications, currentPage, currentFilter])

  const pageCount = useMemo(() => {
    // If filtering by type on frontend, calculate page count manually
    if (['error', 'new_request', 'success', 'warning', 'info'].includes(currentFilter)) {
      return Math.ceil(filteredNotifications.length / NOTIFICATIONS_PER_PAGE)
    }
    // For 'all' and 'unread', use backend totalPages
    return totalPages
  }, [filteredNotifications.length, currentFilter, totalPages])

  // Get icon based on notification type
  const getNotificationIcon = (type: UINotification['type']) => {
    switch (type) {
      case 'error':
        return <ErrorOutline color="error" />
      case 'new_request':
        return <PlaylistAddCheck color="success" />
      case 'success':
        return <CheckCircleOutline color="success" />
      case 'warning':
        return <WarningAmberOutlined color="warning" />
      case 'info':
        return <InfoOutlined color="info" />
      default:
        return <InfoOutlined />
    }
  }

  // Show loading state
  if (loading) {
    return (
      <>
        <PageBreadcrumb title="Tất cả Thông báo" subName="Thông báo" />
        <PageMetaData title="Tất cả Thông báo" />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} />
        </Box>
      </>
    )
  }

  // Show error state
  if (error) {
    return (
      <>
        <PageBreadcrumb title="Tất cả Thông báo" subName="Thông báo" />
        <PageMetaData title="Tất cả Thông báo" />
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 3 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button variant="contained" onClick={fetchNotifications}>
              Thử lại
            </Button>
          </Box>
        </Box>
      </>
    )
  }

  return (
    <>
      <PageBreadcrumb title="Tất cả Thông báo" subName="Thông báo" />
      <PageMetaData title="Tất cả Thông báo" />

      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header Stats */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 600, flex: 1 }}>
            Tất cả Thông báo
          </Typography>
          <Chip label={`${totalCount} tổng`} color="primary" variant="outlined" />
          {unreadCount > 0 && <Chip label={`${unreadCount} chưa đọc`} color="error" />}
        </Box>

        <Paper elevation={2}>
          {/* Tabs Filter */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentFilter}
              onChange={handleFilterChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: 2,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  minWidth: 100,
                },
              }}
            >
              <Tab label="Tất cả" value="all" />
              <Tab label="Chưa đọc" value="unread" />
              <Tab label="Lỗi" value="error" icon={<ErrorOutline fontSize="small" />} iconPosition="start" />
              <Tab label="Yêu cầu" value="new_request" icon={<PlaylistAddCheck fontSize="small" />} iconPosition="start" />
              <Tab label="Thành công" value="success" icon={<CheckCircleOutline fontSize="small" />} iconPosition="start" />
              <Tab label="Cảnh báo" value="warning" icon={<WarningAmberOutlined fontSize="small" />} iconPosition="start" />
              <Tab label="Thông tin" value="info" icon={<InfoOutlined fontSize="small" />} iconPosition="start" />
            </Tabs>
          </Box>

          {/* Action Bar */}
          <Box
            sx={{
              px: 3,
              py: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Hiển thị {paginatedNotifications.length} / {filteredNotifications.length} thông báo
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<MarkEmailReadOutlined />}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Đánh dấu tất cả là đã đọc
            </Button>
          </Box>

          {/* Notifications List */}
          <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
            {paginatedNotifications.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Không có thông báo nào
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {currentFilter !== 'all' ? 'Thử thay đổi bộ lọc để xem các thông báo khác' : 'Bạn không có thông báo nào'}
                </Typography>
              </Box>
            ) : (
              paginatedNotifications.map((notification, index) => (
                <Box key={notification.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      px: 3,
                      bgcolor: notification.read ? 'transparent' : alpha('#7f56da', 0.05),
                      borderLeft: notification.read ? 'none' : '4px solid',
                      borderColor: 'primary.main',
                      '&:hover': {
                        bgcolor: notification.read ? 'action.hover' : alpha('#7f56da', 0.08),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 48 }}>{getNotificationIcon(notification.type)}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: notification.read ? 400 : 600,
                            fontSize: '0.9375rem',
                            mb: 0.5,
                          }}
                        >
                          {notification.message}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {notification.timestamp}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {!notification.read && (
                          <Tooltip title="Đánh dấu đã đọc">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleMarkAsRead(notification.id)}
                              sx={{ color: 'primary.main' }}
                            >
                              <CheckOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {/* Delete functionality removed as backend API doesn't support it */}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < paginatedNotifications.length - 1 && <Divider />}
                </Box>
              ))
            )}
          </List>

          {/* Pagination */}
          {pageCount > 1 && (
            <Box
              sx={{
                py: 3,
                display: 'flex',
                justifyContent: 'center',
                borderTop: 1,
                borderColor: 'divider',
                bgcolor: 'background.default',
              }}
            >
              <Pagination count={pageCount} page={currentPage} onChange={handlePageChange} color="primary" size="large" />
            </Box>
          )}
        </Paper>
      </Box>
    </>
  )
}

export default AllNotifications
