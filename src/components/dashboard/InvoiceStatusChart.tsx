import { Card, CardContent, Typography, Box } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface InvoiceStatusData {
  name: string
  value: number
  color: string
  [key: string]: string | number // Index signature for Recharts compatibility
}

interface LegendPayloadItem {
  value?: string
  color?: string
  type?: string
  id?: string
}

const InvoiceStatusChart = () => {
  // Mock data
  const data: InvoiceStatusData[] = [
    { name: 'Đã thanh toán', value: 145, color: '#2e7d32' }, // Green
    { name: 'Chưa thanh toán', value: 58, color: '#d32f2f' }, // Red
  ]

  const totalInvoices = data.reduce((sum, item) => sum + item.value, 0)

  // Custom Label - Center Text
  const renderCenterLabel = () => {
    return (
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: '32px', fontWeight: 700, fill: '#1a1a1a' }}
      >
        {totalInvoices}
      </text>
    )
  }

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: InvoiceStatusData }> }) => {
    if (active && payload && payload.length) {
      const percent = ((payload[0].value / totalInvoices) * 100).toFixed(1)
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
            {payload[0].name}
          </Typography>
          <Typography variant="body2" sx={{ color: payload[0].payload.color, fontWeight: 600 }}>
            {payload[0].value} hóa đơn ({percent}%)
          </Typography>
        </Box>
      )
    }
    return null
  }

  // Custom Legend
  const renderLegend = (props: { payload?: ReadonlyArray<LegendPayloadItem> }) => {
    const { payload } = props
    if (!payload) return null
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
        {payload.map((entry: LegendPayloadItem, index: number) => {
          if (!entry.value) return null
          const dataItem = data.find(d => d.name === entry.value)
          const percent = dataItem ? ((dataItem.value / totalInvoices) * 100).toFixed(1) : '0'
          return (
            <Box key={`legend-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: entry.color || '#999',
                }}
              />
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
                {entry.value} <Box component="span" sx={{ fontWeight: 600 }}>({percent}%)</Box>
              </Typography>
            </Box>
          )
        })}
      </Box>
    )
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
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
            Tỷ lệ thanh toán
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Tổng số: <Box component="span" sx={{ fontWeight: 700 }}>{totalInvoices} hóa đơn</Box>
          </Typography>
        </Box>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
            {renderCenterLabel()}
          </PieChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f0f0f0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Tỷ lệ thu hồi:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#2e7d32' }}>
              {((data[0].value / totalInvoices) * 100).toFixed(1)}%
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Cần xử lý:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#d32f2f' }}>
              {data[1].value} hóa đơn
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default InvoiceStatusChart
