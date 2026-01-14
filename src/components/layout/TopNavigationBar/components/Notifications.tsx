import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  IconButton,
  Badge,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Tooltip,
  CircularProgress,
  Chip,
} from '@mui/material'
import {
  NotificationsNoneOutlined,
  ErrorOutline,
  PlaylistAddCheck,
  InfoOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
  NotificationsOffOutlined,
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

// Map backend typeName (string) to UI icon type
const mapTypeNameToIconType = (typeName: string): 'error' | 'new_request' | 'info' | 'success' | 'warning' => {
  const lowerTypeName = typeName.toLowerCase()
  
  // Map based on typeName content
  if (lowerTypeName.includes('lỗi') || lowerTypeName.includes('error')) {
    return 'error'
  }
  if (lowerTypeName.includes('yêu cầu') || lowerTypeName.includes('request')) {
    return 'new_request'
  }
  if (lowerTypeName.includes('thành công') || lowerTypeName.includes('success')) {
    return 'success'
  }
  if (lowerTypeName.includes('cảnh báo') || lowerTypeName.includes('warning')) {
    return 'warning'
  }
  
  // Default to info for generic types like "Hóa đơn", "Người dùng", etc.
  return 'info'
}

const NotificationsDropdown = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [markingAllAsRead, setMarkingAllAsRead] = useState<boolean>(false)
  const navigate = useNavigate()

  // Fetch recent notifications (top 5)
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const response = await notificationService.getNotifications({
        pageIndex: 1,
        pageSize: 5, // Only show 5 most recent in dropdown
      })

      // Map backend notifications to UI format
      const mappedNotifications: Notification[] = response.items.map((item: BackendNotification) => ({
        id: item.notificationID.toString(),
        message: item.content || item.message || 'Thông báo mới',
        timestamp: formatRelativeTime(item.time || item.createdAt || new Date().toISOString()),
        read: item.isRead,
        // Use typeName if available, otherwise fallback to notificationType or 'info'
        type: item.typeName 
          ? mapTypeNameToIconType(item.typeName) 
          : item.notificationType 
          ? mapNotificationType(item.notificationType) 
          : 'info',
      }))

      setNotifications(mappedNotifications)
    } catch (error) {
      // Silently fail - backend may not be ready or user not authenticated
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      // Silently fail - backend may not be ready or user not authenticated
      // Just set count to 0 and don't spam console
      setUnreadCount(0)
    }
  }, [])

  // Load notifications when component mounts and when dropdown opens
  useEffect(() => {
    fetchUnreadCount()
    // Refresh unread count every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (anchorEl) {
      fetchNotifications()
    }
  }, [anchorEl, fetchNotifications])

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllAsRead(true)
      await notificationService.markAllAsRead()
      
      // Optimistically update all to read
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
      
      // Refresh in background
      await Promise.all([fetchNotifications(), fetchUnreadCount()])
    } catch (error) {
      console.error('Error marking all as read:', error)
      // Revert on error
      await Promise.all([fetchNotifications(), fetchUnreadCount()])
    } finally {
      setMarkingAllAsRead(false)
    }
  }

  const handleViewAll = () => {
    navigate('/pages/all-notifications')
    handleClose()
  }

  const handleNotificationClick = async (id: string) => {
    try {
      // Optimistically update UI first
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
      
      // Then call API
      await notificationService.markAsRead(Number(id))
      
      // Refresh in background to ensure sync
      await fetchUnreadCount()
    } catch (error) {
      console.error('Error marking notification as read:', error)
      // Revert optimistic update on error
      await Promise.all([fetchNotifications(), fetchUnreadCount()])
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
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              width: 420,
              maxHeight: 'min(600px, calc(100vh - 120px))',
              mt: 1.5,
              overflow: 'hidden',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
              Thông báo
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} chưa đọc`}
                size="small"
                color="error"
                sx={{ fontWeight: 600, height: 24 }}
              />
            )}
          </Box>
        </Box>

        {/* Notifications List */}
        <List
          sx={{
            py: 0,
            overflow: 'auto',
            maxHeight: 'calc(min(600px, calc(100vh - 120px)) - 140px)',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'background.default',
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'divider',
              borderRadius: '4px',
              '&:hover': {
                bgcolor: 'text.disabled',
              },
            },
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                py: 6,
                gap: 2,
              }}
            >
              <CircularProgress size={36} />
              <Typography variant="body2" color="text.secondary">
                Đang tải thông báo...
              </Typography>
            </Box>
          ) : notifications.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
                px: 3,
                gap: 2,
              }}
            >
              <NotificationsOffOutlined sx={{ fontSize: 48, color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Không có thông báo mới
              </Typography>
              <Typography variant="caption" color="text.disabled" textAlign="center">
                Bạn đã xem hết tất cả thông báo
              </Typography>
            </Box>
          ) : (
            notifications.map((notification, index) => (
              <Box key={notification.id}>
                <ListItem
                  component="button"
                  onClick={() => handleNotificationClick(notification.id)}
                  sx={{
                    bgcolor: getNotificationBgColor(notification.read),
                    py: 2,
                    px: 2.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'action.selected',
                      transform: 'translateX(4px)',
                    },
                    borderLeft: notification.read ? 'none' : '4px solid',
                    borderColor: 'primary.main',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    width: '100%',
                    border: 'none',
                    textAlign: 'left',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: notification.read ? 400 : 600,
                          fontSize: '0.9rem',
                          lineHeight: 1.5,
                          color: notification.read ? 'text.secondary' : 'text.primary',
                        }}
                      >
                        {notification.message}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.disabled',
                          fontSize: '0.75rem',
                          mt: 0.5,
                          display: 'block',
                        }}
                      >
                        {notification.timestamp}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
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
                px: 2.5,
                py: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 1.5,
                bgcolor: 'background.default',
                position: 'sticky',
                bottom: 0,
                zIndex: 1,
              }}
            >
              <Button
                size="small"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0 || markingAllAsRead}
                startIcon={markingAllAsRead ? <CircularProgress size={16} /> : <CheckCircleOutline />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                Đánh dấu đã đọc
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleViewAll}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2,
                }}
              >
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
