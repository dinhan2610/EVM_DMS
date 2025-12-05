import { useState, useMemo, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import AddIcon from '@mui/icons-material/Add'
import SendIcon from '@mui/icons-material/Send'
import DrawIcon from '@mui/icons-material/Draw'
import { Link, useNavigate } from 'react-router-dom'
import { Snackbar, Alert } from '@mui/material'
import InvoiceFilter, { InvoiceFilterState } from '@/components/InvoiceFilter'
import invoiceService, { InvoiceListItem } from '@/services/invoiceService'
import templateService from '@/services/templateService'
import customerService from '@/services/customerService'
import Spinner from '@/components/Spinner'
import {
  INVOICE_INTERNAL_STATUS_LABELS,
  getInternalStatusColor,
  TAX_AUTHORITY_STATUS,
  getTaxStatusLabel,
  getTaxStatusColor,
} from '@/constants/invoiceStatus'

// Định nghĩa kiểu dữ liệu hiển thị trên UI
export interface Invoice {
  id: string
  invoiceNumber: string
  symbol: string // Ký hiệu hoá đơn (template serial)
  customerName: string // Tên khách hàng
  taxCode: string // Mã số thuế khách hàng
  taxAuthority: string // Mã của CQT
  issueDate: string
  internalStatusId: number // ID trạng thái nội bộ (0-5)
  internalStatus: string // Label trạng thái nội bộ
  taxStatusId: number // ID trạng thái thuế (0-3)
  taxStatus: string // Label trạng thái thuế
  amount: number
}

// Mapper từ backend response sang UI format
const mapInvoiceToUI = (
  item: InvoiceListItem,
  templateMap: Map<number, string>,
  customerMap: Map<number, { name: string; taxCode: string }>
): Invoice => {
  const template = templateMap.get(item.templateID)
  const customer = customerMap.get(item.customerID)
  
  // Xác định trạng thái thuế dựa trên taxAuthorityCode
  const taxStatusId = item.taxAuthorityCode 
    ? TAX_AUTHORITY_STATUS.ACCEPTED 
    : TAX_AUTHORITY_STATUS.NOT_SENT
  
  return {
    id: item.invoiceID.toString(),
    invoiceNumber: `0000${item.invoiceID}`, // Dùng invoiceID thay vì invoiceNumber để tránh trùng
    symbol: template || '',
    customerName: customer?.name || '',
    taxCode: customer?.taxCode || '',
    taxAuthority: item.taxAuthorityCode || '',
    issueDate: item.createdAt,
    internalStatusId: item.invoiceStatusID,
    internalStatus: INVOICE_INTERNAL_STATUS_LABELS[item.invoiceStatusID] || 'Không xác định',
    taxStatusId: taxStatusId,
    taxStatus: getTaxStatusLabel(taxStatusId),
    amount: item.totalAmount,
  }
}

const InvoiceManagement = () => {
  const navigate = useNavigate()
  
  // State quản lý data
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  
  // State quản lý bộ lọc - sử dụng InvoiceFilterState
  const [filters, setFilters] = useState<InvoiceFilterState>({
    searchText: '',
    dateFrom: null,
    dateTo: null,
    invoiceStatus: [],
    taxStatus: '',
    customer: null,
    project: null,
    invoiceType: [],
    amountFrom: '',
    amountTo: '',
  })

  // Load invoices từ API
  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load all data in parallel
      const [invoicesData, templatesData, customersData] = await Promise.all([
        invoiceService.getAllInvoices(),
        templateService.getAllTemplates(),
        customerService.getAllCustomers(),
      ])
      
      // Create maps for quick lookup
      const templateMap = new Map(
        templatesData.map(t => [t.templateID, t.serial])
      )
      const customerMap = new Map(
        customersData.map(c => [c.customerID, { name: c.customerName, taxCode: c.taxCode }])
      )
      
      // Map invoices with real data
      const mappedData = invoicesData.map(item => mapInvoiceToUI(item, templateMap, customerMap))
      setInvoices(mappedData)
    } catch (err) {
      console.error('Failed to load invoices:', err)
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách hóa đơn')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  // Handler khi filter thay đổi
  const handleFilterChange = (newFilters: InvoiceFilterState) => {
    setFilters(newFilters)
  }

  // Handler khi reset filter
  const handleResetFilter = () => {
    setFilters({
      searchText: '',
      dateFrom: null,
      dateTo: null,
      invoiceStatus: [],
      taxStatus: '',
      customer: null,
      project: null,
      invoiceType: [],
      amountFrom: '',
      amountTo: '',
    })
  }

  // Gửi hóa đơn cho Kế toán trưởng (update status 1 -> 6)
  const handleSendForApproval = async (invoiceId: string) => {
    try {
      setSubmittingId(invoiceId)
      
      // Gọi API update status
      await invoiceService.updateInvoiceStatus(parseInt(invoiceId), 6)
      
      // Update UI optimistically
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, internalStatusId: 6, internalStatus: INVOICE_INTERNAL_STATUS_LABELS[6] }
          : inv
      ))
      
      setSnackbar({
        open: true,
        message: 'Đã gửi hóa đơn cho Kế toán trưởng',
        severity: 'success'
      })
      
      // Reload data
      await loadInvoices()
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Không thể gửi hóa đơn',
        severity: 'error'
      })
    } finally {
      setSubmittingId(null)
    }
  }

  // Định nghĩa columns
  const columns: GridColDef[] = [
    {
      field: 'invoiceNumber',
      headerName: 'Số hóa đơn',
      flex: 1,
      minWidth: 130,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Link
          to={`/invoices/${params.row.id}`}
          style={{
            textDecoration: 'none',
            color: '#1976d2',
            fontWeight: 600,
            transition: 'color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#1565c0')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#1976d2')}>
          {params.value as string}
        </Link>
      ),
    },
    {
      field: 'symbol',
      headerName: 'Ký hiệu',
      flex: 0.8,
      minWidth: 100,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as string
        if (!value) return <Typography variant="body2" sx={{ color: '#bdbdbd', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>-</Typography>
        return (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: '#1976d2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}>
            {value}
          </Typography>
        )
      },
    },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1.5,
      minWidth: 180,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'taxCode',
      headerName: 'Mã số thuế',
      flex: 1,
      minWidth: 120,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as string
        if (!value) return <Typography variant="body2" sx={{ color: '#bdbdbd', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>-</Typography>
        return (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              letterSpacing: '0.02em',
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}>
            {value}
          </Typography>
        )
      },
    },
    {
      field: 'taxAuthority',
      headerName: 'Mã của CQT',
      flex: 1,
      minWidth: 130,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value as string
        if (!value) return <Typography variant="body2" sx={{ color: '#bdbdbd' }}>-</Typography>
        return (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: '#1976d2',
              backgroundColor: '#e3f2fd',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
            }}>
            {value}
          </Typography>
        )
      },
    },
    {
      field: 'issueDate',
      headerName: 'Ngày phát hành',
      flex: 1,
      minWidth: 130,
      sortable: true,
      type: 'date',
      align: 'center',
      headerAlign: 'center',
      valueGetter: (value: string) => new Date(value),
      renderCell: (params: GridRenderCellParams) => dayjs(params.value as Date).format('DD/MM/YYYY'),
    },
    {
      field: 'internalStatus',
      headerName: 'Trạng thái',
      flex: 1,
      minWidth: 140,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const statusId = params.row.internalStatusId
        return (
          <Chip 
            label={params.value as string} 
            color={getInternalStatusColor(statusId)} 
            size="small" 
            sx={{ fontWeight: 600 }}
          />
        )
      },
    },
    {
      field: 'taxStatus',
      headerName: 'Trạng thái CQT',
      flex: 1,
      minWidth: 140,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const taxStatusId = params.row.taxStatusId
        return (
          <Chip 
            label={params.value as string} 
            color={getTaxStatusColor(taxStatusId)} 
            size="small"
            sx={{ fontWeight: 600 }}
          />
        )
      },
    },
    {
      field: 'amount',
      headerName: 'Tổng tiền',
      flex: 1,
      minWidth: 120,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(params.value as number),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const isDraft = params.row.internalStatusId === 1 // Status Nháp
        const isPendingSign = params.row.internalStatusId === 7 // Status Chờ ký
        const isSending = submittingId === params.row.id
        
        return (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
            <Tooltip title="Xem chi tiết" arrow>
              <IconButton
                component={Link}
                to={`/invoices/${params.row.id}`}
                size="small"
                color="info"
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                  },
                }}>
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {isDraft && (
              <Tooltip title="Chỉnh sửa" arrow>
                <IconButton
                  size="small"
                  color="primary"
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(28, 132, 238, 0.08)',
                    },
                  }}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {isDraft && (
              <Tooltip title="Gửi cho KT Trưởng" arrow>
                <IconButton
                  size="small"
                  color="success"
                  disabled={isSending}
                  onClick={() => handleSendForApproval(params.row.id)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(46, 125, 50, 0.08)',
                    },
                  }}>
                  <SendIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {isPendingSign && (
              <Tooltip title="Ký số" arrow>
                <IconButton
                  size="small"
                  color="secondary"
                  onClick={() => console.log('Ký số hóa đơn:', params.row.id)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(156, 39, 176, 0.08)',
                    },
                  }}>
                  <DrawIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      },
    },
  ]

  // Logic lọc dữ liệu - tích hợp với InvoiceFilter
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Lọc theo text search (số HĐ, ký hiệu, tên khách hàng, mã số thuế)
      const matchesSearch =
        !filters.searchText ||
        invoice.invoiceNumber.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        invoice.symbol.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        invoice.taxCode.toLowerCase().includes(filters.searchText.toLowerCase())

      // Lọc theo khoảng ngày
      const matchesDateFrom = !filters.dateFrom || dayjs(invoice.issueDate).isAfter(filters.dateFrom, 'day') || dayjs(invoice.issueDate).isSame(filters.dateFrom, 'day')
      const matchesDateTo = !filters.dateTo || dayjs(invoice.issueDate).isBefore(filters.dateTo, 'day') || dayjs(invoice.issueDate).isSame(filters.dateTo, 'day')

      // Lọc theo trạng thái hóa đơn (multiselect)
      const matchesInvoiceStatus = filters.invoiceStatus.length === 0 || filters.invoiceStatus.includes(invoice.internalStatus)

      // Lọc theo trạng thái CQT
      const matchesTaxStatus = !filters.taxStatus || invoice.taxStatus === filters.taxStatus

      // Lọc theo khách hàng
      const matchesCustomer = !filters.customer || invoice.customerName === filters.customer

      // Lọc theo khoảng tiền
      const matchesAmountFrom = !filters.amountFrom || invoice.amount >= parseFloat(filters.amountFrom)
      const matchesAmountTo = !filters.amountTo || invoice.amount <= parseFloat(filters.amountTo)

      return (
        matchesSearch &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesInvoiceStatus &&
        matchesTaxStatus &&
        matchesCustomer &&
        matchesAmountFrom &&
        matchesAmountTo
      )
    })
  }, [invoices, filters])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
                Quản lý Hóa đơn
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Quản lý và theo dõi các hóa đơn điện tử của doanh nghiệp
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/newinvoices')}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(28, 132, 238, 0.24)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(28, 132, 238, 0.32)',
                },
              }}>
              Tạo hóa đơn
            </Button>
          </Box>

          {/* Bộ lọc nâng cao */}
          <InvoiceFilter onFilterChange={handleFilterChange} onReset={handleResetFilter} />

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
              <Spinner />
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Paper sx={{ p: 3, mt: 2, backgroundColor: '#fff3e0', border: '1px solid #ffb74d' }}>
              <Typography color="error" variant="body1">
                {error}
              </Typography>
            </Paper>
          )}

          {/* Data Table */}
          {!loading && !error && (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                overflow: 'hidden',
              }}>
              {/* Table Section */}
              <DataGrid
              rows={filteredInvoices}
              columns={columns}
              checkboxSelection
              disableRowSelectionOnClick
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
        )}
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  </LocalizationProvider>
  )
}

export default InvoiceManagement