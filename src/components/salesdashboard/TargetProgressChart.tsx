import React from 'react';
import { Box, Card, CardContent, Typography, LinearProgress } from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { TargetProgress } from '../../types/sales.types';

interface TargetProgressChartProps {
  data: TargetProgress;
}

const TargetProgressChart: React.FC<TargetProgressChartProps> = ({ data }) => {
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return value.toLocaleString('vi-VN');
  };

  // Radial Bar Chart Configuration
  const chartOptions: ApexOptions = {
    chart: {
      type: 'radialBar',
      height: 280,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 1200,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          margin: 0,
          size: '70%',
          background: '#fff',
        },
        track: {
          background: '#f1f5f9',
          strokeWidth: '100%',
          margin: 5,
        },
        dataLabels: {
          show: true,
          name: {
            offsetY: -15,
            show: true,
            color: '#64748b',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'inherit',
          },
          value: {
            formatter: function (val: number) {
              return val.toFixed(0) + '%';
            },
            offsetY: 5,
            color: '#1e293b',
            fontSize: '36px',
            fontWeight: 700,
            fontFamily: 'inherit',
            show: true,
          },
        },
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: ['#f59e0b'], // Gold
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    stroke: {
      lineCap: 'round',
    },
    labels: ['Hoàn thành'],
    colors: ['#1976d2'], // Blue
  };

  const series = [data.completionRate];

  // Motivational message based on progress
  const getMotivationalMessage = (): { text: string; color: string } => {
    if (data.completionRate >= 100) {
      return { text: '🎉 Xuất sắc! Bạn đã vượt chỉ tiêu!', color: '#10b981' };
    }
    if (data.completionRate >= 90) {
      return {
        text: `💪 Chỉ còn ${formatCurrency(data.remainingAmount)} VNĐ nữa!`,
        color: '#f59e0b',
      };
    }
    if (data.completionRate >= 70) {
      return {
        text: `🚀 Đang tiến rất tốt! Còn ${data.daysLeft} ngày!`,
        color: '#3b82f6',
      };
    }
    return {
      text: `⏰ Cần tăng tốc! Còn ${formatCurrency(data.remainingAmount)} VNĐ`,
      color: '#ef5350',
    };
  };

  const motivation = getMotivationalMessage();

  return (
    <Card
      sx={{
        height: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #f1f5f9',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', mb: 0.5 }}>
          Tiến độ chỉ tiêu
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px', mb: 2 }}>
          Mục tiêu tháng này
        </Typography>

        {/* Radial Chart */}
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <ReactApexChart
            options={chartOptions}
            series={series}
            type="radialBar"
            height={280}
          />
        </Box>

        {/* Progress Details */}
        <Box sx={{ mt: 3 }}>
          {/* Current vs Target */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
              Hiện tại
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: '#1976d2' }}>
              {formatCurrency(data.currentRevenue)} VNĐ
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
              Mục tiêu
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: '#1e293b' }}>
              {formatCurrency(data.targetRevenue)} VNĐ
            </Typography>
          </Box>

          {/* Linear Progress Bar */}
          <LinearProgress
            variant="determinate"
            value={data.completionRate}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: '#f1f5f9',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(90deg, #1976d2 0%, #f59e0b 100%)',
              },
            }}
          />

          {/* Motivational Message */}
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: `${motivation.color}15`,
              border: `1px solid ${motivation.color}30`,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: motivation.color,
                fontWeight: 600,
                textAlign: 'center',
                fontSize: '14px',
              }}
            >
              {motivation.text}
            </Typography>
          </Box>

          {/* Days Left */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '11px' }}>
              Còn {data.daysLeft} ngày trong tháng
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TargetProgressChart;
