import React from 'react';
import { Box, Card, CardContent, Typography, LinearProgress, Chip } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import type { SystemKPI } from '../../types/admin.types';

interface SystemKPIsProps {
  kpis: SystemKPI[];
}

const SystemKPIs: React.FC<SystemKPIsProps> = ({ kpis }) => {
  const getStatusColor = (status: 'safe' | 'warning' | 'critical') => {
    switch (status) {
      case 'safe':
        return '#2e7d32'; // Green
      case 'warning':
        return '#ff9800'; // Orange
      case 'critical':
        return '#d32f2f'; // Red
      default:
        return '#1976d2'; // Blue
    }
  };

  const getProgressColor = (value: number): 'success' | 'warning' | 'error' => {
    if (value < 70) return 'success';
    if (value < 90) return 'warning';
    return 'error';
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 3,
      }}
    >
      {kpis.map((kpi) => {
        const statusColor = getStatusColor(kpi.status);
        
        return (
          <Card
            key={kpi.id}
            sx={{
              height: '100%',
                borderLeft: `4px solid ${statusColor}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: `${statusColor}15`,
                      color: statusColor,
                    }}
                  >
                    {kpi.icon}
                  </Box>
                  
                  {kpi.status === 'critical' && (
                    <Chip 
                      label="Quan trọng" 
                      color="error" 
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Box>

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {kpi.label}
                </Typography>

                <Typography 
                  variant="h4" 
                  fontWeight="bold" 
                  sx={{ 
                    color: kpi.status === 'critical' ? statusColor : 'text.primary',
                    mb: 1,
                  }}
                >
                  {kpi.value}
                </Typography>

                {/* Trend Indicator */}
                {kpi.trend && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {kpi.trend.isPositive ? (
                      <TrendingUpIcon sx={{ fontSize: 16, color: '#2e7d32' }} />
                    ) : (
                      <TrendingDownIcon sx={{ fontSize: 16, color: '#d32f2f' }} />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        color: kpi.trend.isPositive ? '#2e7d32' : '#d32f2f',
                        fontWeight: 600,
                      }}
                    >
                      {kpi.trend.isPositive ? '+' : ''}{kpi.trend.value}%
                    </Typography>
                    {kpi.subtitle && (
                      <Typography variant="caption" color="text.secondary">
                        {kpi.subtitle}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Storage Progress Bar */}
                {kpi.progress !== undefined && (
                  <Box mt={2}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Sử dụng
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {kpi.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={kpi.progress}
                      color={getProgressColor(kpi.progress)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#f5f5f5',
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
        );
      })}
    </Box>
  );
};

export default SystemKPIs;
