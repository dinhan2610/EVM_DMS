import React, { useState } from 'react'
import { Box, Card, CardContent, Typography, Dialog, DialogTitle, DialogContent, IconButton, Tooltip, Zoom, alpha } from '@mui/material'
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'
import ReactApexChart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import type { DebtAgingData } from '../../types/dashboard.types'

interface DebtAgingChartProps {
  data: DebtAgingData
}

interface CategoryData {
  label: string
  amount: number
  count: number
  percentage: number
  color: string
  icon: React.ReactNode
  riskLevel: 'safe' | 'warning' | 'danger' | 'critical'
  description: string
}

const DebtAgingChart: React.FC<DebtAgingChartProps> = ({ data }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null)

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Convert API structure to chart data with enhanced info
  const categories: CategoryData[] = [
    {
      ...data.withinDue,
      color: '#10b981',
      icon: <CheckCircleIcon sx={{ fontSize: 20 }} />,
      riskLevel: 'safe',
      description: 'Công nợ trong hạn thanh toán, khách hàng đang thực hiện tốt nghĩa vụ.',
    },
    {
      ...data.overdue1To30,
      color: '#f59e0b',
      icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
      riskLevel: 'warning',
      description: 'Công nợ quá hạn từ 1-30 ngày, cần theo dõi và nhắc nhở thanh toán.',
    },
    {
      ...data.overdue31To60,
      color: '#f97316',
      icon: <WarningIcon sx={{ fontSize: 20 }} />,
      riskLevel: 'danger',
      description: 'Công nợ quá hạn 31-60 ngày, cần liên hệ khách hàng gấp để thu hồi.',
    },
    {
      ...data.criticalOverdue60Plus,
      color: '#ef4444',
      icon: <ErrorIcon sx={{ fontSize: 20 }} />,
      riskLevel: 'critical',
      description: 'Công nợ quá hạn trên 60 ngày, rủi ro mất vốn cao, cần xử lý khẩn cấp.',
    },
  ]

  const chartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 320,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
      toolbar: {
        show: false,
      },
    },
    series: categories.map((d) => d.amount),
    labels: categories.map((d) => d.label),
    colors: categories.map((d) => d.color),

    // Simple Donut Configuration (Following Template)
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          background: 'transparent',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '13px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              color: '#1e293b',
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: '24px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              color: '#1e293b',
              offsetY: 10,
              formatter: function (val: string) {
                return formatCurrency(Number(val))
              },
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Tổng nợ',
              fontSize: '12px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              color: '#64748b',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter: function (w: any) {
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)
                return formatCurrency(total)
              },
            },
          },
        },
      },
    },

    // Data Labels (Simple percentage only)
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + '%'
      },
      style: {
        fontSize: '11px',
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        colors: ['#fff'],
      },
      dropShadow: {
        enabled: false,
      },
    },

    // Legend (Simple template style)
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '12px',
      fontFamily: "'Inter', sans-serif",
      fontWeight: 500,
      offsetY: 7,
      markers: {
        width: 10,
        height: 10,
        radius: 12,
      },
      itemMargin: {
        horizontal: 12,
        vertical: 6,
      },
    },

    // Tooltip (Enhanced with customer count)
    tooltip: {
      enabled: true,
      theme: 'light',
      style: {
        fontSize: '12px',
        fontFamily: "'Inter', sans-serif",
      },
      y: {
        formatter: function (val: number, opts: { seriesIndex: number }) {
          const count = categories[opts.seriesIndex].count
          return `${formatCurrency(val)} • ${count} khách hàng`
        },
      },
    },

    // States (Smooth hover effects)
    states: {
      hover: {
        filter: {
          type: 'lighten',
          value: 0.08,
        },
      },
      active: {
        filter: {
          type: 'none',
        },
      },
    },

    // Responsive (Template breakpoint)
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: {
            height: 280,
          },
          legend: {
            show: true,
            fontSize: '12px',
          },
          plotOptions: {
            pie: {
              donut: {
                labels: {
                  show: true,
                  value: {
                    fontSize: '20px',
                  },
                  total: {
                    fontSize: '12px',
                  },
                },
              },
            },
          },
        },
      },
    ],
  }

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5, fontSize: '1rem', letterSpacing: '-0.02em' }}>
            Phân tích Tuổi nợ
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '12px', fontWeight: 400 }}>
            Đánh giá rủi ro theo độ tuổi công nợ • Click vào từng mục để xem chi tiết
          </Typography>
        </Box>

        {/* Simple Donut Chart */}
        <Box sx={{ mt: 1 }}>
          <ReactApexChart options={chartOptions} series={chartOptions.series as number[]} type="donut" height={320} />
        </Box>

        {/* Summary Stats Grid - Interactive Cards */}
        <Box
          sx={{
            mt: 3,
            pt: 3,
            borderTop: '1px solid #e2e8f0',
          }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
              gap: 2,
            }}>
            {categories.map((item) => (
              <Tooltip key={item.label} title="Click để xem chi tiết" arrow TransitionComponent={Zoom} placement="top">
                <Box
                  onClick={() => setSelectedCategory(item)}
                  sx={{
                    position: 'relative',
                    p: 2,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(item.color, 0.08)} 0%, ${alpha(item.color, 0.03)} 100%)`,
                    border: `1px solid ${alpha(item.color, 0.2)}`,
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${alpha(item.color, 0.2)}`,
                      borderColor: alpha(item.color, 0.4),
                    },
                    '&:active': {
                      transform: 'translateY(-2px)',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: 3,
                      background: item.color,
                    },
                  }}>
                  {/* Status Badge with Icon */}
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 2,
                      bgcolor: alpha(item.color, 0.15),
                      mb: 1.5,
                      color: item.color,
                    }}>
                    {item.icon}
                    <Typography
                      sx={{
                        color: item.color,
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                      }}>
                      {item.label}
                    </Typography>
                  </Box>

                  {/* Amount */}
                  <Typography
                    sx={{
                      color: '#1e293b',
                      fontSize: { xs: '13px', sm: '14px', md: '15px' },
                      fontWeight: 700,
                      mb: 1.5,
                      lineHeight: 1.2,
                    }}>
                    {formatCurrency(item.amount)}
                  </Typography>

                  {/* Footer Stats */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      pt: 1.5,
                      borderTop: `1px dashed ${alpha(item.color, 0.25)}`,
                    }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography
                        sx={{
                          color: '#64748b',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}>
                        {item.count}
                      </Typography>
                      <Typography
                        sx={{
                          color: '#94a3b8',
                          fontSize: '10px',
                          fontWeight: 500,
                        }}>
                        KH
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: 1.5,
                        bgcolor: item.percentage > 0 ? alpha(item.color, 0.15) : '#f1f5f9',
                      }}>
                      <Typography
                        sx={{
                          color: item.percentage > 0 ? item.color : '#94a3b8',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}>
                        {item.percentage.toFixed(2)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Box>
      </CardContent>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}>
        {selectedCategory && (
          <>
            <DialogTitle
              sx={{
                bgcolor: selectedCategory.color,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 2,
              }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {selectedCategory.icon}
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {selectedCategory.label}
                </Typography>
              </Box>
              <IconButton onClick={() => setSelectedCategory(null)} sx={{ color: '#fff' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              {/* Overview Stats */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 2,
                  mb: 3,
                }}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(selectedCategory.color, 0.1),
                  }}>
                  <Typography sx={{ fontSize: '10px', color: '#64748b', mb: 0.5, fontWeight: 500 }}>Tổng công nợ</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{formatCurrency(selectedCategory.amount)}</Typography>
                </Box>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(selectedCategory.color, 0.1),
                  }}>
                  <Typography sx={{ fontSize: '10px', color: '#64748b', mb: 0.5, fontWeight: 500 }}>Số khách hàng</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{selectedCategory.count} KH</Typography>
                </Box>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(selectedCategory.color, 0.1),
                  }}>
                  <Typography sx={{ fontSize: '10px', color: '#64748b', mb: 0.5, fontWeight: 500 }}>Tỷ lệ</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 700, color: selectedCategory.color }}>
                    {selectedCategory.percentage.toFixed(2)}%
                  </Typography>
                </Box>
              </Box>

              {/* Risk Level Badge */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(selectedCategory.color, 0.08),
                  border: `1px solid ${alpha(selectedCategory.color, 0.2)}`,
                  mb: 2,
                }}>
                {selectedCategory.icon}
                <Box>
                  <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Mức độ rủi ro</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: selectedCategory.color }}>
                    {selectedCategory.riskLevel === 'safe' && 'An toàn'}
                    {selectedCategory.riskLevel === 'warning' && 'Cảnh báo'}
                    {selectedCategory.riskLevel === 'danger' && 'Nguy hiểm'}
                    {selectedCategory.riskLevel === 'critical' && 'Nghiêm trọng'}
                  </Typography>
                </Box>
              </Box>

              {/* Description */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}>
                <Typography sx={{ fontSize: '12px', color: '#475569', lineHeight: 1.7, fontWeight: 400 }}>{selectedCategory.description}</Typography>
              </Box>

              {/* Action Hint */}
              {selectedCategory.count > 0 && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>
                    💡 Truy cập trang Công nợ để xem danh sách chi tiết {selectedCategory.count} khách hàng
                  </Typography>
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Card>
  )
}

export default DebtAgingChart
