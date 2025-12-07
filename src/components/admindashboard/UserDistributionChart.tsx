import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { UserDistribution } from '../../types/admin.types';

interface UserDistributionChartProps {
  data: UserDistribution[];
}

const UserDistributionChart: React.FC<UserDistributionChartProps> = ({ data }) => {
  const totalUsers = data.reduce((sum, item) => sum + item.count, 0);

  // Calculate percentages
  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: (item.count / totalUsers) * 100,
  }));

  // ApexCharts configuration
  const chartOptions: ApexOptions = {
    chart: {
      type: 'pie',
      height: 360,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
      toolbar: {
        show: false,
      },
    },
    series: dataWithPercentage.map((item) => item.count),
    labels: dataWithPercentage.map((item) => item.role),
    colors: dataWithPercentage.map((item) => item.color),
    
    // Data Labels on slices
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + '%';
      },
      style: {
        fontSize: '14px',
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

    // Legend configuration
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '14px',
      fontFamily: 'inherit',
      fontWeight: 500,
      offsetY: 0,
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
        const count = opts.w.config.series[opts.seriesIndex];
        return seriesName + ': ' + count.toLocaleString('vi-VN');
      },
    },

    // Tooltip
    tooltip: {
      enabled: true,
      y: {
        formatter: function (val: number) {
          return val.toLocaleString('vi-VN') + ' người';
        },
      },
      style: {
        fontSize: '13px',
        fontFamily: 'inherit',
      },
    },

    // Plot Options
    plotOptions: {
      pie: {
        expandOnClick: true,
        donut: {
          size: '0%', // 0% = Full Pie (not donut)
        },
        dataLabels: {
          offset: 0,
          minAngleToShowLabel: 10, // Hide label if slice < 10 degrees
        },
      },
    },

    // States (hover effects)
    states: {
      hover: {
        filter: {
          type: 'lighten',
          value: 0.15,
        },
      },
      active: {
        filter: {
          type: 'darken',
          value: 0.15,
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
              fontSize: '12px',
            },
          },
        },
      },
    ],
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Cơ cấu Người dùng theo Vai trò
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Phân bổ người dùng trong hệ thống
        </Typography>

        {/* ApexCharts Pie */}
        <Box sx={{ mt: 2 }}>
          <ReactApexChart
            options={chartOptions}
            series={chartOptions.series as number[]}
            type="pie"
            height={360}
          />
        </Box>

        {/* Summary Stats */}
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: '1px solid #e0e0e0',
          }}
        >
          <Box display="flex" flexWrap="wrap" gap={2} justifyContent="space-around">
            {dataWithPercentage.map((item) => (
              <Box key={item.role} textAlign="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: item.color,
                    mx: 'auto',
                    mb: 0.5,
                  }}
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  {item.role}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {item.count.toLocaleString('vi-VN')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({item.percentage.toFixed(1)}%)
                </Typography>
              </Box>
            ))}
          </Box>

          <Box textAlign="center" mt={2}>
            <Typography variant="h5" fontWeight="bold" color="primary">
              {totalUsers.toLocaleString('vi-VN')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tổng số người dùng
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserDistributionChart;
