import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Tabs,
  Tab,
  Fab,
  Zoom,
  Alert,
  Snackbar,
  Link as MuiLink,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { usePageTitle } from '@/hooks/usePageTitle'
import EmailIcon from '@mui/icons-material/Email'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import SendIcon from '@mui/icons-material/Send'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import StatementFilter, { StatementFilterState } from '@/components/StatementFilter'
import {
  STATEMENT_STATUS,
  STATEMENT_STATUS_LABELS,
  getStatementStatusColor,
  type StatementStatus,
} from '@/constants/statementStatus'

// ==================== INTERFACES ====================

/**
 * Interface Statement - Bảng kê công nợ
 */
export interface Statement {
  id: string
  code: string                        // Mã Bảng kê (VD: BK-1025-001)
  customerName: string                // Tên khách hàng
  period: string                      // Kỳ cước (VD: "10/2025")
  totalAmount: number                 // Tổng thanh toán
  status: StatementStatus             // Trạng thái
  linkedInvoiceNumber: string | null  // Số hóa đơn đã gắn
  isEmailSent: boolean                // Đã gửi email báo cước chưa
  createdDate: string                 // Ngày tạo
}

// ==================== MOCK DATA ====================

const mockStatements: Statement[] = [
  {
    id: '1',
    code: 'BK-1025-001',
    customerName: 'Công ty TNHH Công nghệ ABC',
    period: '10/2025',
    totalAmount: 25000000,
    status: STATEMENT_STATUS.DRAFT,
    linkedInvoiceNumber: null,
    isEmailSent: true,
    createdDate: '2025-10-25',
  },
  {
    id: '2',
    code: 'BK-1025-002',
    customerName: 'Công ty CP Viễn thông XYZ',
    period: '10/2025',
    totalAmount: 45000000,
    status: STATEMENT_STATUS.INVOICED,
    linkedInvoiceNumber: '0001234',
    isEmailSent: true,
    createdDate: '2025-10-26',
  },
  {
    id: '3',
    code: 'BK-1025-003',
    customerName: 'Doanh nghiệp tư nhân Minh Tuấn',
    period: '10/2025',
    totalAmount: 12000000,
    status: STATEMENT_STATUS.DRAFT,
    linkedInvoiceNumber: null,
    isEmailSent: false,
    createdDate: '2025-10-27',
  },
  {
    id: '4',
    code: 'BK-1025-004',
    customerName: 'Công ty TNHH Thương mại Quốc tế',
    period: '10/2025',
    totalAmount: 67000000,
    status: STATEMENT_STATUS.INVOICED,
    linkedInvoiceNumber: '0001235',
    isEmailSent: true,
    createdDate: '2025-10-28',
  },
  {
    id: '5',
    code: 'BK-0925-015',
    customerName: 'Công ty CP Đầu tư Phát triển',
    period: '09/2025',
    totalAmount: 38000000,
    status: STATEMENT_STATUS.INVOICED,
    linkedInvoiceNumber: '0001180',
    isEmailSent: true,
    createdDate: '2025-09-25',
  },
  {
    id: '6',
    code: 'BK-1025-005',
    customerName: 'Công ty TNHH Xây dựng Hoàng Gia',
    period: '10/2025',
    totalAmount: 92000000,
    status: STATEMENT_STATUS.DRAFT,
    linkedInvoiceNumber: null,
    isEmailSent: true,
    createdDate: '2025-10-29',
  },
  {
    id: '7',
    code: 'BK-1025-006',
    customerName: 'Công ty CP Logistics Việt Nam',
    period: '10/2025',
    totalAmount: 15000000,
    status: STATEMENT_STATUS.DRAFT,
    linkedInvoiceNumber: null,
    isEmailSent: false,
    createdDate: '2025-10-30',
  },
  {
    id: '8',
    code: 'BK-0925-020',
    customerName: 'Công ty TNHH Thời trang Trendy',
    period: '09/2025',
    totalAmount: 28000000,
    status: STATEMENT_STATUS.INVOICED,
    linkedInvoiceNumber: '0001199',
    isEmailSent: true,
    createdDate: '2025-09-28',
  },
  {
    id: '9',
    code: 'BK-1125-001',
    customerName: 'Công ty CP Sản xuất Điện tử',
    period: '11/2025',
    totalAmount: 125000000,
    status: STATEMENT_STATUS.DRAFT,
    linkedInvoiceNumber: null,
    isEmailSent: false,
    createdDate: '2025-11-15',
  },
  {
    id: '10',
    code: 'BK-1025-007',
    customerName: 'Công ty TNHH Dịch vụ Tài chính',
    period: '10/2025',
    totalAmount: 54000000,
    status: STATEMENT_STATUS.INVOICED,
    linkedInvoiceNumber: '0001250',
    isEmailSent: true,
    createdDate: '2025-10-31',
  },
];

