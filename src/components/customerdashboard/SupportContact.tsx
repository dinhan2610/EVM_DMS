import React from 'react';
import { Box, Card, CardContent, Typography, Avatar, IconButton, Tooltip } from '@mui/material';
import { Phone, Email, Support } from '@mui/icons-material';
import type { SupportContact } from '../../types/customer.types';

interface SupportContactProps {
  contact: SupportContact;
}

const SupportContactCard: React.FC<SupportContactProps> = ({ contact }) => {
  const handleCall = () => {
    window.location.href = `tel:${contact.phone}`;
  };

  const handleEmail = () => {
    window.location.href = `mailto:${contact.email}`;
  };

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
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Support sx={{ color: '#1976d2', fontSize: 20 }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#64748b', fontSize: '13px' }}>
            Nhân viên hỗ trợ của bạn
          </Typography>
        </Box>

        {/* Avatar & Info */}
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: '#1976d2',
              fontSize: '32px',
              fontWeight: 700,
              mb: 2,
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            }}
          >
            {contact.name.charAt(0)}
          </Avatar>

          <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b', mb: 0.5 }}>
            {contact.name}
          </Typography>

          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px', mb: 0.5 }}>
            {contact.role}
          </Typography>

          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '11px' }}>
            {contact.department}
          </Typography>
        </Box>

        {/* Contact Actions */}
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Tooltip title="Gọi điện">
            <IconButton
              onClick={handleCall}
              sx={{
                bgcolor: '#dbeafe',
                color: '#1976d2',
                '&:hover': {
                  bgcolor: '#bfdbfe',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Phone sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Gửi email">
            <IconButton
              onClick={handleEmail}
              sx={{
                bgcolor: '#d1fae5',
                color: '#10b981',
                '&:hover': {
                  bgcolor: '#a7f3d0',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Email sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Contact Details */}
        <Box
          sx={{
            p: 2,
            bgcolor: '#f8fafc',
            borderRadius: 2,
            border: '1px solid #e2e8f0',
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Phone sx={{ fontSize: 16, color: '#64748b' }} />
            <Typography variant="body2" sx={{ color: '#1e293b', fontSize: '13px' }}>
              {contact.phone}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Email sx={{ fontSize: 16, color: '#64748b' }} />
            <Typography
              variant="body2"
              sx={{
                color: '#1e293b',
                fontSize: '13px',
                wordBreak: 'break-all',
              }}
            >
              {contact.email}
            </Typography>
          </Box>
        </Box>

        {/* Help Text */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 2,
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '11px',
          }}
        >
          💬 Liên hệ nếu bạn cần hỗ trợ về hóa đơn
        </Typography>
      </CardContent>
    </Card>
  );
};

export default SupportContactCard;
