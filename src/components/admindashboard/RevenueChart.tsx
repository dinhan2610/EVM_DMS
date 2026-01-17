import React, { useCallback } from 'react'
import { Card, CardContent, Typography, Box } from '@mui/material'
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { RevenueTrendItem } from '@/types/dashboard.types'
import { formatCurrencyCompact } from '@/utils/currency'

interface RevenueChartProps {
  data: RevenueTrendItem[]
  growthPercentage?: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: RevenueTrendItem
  }>
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, growthPercentage }) => {
  // Memoize CustomTooltip để tránh recreation
  const CustomTooltip: React.FC<CustomTooltipProps> = useCallback(({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {payload[0].payload.month}
          </Typography>
          <Typography variant="body2" color="primary">
            Doanh thu: {formatCurrencyCompact(payload[0].value)}
          </Typography>
        </Box>
      )
    }
    return null
  }, [])

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Xu hướng doanh thu
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Biểu đồ doanh thu theo tháng
            </Typography>
          </Box>

          {/* Growth Percentage Badge */}
          {growthPercentage !== undefined && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 2,
                bgcolor: growthPercentage >= 0 ? '#e8f5e9' : '#ffebee',
                color: growthPercentage >= 0 ? '#2e7d32' : '#d32f2f',
              }}
            >
              {growthPercentage >= 0 ? (
                <TrendingUpIcon sx={{ fontSize: 20 }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 20 }} />
              )}
              <Typography variant="h6" fontWeight="bold">
                {growthPercentage >= 0 ? '+' : ''}
                {growthPercentage.toFixed(1)}%
              </Typography>
            </Box>
          )}
        </Box>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis
              tickFormatter={(value) => formatCurrencyCompact(value)}
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Doanh thu"
              stroke="#1976d2"
              strokeWidth={3}
              dot={{ fill: '#1976d2', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        {data.length > 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-around',
              mt: 3,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box textAlign="center">
              <Typography variant="caption" color="text.secondary">
                Số tháng
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {data.length}
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="caption" color="text.secondary">
                Tổng doanh thu
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrencyCompact(data.reduce((sum, item) => sum + item.revenue, 0))}
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="caption" color="text.secondary">
                TB/tháng
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatCurrencyCompact(data.reduce((sum, item) => sum + item.revenue, 0) / data.length)}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box textAlign="center" py={3}>
            <Typography variant="body2" color="text.secondary">
              Chưa có dữ liệu doanh thu
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default RevenueChart
