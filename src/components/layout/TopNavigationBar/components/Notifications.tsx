import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {Box,  IconButton, Badge,  Popover,  Typography, List,ListItem,ListItemText,ListItemIcon, Divider, Button, Tooltip, CircularProgress} from '@mui/material'
import {
  NotificationsNoneOutlined,
  ErrorOutline,
  PlaylistAddCheck,
  InfoOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
} from '@mui/icons-material'
import notificationService from '@/services/notificationService'
import { Notification as BackendNotification, NotificationType } from '@/services/notificationService'

// UI Notification interface
interface Notification {
  id: string
  message: string
  timestamp: string
  read: boolean
  type: 'error' | 'new_request' | 'info' | 'success' | 'warning'
}

// Format relative time in Vietnamese
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  
  // Format as dd/mm/yyyy if older than a week
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

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

const NotificationsDropdown = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const navigate = useNavigate()

  // Fetch recent notifications (top 5)
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationService.getNotifications({
        pageIndex: 1,
        pageSize: 5, // Only show 5 most recent in dropdown
      })

      // Map backend notifications to UI format
      const mappedNotifications: Notification[] = response.items.map((item: BackendNotification) => ({
        id: item.notificationID.toString(),
        message: item.message,
        timestamp: formatRelativeTime(item.createdAt),
        read: item.isRead,
        type: mapNotificationType(item.notificationType),
      }))

      setNotifications(mappedNotifications)
    } catch (error) {
      // Silently fail - backend may not be ready or user not authenticated
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
    } catch (error) {
      // Silently fail - backend may not be ready or user not authenticated
      // Just set count to 0 and don't spam console
      setUnreadCount(0)
    }
  }

  // Load notifications when component mounts and when dropdown opens
  useEffect(() => {
    fetchUnreadCount()
    // Refresh unread count every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (anchorEl) {
      fetchNotifications()
    }
  }, [anchorEl])

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      // Refresh notifications and unread count
      await fetchNotifications()
      await fetchUnreadCount()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleViewAll = () => {
    navigate('/pages/all-notifications')
    handleClose()
  }

  const handleNotificationClick = async (id: string) => {
    try {
      // Mark as read when clicked
      await notificationService.markAsRead(Number(id))
      // Update UI optimistically
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      // Refresh unread count
      await fetchUnreadCount()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Get icon based on notification type
  const getNotificationIcon = (type: Notification['type']) => {
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

  // Get background color for unread notifications
  const getNotificationBgColor = (read: boolean) => {
    return read ? 'transparent' : 'action.hover'
  }

  const open = Boolean(anchorEl)
  const id = open ? 'notifications-popover' : undefined

  return (
    <>
      {/* Trigger Button */}
      <Tooltip title="Thông báo">
        <IconButton onClick={handleOpen} size="medium" aria-describedby={id} sx={{ ml: 1 }}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsNoneOutlined />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Popover Dropdown */}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 'calc(100vh - 100px)', // Dynamic max height based on viewport
            mt: 1.5,
            overflow: 'hidden',
            boxShadow: 3,
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Thông báo
            </Typography>
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error" sx={{ mr: 1 }}>
                <Box />
              </Badge>
            )}
          </Box>
        </Box>

        {/* Notifications List */}
        <List sx={{ py: 0, overflow: 'auto', maxHeight: 360 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="Không có thông báo"
                secondary="Bạn đã xem hết tất cả thông báo"
                sx={{ textAlign: 'center', py: 3 }}
              />
            </ListItem>
          ) : (
            notifications.map((notification) => (
              <Box key={notification.id}>
                <ListItem
                  component="button"
                  onClick={() => handleNotificationClick(notification.id)}
                  sx={{
                    bgcolor: getNotificationBgColor(notification.read),
                    py: 1.5,
                    px: 2,
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                    borderLeft: notification.read ? 'none' : '3px solid',
                    borderColor: 'primary.main',
                    cursor: 'pointer',
                    display: 'flex',
                    width: '100%',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{getNotificationIcon(notification.type)}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: notification.read ? 400 : 600,
                          fontSize: '0.875rem',
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
                </ListItem>
                <Divider />
              </Box>
            ))
          )}
        </List>

        {/* Footer Actions */}
        {notifications.length > 0 && (
          <>
            <Divider />
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                bgcolor: 'background.default',
              }}
            >
              <Button size="small" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                Đánh dấu đã đọc
              </Button>
              <Button size="small" variant="contained" onClick={handleViewAll}>
                Xem tất cả
              </Button>
            </Box>
          </>
        )}
      </Popover>
    </>
  )
}

export default NotificationsDropdown