// ==================== COMPONENT: ACTIONS MENU ====================

interface StatementActionsMenuProps {
  statement: Statement
  onDelete: (id: string) => void
}

const StatementActionsMenu = ({ statement, onDelete }: StatementActionsMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const isDraft = statement.status === STATEMENT_STATUS.DRAFT

  const menuItems = [
    {
      label: 'Xem chi tiết',
      icon: <VisibilityOutlinedIcon fontSize="small" />,
      enabled: true,
      action: () => {
        console.log('Xem chi tiết:', statement.id)
        handleClose()
      },
      color: 'primary.main',
    },
    {
      label: 'Chỉnh sửa',
      icon: <EditOutlinedIcon fontSize="small" />,
      enabled: isDraft,
      action: () => {
        console.log('Chỉnh sửa:', statement.id)
        handleClose()
      },
      color: 'primary.main',
    },
    {
      label: 'Xuất hóa đơn',
      icon: <DescriptionOutlinedIcon fontSize="small" />,
      enabled: isDraft,
      action: () => {
        console.log('Xuất hóa đơn cho:', statement.id)
        handleClose()
      },
      color: 'success.main',
    },
    { divider: true },
    {
      label: 'Gửi email',
      icon: <EmailIcon fontSize="small" />,
      enabled: true,
      action: () => {
        console.log('Gửi email:', statement.id)
        handleClose()
      },
      color: 'info.main',
    },
    { divider: true },
    {
      label: 'Xóa',
      icon: <DeleteOutlineIcon fontSize="small" />,
      enabled: isDraft,
      action: () => {
        onDelete(statement.id)
        handleClose()
      },
      color: 'error.main',
    },
  ]

  return (
    <>
      <Tooltip title="Thao tác" arrow placement="left">
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{
            color: 'text.secondary',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'action.hover',
              color: 'primary.main',
              transform: 'scale(1.1)',
            },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        TransitionProps={{
          timeout: 250,
        }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              minWidth: 220,
              borderRadius: 2.5,
              mt: 0.5,
              overflow: 'visible',
              filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))',
              border: '1px solid',
              borderColor: 'divider',
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
                borderLeft: '1px solid',
                borderTop: '1px solid',
                borderColor: 'divider',
              },
            },
          },
        }}
      >
        {menuItems.map((item, index) => {
          if ('divider' in item) {
            return <Divider key={`divider-${index}`} sx={{ my: 1 }} />
          }

          return (
            <MenuItem
              key={item.label}
              onClick={item.enabled ? item.action : undefined}
              disabled={!item.enabled}
              sx={{
                py: 1.25,
                px: 2.5,
                gap: 1.5,
                transition: 'all 0.2s ease',
                '&:hover': item.enabled ? {
                  backgroundColor: 'action.hover',
                  transform: 'translateX(4px)',
                } : {},
                '&.Mui-disabled': {
                  opacity: 0.4,
                },
                cursor: item.enabled ? 'pointer' : 'not-allowed',
              }}
            >
              <ListItemIcon
                sx={{
                  color: item.enabled ? item.color : 'text.disabled',
                  minWidth: 28,
                  transition: 'color 0.2s ease',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: item.enabled ? 500 : 400,
                  letterSpacing: '0.01em',
                  color: item.enabled ? 'text.primary' : 'text.disabled',
                }}
              />
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}

// ==================== MAIN COMPONENT ====================

const StatementManagement = () => {
  usePageTitle('Quản lý bảng kê')
  
  // Hooks
  const navigate = useNavigate()

  // State
  const [statements, setStatements] = useState<Statement[]>(mockStatements)
  const [selectedTab, setSelectedTab] = useState<'all' | 'draft' | 'invoiced'>('all')
  const [selectedRowsCount, setSelectedRowsCount] = useState<number>(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })

  // Filter state
  const [filters, setFilters] = useState<StatementFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    periodFrom: '',
    periodTo: '',
    status: [],
    customer: null,
    emailSentStatus: 'ALL',
    linkedInvoice: 'ALL',
  })

  // ==================== FILTER LOGIC ====================

  // Filter statements based on selected tab AND filter criteria
  const filteredStatements = useMemo(() => {
    let result = statements

    // Tab filtering
    switch (selectedTab) {
      case 'draft':
        result = result.filter(s => s.status !== STATEMENT_STATUS.INVOICED)
        break
      case 'invoiced':
        result = result.filter(s => s.status === STATEMENT_STATUS.INVOICED)
        break
      default:
        break
    }

    // Advanced filtering
    result = result.filter((statement) => {
      // 1️⃣ Search text
      const matchesSearch =
        !filters.searchText ||
        statement.code.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        statement.customerName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        statement.linkedInvoiceNumber?.toLowerCase().includes(filters.searchText.toLowerCase())

      // 2️⃣ Date range (ngày tạo)
      const matchesDateFrom =
        !filters.dateFrom ||
        dayjs(statement.createdDate).isAfter(filters.dateFrom, 'day') ||
        dayjs(statement.createdDate).isSame(filters.dateFrom, 'day')
      const matchesDateTo =
        !filters.dateTo ||
        dayjs(statement.createdDate).isBefore(filters.dateTo, 'day') ||
        dayjs(statement.createdDate).isSame(filters.dateTo, 'day')

      // 3️⃣ Period range (kỳ cước)
      const matchesPeriodFrom =
        !filters.periodFrom ||
        statement.period >= filters.periodFrom
      const matchesPeriodTo =
        !filters.periodTo ||
        statement.period <= filters.periodTo

      // 4️⃣ Status
      const matchesStatus =
        filters.status.length === 0 ||
        filters.status.includes('ALL') ||
        filters.status.includes(statement.status)

      // 5️⃣ Customer
      const matchesCustomer =
        !filters.customer ||
        filters.customer === 'ALL' ||
        statement.customerName === filters.customer

      // 6️⃣ Email sent status
      const matchesEmailSent =
        filters.emailSentStatus === 'ALL' ||
        (filters.emailSentStatus === 'SENT' && statement.isEmailSent) ||
        (filters.emailSentStatus === 'NOT_SENT' && !statement.isEmailSent)

      // 7️⃣ Invoice linked status
      const matchesInvoiceLinked =
        filters.linkedInvoice === 'ALL' ||
        (filters.linkedInvoice === 'LINKED' && statement.linkedInvoiceNumber !== null) ||
        (filters.linkedInvoice === 'NOT_LINKED' && statement.linkedInvoiceNumber === null)

      return (
        matchesSearch &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesPeriodFrom &&
        matchesPeriodTo &&
        matchesStatus &&
        matchesCustomer &&
        matchesEmailSent &&
        matchesInvoiceLinked
      )
    })

    return result
  }, [statements, selectedTab, filters])

  // Count badges
  const countDraft = useMemo(() => 
    statements.filter(s => s.status !== STATEMENT_STATUS.INVOICED).length, 
    [statements]
  )
  const countInvoiced = useMemo(() => 
    statements.filter(s => s.status === STATEMENT_STATUS.INVOICED).length, 
    [statements]
  )

  // ==================== HANDLERS ====================

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: StatementFilterState) => {
    setFilters(newFilters)
  }, [])

  // Handle reset filter
  const handleResetFilter = useCallback(() => {
    setFilters({
      searchText: '',
      dateFrom: null,
      dateTo: null,
      periodFrom: '',
      periodTo: '',
      status: [],
      customer: null,
      emailSentStatus: 'ALL',
      linkedInvoice: 'ALL',
    })
  }, [])

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'all' | 'draft' | 'invoiced') => {
    setSelectedTab(newValue)
    setSelectedRowsCount(0) // Clear count khi đổi tab
  }

  // Handle delete
  const handleDelete = (id: string) => {
    setStatements(prev => prev.filter(s => s.id !== id))
    setSnackbar({ 
      open: true, 
      message: 'Đã xóa bảng kê thành công', 
      severity: 'success' 
    })
  }

  // Handle bulk send email
  const handleBulkSendEmail = () => {
    const count = selectedRowsCount
    setSnackbar({
      open: true,
      message: `Đang gửi bảng kê cho ${count} khách hàng...`,
      severity: 'info',
    })
    
    // Simulate API call
    setTimeout(() => {
      setSnackbar({
        open: true,
        message: `Đã gửi email thành công cho ${count} khách hàng`,
        severity: 'success',
      })
      setSelectedRowsCount(0)
    }, 1500)
  }

  // Format currency VND
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount)
  }

  // DataGrid Columns - Tối ưu căn chỉnh và bố cục
  const columns: GridColDef[] = [
    {
      field: 'code',
      headerName: 'Mã Bảng kê',
      width: 160,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Statement>) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            fontSize: '0.9rem',
            color: '#1976d2',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1,
      minWidth: 220,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Statement>) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: '#2c3e50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'period',
      headerName: 'Kỳ cước',
      width: 120,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Statement>) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'totalAmount',
      headerName: 'Tổng tiền',
      width: 170,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Statement>) => (
        <Typography sx={{ fontWeight: 600 }}>
          {formatCurrency(params.value as number)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 150,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Statement>) => {
        const status = params.value as StatementStatus
        return (
          <Chip
            label={STATEMENT_STATUS_LABELS[status]}
            color={getStatementStatusColor(status)}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        )
      },
    },
    {
      field: 'linkedInvoiceNumber',
      headerName: 'Hóa đơn',
      width: 140,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Statement>) => {
        const invoiceNumber = params.value as string | null
        if (!invoiceNumber) {
          return (
            <Typography variant="body2" sx={{ color: '#bdbdbd' }}>-</Typography>
          )
        }
        return (
          <MuiLink
            component={Link}
            to={`/invoices/${invoiceNumber}`}
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              color: 'primary.main',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {invoiceNumber}
          </MuiLink>
        )
      },
    },
    {
      field: 'isEmailSent',
      headerName: 'Email',
      width: 120,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Statement>) => {
        const isSent = params.value as boolean
        return (
          <Chip
            label={isSent ? 'Đã gửi' : 'Chưa gửi'}
            color={isSent ? 'success' : 'default'}
            size="small"
            variant={isSent ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600 }}
          />
        )
      },
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 100,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams<Statement>) => (
        <StatementActionsMenu 
          statement={params.row} 
          onDelete={handleDelete}
        />
      ),
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
          📋 Quản lý Bảng kê công nợ
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          Quản lý và theo dõi các bảng kê cước, công nợ khách hàng
        </Typography>
        {filteredStatements.length > 0 && (
          <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 500, mt: 0.5 }}>
            📊 Hiển thị {filteredStatements.length} / {statements.length} bảng kê
          </Typography>
        )}
      </Box>

      {/* Statement Filter */}
      <StatementFilter
        onFilterChange={handleFilterChange}
        onReset={handleResetFilter}
        totalResults={statements.length}
        filteredResults={filteredStatements.length}
        actionButton={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/statements/new')}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(28, 132, 238, 0.24)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(28, 132, 238, 0.32)',
              },
            }}
          >
            Tạo Bảng kê mới
          </Button>
        }
      />

      {/* Tabs - Quick Filters */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          backgroundColor: '#fff',
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: '1px solid #e0e0e0',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.9rem',
              minHeight: 56,
              px: 3,
            },
            '& .Mui-selected': {
              color: 'primary.main',
              fontWeight: 600,
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Tất cả
                <Chip 
                  label={statements.length} 
                  size="small" 
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }} 
                />
              </Box>
            }
            value="all"
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Chưa xuất hóa đơn
                <Badge
                  badgeContent={countDraft}
                  color="warning"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    },
                  }}
                >
                  <Box sx={{ width: 8 }} />
                </Badge>
              </Box>
            }
            value="draft"
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Đã xuất hóa đơn
                <Badge
                  badgeContent={countInvoiced}
                  color="success"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    },
                  }}
                >
                  <Box sx={{ width: 8 }} />
                </Badge>
              </Box>
            }
            value="invoiced"
          />
        </Tabs>
      </Paper>

      {/* Data Table */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          backgroundColor: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <DataGrid
          rows={filteredStatements}
          columns={columns}
          checkboxSelection
          disableRowSelectionOnClick
          onRowSelectionModelChange={(newSelection) => {
            setSelectedRowsCount(newSelection.ids.size)
          }}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8f9fa',
              borderBottom: '2px solid #e0e0e0',
              fontWeight: 600,
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f8f9fa',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '2px solid #e0e0e0',
              backgroundColor: '#fafafa',
              minHeight: '56px',
              padding: '8px 16px',
            },
            '& .MuiTablePagination-root': {
              overflow: 'visible',
            },
            '& .MuiTablePagination-toolbar': {
              minHeight: '56px',
              paddingLeft: '16px',
              paddingRight: '8px',
            },
            '& .MuiTablePagination-selectLabel': {
              margin: 0,
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#666',
            },
            '& .MuiTablePagination-displayedRows': {
              margin: 0,
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#666',
            },
            '& .MuiTablePagination-select': {
              paddingTop: '8px',
              paddingBottom: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
            },
            '& .MuiTablePagination-actions': {
              marginLeft: '20px',
              '& .MuiIconButton-root': {
                padding: '8px',
                '&:hover': {
                  backgroundColor: '#e3f2fd',
                },
                '&.Mui-disabled': {
                  opacity: 0.3,
                },
              },
            },
          }}
          autoHeight
        />
      </Paper>

      {/* Floating Action Button - Bulk Send Email */}
      {/* Floating Action Button - Bulk Send Email */}
      <Zoom in={selectedRowsCount > 0}>
        <Fab
          variant="extended"
          color="primary"
          onClick={handleBulkSendEmail}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            boxShadow: '0 4px 16px rgba(28, 132, 238, 0.32)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(28, 132, 238, 0.4)',
            },
          }}
        >
          <SendIcon sx={{ mr: 1 }} />
          Gửi Email báo cước ({selectedRowsCount})
        </Fab>
      </Zoom>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default StatementManagement
