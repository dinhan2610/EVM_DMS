import { useState, useMemo, useCallback, useEffect } from 'react'
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
  Fab,
  Zoom,
  Alert,
  Snackbar,
  Link as MuiLink,
  CircularProgress,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
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
import type { StatementListItem } from '@/types/statement.types'
import { 
  fetchStatements, 
  exportStatementPDF,
  sendStatementEmail,
  formatStatementPeriod,
  formatStatementDate 
} from '@/services/statementService'
import CreateStatementModal from '@/components/CreateStatementModal'

// ==================== INTERFACES ====================

/**
 * Interface Statement - Bảng kê công nợ (Legacy - for backward compatibility)
 * @deprecated Use StatementListItem from @/types/statement.types
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

// Convert API response to legacy format for backward compatibility
function convertToLegacyFormat(item: StatementListItem): Statement {
  return {
    id: String(item.statementID),
    code: item.statementCode,
    customerName: item.customerName,
    period: formatStatementPeriod(item.statementDate),
    totalAmount: item.totalAmount,
    status: item.status as StatementStatus,
    linkedInvoiceNumber: item.totalInvoices > 0 ? `${item.totalInvoices} HĐ` : null,
    isEmailSent: false, // Not available from API
    createdDate: formatStatementDate(item.statementDate),
  }
}

// ==================== MOCK DATA (No longer used - kept for reference) ====================
// Mock data has been replaced with real API calls to /api/Statement

// ==================== COMPONENT: ACTIONS MENU ====================

interface StatementActionsMenuProps {
  statement: Statement
  onDelete: (id: string) => void
  onExportPDF: (id: string, code: string) => void
  onSendEmail: (id: string, code: string, customerName: string) => void
}

const StatementActionsMenu = ({ statement, onDelete, onExportPDF, onSendEmail }: StatementActionsMenuProps) => {
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
      label: 'Xuất PDF',
      icon: <PictureAsPdfIcon fontSize="small" />,
      enabled: true,
      action: () => {
        onExportPDF(statement.id, statement.code)
        handleClose()
      },
      color: 'error.main',
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
        onSendEmail(statement.id, statement.code, statement.customerName)
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

  // API State
  const [statements, setStatements] = useState<Statement[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 10,
    totalPages: 0,
    totalCount: 0,
  })

  // UI State
  const [selectedRowsCount, setSelectedRowsCount] = useState<number>(0)
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false)
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' 
  })

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

  // ==================== API FETCH ====================

  // Fetch statements from API
  const loadStatements = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetchStatements({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      })

      // Convert API response to legacy format
      const convertedStatements = response.items.map(convertToLegacyFormat)
      setStatements(convertedStatements)
      
      setPagination(prev => ({
        ...prev,
        totalPages: response.totalPages,
        totalCount: response.totalCount,
      }))

      console.log('✅ Loaded statements:', response.totalCount, 'items')
    } catch (err) {
      let errorMessage = 'Không thể tải danh sách bảng kê'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        errorMessage = axiosError.response?.data?.message || errorMessage
      }
      setError(errorMessage)
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      })
      console.error('❌ Error loading statements:', err)
    } finally {
      setLoading(false)
    }
  }, [pagination.pageIndex, pagination.pageSize])

  // Load statements on component mount
  useEffect(() => {
    loadStatements()
  }, [loadStatements])

  // ==================== HANDLERS ====================

  // Handle PDF export
  const handleExportPDF = async (id: string, code: string) => {
    try {
      setSnackbar({
        open: true,
        message: `Đang xuất PDF cho ${code}...`,
        severity: 'info',
      })
      
      await exportStatementPDF(Number(id), `${code}.pdf`)
      
      setSnackbar({
        open: true,
        message: `✅ Đã xuất PDF thành công: ${code}.pdf`,
        severity: 'success',
      })
    } catch (err) {
      let errorMessage = 'Không thể xuất PDF'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { detail?: string; message?: string } } }
        errorMessage = axiosError.response?.data?.detail || axiosError.response?.data?.message || errorMessage
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      })
      console.error('❌ Error exporting PDF:', err)
    }
  }

  // Handle send email
  const handleSendEmail = async (id: string, _code: string, customerName: string) => {
    try {
      setSnackbar({
        open: true,
        message: `Đang gửi email cho ${customerName}...`,
        severity: 'info',
      })
      
      await sendStatementEmail(Number(id))
      
      setSnackbar({
        open: true,
        message: `✅ Đã gửi email thành công cho ${customerName}`,
        severity: 'success',
      })
    } catch (err) {
      let errorMessage = 'Không thể gửi email'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { detail?: string; message?: string } } }
        errorMessage = axiosError.response?.data?.detail || axiosError.response?.data?.message || errorMessage
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      })
      console.error('❌ Error sending email:', err)
    }
  }

  // Handle create statement from modal
  const handleCreateStatement = (customerId: number, month: number, year: number) => {
    console.log('Creating statement:', { customerId, month, year })
    
    // Navigate to create statement page with query params
    navigate(`/statements/new?customerId=${customerId}&month=${month}&year=${year}`)
    
    // Show success message
    setSnackbar({
      open: true,
      message: 'Đang tạo bảng kê...',
      severity: 'info',
    })
  }

  // ==================== FILTER LOGIC ====================

  // Filter statements based on selected tab AND filter criteria
  const filteredStatements = useMemo(() => {
    let result = statements

    // Tab filtering - currently fixed to 'all'
    // If tabs UI is added back, this will filter by status
    // switch (selectedTab) {
    //   case 'draft':
    //     result = result.filter(s => s.status !== STATEMENT_STATUS.INVOICED)
    //     break
    //   case 'invoiced':
    //     result = result.filter(s => s.status === STATEMENT_STATUS.INVOICED)
    //     break
    //   default:
    //     break
    // }

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
  }, [statements, filters])

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
          onExportPDF={handleExportPDF}
          onSendEmail={handleSendEmail}
        />
      ),
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

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
            📊 Hiển thị {filteredStatements.length} / {pagination.totalCount} bảng kê
          </Typography>
        )}
      </Box>

      {/* Statement Filter */}
      <StatementFilter
        onFilterChange={handleFilterChange}
        onReset={handleResetFilter}
        totalResults={pagination.totalCount}
        filteredResults={filteredStatements.length}
        actionButton={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
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
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filteredStatements}
            columns={columns}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={(newSelection) => {
              setSelectedRowsCount(Array.isArray(newSelection) ? newSelection.length : 0)
            }}
            paginationMode="server"
            rowCount={pagination.totalCount}
            paginationModel={{
              page: pagination.pageIndex - 1, // DataGrid uses 0-based index
              pageSize: pagination.pageSize,
            }}
            onPaginationModelChange={(model) => {
              setPagination(prev => ({
                ...prev,
                pageIndex: model.page + 1, // Convert to 1-based for API
                pageSize: model.pageSize,
              }))
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
            }}
            autoHeight
          />
        )}
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

      {/* Create Statement Modal */}
      <CreateStatementModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateStatement}
      />
    </Box>
  )
}

export default StatementManagement
