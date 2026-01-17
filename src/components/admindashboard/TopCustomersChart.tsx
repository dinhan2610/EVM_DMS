import React, { useCallback } from 'react'
import { Card, CardContent, Typography, Box } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { TopCustomer } from '@/types/dashboard.types'
import { formatCurrencyCompact } from '@/utils/currency'

interface TopCustomersChartProps {
  data: TopCustomer[]
}

const TopCustomersChart: React.FC<TopCustomersChartProps> = ({ data }) => {
  const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f']

  interface CustomTooltipProps {
    active?: boolean
    payload?: Array<{
      value: number
      payload: TopCustomer
    }>
  }

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
            {payload[0].payload.customerName}
          </Typography>
          <Typography variant="body2" color="primary">
            Doanh thu: {formatCurrencyCompact(payload[0].value)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Số hóa đơn: {payload[0].payload.invoiceCount}
          </Typography>
        </Box>
      )
    }
    return null
  }, [])

  return (
    <Card>
      <CardContent>
        <Box mb={3}>
          <Typography variant="h6" fontWeight="bold">
            Top khách hàng
          </Typography>
          <Typography variant="body2" color="text.secondary">
            5 khách hàng chi tiêu nhiều nhất
          </Typography>
        </Box>

        {/* Bar Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="customerName"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 11 }}
              stroke="#666"
            />
            <YAxis
              tickFormatter={(value) => formatCurrencyCompact(value)}
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalSpent" name="Tổng chi tiêu" radius={[8, 8, 0, 0]}>
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Summary Table */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          {data.slice(0, 3).map((customer, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.5,
                borderBottom: index < 2 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: COLORS[index],
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 14,
                  }}
                >
                  {index + 1}
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" noWrap>
                    {customer.customerName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {customer.invoiceCount} hóa đơn
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" fontWeight="bold" color="primary">
                {formatCurrencyCompact(customer.totalSpent)}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}

export default TopCustomersChart
