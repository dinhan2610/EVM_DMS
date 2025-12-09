import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  alpha,
} from '@mui/material'
import {
  Description,
  Assessment,
  Star,
  TrendingUp,
  AccountBalance,
  PieChart,
  ArrowForward,
} from '@mui/icons-material'

interface ReportShortcut {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  badge?: string
  route: string
}

const ReportShortcuts = () => {
  // Mock Data - Shortcuts to Report Pages
  const shortcuts: ReportShortcut[] = [
    {
      id: '1',
      title: 'Báo cáo Thuế (Bảng kê bán ra)',
      description: 'Xuất bảng kê hóa đơn theo kỳ thuế',
      icon: Description,
      color: '#1976d2',
      badge: 'Quan trọng',
      route: '/admin/reports/tax',
    },
    {
      id: '2',
      title: 'Tình hình sử dụng HĐ (BC-26)',
      description: 'Báo cáo sử dụng hóa đơn gửi cơ quan thuế',
      icon: Assessment,
      color: '#7b1fa2',
      badge: 'Hàng tháng',
      route: '/admin/reports/bc26',
    },
    {
      id: '3',
      title: 'Top Khách hàng & Sản phẩm',
      description: 'Phân tích khách hàng và sản phẩm bán chạy',
      icon: Star,
      color: '#f57c00',
      route: '/admin/reports/top-customers',
    },
    {
      id: '4',
      title: 'Doanh thu & Lợi nhuận',
      description: 'Báo cáo tài chính tổng hợp theo kỳ',
      icon: TrendingUp,
      color: '#2e7d32',
      route: '/admin/reports/revenue',
    },
    {
      id: '5',
      title: 'Công nợ phải thu',
      description: 'Theo dõi công nợ và lịch sử thanh toán',
      icon: AccountBalance,
      color: '#d32f2f',
      badge: 'Cần xử lý',
      route: '/admin/reports/receivables',
    },
    {
      id: '6',
      title: 'Phân tích trạng thái HĐ',
      description: 'Thống kê hóa đơn theo trạng thái',
      icon: PieChart,
      color: '#0288d1',
      route: '/admin/reports/invoice-status',
    },
  ]

  const handleNavigate = (route: string) => {
    // Navigate to report page
    console.log('Navigate to:', route)
    // window.location.href = route // Simple navigation
    // Or use React Router: navigate(route)
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
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
            Trung tâm Báo cáo & Thuế
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Truy cập nhanh các báo cáo quan trọng
          </Typography>
        </Box>

        {/* Shortcuts List */}
        <List sx={{ p: 0 }}>
          {shortcuts.map((shortcut, index) => {
            const IconComponent = shortcut.icon
            return (
              <ListItem
                key={shortcut.id}
                disablePadding
                sx={{
                  mb: index < shortcuts.length - 1 ? 1 : 0,
                }}
              >
                <ListItemButton
                  onClick={() => handleNavigate(shortcut.route)}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid #f0f0f0',
                    px: 2,
                    py: 1.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: alpha(shortcut.color, 0.3),
                      backgroundColor: alpha(shortcut.color, 0.05),
                      transform: 'translateX(4px)',
                      '& .arrow-icon': {
                        transform: 'translateX(4px)',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 48 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: alpha(shortcut.color, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconComponent sx={{ fontSize: 20, color: shortcut.color }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: '#1a1a1a',
                            fontSize: '0.875rem',
                          }}
                        >
                          {shortcut.title}
                        </Typography>
                        {shortcut.badge && (
                          <Chip
                            label={shortcut.badge}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              backgroundColor: alpha(shortcut.color, 0.15),
                              color: shortcut.color,
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#666',
                          fontSize: '0.75rem',
                          display: 'block',
                        }}
                      >
                        {shortcut.description}
                      </Typography>
                    }
                  />
                  <ArrowForward
                    className="arrow-icon"
                    sx={{
                      fontSize: 18,
                      color: '#999',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>

        {/* Footer Stats */}
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" sx={{ color: '#666' }}>
            Cập nhật lần cuối: Hôm nay, 11:30
          </Typography>
          <Chip
            label="6 Báo cáo"
            size="small"
            sx={{
              backgroundColor: '#f5f5f5',
              color: '#666',
              fontSize: '0.7rem',
              fontWeight: 600,
            }}
          />
        </Box>
      </CardContent>
    </Card>
  )
}

export default ReportShortcuts
