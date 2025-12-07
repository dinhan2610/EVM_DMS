import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
} from '@mui/material'
import {
  Receipt,
  Delete,
  Send,
  CheckCircle,
  Edit,
  Warning,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Activity {
  id: string
  type: 'invoice' | 'delete' | 'system' | 'payment' | 'edit' | 'warning'
  title: string
  description: string
  timestamp: Date
  user: string
}

const RecentActivities = () => {
  // Mock Data - Hoạt động gần đây
  const activities: Activity[] = [
    {
      id: '1',
      type: 'invoice',
      title: 'Tạo hóa đơn mới',
      description: 'Kế toán Nguyễn Văn A vừa tạo hóa đơn #HD-2025-001',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
      user: 'Nguyễn Văn A',
    },
    {
      id: '2',
      type: 'payment',
      title: 'Thanh toán thành công',
      description: 'Khách hàng Công ty ABC đã thanh toán hóa đơn #HD-2024-998',
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
      user: 'Hệ thống',
    },
    {
      id: '3',
      type: 'delete',
      title: 'Xóa mẫu email',
      description: 'Admin đã xóa mẫu email "Thông báo cũ"',
      timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 mins ago
      user: 'Admin',
    },
    {
      id: '4',
      type: 'system',
      title: 'Gửi bảng kê tự động',
      description: 'Hệ thống đã gửi bảng kê cho KH Công ty XYZ',
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      user: 'Hệ thống',
    },
    {
      id: '5',
      type: 'edit',
      title: 'Cập nhật thông tin',
      description: 'Kế toán B đã cập nhật thông tin khách hàng DEF',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      user: 'Kế toán B',
    },
  ]

  // Activity type config
  const activityConfig = {
    invoice: {
      icon: Receipt,
      color: '#1976d2',
      bgColor: 'rgba(25, 118, 210, 0.1)',
    },
    payment: {
      icon: CheckCircle,
      color: '#2e7d32',
      bgColor: 'rgba(46, 125, 50, 0.1)',
    },
    delete: {
      icon: Delete,
      color: '#d32f2f',
      bgColor: 'rgba(211, 47, 47, 0.1)',
    },
    system: {
      icon: Send,
      color: '#0288d1',
      bgColor: 'rgba(2, 136, 209, 0.1)',
    },
    edit: {
      icon: Edit,
      color: '#ed6c02',
      bgColor: 'rgba(237, 108, 2, 0.1)',
    },
    warning: {
      icon: Warning,
      color: '#f57c00',
      bgColor: 'rgba(245, 124, 0, 0.1)',
    },
  }

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        height: '100%',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
              Hoạt động gần đây
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              {activities.length} hoạt động mới nhất
            </Typography>
          </Box>
          <Chip
            label="Hôm nay"
            size="small"
            sx={{
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              color: '#1976d2',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        </Box>

        {/* Activities List */}
        <List sx={{ p: 0 }}>
          {activities.map((activity, index) => {
            const config = activityConfig[activity.type]
            const IconComponent = config.icon
            const timeAgo = formatDistanceToNow(activity.timestamp, {
              addSuffix: true,
              locale: vi,
            })

            return (
              <ListItem
                key={activity.id}
                sx={{
                  px: 0,
                  py: 2,
                  borderBottom: index < activities.length - 1 ? '1px solid #f0f0f0' : 'none',
                  '&:hover': {
                    backgroundColor: '#fafafa',
                    borderRadius: 1,
                    px: 1.5,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      backgroundColor: config.bgColor,
                      width: 44,
                      height: 44,
                    }}
                  >
                    <IconComponent sx={{ fontSize: 22, color: config.color }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: '#1a1a1a',
                        fontSize: '0.875rem',
                        mb: 0.5,
                      }}
                    >
                      {activity.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666',
                          fontSize: '0.8125rem',
                          mb: 0.5,
                        }}
                      >
                        {activity.description}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#999',
                          fontSize: '0.75rem',
                        }}
                      >
                        {timeAgo} • {activity.user}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            )
          })}
        </List>

        {/* View All Link */}
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: '1px solid #f0f0f0',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#1976d2',
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Xem tất cả hoạt động →
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default RecentActivities
