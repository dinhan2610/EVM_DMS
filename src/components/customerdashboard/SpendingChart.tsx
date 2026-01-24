import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { SpendingData } from '../../types/customer.types';

interface SpendingChartProps {
  data: SpendingData[];
}

const SpendingChart: React.FC<SpendingChartProps> = ({ data }) => {
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return value.toLocaleString('vi-VN');
  };

  // Prepare data for chart
  const categories = data.map((d) => d.month);
  const paidData = data.map((d) => d.paidAmount);
  const unpaidData = data.map((d) => d.unpaidAmount);

  // Bar Chart Configuration
  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
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
        horizontal: false,
        columnWidth: '65%',
        borderRadius: 6,
      },
    },
    dataLabels: {
      enabled: false,
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
          colors: 'var(--mui-palette-text-secondary)',
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
          colors: 'var(--mui-palette-text-secondary)',
        },
        formatter: (value: number) => {
          return formatCurrency(value);
        },
      },
    },
    fill: {
      opacity: 1,
    },
    colors: ['#10b981', '#f59e0b'], // Green for paid, Orange for unpaid - ApexCharts needs hex
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
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
    grid: {
      borderColor: '#f1f5f9', // ApexCharts requires hex
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
          const invoiceCount = data[opts.dataPointIndex].invoiceCount;
          return `${formatCurrency(val)} VNĐ • ${invoiceCount} hóa đơn`;
        },
      },
    },
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: {
            height: 300,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
  };

  const series = [
    {
      name: 'Đã thanh toán',
      data: paidData,
    },
    {
      name: 'Chưa thanh toán',
      data: unpaidData,
    },
  ];

  // Calculate totals
  const totalYear = data.reduce((sum, d) => sum + d.totalAmount, 0);
  const totalPaid = data.reduce((sum, d) => sum + d.paidAmount, 0);
  const totalUnpaid = data.reduce((sum, d) => sum + d.unpaidAmount, 0);
  const totalInvoices = data.reduce((sum, d) => sum + d.invoiceCount, 0);

  return (
    <Card
      sx={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #f1f5f9',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
          Chi phí theo tháng (Năm 2025)
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px', mb: 3 }}>
          Theo dõi chi tiêu và quản lý ngân sách của bạn
        </Typography>

        {/* Chart */}
        <Box sx={{ mt: 2 }}>
          <ReactApexChart
            options={chartOptions}
            series={series}
            type="bar"
            height={350}
          />
        </Box>

        {/* Summary Stats */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
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
                color: 'primary.main',
                fontSize: '18px',
              }}
            >
              {formatCurrency(totalYear)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
              Tổng chi năm
            </Typography>
          </Box>

          <Box textAlign="center">
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                color: 'success.main',
                fontSize: '18px',
              }}
            >
              {formatCurrency(totalPaid)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
              Đã thanh toán
            </Typography>
          </Box>

          <Box textAlign="center">
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                color: 'warning.main',
                fontSize: '18px',
              }}
            >
              {formatCurrency(totalUnpaid)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
              Chưa thanh toán
            </Typography>
          </Box>

          <Box textAlign="center">
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                color: 'secondary.main',
                fontSize: '18px',
              }}
            >
              {totalInvoices}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
              Tổng hóa đơn
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SpendingChart;
