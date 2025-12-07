import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { TrafficData } from '../../types/admin.types';

interface TrafficChartProps {
  data: TrafficData[];
}

const TrafficChart: React.FC<TrafficChartProps> = ({ data }) => {
  // Prepare data for ApexCharts
  const categories = data.map((d) => {
    try {
      return format(new Date(d.date), 'dd/MM', { locale: vi });
    } catch {
      return d.date;
    }
  });

  const requestsData = data.map((d) => d.requests);
  const errorsData = data.map((d) => d.errors);

  // Calculate summary stats
  const totalRequests = data.reduce((sum, d) => sum + d.requests, 0);
  const totalErrors = data.reduce((sum, d) => sum + d.errors, 0);
  const successRate = ((1 - totalErrors / totalRequests) * 100).toFixed(2);

  // ApexCharts Spline Area Configuration
  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 320,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 3,
      curve: 'smooth', // Smooth spline curves
    },
    colors: ['#1976d2', '#ef5350'], // Blue for requests, Red for errors
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.6,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      offsetY: 0,
      fontSize: '13px',
      fontFamily: 'inherit',
      markers: {
        width: 10,
        height: 10,
        radius: 12,
      },
      itemMargin: {
        horizontal: 12,
        vertical: 0,
      },
    },
    xaxis: {
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          fontSize: '12px',
          fontFamily: 'inherit',
          colors: '#64748b',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          fontFamily: 'inherit',
          colors: '#64748b',
        },
        formatter: (value: number) => {
          if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`;
          }
          return value.toString();
        },
      },
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 3,
      padding: {
        top: 0,
        right: 0,
        bottom: 10,
        left: 10,
      },
      row: {
        colors: ['transparent', 'transparent'],
        opacity: 0.5,
      },
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      theme: 'light',
      style: {
        fontSize: '13px',
        fontFamily: 'inherit',
      },
      x: {
        show: true,
        formatter: (value: number) => {
          return categories[value - 1] || '';
        },
      },
      y: {
        formatter: (value: number) => {
          return value.toLocaleString('vi-VN');
        },
      },
      marker: {
        show: true,
      },
    },
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: {
            height: 280,
          },
          legend: {
            position: 'bottom',
            offsetY: 0,
          },
        },
      },
    ],
  };

  const series = [
    {
      name: 'Yêu cầu',
      data: requestsData,
    },
    {
      name: 'Lỗi',
      data: errorsData,
    },
  ];

  return (
    <Card sx={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <CardContent>
        {/* Header */}
        <Box mb={2}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Lưu lượng truy cập hệ thống (7 ngày qua)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Theo dõi số lượng yêu cầu và lỗi để phát hiện sớm các vấn đề bảo mật
          </Typography>
        </Box>

        {/* Spline Area Chart */}
        <Box sx={{ mt: 2 }}>
          <ReactApexChart
            options={chartOptions}
            series={series}
            type="area"
            height={320}
          />
        </Box>

        {/* Summary Stats */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 3,
            mt: 3,
            pt: 3,
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <Box textAlign="center">
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{
                color: '#1976d2',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {totalRequests.toLocaleString('vi-VN')}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Tổng yêu cầu
            </Typography>
          </Box>

          <Box textAlign="center">
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{
                color: '#ef5350',
                background: 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {totalErrors.toLocaleString('vi-VN')}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Tổng lỗi
            </Typography>
          </Box>

          <Box textAlign="center">
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{
                color: '#2e7d32',
                background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {successRate}%
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Tỷ lệ thành công
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TrafficChart;
