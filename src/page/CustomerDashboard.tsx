import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Box, Container, Typography } from '@mui/material';
import DebtHeroCard from '../components/customerdashboard/DebtHeroCard';
import SupportContact from '../components/customerdashboard/SupportContact';
import SpendingChart from '../components/customerdashboard/SpendingChart';
import CustomerInvoicesTable from '../components/customerdashboard/CustomerInvoicesTable';
import {
  currentCustomerUser,
  mockDebtSummary,
  mockSupportContact,
  mockSpendingData,
  mockCustomerInvoices,
  mockBankInfo,
} from '../types/customer.mockdata';

const CustomerDashboard: React.FC = () => {
  usePageTitle('Tổng quan - Khách hàng');
  
  // Handler for downloading invoice PDF
  const handleDownloadInvoice = (invoiceId: string) => {
    console.log('Downloading invoice:', invoiceId);
    // TODO: Implement actual PDF download logic
    alert(`Tải xuống hóa đơn ${invoiceId}`);
  };

  // Handler for viewing invoice details
  const handleViewInvoice = (invoiceId: string) => {
    console.log('Viewing invoice:', invoiceId);
    // TODO: Implement navigation to invoice detail page
    alert(`Xem chi tiết hóa đơn ${invoiceId}`);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            color: '#1e293b',
            mb: 0.5,
          }}
        >
          Xin chào, {currentCustomerUser.name} 👋
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '14px' }}>
          {currentCustomerUser.company}
        </Typography>
      </Box>

      {/* Row 1: Debt Hero Card (70%) + Support Contact (30%) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '70fr 30fr' },
          gap: 3,
          mb: 3,
        }}
      >
        <DebtHeroCard debtSummary={mockDebtSummary} bankInfo={mockBankInfo} />
        <SupportContact contact={mockSupportContact} />
      </Box>

      {/* Row 2: Spending Chart (Full Width) */}
      <Box sx={{ mb: 3 }}>
        <SpendingChart data={mockSpendingData} />
      </Box>

      {/* Row 3: Invoices Table (Full Width) */}
      <Box>
        <CustomerInvoicesTable
          invoices={mockCustomerInvoices}
          onDownload={handleDownloadInvoice}
          onView={handleViewInvoice}
        />
      </Box>
    </Container>
  );
};

export default CustomerDashboard;
