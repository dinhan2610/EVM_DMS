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
      height: 320,
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
    
    // Simple Donut Configuration (Following Template)
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
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
              fontSize: '28px',
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
              fontWeight: 600,
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

    // Data Labels (Simple percentage only)
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + '%';
      },
      style: {
        fontSize: '12px',
        fontFamily: 'inherit',
        fontWeight: 600,
        colors: ['#fff'],
      },
      dropShadow: {
        enabled: false,
      },
    },

    // Legend (Simple template style)
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '14px',
      fontFamily: 'inherit',
      fontWeight: 500,
      offsetY: 7,
      markers: {
        width: 10,
        height: 10,
        radius: 12,
      },
      itemMargin: {
        horizontal: 12,
        vertical: 6,
      },
    },

    // Tooltip (Enhanced with customer count)
    tooltip: {
      enabled: true,
      theme: 'light',
      style: {
        fontSize: '13px',
        fontFamily: 'inherit',
      },
      y: {
        formatter: function (val: number, opts: { seriesIndex: number }) {
          const count = data[opts.seriesIndex].count;
          return `${formatCurrency(val)} • ${count} khách hàng`;
        },
      },
    },

    // States (Smooth hover effects)
    states: {
      hover: {
        filter: {
          type: 'lighten',
          value: 0.08,
        },
      },
      active: {
        filter: {
          type: 'none',
        },
      },
    },

    // Responsive (Template breakpoint)
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: {
            height: 280,
          },
          legend: {
            show: true,
            fontSize: '12px',
          },
          plotOptions: {
            pie: {
              donut: {
                labels: {
                  show: true,
                  value: {
                    fontSize: '20px',
                  },
                  total: {
                    fontSize: '12px',
                  },
                },
              },
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
    <Card 
      elevation={0} 
      sx={{ 
        height: '100%', 
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', mb: 0.5 }}>
              Phân tích Tuổi nợ
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
              Đánh giá rủi ro theo độ tuổi công nợ
            </Typography>
          </Box>
          <Chip
            label={riskPercentage >= 20 ? 'Rủi ro cao' : riskPercentage >= 10 ? 'Cảnh báo' : 'An toàn'}
            color={riskPercentage >= 20 ? 'error' : riskPercentage >= 10 ? 'warning' : 'success'}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '12px',
              height: 26,
            }}
          />
        </Box>

        {/* Simple Donut Chart */}
        <Box sx={{ mt: 1 }}>
          <ReactApexChart
            options={chartOptions}
            series={chartOptions.series as number[]}
            type="donut"
            height={320}
          />
        </Box>

        {/* Summary Stats Grid */}
        <Box
          sx={{
            mt: 3,
            pt: 3,
            borderTop: '2px solid #f1f5f9',
          }}
        >
          <Box 
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            {data.map((item) => (
              <Box 
                key={item.category} 
                sx={{
                  textAlign: 'center',
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: '#fafafa',
                  border: '1px solid #f1f5f9',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#f8fafc',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.06)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: item.color,
                    mx: 'auto',
                    mb: 1,
                    boxShadow: `0 0 0 3px ${item.color}20`,
                  }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#64748b', 
                    fontSize: '11px', 
                    display: 'block',
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  {item.category}
                </Typography>
                <Typography 
                  variant="body2" 
                  fontWeight={700} 
                  sx={{ 
                    color: '#1e293b', 
                    fontSize: '15px',
                    mb: 0.5,
                  }}
                >
                  {formatCurrency(item.amount)}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#94a3b8', 
                    fontSize: '10px',
                    fontWeight: 500,
                  }}
                >
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
