import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { TrafficData } from '../../types/admin.types';

interface TrafficChartProps {
  data: TrafficData[];
}

// Custom Tooltip Component
interface CustomTooltipPayload {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayload[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <Box
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.98)',
        p: 2,
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <Typography variant="subtitle2" fontWeight={600} mb={1}>
        {label}
      </Typography>
      {payload.map((entry) => (
        <Box key={entry.dataKey} display="flex" alignItems="center" gap={1} mb={0.5}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: entry.color,
            }}
          />
          <Typography variant="body2" color="text.secondary">
            {entry.name}:
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {entry.value.toLocaleString('vi-VN')}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const TrafficChart: React.FC<TrafficChartProps> = ({ data }) => {
  // Format number for Y-axis (e.g., 3500 -> "3.5k")
  const formatYAxis = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Lưu lượng truy cập hệ thống (7 ngày qua)
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Theo dõi số lượng yêu cầu và lỗi để phát hiện sớm các vấn đề bảo mật
        </Typography>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                try {
                  return format(new Date(value), 'dd/MM', { locale: vi });
                } catch {
                  return value;
                }
              }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value) => {
                if (value === 'requests') return 'Yêu cầu';
                if (value === 'errors') return 'Lỗi';
                return value;
              }}
            />
            <Line
              type="monotone"
              dataKey="requests"
              stroke="#1976d2"
              strokeWidth={2}
              dot={{ fill: '#1976d2', r: 4 }}
              activeDot={{ r: 6 }}
              name="requests"
            />
            <Line
              type="monotone"
              dataKey="errors"
              stroke="#d32f2f"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#d32f2f', r: 4 }}
              activeDot={{ r: 6 }}
              name="errors"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <Box display="flex" gap={3} mt={3} justifyContent="center">
          <Box textAlign="center">
            <Typography variant="h5" fontWeight="bold" color="#1976d2">
              {data.reduce((sum, d) => sum + d.requests, 0).toLocaleString('vi-VN')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tổng yêu cầu
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" fontWeight="bold" color="#d32f2f">
              {data.reduce((sum, d) => sum + d.errors, 0).toLocaleString('vi-VN')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tổng lỗi
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" fontWeight="bold" color="#2e7d32">
              {((1 - data.reduce((sum, d) => sum + d.errors, 0) / data.reduce((sum, d) => sum + d.requests, 0)) * 100).toFixed(2)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tỷ lệ thành công
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TrafficChart;
