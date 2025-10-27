import { useState, useMemo } from 'react'
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
} from '@mui/material'
import {
  MarkEmailReadOutlined,
  DeleteOutline,
  ErrorOutline,
  PlaylistAddCheck,
  InfoOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
  CheckOutlined,
} from '@mui/icons-material'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'

// Interface
interface Notification {
  id: string
  message: string
  timestamp: string
  read: boolean
  type: 'error' | 'new_request' | 'info' | 'success' | 'warning'
}

// Mock Data - 30 notifications
const mockAllNotifications: Notification[] = [
  { id: '1', message: 'Yêu cầu hóa đơn #INV-2024-001 đã được phê duyệt', timestamp: '24/10/2025 14:30', read: false, type: 'success' },
  { id: '2', message: 'Có 3 hóa đơn mới chờ xử lý', timestamp: '24/10/2025 14:25', read: false, type: 'new_request' },
  { id: '3', message: 'Lỗi khi xuất báo cáo doanh thu tháng 10', timestamp: '24/10/2025 14:15', read: false, type: 'error' },
  { id: '4', message: 'Hệ thống sẽ bảo trì vào 2h sáng ngày mai', timestamp: '24/10/2025 13:00', read: true, type: 'warning' },
  { id: '5', message: 'Cập nhật phiên bản mới 2.5.0 đã có sẵn', timestamp: '24/10/2025 11:00', read: true, type: 'info' },
  { id: '6', message: 'Yêu cầu #REQ-2024-045 cần phê duyệt khẩn cấp', timestamp: '24/10/2025 10:45', read: false, type: 'new_request' },
  { id: '7', message: 'Lỗi kết nối cơ sở dữ liệu', timestamp: '24/10/2025 10:30', read: false, type: 'error' },
  { id: '8', message: 'Hóa đơn #INV-2024-002 đã được thanh toán', timestamp: '24/10/2025 09:15', read: true, type: 'success' },
  { id: '9', message: 'Bạn có 5 tin nhắn mới từ nhóm Kế toán', timestamp: '24/10/2025 08:00', read: true, type: 'info' },
  { id: '10', message: 'Cảnh báo: Dung lượng ổ đĩa sắp đầy', timestamp: '23/10/2025 18:30', read: false, type: 'warning' },
  { id: '11', message: 'Yêu cầu nghỉ phép của Nguyễn Văn A cần duyệt', timestamp: '23/10/2025 16:00', read: false, type: 'new_request' },
  { id: '12', message: 'Lỗi khi gửi email thông báo', timestamp: '23/10/2025 15:45', read: true, type: 'error' },
  { id: '13', message: 'Báo cáo tài chính Q3 đã được hoàn thành', timestamp: '23/10/2025 14:00', read: true, type: 'success' },
  { id: '14', message: 'Cập nhật chính sách bảo mật mới', timestamp: '23/10/2025 11:30', read: true, type: 'info' },
  { id: '15', message: 'Cảnh báo: Mật khẩu của bạn sẽ hết hạn sau 7 ngày', timestamp: '23/10/2025 09:00', read: false, type: 'warning' },
  { id: '16', message: 'Yêu cầu mua sắm #PO-2024-123 cần phê duyệt', timestamp: '22/10/2025 17:30', read: false, type: 'new_request' },
  { id: '17', message: 'Lỗi khi đồng bộ dữ liệu với Azure', timestamp: '22/10/2025 16:15', read: true, type: 'error' },
  { id: '18', message: 'Dự án Website ABC đã hoàn thành 80%', timestamp: '22/10/2025 14:45', read: true, type: 'success' },
  { id: '19', message: 'Thông báo họp team vào 15h chiều nay', timestamp: '22/10/2025 13:00', read: true, type: 'info' },
  { id: '20', message: 'Cảnh báo: Số lượng API calls gần đạt giới hạn', timestamp: '22/10/2025 11:00', read: false, type: 'warning' },
  { id: '21', message: 'Yêu cầu tạo tài khoản mới cho nhân viên', timestamp: '21/10/2025 16:00', read: false, type: 'new_request' },
  { id: '22', message: 'Lỗi timeout khi xử lý thanh toán', timestamp: '21/10/2025 15:30', read: true, type: 'error' },
  { id: '23', message: 'Backup dữ liệu đã hoàn tất thành công', timestamp: '21/10/2025 03:00', read: true, type: 'success' },
  { id: '24', message: 'Hướng dẫn sử dụng tính năng mới', timestamp: '20/10/2025 14:00', read: true, type: 'info' },
  { id: '25', message: 'Cảnh báo: Phát hiện hoạt động bất thường', timestamp: '20/10/2025 11:00', read: false, type: 'warning' },
  { id: '26', message: 'Yêu cầu cấp quyền truy cập module Finance', timestamp: '20/10/2025 09:30', read: false, type: 'new_request' },
  { id: '27', message: 'Lỗi khi tạo báo cáo Excel', timestamp: '19/10/2025 16:45', read: true, type: 'error' },
  { id: '28', message: 'Tất cả hóa đơn tháng 9 đã được đối soát', timestamp: '19/10/2025 14:00', read: true, type: 'success' },
  { id: '29', message: 'Thông báo nâng cấp hệ thống vào cuối tuần', timestamp: '18/10/2025 10:00', read: true, type: 'info' },
  { id: '30', message: 'Cảnh báo: SSL certificate sẽ hết hạn sau 30 ngày', timestamp: '17/10/2025 09:00', read: false, type: 'warning' },
]

const NOTIFICATIONS_PER_PAGE = 10

const AllNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockAllNotifications)
  const [currentFilter, setCurrentFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Handlers
  const handleFilterChange = (_event: React.SyntheticEvent, newValue: string) => {
    setCurrentFilter(newValue)
    setCurrentPage(1) // Reset to page 1 when filter changes
  }

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value)
  }

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    // Reset to page 1 if current page becomes empty
    const newFilteredLength = notifications.filter((n) => n.id !== id).length
    const newPageCount = Math.ceil(newFilteredLength / NOTIFICATIONS_PER_PAGE)
    if (currentPage > newPageCount && newPageCount > 0) {
      setCurrentPage(newPageCount)
    }
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  // Computed values using useMemo
  const filteredNotifications = useMemo(() => {
    switch (currentFilter) {
      case 'unread':
        return notifications.filter((n) => !n.read)
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
        return notifications
    }
  }, [notifications, currentFilter])

  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * NOTIFICATIONS_PER_PAGE
    const endIndex = startIndex + NOTIFICATIONS_PER_PAGE
    return filteredNotifications.slice(startIndex, endIndex)
  }, [filteredNotifications, currentPage])

  const pageCount = useMemo(() => {
    return Math.ceil(filteredNotifications.length / NOTIFICATIONS_PER_PAGE)
  }, [filteredNotifications.length])

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length
  }, [notifications])

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
          <Chip label={`${notifications.length} tổng`} color="primary" variant="outlined" />
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
                        <Tooltip title="Xóa">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleDelete(notification.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
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
