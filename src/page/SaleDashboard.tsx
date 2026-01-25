import React from 'react';
import { Box, Typography } from '@mui/material';
import SalesKPIs from '../components/salesdashboard/SalesKPIs';
import TargetProgressChart from '../components/salesdashboard/TargetProgressChart';
import SalesTrendChart from '../components/salesdashboard/SalesTrendChart';
import DebtWatchlist from '../components/salesdashboard/DebtWatchlist';
import MyRecentInvoices from '../components/salesdashboard/MyRecentInvoices';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSignalR, useSignalRReconnect } from '@/hooks/useSignalR';
import { USER_ROLES } from '@/constants/roles';
import {
  currentSalesUser,
  mockSalesKPI,
  mockTargetProgress,
  mockSalesTrendData,
  mockDebtWatchlist,
  mockSalesInvoices,
} from '../types/sales.mockdata';
import type { DebtCustomer } from '../types/sales.types';

const SaleDashboard: React.FC = () => {
  usePageTitle('Tổng quan - Sales')
  
  // 🔥 SignalR Realtime Updates (Ready for future API integration)
  useSignalR({
    onDashboardChanged: (payload) => {
      console.log('📨 [SaleDashboard] DashboardChanged event:', payload)
      
      // Sales refresh khi scope = Invoices
      if (payload.scope === 'Invoices' && payload.roles.includes(USER_ROLES.SALES)) {
        console.log('🔄 [SaleDashboard] Refreshing dashboard data...')
        // TODO: Call API để reload dashboard khi có API thật
        // fetchSalesDashboard()
      }
    },
    onInvoiceChanged: (payload) => {
      console.log('📨 [SaleDashboard] InvoiceChanged event:', payload)
      if (payload.roles.includes(USER_ROLES.SALES)) {
        console.log('🔄 [SaleDashboard] Invoice changed, refreshing...')
        // TODO: Reload dashboard khi có API
      }
    }
  })

  // Resync khi reconnect
  useSignalRReconnect(() => {
    console.log('🔄 [SaleDashboard] SignalR reconnected')
    // TODO: Resync data khi có API
  })
  
  // Event Handlers
  const handleCall = (customer: DebtCustomer) => {
    console.log('Call customer:', customer.name, customer.phone);
    // TODO: Integrate with phone system or open dialer
    // window.location.href = `tel:${customer.phone}`;
  };

  const handleSendReminder = (customer: DebtCustomer) => {
    console.log('Send reminder to:', customer.name, customer.email);
    // TODO: Navigate to email template or send reminder
    // navigate('/emails/send-reminder', { state: { customer } });
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 3 }}>
      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
            Dashboard Sales - {currentSalesUser.name}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Theo dõi hiệu suất bán hàng và quản lý khách hàng của bạn
          </Typography>
        </Box>

        {/* Row 1: Personal KPIs (4 Cards) */}
        <Box sx={{ mb: 3 }}>
          <SalesKPIs data={mockSalesKPI} />
        </Box>

        {/* Row 2: Progress & Trends (40% + 60%) */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '40fr 60fr' },
            gap: 3,
            mb: 3,
          }}
        >
          {/* Left: Target Progress Gauge (40%) */}
          <TargetProgressChart data={mockTargetProgress} />

          {/* Right: Sales Trend Chart (60%) */}
          <SalesTrendChart data={mockSalesTrendData} />
        </Box>

        {/* Row 3: Actionable Lists (50% + 50%) */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
            gap: 3,
          }}
        >
          {/* Left: Debt Watchlist (50%) */}
          <DebtWatchlist
            customers={mockDebtWatchlist}
            onCall={handleCall}
            onSendReminder={handleSendReminder}
          />

          {/* Right: Recent Invoices (50%) */}
          <MyRecentInvoices invoices={mockSalesInvoices} />
        </Box>
      </Box>
    </Box>
  );
};

export default SaleDashboard;
