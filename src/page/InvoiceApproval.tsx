import { useState, useMemo, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import DrawIcon from '@mui/icons-material/Draw'
import EmailIcon from '@mui/icons-material/Email'
import PrintIcon from '@mui/icons-material/Print'
import DownloadIcon from '@mui/icons-material/Download'
import FindReplaceIcon from '@mui/icons-material/FindReplace'
import RestoreIcon from '@mui/icons-material/Restore'
import { Link } from 'react-router-dom'
import InvoiceFilter, { InvoiceFilterState } from '@/components/InvoiceFilter'
import invoiceService, { InvoiceListItem } from '@/services/invoiceService'
import templateService from '@/services/templateService'
import customerService from '@/services/customerService'
import Spinner from '@/components/Spinner'
import {
  INVOICE_INTERNAL_STATUS,
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
  symbol: string
  customerName: string
  taxCode: string
  taxAuthority: string
  issueDate: string
  internalStatusId: number
  internalStatus: string
  taxStatusId: number
  taxStatus: string
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
  
  const taxStatusId = item.taxAuthorityCode 
    ? TAX_AUTHORITY_STATUS.ACCEPTED 
    : TAX_AUTHORITY_STATUS.NOT_SENT
  
  return {
    id: item.invoiceID.toString(),
    invoiceNumber: `0000${item.invoiceID}`,
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

// Component menu thao tác cho mỗi hóa đơn
interface InvoiceApprovalActionsMenuProps {
  invoice: Invoice
  onApprove: (id: string, invoiceNumber: string) => void
  onReject: (id: string, invoiceNumber: string) => void
}

const InvoiceApprovalActionsMenu = ({ invoice, onApprove, onReject }: InvoiceApprovalActionsMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  // Xác định trạng thái hóa đơn
  const isPendingApproval = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.PENDING_APPROVAL // 6 - Chờ duyệt
  const isPendingSign = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.PENDING_SIGN // 7 - Đã duyệt, chờ ký
  const isIssued = invoice.internalStatusId === INVOICE_INTERNAL_STATUS.ISSUED // 2 - Đã phát hành (đã ký + gửi)
  
  // Logic điều khiển menu
  const canCancel = isPendingApproval || isPendingSign // Có thể hủy khi Chờ duyệt HOẶC Chờ ký

  const menuItems = [
    {
      label: 'Xem chi tiết',
      icon: <VisibilityOutlinedIcon fontSize="small" />,
      enabled: true,
      action: () => {
        // Link sẽ được xử lý riêng
        handleClose()
      },
      color: 'primary.main',
      isLink: true,
      linkTo: `/approval/invoices/${invoice.id}`,
    },
    {
      label: 'Chỉnh sửa',
      icon: <EditOutlinedIcon fontSize="small" />,
      enabled: isPendingApproval,
      action: () => {
        console.log('Chỉnh sửa:', invoice.id)
        handleClose()
      },
      color: 'primary.main',
    },
    {
      label: 'Duyệt',
      icon: <CheckCircleIcon fontSize="small" />,
      enabled: isPendingApproval,
      action: () => {
        onApprove(invoice.id, invoice.invoiceNumber)
        handleClose()
      },
      color: 'success.main',
    },
    {
      label: 'Ký số',
      icon: <DrawIcon fontSize="small" />,
      enabled: isPendingSign,
      action: () => {
        console.log('Ký số:', invoice.id)
        handleClose()
      },
      color: 'secondary.main',
    },
    { divider: true },
    {
      label: 'Gửi email',
      icon: <EmailIcon fontSize="small" />,
      enabled: true, // Luôn dùng được
      action: () => {
        console.log('Gửi email:', invoice.id)
        handleClose()
      },
      color: 'info.main',
    },
    {
      label: 'In hóa đơn',
      icon: <PrintIcon fontSize="small" />,
      enabled: true, // Luôn dùng được
      action: () => {
        console.log('In hóa đơn:', invoice.id)
        handleClose()
      },
      color: 'text.primary',
    },
    {
      label: 'Tải xuống',
      icon: <DownloadIcon fontSize="small" />,
      enabled: true, // Luôn dùng được
      action: () => {
        console.log('Tải xuống:', invoice.id)
        handleClose()
      },
      color: 'text.primary',
    },
    { divider: true },
    {
      label: 'Tạo HĐ điều chỉnh',
      icon: <FindReplaceIcon fontSize="small" />,
      enabled: isIssued,
      action: () => {
        console.log('Tạo HĐ điều chỉnh:', invoice.id)
        handleClose()
      },
      color: 'warning.main',
    },
    {
      label: 'Tạo HĐ thay thế',
      icon: <RestoreIcon fontSize="small" />,
      enabled: isIssued,
      action: () => {
        console.log('Tạo HĐ thay thế:', invoice.id)
        handleClose()
      },
      color: 'warning.main',
    },
    {
      label: 'Hủy',
      icon: <CancelIcon fontSize="small" />,
      enabled: canCancel, // Chờ duyệt hoặc Chờ ký (chưa phát hành)
      action: () => {
        onReject(invoice.id, invoice.invoiceNumber) // Dùng lại logic reject/cancel
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

          // Nếu là link item
          if ('isLink' in item && item.isLink) {
            return (
              <MenuItem
                key={item.label}
                component={Link}
                to={item.linkTo || '#'}
                disabled={!item.enabled}
                sx={{
                  py: 1.25,
                  px: 2.5,
                  gap: 1.5,
                  textDecoration: 'none',
                  color: 'inherit',
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

const InvoiceApproval = () => {
  // State quản lý data
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State quản lý bộ lọc
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

  // State cho dialog duyệt/từ chối
  const [approvalDialog, setApprovalDialog] = useState({
    open: false,
    invoiceId: '',
    invoiceNumber: '',
    action: '' as 'approve' | 'reject' | '',
  })
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  // State cho snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning',
  })

  // Load invoices từ API
  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [invoicesData, templatesData, customersData] = await Promise.all([
        invoiceService.getAllInvoices(),
        templateService.getAllTemplates(),
        customerService.getAllCustomers(),
      ])
      
      const templateMap = new Map(
        templatesData.map(t => [t.templateID, t.serial])
      )
      const customerMap = new Map(
        customersData.map(c => [c.customerID, { name: c.customerName, taxCode: c.taxCode }])
      )
      
      // ⭐ KẾ TOÁN TRƯỞNG XEM TẤT CẢ HÓA ĐƠN TRỪ NHÁP (status !== 1)
      const managementInvoices = invoicesData.filter(
        item => item.invoiceStatusID !== INVOICE_INTERNAL_STATUS.DRAFT
      )
      
      const mappedData = managementInvoices.map(item => mapInvoiceToUI(item, templateMap, customerMap))
      setInvoices(mappedData)
    } catch (err) {
      console.error('Failed to load invoices:', err)
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách hóa đơn')
    } finally {
      setLoading(false)
    }
  }

  // Handlers
  const handleFilterChange = (newFilters: InvoiceFilterState) => {
    setFilters(newFilters)
  }

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

  const handleOpenApprovalDialog = (invoiceId: string, invoiceNumber: string, action: 'approve' | 'reject') => {
    setApprovalDialog({
      open: true,
      invoiceId,
      invoiceNumber,
      action,
    })
    setRejectionReason('')
  }

  const handleCloseApprovalDialog = () => {
    setApprovalDialog({
      open: false,
      invoiceId: '',
      invoiceNumber: '',
      action: '',
    })
    setRejectionReason('')
  }

  const handleConfirmAction = async () => {
    if (approvalDialog.action === 'reject' && !rejectionReason.trim()) {
      setSnackbar({
        open: true,
        message: 'Vui lòng nhập lý do từ chối',
        severity: 'warning',
      })
      return
    }

    setActionLoading(true)
    try {
      // ⭐ Gọi API để update status
      
      if (approvalDialog.action === 'approve') {
        // ✅ Update status từ PENDING_APPROVAL (6) -> PENDING_SIGN (7)
        await invoiceService.updateInvoiceStatus(parseInt(approvalDialog.invoiceId), INVOICE_INTERNAL_STATUS.PENDING_SIGN)
        
        setSnackbar({
          open: true,
          message: `Đã duyệt hóa đơn ${approvalDialog.invoiceNumber}`,
          severity: 'success',
        })
      } else {
        // ✅ Update status từ PENDING_APPROVAL (6) -> CANCELLED (3) - Bị từ chối
        await invoiceService.updateInvoiceStatus(parseInt(approvalDialog.invoiceId), INVOICE_INTERNAL_STATUS.CANCELLED)
        // TODO: Gửi rejectionReason lên backend nếu API hỗ trợ
        
        setSnackbar({
          open: true,
          message: `Đã từ chối hóa đơn ${approvalDialog.invoiceNumber}`,
          severity: 'success',
        })
      }

      handleCloseApprovalDialog()
      
      // Reload data để refresh danh sách
      await loadInvoices()
      
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Không thể thực hiện thao tác',
        severity: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Định nghĩa columns với chức năng duyệt
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
          to={`/approval/invoices/${params.row.id}`}
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
      width: 80,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        return (
          <InvoiceApprovalActionsMenu
            invoice={params.row as Invoice}
            onApprove={(id, invoiceNumber) => handleOpenApprovalDialog(id, invoiceNumber, 'approve')}
            onReject={(id, invoiceNumber) => handleOpenApprovalDialog(id, invoiceNumber, 'reject')}
          />
        )
      },
    },
  ]

  // Logic lọc dữ liệu
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        !filters.searchText ||
        invoice.invoiceNumber.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        invoice.symbol.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        invoice.taxCode.toLowerCase().includes(filters.searchText.toLowerCase())

      const matchesDateFrom = !filters.dateFrom || dayjs(invoice.issueDate).isAfter(filters.dateFrom, 'day') || dayjs(invoice.issueDate).isSame(filters.dateFrom, 'day')
      const matchesDateTo = !filters.dateTo || dayjs(invoice.issueDate).isBefore(filters.dateTo, 'day') || dayjs(invoice.issueDate).isSame(filters.dateTo, 'day')
      const matchesInvoiceStatus = filters.invoiceStatus.length === 0 || filters.invoiceStatus.includes(invoice.internalStatus)
      const matchesTaxStatus = !filters.taxStatus || invoice.taxStatus === filters.taxStatus
      const matchesCustomer = !filters.customer || invoice.customerName === filters.customer
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

  // Count pending approval invoices
  const pendingCount = useMemo(() => {
    return invoices.filter(inv => inv.internalStatusId === INVOICE_INTERNAL_STATUS.PENDING_APPROVAL).length
  }, [invoices])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                Duyệt Hóa đơn
              </Typography>
              {pendingCount > 0 && (
                <Chip
                  label={`${pendingCount} chờ duyệt`}
                  color="warning"
                  sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Duyệt và quản lý các hóa đơn điện tử - Dành cho Kế toán trưởng
            </Typography>
          </Box>

          {/* Bộ lọc */}
          <InvoiceFilter onFilterChange={handleFilterChange} onReset={handleResetFilter} />

          {/* Loading */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
              <Spinner />
            </Box>
          )}

          {/* Error */}
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
                  },
                }}
                autoHeight
              />
            </Paper>
          )}
        </Box>

        {/* Approval/Rejection Dialog */}
        <Dialog
          open={approvalDialog.open}
          onClose={handleCloseApprovalDialog}
          maxWidth="sm"
          fullWidth>
          <DialogTitle>
            {approvalDialog.action === 'approve' ? 'Xác nhận duyệt hóa đơn' : 'Xác nhận từ chối hóa đơn'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {approvalDialog.action === 'approve' 
                ? `Bạn có chắc chắn muốn duyệt hóa đơn ${approvalDialog.invoiceNumber}?`
                : `Bạn có chắc chắn muốn từ chối hóa đơn ${approvalDialog.invoiceNumber}?`
              }
            </Typography>
            
            {approvalDialog.action === 'reject' && (
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Lý do từ chối *"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Nhập lý do từ chối hóa đơn..."
                sx={{ mt: 2 }}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={handleCloseApprovalDialog} disabled={actionLoading}>
              Hủy
            </Button>
            <Button
              variant="contained"
              color={approvalDialog.action === 'approve' ? 'success' : 'error'}
              onClick={handleConfirmAction}
              disabled={actionLoading}
              startIcon={approvalDialog.action === 'approve' ? <CheckCircleIcon /> : <CancelIcon />}>
              {actionLoading ? 'Đang xử lý...' : (approvalDialog.action === 'approve' ? 'Duyệt' : 'Từ chối')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  )
}

export default InvoiceApproval
