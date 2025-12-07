import React from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import {
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

interface QuickActionsProps {
  onAction: (actionId: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const actions = [
    {
      id: 'create-invoice',
      label: 'Tạo Hóa đơn mới',
      icon: AddIcon,
      color: '#3b82f6',
      bgColor: '#eff6ff',
      path: '/invoices/create',
    },
    {
      id: 'add-customer',
      label: 'Thêm Khách hàng',
      icon: PersonAddIcon,
      color: '#10b981',
      bgColor: '#f0fdf4',
      path: '/customers/create',
    },
    {
      id: 'search-debt',
      label: 'Tra cứu Công nợ',
      icon: SearchIcon,
      color: '#f59e0b',
      bgColor: '#fffbeb',
      path: '/debt/search',
    },
    {
      id: 'create-report',
      label: 'Tạo Bảng kê',
      icon: DescriptionIcon,
      color: '#8b5cf6',
      bgColor: '#faf5ff',
      path: '/reports/create',
    },
  ];

  return (
    <Card elevation={0} sx={{ height: '100%', border: '1px solid #f1f5f9' }}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box mb={2.5}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', mb: 0.5 }}>
            Thao tác nhanh
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px' }}>
            Các chức năng thường dùng
          </Typography>
        </Box>

        {/* Action Grid */}
        <Box
          sx={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
          }}
        >
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                onClick={() => onAction(action.id)}
                sx={{
                  p: 2.5,
                  height: '100%',
                  minHeight: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  bgcolor: action.bgColor,
                  border: `2px solid transparent`,
                  borderRadius: '16px',
                  transition: 'all 0.3s ease',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: action.bgColor,
                    borderColor: action.color,
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 24px ${action.color}20`,
                  },
                }}
              >
                {/* Icon Circle */}
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '16px',
                    bgcolor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${action.color}15`,
                  }}
                >
                  <Icon sx={{ fontSize: 32, color: action.color }} />
                </Box>

                {/* Label */}
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: '#1e293b',
                    fontWeight: 600,
                    fontSize: '14px',
                    textAlign: 'center',
                    lineHeight: 1.3,
                  }}
                >
                  {action.label}
                </Typography>

                {/* Special badge for primary action */}
                {action.id === 'create-invoice' && (
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      bgcolor: action.color,
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Thường dùng
                  </Box>
                )}
              </Button>
            );
          })}
        </Box>

        {/* Keyboard Shortcuts Hint */}
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: '#94a3b8',
              fontSize: '11px',
              display: 'block',
              textAlign: 'center',
            }}
          >
            💡 Mẹo: Nhấn <kbd style={{ fontWeight: 600 }}>Ctrl+N</kbd> để tạo hóa đơn nhanh
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
