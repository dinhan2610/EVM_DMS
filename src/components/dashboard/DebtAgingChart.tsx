import React from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { DebtAgingData } from '../../types/dashboard.types';

interface DebtAgingChartProps {
  data: DebtAgingData[];
}

const DebtAgingChart: React.FC<DebtAgingChartProps> = ({ data }) => {
  const formatCurrency = (value: number): string => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B VNĐ`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M VNĐ`;
    }
    return value.toLocaleString('vi-VN') + ' VNĐ';
  };

  const chartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 340,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
      toolbar: {
        show: false,
      },
    },
    series: data.map((d) => d.amount),
    labels: data.map((d) => d.category),
    colors: data.map((d) => d.color),
    
    // Donut configuration
    plotOptions: {
      pie: {
        startAngle: 0,
        endAngle: 360,
        expandOnClick: true,
        offsetX: 0,
        offsetY: 0,
        customScale: 1,
        dataLabels: {
          offset: 0,
          minAngleToShowLabel: 10,
        },
        donut: {
          size: '70%',
          background: 'transparent',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontFamily: 'inherit',
              fontWeight: 600,
              color: '#1e293b',
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: '24px',
              fontFamily: 'inherit',
              fontWeight: 700,
              color: '#1e293b',
              offsetY: 10,
              formatter: function (val: string) {
                return formatCurrency(Number(val));
              },
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Tổng nợ',
              fontSize: '13px',
              fontFamily: 'inherit',
              fontWeight: 500,
              color: '#64748b',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter: function (w: any) {
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                return formatCurrency(total);
              },
            },
          },
        },
      },
    },

    // Data Labels
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + '%';
      },
      style: {
        fontSize: '13px',
        fontFamily: 'inherit',
        fontWeight: 600,
        colors: ['#fff'],
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 1,
        color: '#000',
        opacity: 0.3,
      },
    },

    // Legend
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '13px',
      fontFamily: 'inherit',
      fontWeight: 500,
      markers: {
        width: 12,
        height: 12,
        radius: 12,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 8,
      },
      formatter: function (seriesName: string, opts: { seriesIndex: number; w: { config: { series: number[] } } }) {
        const count = data[opts.seriesIndex].count;
        return `${seriesName} (${count} KH)`;
      },
    },

    // Tooltip
    tooltip: {
      enabled: true,
      style: {
        fontSize: '13px',
        fontFamily: 'inherit',
      },
      y: {
        formatter: function (val: number, opts: { seriesIndex: number }) {
          const count = data[opts.seriesIndex].count;
          return `${formatCurrency(val)} - ${count} khách hàng`;
        },
      },
    },

    // States
    states: {
      hover: {
        filter: {
          type: 'lighten',
          value: 0.1,
        },
      },
      active: {
        filter: {
          type: 'darken',
          value: 0.1,
        },
      },
    },

    // Responsive
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: {
            height: 280,
          },
          legend: {
            position: 'bottom',
            fontSize: '12px',
          },
          dataLabels: {
            style: {
              fontSize: '11px',
            },
          },
        },
      },
    ],
  };

  // Calculate risk metrics
  const totalDebt = data.reduce((sum, d) => sum + d.amount, 0);
  const criticalDebt = data.slice(-1)[0]?.amount || 0; // Last segment (>60 days)
  const riskPercentage = (criticalDebt / totalDebt) * 100;

  return (
    <Card elevation={0} sx={{ height: '100%', border: '1px solid #f1f5f9' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', mb: 0.5 }}>
              Phân tích Tuổi nợ
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
              Đánh giá rủi ro nợ xấu
            </Typography>
          </Box>
          <Chip
            label={riskPercentage >= 20 ? 'Rủi ro cao' : riskPercentage >= 10 ? 'Cảnh báo' : 'An toàn'}
            color={riskPercentage >= 20 ? 'error' : riskPercentage >= 10 ? 'warning' : 'success'}
            sx={{
              fontWeight: 700,
              fontSize: '12px',
            }}
          />
        </Box>

        {/* Chart */}
        <Box sx={{ mt: 2 }}>
          <ReactApexChart
            options={chartOptions}
            series={chartOptions.series as number[]}
            type="donut"
            height={340}
          />
        </Box>

        {/* Summary Stats */}
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <Box display="flex" flexWrap="wrap" gap={3} justifyContent="space-around">
            {data.map((item) => (
              <Box key={item.category} textAlign="center">
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: item.color,
                    mx: 'auto',
                    mb: 0.5,
                  }}
                />
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px', display: 'block' }}>
                  {item.category}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#1e293b', fontSize: '14px' }}>
                  {formatCurrency(item.amount)}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '10px' }}>
                  {item.count} khách hàng
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DebtAgingChart;
