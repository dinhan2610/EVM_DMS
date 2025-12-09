import { Card, CardContent, Typography, Box } from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface RevenueData {
  month: string
  revenue: number
}

const RevenueChart = () => {
  // Mock data - 12 tháng trong năm
  const data: RevenueData[] = [
    { month: 'T1', revenue: 45000000 },
    { month: 'T2', revenue: 52000000 },
    { month: 'T3', revenue: 48000000 },
    { month: 'T4', revenue: 61000000 },
    { month: 'T5', revenue: 55000000 },
    { month: 'T6', revenue: 67000000 },
    { month: 'T7', revenue: 73000000 },
    { month: 'T8', revenue: 69000000 },
    { month: 'T9', revenue: 78000000 },
    { month: 'T10', revenue: 82000000 },
    { month: 'T11', revenue: 88000000 },
    { month: 'T12', revenue: 95000000 },
  ]

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: RevenueData }> }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            p: 1.5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
            {payload[0].payload.month}
          </Typography>
          <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600 }}>
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              maximumFractionDigits: 0,
            }).format(payload[0].value)}
          </Typography>
        </Box>
      )
    }
    return null
  }

  // Format Y-axis - Rút gọn (10tr, 20tr...)
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}tr`
    }
    return value.toString()
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
      <CardContent sx={{ p: 3, height: '100%' }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
            Doanh thu theo tháng (Năm nay)
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Tổng doanh thu: {' '}
            <Box component="span" sx={{ fontWeight: 700, color: '#1976d2' }}>
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                maximumFractionDigits: 0,
              }).format(data.reduce((sum, item) => sum + item.revenue, 0))}
            </Box>
          </Typography>
        </Box>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#666', fontSize: 12 }}
              tickLine={{ stroke: '#e0e0e0' }}
              axisLine={{ stroke: '#e0e0e0' }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: '#666', fontSize: 12 }}
              tickLine={{ stroke: '#e0e0e0' }}
              axisLine={{ stroke: '#e0e0e0' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(25, 118, 210, 0.05)' }} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
              formatter={() => 'Doanh thu'}
            />
            <Bar
              dataKey="revenue"
              fill="#1976d2"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default RevenueChart
