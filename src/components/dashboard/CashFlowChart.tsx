import React from 'react'
import { Box, Card, CardContent, Typography } from '@mui/material'
import ReactApexChart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import type { CashFlowData } from '../../types/dashboard.types'

interface CashFlowChartProps {
  data: CashFlowData[]
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ data }) => {
  const formatCurrency = (value: number): string => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    return value.toLocaleString('vi-VN')
  }

  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      stacked: false,
      height: 380,
      toolbar: {
        show: false,
      },
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
      zoom: {
        enabled: false,
      },
    },
    colors: ['#3b82f6', '#10b981', '#f97316'],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 3,
      curve: 'smooth',
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 1,
        gradientToColors: ['#93c5fd', '#86efac', '#fed7aa'],
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0.05,
        stops: [20, 100, 100, 100],
      },
    },
    markers: {
      size: 0,
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 6,
        sizeOffset: 3,
      },
    },
    xaxis: {
      categories: data.map((d) => d.month),
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
        offsetX: 0,
        formatter: (value) => formatCurrency(value),
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      row: {
        colors: ['transparent', 'transparent'],
        opacity: 0.2,
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 5,
        left: 10,
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'center',
      offsetY: -5,
      fontSize: '13px',
      fontFamily: 'inherit',
      fontWeight: 500,
      markers: {
        width: 10,
        height: 10,
        radius: 10,
      },
      itemMargin: {
        horizontal: 12,
        vertical: 0,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      style: {
        fontSize: '13px',
        fontFamily: 'inherit',
      },
      y: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: function (val: number, opts: any) {
          const dataPoint = data[opts.dataPointIndex]
          const seriesName = opts.w.config.series[opts.seriesIndex].name

          if (seriesName === 'Đã thu') {
            const collectionRate = dataPoint.collectionRate
            return `${formatCurrency(val)} (${collectionRate.toFixed(1)}%)`
          }
          return formatCurrency(val)
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      custom: function ({ dataPointIndex }: any) {
        const dataPoint = data[dataPointIndex]
        return `
          <div style="padding: 12px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">${dataPoint.month}</div>
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; margin-right: 8px;"></div>
              <div style="color: #64748b; font-size: 12px; flex: 1;">Đã xuất hóa đơn:</div>
              <div style="font-weight: 600; color: #1e293b;">${formatCurrency(dataPoint.invoiced)}</div>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; margin-right: 8px;"></div>
              <div style="color: #64748b; font-size: 12px; flex: 1;">Đã thu:</div>
              <div style="font-weight: 600; color: #10b981;">${formatCurrency(dataPoint.collected)}</div>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #f97316; margin-right: 8px;"></div>
              <div style="color: #64748b; font-size: 12px; flex: 1;">Còn nợ:</div>
              <div style="font-weight: 600; color: #f97316;">${formatCurrency(dataPoint.outstanding)}</div>
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #f1f5f9;">
              <div style="color: #64748b; font-size: 12px;">Tỷ lệ thu:</div>
              <div style="font-weight: 700; color: #10b981; font-size: 16px;">${dataPoint.collectionRate.toFixed(1)}%</div>
            </div>
          </div>
        `
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 300,
          },
          legend: {
            position: 'bottom',
            offsetY: 0,
          },
          grid: {
            padding: {
              left: 5,
              right: 5,
            },
          },
        },
      },
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 280,
          },
          legend: {
            show: false,
          },
          yaxis: {
            labels: {
              style: {
                fontSize: '10px',
              },
            },
          },
          xaxis: {
            labels: {
              style: {
                fontSize: '10px',
              },
            },
          },
        },
      },
    ],
  }

  const series = [
    {
      name: 'Đã xuất hóa đơn',
      data: data.map((d) => d.invoiced),
    },
    {
      name: 'Đã thu',
      data: data.map((d) => d.collected),
    },
    {
      name: 'Còn nợ',
      data: data.map((d) => d.outstanding),
    },
  ]

  return (
    <Card elevation={0} sx={{ height: '100%', border: '1px solid #f1f5f9' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', mb: 0.5 }}>
              Hiệu quả Dòng tiền
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
              Theo dõi xuất hóa đơn vs thu tiền
            </Typography>
          </Box>
        </Box>

        {/* Chart */}
        <Box sx={{ mt: 2 }}>
          <ReactApexChart options={chartOptions} series={series} type="area" height={380} />
        </Box>
      </CardContent>
    </Card>
  )
}

export default CashFlowChart
