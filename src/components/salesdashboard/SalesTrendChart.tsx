import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { SalesTrendData } from '../../types/sales.types';

interface SalesTrendChartProps {
  data: SalesTrendData[];
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data }) => {
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return value.toLocaleString('vi-VN');
  };

  // Prepare data for chart
  const categories = data.map((d) => d.month);
  const revenueData = data.map((d) => d.revenue);
  const invoiceCountData = data.map((d) => d.invoiceCount);

  // Bar Chart Configuration with Gradient
  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 320,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '60%',
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return formatCurrency(val);
      },
      offsetY: -25,
      style: {
        fontSize: '11px',
        fontFamily: 'inherit',
        fontWeight: 600,
        colors: ['#1976d2'],
      },
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories,
      labels: {
        style: {
          fontSize: '12px',
          fontFamily: 'inherit',
          colors: '#64748b',
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
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
          return formatCurrency(value);
        },
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: ['#60a5fa'], // Light blue
        opacityFrom: 1,
        opacityTo: 0.85,
        stops: [0, 100],
      },
    },
    colors: ['#1976d2'], // Primary blue
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 3,
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10,
      },
    },
    tooltip: {
      enabled: true,
      theme: 'light',
      style: {
        fontSize: '13px',
        fontFamily: 'inherit',
      },
      y: {
        formatter: function (val: number, opts: { seriesIndex: number; dataPointIndex: number }) {
          const invoiceCount = invoiceCountData[opts.dataPointIndex];
          return `${formatCurrency(val)} VNĐ • ${invoiceCount} đơn hàng`;
        },
      },
    },
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: {
            height: 280,
          },
          dataLabels: {
            enabled: false,
          },
        },
      },
    ],
  };

  const series = [
    {
      name: 'Doanh số',
      data: revenueData,
    },
  ];

  // Calculate total and average
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const avgRevenue = totalRevenue / data.length;
  const totalInvoices = data.reduce((sum, d) => sum + d.invoiceCount, 0);

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
          Doanh số 6 tháng gần nhất
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px', mb: 2 }}>
          Theo dõi xu hướng và hiệu suất bán hàng
        </Typography>

        {/* Bar Chart */}
        <Box sx={{ mt: 2 }}>
          <ReactApexChart
            options={chartOptions}
            series={series}
            type="bar"
            height={320}
          />
        </Box>

        {/* Summary Stats */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
            mt: 3,
            pt: 3,
            borderTop: '2px solid #f1f5f9',
          }}
        >
          <Box textAlign="center">
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                color: '#1976d2',
                fontSize: '18px',
              }}
            >
              {formatCurrency(totalRevenue)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
              Tổng 6 tháng
            </Typography>
          </Box>

          <Box textAlign="center">
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                color: '#10b981',
                fontSize: '18px',
              }}
            >
              {formatCurrency(avgRevenue)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
              TB/tháng
            </Typography>
          </Box>

          <Box textAlign="center">
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                color: '#f59e0b',
                fontSize: '18px',
              }}
            >
              {totalInvoices}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
              Tổng đơn hàng
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SalesTrendChart;
