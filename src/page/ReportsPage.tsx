import { useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Stack,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Autocomplete,
  Divider,
  Alert,
  Chip,
  Card,
  CardContent,
  CardActions,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'

// Interfaces
interface ReportCardProps {
  icon: React.ReactElement
  color: string
  title: string
  description: string
  features: string[]
  onRun: () => void
}

// Mock data for Autocomplete
const mockCustomers = [
  { id: 1, label: 'Công ty TNHH ABC Technology' },
  { id: 2, label: 'Công ty Cổ phần XYZ Solutions' },
  { id: 3, label: 'Doanh nghiệp Tư nhân DEF' },
]

const mockProjects = [
  { id: 1, label: 'Dự án Website Corporate' },
  { id: 2, label: 'Dự án Mobile App iOS' },
  { id: 3, label: 'Dự án ERP System' },
]

// Report Card Component
const ReportCard: React.FC<ReportCardProps> = ({ icon, color, title, description, features, onRun }) => {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          transform: 'translateY(-4px)',
          borderColor: color,
        },
      }}
    >
      <CardContent sx={{ pb: 1.5 }}>
        <Stack spacing={2}>
          {/* Icon & Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Avatar
              sx={{
                bgcolor: `${color}15`,
                color: color,
                width: 56,
                height: 56,
              }}
            >
              {icon}
            </Avatar>
            <Chip
              label="Mới"
              size="small"
              sx={{
                bgcolor: `${color}20`,
                color: color,
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
          </Box>

          {/* Title */}
          <Typography variant="h6" sx={{ fontWeight: 600, minHeight: 56 }}>
            {title}
          </Typography>

          {/* Description */}
          <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
            {description}
          </Typography>

          {/* Features */}
          <Box>
            <Divider sx={{ mb: 1.5 }} />
            <Stack spacing={0.5}>
              {features.map((feature, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: color,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {feature}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<PlayArrowOutlinedIcon />}
          onClick={onRun}
          sx={{
            textTransform: 'none',
            bgcolor: color,
            borderRadius: 2,
            py: 1,
            fontWeight: 600,
            boxShadow: 2,
            '&:hover': {
              bgcolor: `${color}dd`,
              boxShadow: 4,
            },
          }}
        >
          Chạy Báo cáo
        </Button>
      </CardActions>
    </Card>
  )
}

