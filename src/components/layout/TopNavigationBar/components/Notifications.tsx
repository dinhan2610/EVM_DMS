import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {Box,  IconButton, Badge,  Popover,  Typography, List,ListItem,ListItemText,ListItemIcon, Divider, Button, Tooltip,} from '@mui/material'
import {
  NotificationsNoneOutlined,
  ErrorOutline,
  PlaylistAddCheck,
  InfoOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
} from '@mui/icons-material'

// Interface
interface Notification {
  id: string
  message: string
  timestamp: string
  read: boolean
  type: 'error' | 'new_request' | 'info' | 'success' | 'warning'
}

// Mock Data
const mockNotifications: Notification[] = [
  {
    id: '1',
    message: 'Yêu cầu hóa đơn #INV-2024-001 đã được phê duyệt',
    timestamp: '2 phút trước',
    read: false,
    type: 'success',
  },
  {
    id: '2',
    message: 'Có 3 hóa đơn mới chờ xử lý',
    timestamp: '5 phút trước',
    read: false,
    type: 'new_request',
  },
  {
    id: '3',
    message: 'Lỗi khi xuất báo cáo doanh thu tháng 10',
    timestamp: '15 phút trước',
    read: false,
    type: 'error',
  },
  {
    id: '4',
    message: 'Hệ thống sẽ bảo trì vào 2h sáng ngày mai',
    timestamp: '1 giờ trước',
    read: true,
    type: 'warning',
  },
  {
    id: '5',
    message: 'Cập nhật phiên bản mới 2.5.0 đã có sẵn',
    timestamp: '3 giờ trước',
    read: true,
    type: 'info',
  },
]

const NotificationsDropdown = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const navigate = useNavigate()

  // Calculate unread count using useMemo
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length
  }, [notifications])

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleViewAll = () => {
    navigate('/pages/all-notifications')
    handleClose()
  }

  const handleNotificationClick = (id: string) => {
    // Mark as read when clicked
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
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
            maxHeight: 500,
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
          {notifications.length === 0 ? (
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
