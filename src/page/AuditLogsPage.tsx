import { useState, useEffect, useMemo, useCallback } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Grid,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel } from '@mui/x-data-grid'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import RefreshIcon from '@mui/icons-material/Refresh'
import StorageIcon from '@mui/icons-material/Storage'
import TimelineIcon from '@mui/icons-material/Timeline'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'

import auditService, { DataLog, ActivityLog } from '@/services/auditService'
import AuditLogsFilter, { AuditLogsFilterState } from '@/components/AuditLogsFilter'

type TabValue = 'data' | 'activity'

const AuditLogsPage = () => {
  usePageTitle('Nhật ký hệ thống')
  
  // State: Tab
  const [currentTab, setCurrentTab] = useState<TabValue>('activity')

  // State: Data Logs
  const [dataLogs, setDataLogs] = useState<DataLog[]>([])
  const [dataLogsLoading, setDataLogsLoading] = useState(false)
  const [dataLogsPagination, setDataLogsPagination] = useState({
    pageIndex: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  })

  // State: Activity Logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [activityLogsLoading, setActivityLogsLoading] = useState(false)
  const [activityLogsPagination, setActivityLogsPagination] = useState({
    pageIndex: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  })

  // State: Filters (Unified with AuditLogsFilter component)
  const [filters, setFilters] = useState<AuditLogsFilterState>({
    searchText: '',
    dateFrom: dayjs().subtract(7, 'day'),
    dateTo: dayjs(),
    activityStatus: 'all',
    tableName: 'all',
    action: 'all',
  })

  // State: Detail Modal
  const [viewingDataLog, setViewingDataLog] = useState<DataLog | null>(null)
  const [viewingActivityLog, setViewingActivityLog] = useState<ActivityLog | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Fetch Data Logs
  const fetchDataLogs = useCallback(async () => {
    try {
      setDataLogsLoading(true)
      
      const response = await auditService.getDataLogs({
        pageIndex: dataLogsPagination.pageIndex,
        pageSize: dataLogsPagination.pageSize,
        tableName: filters.tableName !== 'all' ? filters.tableName : undefined,
        action: filters.action !== 'all' ? filters.action : undefined,
        fromDate: filters.dateFrom?.toISOString(),
        toDate: filters.dateTo?.toISOString(),
      })

      setDataLogs(response.items)
      setDataLogsPagination({
        pageIndex: response.pageIndex,
        pageSize: 20, // Default pageSize
        totalCount: response.totalCount,
        totalPages: response.totalPages,
      })
    } catch (error) {
      console.error('Failed to fetch data logs:', error)
      setDataLogs([])
    } finally {
      setDataLogsLoading(false)
    }
  }, [dataLogsPagination.pageIndex, dataLogsPagination.pageSize, filters.tableName, filters.action, filters.dateFrom, filters.dateTo])

  // Fetch Activity Logs
  const fetchActivityLogs = useCallback(async () => {
    try {
      setActivityLogsLoading(true)
      
      const response = await auditService.getActivityLogs({
        pageIndex: activityLogsPagination.pageIndex,
        pageSize: activityLogsPagination.pageSize,
        status: filters.activityStatus !== 'all' ? (filters.activityStatus as 'Success' | 'Failed') : undefined,
        fromDate: filters.dateFrom?.toISOString(),
        toDate: filters.dateTo?.toISOString(),
      })

      setActivityLogs(response.items)
      setActivityLogsPagination({
        pageIndex: response.pageIndex,
        pageSize: 20, // Default pageSize
        totalCount: response.totalCount,
        totalPages: response.totalPages,
      })
    } catch (error) {
      console.error('Failed to fetch activity logs:', error)
      setActivityLogs([])
    } finally {
      setActivityLogsLoading(false)
    }
  }, [activityLogsPagination.pageIndex, activityLogsPagination.pageSize, filters.activityStatus, filters.dateFrom, filters.dateTo])

  // Effect: Fetch logs when tab changes or filters change
  useEffect(() => {
    if (currentTab === 'data') {
      fetchDataLogs()
    } else {
      fetchActivityLogs()
    }
  }, [currentTab, fetchDataLogs, fetchActivityLogs])

  // Filtered Data Logs (client-side search with Vietnamese labels)
  const filteredDataLogs = useMemo(() => {
    if (!filters.searchText) return dataLogs

    const searchLower = filters.searchText.toLowerCase().trim()
    return dataLogs.filter((log) => {
      // Search raw field values
      if (
        log.userName.toLowerCase().includes(searchLower) ||
        log.tableName.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        (log.recordId && log.recordId.includes(searchLower)) ||
        log.traceId.toLowerCase().includes(searchLower)
      ) {
        return true
      }

      // Search Vietnamese labels
      const actionLabel = auditService.getActionLabel(log.action).toLowerCase()
      const tableLabel = auditService.getTableLabel(log.tableName).toLowerCase()
      if (actionLabel.includes(searchLower) || tableLabel.includes(searchLower)) {
        return true
      }

      // Search formatted timestamp (DD/MM/YYYY HH:mm:ss)
      const formattedTimestamp = dayjs(log.timestamp).format('DD/MM/YYYY HH:mm:ss')
      if (formattedTimestamp.includes(searchLower)) {
        return true
      }

      // Search oldValues content
      if (log.oldValues) {
        try {
          const oldValuesObj = JSON.parse(log.oldValues)
          const oldValuesStr = JSON.stringify(oldValuesObj).toLowerCase()
          if (oldValuesStr.includes(searchLower)) {
            return true
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Search newValues content
      if (log.newValues) {
        try {
          const newValuesObj = JSON.parse(log.newValues)
          const newValuesStr = JSON.stringify(newValuesObj).toLowerCase()
          if (newValuesStr.includes(searchLower)) {
            return true
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      return false
    })
  }, [dataLogs, filters.searchText])

  // Filtered Activity Logs (client-side search with Vietnamese labels)
  const filteredActivityLogs = useMemo(() => {
    if (!filters.searchText) return activityLogs

    const searchLower = filters.searchText.toLowerCase().trim()
    return activityLogs.filter((log) => {
      // Search raw field values
      if (
        log.userId.toLowerCase().includes(searchLower) ||
        log.actionName.toLowerCase().includes(searchLower) ||
        log.description.toLowerCase().includes(searchLower) ||
        log.ipAddress.includes(searchLower)
      ) {
        return true
      }

      // Search Vietnamese labels
      const userIdLabel = auditService.getUserIdLabel(log.userId).toLowerCase()
      const actionNameLabel = auditService.getActionNameLabel(log.actionName).toLowerCase()
      const statusLabel = auditService.getStatusLabel(log.status).toLowerCase()
      if (
        userIdLabel.includes(searchLower) ||
        actionNameLabel.includes(searchLower) ||
        statusLabel.includes(searchLower)
      ) {
        return true
      }

      // Search formatted timestamp (DD/MM/YYYY HH:mm:ss)
      const formattedTimestamp = dayjs(log.timestamp).format('DD/MM/YYYY HH:mm:ss')
      if (formattedTimestamp.includes(searchLower)) {
        return true
      }

      return false
    })
  }, [activityLogs, filters.searchText])

  // Handlers
  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setCurrentTab(newValue)
    // Clear search when switching tabs
    setFilters((prev) => ({ ...prev, searchText: '' }))
  }

  // Handle filter change from AuditLogsFilter component
  const handleFilterChange = (newFilters: AuditLogsFilterState) => {
    setFilters(newFilters)
  }

  // Handle filter reset
  const handleFilterReset = () => {
    setFilters({
      searchText: '',
      dateFrom: dayjs().subtract(7, 'day'),
      dateTo: dayjs(),
      activityStatus: 'all',
      tableName: 'all',
      action: 'all',
    })
  }

  const handleViewDataLogDetails = (log: DataLog) => {
    setViewingDataLog(log)
    setIsDetailModalOpen(true)
  }

  const handleViewActivityLogDetails = (log: ActivityLog) => {
    setViewingActivityLog(log)
    setIsDetailModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsDetailModalOpen(false)
    setViewingDataLog(null)
    setViewingActivityLog(null)
  }

  const handleRefresh = () => {
    if (currentTab === 'data') {
      fetchDataLogs()
    } else {
      fetchActivityLogs()
    }
  }

  const handleDataLogsPaginationChange = (model: GridPaginationModel) => {
    setDataLogsPagination((prev) => ({
      ...prev,
      pageIndex: model.page + 1, // MUI DataGrid uses 0-based, backend uses 1-based
      pageSize: model.pageSize,
    }))
  }

  const handleActivityLogsPaginationChange = (model: GridPaginationModel) => {
    setActivityLogsPagination((prev) => ({
      ...prev,
      pageIndex: model.page + 1,
      pageSize: model.pageSize,
    }))
  }

  // DataGrid Columns: Data Logs
  const dataLogsColumns: GridColDef[] = [
    {
      field: 'timestamp',
      headerName: 'Thời gian',
      width: 160,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<DataLog>) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.875rem',
              fontWeight: 600,
              lineHeight: 1.2,
              color: 'text.primary',
            }}
          >
            {dayjs(params.row.timestamp).format('DD/MM/YYYY')}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '0.75rem',
              color: 'text.secondary',
              lineHeight: 1,
            }}
          >
            {dayjs(params.row.timestamp).format('HH:mm:ss')}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'userName',
      headerName: 'Người thực hiện',
      width: 180,
      flex: 0.5,
      renderCell: (params: GridRenderCellParams<DataLog>) => (
        <Box display="flex" alignItems="center" gap={1}>
          <PersonOutlineIcon fontSize="small" color="action" sx={{ fontSize: '1.125rem' }} />
          <Typography 
            variant="body2" 
            sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {params.row.userName}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'action',
      headerName: 'Hành động',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<DataLog>) => (
        <Chip
          label={auditService.getActionLabel(params.row.action)}
          color={auditService.getActionColor(params.row.action)}
          size="small"
          sx={{ 
            fontWeight: 600,
            minWidth: 90,
            fontSize: '0.8125rem',
          }}
        />
      ),
    },
    {
      field: 'tableName',
      headerName: 'Bảng dữ liệu',
      width: 160,
      flex: 0.5,
      renderCell: (params: GridRenderCellParams<DataLog>) => (
        <Chip
          label={auditService.getTableLabel(params.row.tableName)}
          variant="outlined"
          size="small"
          sx={{ 
            fontWeight: 500,
            fontSize: '0.8125rem',
          }}
        />
      ),
    },
    {
      field: 'recordId',
      headerName: 'Record ID',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<DataLog>) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontFamily: 'monospace',
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'text.secondary',
          }}
        >
          {params.row.recordId || '—'}
        </Typography>
      ),
    },
    {
      field: 'traceId',
      headerName: 'Trace ID',
      width: 240,
      flex: 1,
      renderCell: (params: GridRenderCellParams<DataLog>) => (
        <Typography 
          variant="caption" 
          sx={{ 
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            color: 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {params.row.traceId}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams<DataLog>) => (
        <IconButton
          size="small"
          onClick={() => handleViewDataLogDetails(params.row)}
          color="primary"
          sx={{
            '&:hover': {
              bgcolor: 'primary.lighter',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s',
          }}
        >
          <VisibilityOutlinedIcon fontSize="small" />
        </IconButton>
      ),
    },
  ]

  // DataGrid Columns: Activity Logs
  const activityLogsColumns: GridColDef[] = [
    {
      field: 'timestamp',
      headerName: 'Thời gian',
      width: 160,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<ActivityLog>) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.875rem',
              fontWeight: 600,
              lineHeight: 1.2,
              color: 'text.primary',
            }}
          >
            {dayjs(params.row.timestamp).format('DD/MM/YYYY')}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '0.75rem',
              color: 'text.secondary',
              lineHeight: 1,
            }}
          >
            {dayjs(params.row.timestamp).format('HH:mm:ss')}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'userId',
      headerName: 'Vai trò',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<ActivityLog>) => {
        const userId = params.row.userId
        const label = auditService.getUserIdLabel(userId)
        
        // Determine color based on role
        const getChipColor = (id: string): 'default' | 'primary' | 'secondary' | 'success' | 'info' => {
          const lower = id.toLowerCase()
          if (lower === 'system') return 'default'
          if (lower === 'admin') return 'primary'
          if (lower === 'hod') return 'secondary'
          if (lower === 'accountant') return 'success'
          if (lower === 'sale') return 'info'
          return 'default'
        }

        return (
          <Chip 
            label={label}
            size="small" 
            color={getChipColor(userId)}
            sx={{ 
              fontWeight: 600,
              fontSize: '0.8125rem',
              minWidth: 120,
            }}
          />
        )
      },
    },
    {
      field: 'actionName',
      headerName: 'Hành động',
      width: 220,
      flex: 1,
      renderCell: (params: GridRenderCellParams<ActivityLog>) => (
        <Typography 
          variant="body2" 
          sx={{
            fontSize: '0.875rem',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {auditService.getActionNameLabel(params.row.actionName)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<ActivityLog>) => (
        <Chip
          label={auditService.getStatusLabel(params.row.status)}
          color={auditService.getStatusColor(params.row.status)}
          size="small"
          sx={{ 
            fontWeight: 600,
            minWidth: 100,
            fontSize: '0.8125rem',
          }}
        />
      ),
    },
    {
      field: 'description',
      headerName: 'Mô tả',
      width: 300,
      flex: 1.5,
      renderCell: (params: GridRenderCellParams<ActivityLog>) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.875rem',
            color: 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {params.row.description}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams<ActivityLog>) => (
        <IconButton
          size="small"
          onClick={() => handleViewActivityLogDetails(params.row)}
          color="primary"
          sx={{
            '&:hover': {
              bgcolor: 'primary.lighter',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s',
          }}
        >
          <VisibilityOutlinedIcon fontSize="small" />
        </IconButton>
      ),
    },
  ]

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Nhật ký Hệ thống
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Theo dõi thay đổi dữ liệu và hoạt động người dùng
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={dataLogsLoading || activityLogsLoading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Làm mới
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadOutlinedIcon />}
                disabled
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                Xuất Excel
              </Button>
            </Box>
          </Box>

          {/* Tabs */}
          <Paper 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <Tabs 
              value={currentTab} 
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  minHeight: 64,
                },
              }}
            >
              <Tab
                value="activity"
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <TimelineIcon />
                    <Typography fontWeight={600}>
                      Hoạt động người dùng ({activityLogsPagination.totalCount})
                    </Typography>
                  </Box>
                }
              />
              <Tab
                value="data"
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <StorageIcon />
                    <Typography fontWeight={600}>
                      Thay đổi dữ liệu ({dataLogsPagination.totalCount})
                    </Typography>
                  </Box>
                }
              />
            </Tabs>
          </Paper>

          {/* NEW: AuditLogsFilter Component */}
          <AuditLogsFilter
            currentTab={currentTab}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
          />
        </Box>

        {/* DataGrid */}
        <Paper 
          elevation={2}
          sx={{ 
            height: 650, 
            width: '100%',
            overflow: 'hidden',
            borderRadius: 2,
          }}
        >
          {currentTab === 'data' ? (
            <DataGrid
              rows={filteredDataLogs}
              columns={dataLogsColumns}
              getRowId={(row) => row.auditID}
              loading={dataLogsLoading}
              pageSizeOptions={[10, 20, 50, 100]}
              paginationMode="server"
              rowCount={dataLogsPagination.totalCount}
              paginationModel={{
                page: dataLogsPagination.pageIndex - 1,
                pageSize: dataLogsPagination.pageSize,
              }}
              onPaginationModelChange={handleDataLogsPaginationChange}
              disableRowSelectionOnClick
              rowHeight={68}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: 'grey.50',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  minHeight: '56px !important',
                  maxHeight: '56px !important',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700,
                  fontSize: '0.875rem',
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid',
                  borderColor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                },
                '& .MuiDataGrid-row': {
                  '&:nth-of-type(even)': {
                    bgcolor: 'grey.50',
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                    cursor: 'pointer',
                  },
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '2px solid',
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                  minHeight: '52px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                },
                '& .MuiTablePagination-root': {
                  overflow: 'visible',
                },
                '& .MuiTablePagination-toolbar': {
                  minHeight: '52px',
                  paddingLeft: 2,
                  paddingRight: 2,
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  margin: 0,
                  fontSize: '0.875rem',
                },
              }}
            />
          ) : (
            <DataGrid
              rows={filteredActivityLogs}
              columns={activityLogsColumns}
              getRowId={(row) => row.logId}
              loading={activityLogsLoading}
              pageSizeOptions={[10, 20, 50, 100]}
              paginationMode="server"
              rowCount={activityLogsPagination.totalCount}
              paginationModel={{
                page: activityLogsPagination.pageIndex - 1,
                pageSize: activityLogsPagination.pageSize,
              }}
              onPaginationModelChange={handleActivityLogsPaginationChange}
              disableRowSelectionOnClick
              rowHeight={68}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: 'grey.50',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  minHeight: '56px !important',
                  maxHeight: '56px !important',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700,
                  fontSize: '0.875rem',
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid',
                  borderColor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                },
                '& .MuiDataGrid-row': {
                  '&:nth-of-type(even)': {
                    bgcolor: 'grey.50',
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                    cursor: 'pointer',
                  },
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '2px solid',
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                  minHeight: '52px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                },
                '& .MuiTablePagination-root': {
                  overflow: 'visible',
                },
                '& .MuiTablePagination-toolbar': {
                  minHeight: '52px',
                  paddingLeft: 2,
                  paddingRight: 2,
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  margin: 0,
                  fontSize: '0.875rem',
                },
              }}
            />
          )}
        </Paper>

        {/* Detail Modal - Data Log */}
        {viewingDataLog && (
          <Dialog
            open={isDetailModalOpen}
            onClose={handleCloseModal}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <StorageIcon />
                <Typography variant="h6">Chi tiết thay đổi dữ liệu</Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Audit ID
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    #{viewingDataLog.auditID}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Trace ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {viewingDataLog.traceId}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Người thực hiện
                  </Typography>
                  <Typography variant="body1">
                    {viewingDataLog.userName} (ID: {viewingDataLog.userID})
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Thời gian
                  </Typography>
                  <Typography variant="body1">
                    {dayjs(viewingDataLog.timestamp).format('DD/MM/YYYY HH:mm:ss')}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Bảng dữ liệu
                  </Typography>
                  <Chip
                    label={auditService.getTableLabel(viewingDataLog.tableName)}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Hành động
                  </Typography>
                  <Chip
                    label={auditService.getActionLabel(viewingDataLog.action)}
                    color={auditService.getActionColor(viewingDataLog.action)}
                    size="small"
                  />
                </Grid>
                {viewingDataLog.recordId && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Record ID
                    </Typography>
                    <Typography variant="body1">{viewingDataLog.recordId}</Typography>
                  </Grid>
                )}
                {viewingDataLog.oldValues && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Giá trị cũ
                    </Typography>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        maxHeight: 200,
                        overflow: 'auto',
                      }}
                    >
                      <pre style={{ margin: 0, fontSize: 12, fontFamily: 'monospace' }}>
                        {JSON.stringify(auditService.parseValues(viewingDataLog.oldValues), null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                )}
                {viewingDataLog.newValues && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Giá trị mới
                    </Typography>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        maxHeight: 200,
                        overflow: 'auto',
                      }}
                    >
                      <pre style={{ margin: 0, fontSize: 12, fontFamily: 'monospace' }}>
                        {JSON.stringify(auditService.parseValues(viewingDataLog.newValues), null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModal}>Đóng</Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Detail Modal - Activity Log */}
        {viewingActivityLog && (
          <Dialog
            open={isDetailModalOpen}
            onClose={handleCloseModal}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <TimelineIcon />
                <Typography variant="h6">Chi tiết hoạt động</Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Log ID
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    #{viewingActivityLog.logId}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Vai trò
                  </Typography>
                  <Chip label={auditService.getUserIdLabel(viewingActivityLog.userId)} size="small" />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Hành động
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {auditService.getActionNameLabel(viewingActivityLog.actionName)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    ({viewingActivityLog.actionName})
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Trạng thái
                  </Typography>
                  <Chip
                    label={auditService.getStatusLabel(viewingActivityLog.status)}
                    color={auditService.getStatusColor(viewingActivityLog.status)}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    IP Address
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {viewingActivityLog.ipAddress}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Thời gian
                  </Typography>
                  <Typography variant="body1">
                    {dayjs(viewingActivityLog.timestamp).format('DD/MM/YYYY HH:mm:ss')}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">
                    Mô tả
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: viewingActivityLog.status === 'Failed' ? 'error.lighter' : 'success.lighter',
                      mt: 1,
                    }}
                  >
                    <Typography variant="body2">{viewingActivityLog.description}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModal}>Đóng</Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </LocalizationProvider>
  )
}

export default AuditLogsPage