const ReportsPage = () => {
  usePageTitle('Báo cáo')
  
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Modal States
  const [revenueModalOpen, setRevenueModalOpen] = useState(false)
  const [debtModalOpen, setDebtModalOpen] = useState(false)
  const [usageModalOpen, setUsageModalOpen] = useState(false)

  // Filter States - Revenue Report
  const [revenueFromDate, setRevenueFromDate] = useState<Dayjs | null>(dayjs().startOf('month'))
  const [revenueToDate, setRevenueToDate] = useState<Dayjs | null>(dayjs())
  const [revenueCustomer, setRevenueCustomer] = useState<typeof mockCustomers[0] | null>(null)
  const [revenueProject, setRevenueProject] = useState<typeof mockProjects[0] | null>(null)

  // Filter States - Debt Report
  const [debtDate, setDebtDate] = useState<Dayjs | null>(dayjs())
  const [debtCustomer, setDebtCustomer] = useState<typeof mockCustomers[0] | null>(null)
  const [debtAge, setDebtAge] = useState<string>('all')

  // Filter States - Usage Report
  const [usageFromDate, setUsageFromDate] = useState<Dayjs | null>(dayjs().startOf('month'))
  const [usageToDate, setUsageToDate] = useState<Dayjs | null>(dayjs())
  const [usageStatus, setUsageStatus] = useState<string>('all')

  // Handlers
  const handleGenerateRevenueReport = () => {
    alert('Đang tạo báo cáo Doanh thu...')
    setRevenueModalOpen(false)
  }

  const handleGenerateDebtReport = () => {
    alert('Đang tạo báo cáo Công nợ...')
    setDebtModalOpen(false)
  }

  const handleGenerateUsageReport = () => {
    alert('Đang tạo báo cáo Sử dụng Hóa đơn...')
    setUsageModalOpen(false)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <TrendingUpOutlinedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              Trung tâm Báo cáo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Chọn và tạo các báo cáo nghiệp vụ chi tiết, phân tích dữ liệu kinh doanh
            </Typography>
          </Box>
        </Box>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2">
            Các báo cáo có thể được xuất ra định dạng <strong>Excel</strong> hoặc <strong>PDF</strong> để lưu trữ
            và chia sẻ.
          </Typography>
        </Alert>

        {/* Report Cards Grid */}
        <Grid container spacing={3}>
          {/* Card 1: Revenue Report */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ReportCard
              icon={<AssessmentOutlinedIcon sx={{ fontSize: 28 }} />}
              color="#1976d2"
              title="Báo cáo Tổng hợp Doanh thu"
              description="Phân tích doanh thu theo dự án, khách hàng và khoảng thời gian."
              features={[
                'Thống kê theo tháng/quý/năm',
                'Lọc theo khách hàng & dự án',
                'Biểu đồ trực quan',
              ]}
              onRun={() => setRevenueModalOpen(true)}
            />
          </Grid>

          {/* Card 2: Debt Report */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ReportCard
              icon={<AccountBalanceWalletOutlinedIcon sx={{ fontSize: 28 }} />}
              color="#ef5350"
              title="Báo cáo Công nợ Khách hàng"
              description="Theo dõi công nợ phải thu, tuổi nợ 30-60-90+ ngày của khách hàng."
              features={[
                'Phân loại theo tuổi nợ',
                'Cảnh báo quá hạn',
                'Lịch sử thanh toán',
              ]}
              onRun={() => setDebtModalOpen(true)}
            />
          </Grid>

          {/* Card 3: Usage Report */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ReportCard
              icon={<DescriptionOutlinedIcon sx={{ fontSize: 28 }} />}
              color="#757575"
              title="Bảng kê Sử dụng Hóa đơn"
              description="Bảng kê chi tiết hóa đơn đã phát hành, hủy... phục vụ báo cáo thuế."
              features={[
                'Theo dõi ký hiệu, số HĐ',
                'Trạng thái phát hành/hủy',
                'Tuân thủ quy định CQT',
              ]}
              onRun={() => setUsageModalOpen(true)}
            />
          </Grid>
        </Grid>

        {/* Preview & Export Area */}
        <Paper
          sx={{
            mt: 4,
            p: 3,
            borderRadius: 2,
            bgcolor: 'grey.50',
            border: '2px dashed',
            borderColor: 'divider',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Kết quả xem trước
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Báo cáo sẽ hiển thị tại đây sau khi được tạo
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<DownloadOutlinedIcon />}
                disabled
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                }}
              >
                Xuất Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfOutlinedIcon />}
                disabled
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                }}
              >
                Xuất PDF
              </Button>
            </Stack>
          </Stack>

          <Box
            sx={{
              height: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <DescriptionOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.disabled">
              Chưa có dữ liệu. Vui lòng chạy một báo cáo.
            </Typography>
          </Box>
        </Paper>

        {/* Modal 1: Revenue Report */}
        <Dialog
          open={revenueModalOpen}
          onClose={() => setRevenueModalOpen(false)}
          fullScreen={isMobile}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 3 },
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontWeight: 600,
              p: { xs: 2, sm: 3 },
            }}
          >
            <AssessmentOutlinedIcon color="primary" />
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              Tạo Báo cáo Doanh thu
            </Typography>
          </DialogTitle>

          <Divider />

          <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
              Chọn khoảng thời gian và các bộ lọc để tạo báo cáo doanh thu chi tiết.
            </Alert>

            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Từ ngày"
                    value={revenueFromDate}
                    onChange={(newValue) => setRevenueFromDate(newValue)}
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
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Đến ngày"
                    value={revenueToDate}
                    onChange={(newValue) => setRevenueToDate(newValue)}
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
              </Grid>

              <Autocomplete
                size="small"
                options={mockCustomers}
                value={revenueCustomer}
                onChange={(_, newValue) => setRevenueCustomer(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Lọc theo Khách hàng (Tùy chọn)"
                    placeholder="Chọn khách hàng"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <BusinessOutlinedIcon sx={{ ml: 1, mr: 0.5, fontSize: 20, color: 'action.active' }} />
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

              <Autocomplete
                size="small"
                options={mockProjects}
                value={revenueProject}
                onChange={(_, newValue) => setRevenueProject(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Lọc theo Dự án (Tùy chọn)"
                    placeholder="Chọn dự án"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <DescriptionOutlinedIcon sx={{ ml: 1, mr: 0.5, fontSize: 20, color: 'action.active' }} />
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
            </Stack>
          </DialogContent>

          <Divider />

          <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1 }}>
            <Button
              onClick={() => setRevenueModalOpen(false)}
              color="inherit"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleGenerateRevenueReport}
              variant="contained"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              Tạo Báo cáo
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal 2: Debt Report */}
        <Dialog
          open={debtModalOpen}
          onClose={() => setDebtModalOpen(false)}
          fullScreen={isMobile}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 3 },
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontWeight: 600,
              p: { xs: 2, sm: 3 },
            }}
          >
            <AccountBalanceWalletOutlinedIcon color="error" />
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              Tạo Báo cáo Công nợ
            </Typography>
          </DialogTitle>

          <Divider />

          <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
              Báo cáo công nợ giúp theo dõi các khoản phải thu từ khách hàng.
            </Alert>

            <Stack spacing={2.5}>
              <DatePicker
                label="Tính đến ngày"
                value={debtDate}
                onChange={(newValue) => setDebtDate(newValue)}
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

              <Autocomplete
                size="small"
                options={mockCustomers}
                value={debtCustomer}
                onChange={(_, newValue) => setDebtCustomer(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Lọc theo Khách hàng (Bỏ trống để xem tất cả)"
                    placeholder="Chọn khách hàng"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <BusinessOutlinedIcon sx={{ ml: 1, mr: 0.5, fontSize: 20, color: 'action.active' }} />
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

              <FormControl fullWidth size="small">
                <InputLabel>Lọc theo Tuổi nợ</InputLabel>
                <Select
                  value={debtAge}
                  label="Lọc theo Tuổi nợ"
                  onChange={(e) => setDebtAge(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="30">30+ ngày</MenuItem>
                  <MenuItem value="60">60+ ngày</MenuItem>
                  <MenuItem value="90">90+ ngày</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>

          <Divider />

          <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1 }}>
            <Button
              onClick={() => setDebtModalOpen(false)}
              color="inherit"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleGenerateDebtReport}
              variant="contained"
              color="error"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              Tạo Báo cáo
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal 3: Usage Report */}
        <Dialog
          open={usageModalOpen}
          onClose={() => setUsageModalOpen(false)}
          fullScreen={isMobile}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 3 },
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontWeight: 600,
              p: { xs: 2, sm: 3 },
            }}
          >
            <DescriptionOutlinedIcon sx={{ color: 'grey.700' }} />
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              Bảng kê Sử dụng Hóa đơn
            </Typography>
          </DialogTitle>

          <Divider />

          <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
              Báo cáo phục vụ khai thuế và đối chiếu với Cơ quan Thuế.
            </Alert>

            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Từ ngày"
                    value={usageFromDate}
                    onChange={(newValue) => setUsageFromDate(newValue)}
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
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Đến ngày"
                    value={usageToDate}
                    onChange={(newValue) => setUsageToDate(newValue)}
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
              </Grid>

              <FormControl fullWidth size="small">
                <InputLabel>Trạng thái Hóa đơn</InputLabel>
                <Select
                  value={usageStatus}
                  label="Trạng thái Hóa đơn"
                  onChange={(e) => setUsageStatus(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="issued">Đã phát hành</MenuItem>
                  <MenuItem value="cancelled">Đã hủy</MenuItem>
                  <MenuItem value="draft">Nháp</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>

          <Divider />

          <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1 }}>
            <Button
              onClick={() => setUsageModalOpen(false)}
              color="inherit"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleGenerateUsageReport}
              variant="contained"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                bgcolor: 'grey.700',
                boxShadow: 2,
                '&:hover': {
                  bgcolor: 'grey.800',
                  boxShadow: 4,
                },
              }}
            >
              Tạo Báo cáo
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}

export default ReportsPage
