import { Box, Typography } from '@mui/material'
import FinancialHealthCards from '../components/dashboard/FinancialHealthCards'
import CashFlowChart from '../components/dashboard/CashFlowChart'
import DebtAgingChart from '../components/dashboard/DebtAgingChart'
import ApprovalQueue from '../components/dashboard/ApprovalQueue'
import {
  mockFinancialHealthKPI,
  mockCashFlowData,
  mockDebtAgingData,
  mockPendingInvoices,
} from '../types/dashboard.mockdata'

const HODDashboard = () => {
  // Event Handlers
  const handleBulkApprove = (invoiceIds: string[]) => {
    console.log('Bulk approve invoices:', invoiceIds)
    // TODO: Implement API call for bulk approval
  }

  const handleQuickView = (invoice: { id: string }) => {
    console.log('Quick view invoice:', invoice.id)
    // TODO: Open invoice detail modal
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 3 }}>
      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
            Dashboard - Financial Command Center
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Phân tích tài chính nâng cao & Quản lý dòng tiền
          </Typography>
        </Box>

        {/* Row 1: Financial Health KPIs */}
        <Box sx={{ mb: 3 }}>
          <FinancialHealthCards data={mockFinancialHealthKPI} />
        </Box>

        {/* Row 2: Deep Dive Charts (60% + 40%) */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' },
            gap: 3,
            mb: 3,
          }}
        >
          <CashFlowChart data={mockCashFlowData} />
          <DebtAgingChart data={mockDebtAgingData} />
        </Box>

        {/* Row 3: Approval Queue - Action Center */}
        <Box>
          <ApprovalQueue
            invoices={mockPendingInvoices}
            onBulkApprove={handleBulkApprove}
            onQuickView={handleQuickView}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default HODDashboard
