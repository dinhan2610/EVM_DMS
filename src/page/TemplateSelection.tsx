import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Stack,
  Button,
  Fade,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  HelpOutline as HelpOutlineIcon,
  InfoOutlined as InfoIcon,
  PlayCircleOutline as PlayCircleIcon,
} from '@mui/icons-material'
import templateFrameService, { TemplateFrame } from '@/services/templateFrameService'
import API_CONFIG from '@/config/api.config'

const TemplateSelection: React.FC = () => {
  const navigate = useNavigate()
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [searchQuery] = useState('')
  const [selectedCategory] = useState<'All' | 'GTGT' | 'Banhang' | 'Universal'>('All')
  const [templateType, setTemplateType] = useState('Loại hoá đơn')
  const [baseType, setBaseType] = useState('Mẫu cơ bản')
  const [paperSize, setPaperSize] = useState('A4')
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  
  // API Integration States
  const [templates, setTemplates] = useState<TemplateFrame[]>([])
  const [loading, setLoading] = useState(false)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // ============================================================================
  // API CALLS
  // ============================================================================

  /**
   * Fetch all template frames from API
   */
  const fetchTemplateFrames = useCallback(async () => {
    // Check authentication first
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY)
    if (!token) {
      setSnackbar({
        open: true,
        message: 'Vui lòng đăng nhập để tiếp tục',
        severity: 'error',
      })
      setTimeout(() => {
        navigate('/auth/sign-in')
      }, 1500)
      return
    }

    setLoading(true)
    try {
      const frames = await templateFrameService.getAllTemplateFrames()
      setTemplates(frames)
      
      if (frames.length === 0) {
        setSnackbar({
          open: true,
          message: 'Không có mẫu hóa đơn nào',
          severity: 'info',
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải danh sách mẫu hóa đơn'
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      })
      console.error('Error fetching template frames:', error)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplateFrames()
  }, [fetchTemplateFrames])

  // ============================================================================
  // FILTERING LOGIC
  // ============================================================================

  /**
   * Filter templates based on search query and category
   */
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Close snackbar
   */
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  /**
   * Handle image load error - track failed images
   */
  const handleImageError = (templateId: number) => {
    console.warn(`Failed to load image for template ${templateId}`)
    setImageErrors((prev) => new Set(prev).add(templateId))
  }

  /**
   * Get fallback image URL for local templates
   */
  const getFallbackImageUrl = (frameId: number): string => {
    // Map frameID to local fallback images
    return `/khunghoadon/khunghoadon${frameId}.png`
  }

  /**
   * Handle template selection and navigate to editor
   */
  const handleSelectTemplate = (templateId: number) => {
    // Navigate to editor with selected template
    navigate(`/admin/templates/new?templateId=${templateId}`)
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e0e0e0', px: 3, py: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          {/* Left: Back + Title */}
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={() => navigate('/admin/templates')} sx={{ color: '#555' }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '1.25rem', color: '#1a1a1a', lineHeight: 1.2 }}>
                Thiết lập mẫu hóa đơn
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', mt: 0.25 }}>
                Hãy chọn một mẫu hoá đơn phù hợp với đơn vị để tiếp tục
              </Typography>
            </Box>
          </Stack>

          {/* Right: Help + Guide Button */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton sx={{ color: '#757575' }}>
              <HelpOutlineIcon sx={{ fontSize: 22 }} />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<PlayCircleIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#1976d2',
                fontSize: '0.875rem',
                px: 2.5,
                py: 0.75,
                '&:hover': {
                  bgcolor: '#1565c0',
                },
              }}>
              Xem phim hướng dẫn
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0', px: 3, py: 2.5 }}>
        <Stack direction="row" spacing={2.5} alignItems="center" justifyContent="center">
          {/* Dropdown 1 */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value)}
              displayEmpty
              variant="standard"
              MenuProps={{
                PaperProps: {
                  sx: {
                    mt: 0.5,
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                    border: '1.5px solid #1976d2',
                    borderRadius: 1.5,
                    '& .MuiList-root': {
                      padding: '4px',
                    },
                  },
                },
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
              }}
              sx={{
                fontSize: '0.875rem',
                transition: 'all 0.3s ease',
                '& .MuiSelect-select': {
                  color: templateType === 'Loại hoá đơn' ? '#9e9e9e' : '#424242',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  pb: 0.5,
                },
                '&:before': {
                  borderBottomColor: '#e0e0e0',
                  transition: 'border-color 0.3s ease',
                },
                '&:hover:before': {
                  borderBottomColor: '#1976d2 !important',
                },
                '&:after': {
                  borderBottomColor: '#1976d2',
                  borderBottomWidth: '2px',
                },
                '&.Mui-focused': {
                  '& .MuiSelect-select': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  },
                },
              }}>
              <MenuItem value="Loại hoá đơn" disabled sx={{ display: 'none' }}>
                Loại hoá đơn
              </MenuItem>
              <MenuItem 
                value="Hoá đơn GTGT" 
                sx={{
                  fontSize: '0.875rem',
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#bbdefb',
                    '&:hover': {
                      backgroundColor: '#90caf9',
                    },
                  },
                }}>
                Hoá đơn GTGT
              </MenuItem>
              <MenuItem 
                value="Hoá đơn bán hàng" 
                sx={{
                  fontSize: '0.875rem',
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#bbdefb',
                    '&:hover': {
                      backgroundColor: '#90caf9',
                    },
                  },
                }}>
                Hoá đơn bán hàng
              </MenuItem>
            </Select>
          </FormControl>

          {/* Dropdown 2 */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={baseType}
              onChange={(e) => setBaseType(e.target.value)}
              displayEmpty
              variant="standard"
              MenuProps={{
                PaperProps: {
                  sx: {
                    mt: 0.5,
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                    border: '1.5px solid #1976d2',
                    borderRadius: 1.5,
                    '& .MuiList-root': {
                      padding: '4px',
                    },
                  },
                },
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
              }}
              sx={{
                fontSize: '0.875rem',
                transition: 'all 0.3s ease',
                '& .MuiSelect-select': {
                  color: baseType === 'Mẫu cơ bản' ? '#9e9e9e' : '#424242',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  pb: 0.5,
                },
                '&:before': {
                  borderBottomColor: '#e0e0e0',
                  transition: 'border-color 0.3s ease',
                },
                '&:hover:before': {
                  borderBottomColor: '#1976d2 !important',
                },
                '&:after': {
                  borderBottomColor: '#1976d2',
                  borderBottomWidth: '2px',
                },
                '&.Mui-focused': {
                  '& .MuiSelect-select': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  },
                },
              }}>
              <MenuItem value="Mẫu cơ bản" disabled sx={{ display: 'none' }}>
                Mẫu cơ bản
              </MenuItem>
              <MenuItem 
                value="Mẫu nâng cao" 
                sx={{
                  fontSize: '0.875rem',
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#bbdefb',
                    '&:hover': {
                      backgroundColor: '#90caf9',
                    },
                  },
                }}>
                Mẫu nâng cao
              </MenuItem>
              <MenuItem 
                value="Mẫu chuyên nghiệp" 
                sx={{
                  fontSize: '0.875rem',
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#bbdefb',
                    '&:hover': {
                      backgroundColor: '#90caf9',
                    },
                  },
                }}>
                Mẫu chuyên nghiệp
              </MenuItem>
            </Select>
          </FormControl>

          {/* Dropdown 3 - Paper Size */}
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              displayEmpty
              variant="standard"
              MenuProps={{
                PaperProps: {
                  sx: {
                    mt: 0.5,
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                    border: '1.5px solid #1976d2',
                    borderRadius: 1.5,
                    '& .MuiList-root': {
                      padding: '4px',
                    },
                  },
                },
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
              }}
              sx={{
                fontSize: '0.875rem',
                transition: 'all 0.3s ease',
                '& .MuiSelect-select': {
                  color: paperSize === 'A4' ? '#9e9e9e' : '#424242',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  pb: 0.5,
                },
                '&:before': {
                  borderBottomColor: '#e0e0e0',
                  transition: 'border-color 0.3s ease',
                },
                '&:hover:before': {
                  borderBottomColor: '#1976d2 !important',
                },
                '&:after': {
                  borderBottomColor: '#1976d2',
                  borderBottomWidth: '2px',
                },
                '&.Mui-focused': {
                  '& .MuiSelect-select': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  },
                },
              }}>
              <MenuItem value="A4" disabled sx={{ display: 'none' }}>
                Khổ giấy
              </MenuItem>
              <MenuItem 
                value="A4-Size" 
                sx={{
                  fontSize: '0.875rem',
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#bbdefb',
                    '&:hover': {
                      backgroundColor: '#90caf9',
                    },
                  },
                }}>
                A4
              </MenuItem>
              <MenuItem 
                value="A5" 
                sx={{
                  fontSize: '0.875rem',
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#bbdefb',
                    '&:hover': {
                      backgroundColor: '#90caf9',
                    },
                  },
                }}>
                A5
              </MenuItem>
              <MenuItem 
                value="Letter" 
                sx={{
                  fontSize: '0.875rem',
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#bbdefb',
                    '&:hover': {
                      backgroundColor: '#90caf9',
                    },
                  },
                }}>
                Letter
              </MenuItem>
            </Select>
          </FormControl>

          {/* Divider */}
          <Box sx={{ 
            height: 32, 
            width: '1px', 
            bgcolor: '#e0e0e0',
            mx: 1,
          }} />

          {/* Info Alert */}
          <Alert
            icon={<InfoIcon sx={{ fontSize: 18 }} />}
            severity="info"
            sx={{
              py: 0.5,
              px: 1.5,
              bgcolor: 'transparent',
              border: 'none',
              '& .MuiAlert-icon': {
                color: '#1976d2',
                marginRight: '8px',
                alignSelf: 'center',
              },
              '& .MuiAlert-message': {
                fontSize: '0.8125rem',
                color: '#78909c',
                fontWeight: 400,
                display: 'flex',
                alignItems: 'center',
              },
            }}>
             Các thiết lập tại đây sẽ được áp dụng cho tất cả hóa đơn phát hành sử dụng mẫu này
          </Alert>
        </Stack>
      </Box>

      {/* Templates Grid */}
      <Box sx={{ px: 3, py: 3 }}>
        {/* Loading State */}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 400,
              flexDirection: 'column',
              gap: 2,
            }}>
            <CircularProgress size={48} />
            <Typography variant="body1" color="text.secondary">
              Đang tải danh sách mẫu hóa đơn...
            </Typography>
          </Box>
        )}

        {/* Templates Grid - Only show when not loading */}
        {!loading && filteredTemplates.length > 0 && (
          <Grid container spacing={2.5}>
            {filteredTemplates.map((template) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={template.id}>
                <Card
                  onMouseEnter={() => setHoveredId(template.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  sx={{
                    height: '100%',
                    border: '1px solid',
                    borderColor: hoveredId === template.id ? '#1976d2' : '#90caf9',
                    borderRadius: 1,
                    transition: 'all 0.2s ease-in-out',
                    transform: hoveredId === template.id ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: hoveredId === template.id 
                      ? '0 8px 24px rgba(25, 118, 210, 0.2)' 
                      : 'none',
                    cursor: 'pointer',
                    bgcolor: '#fff',
                  }}>
                  <CardActionArea onClick={() => handleSelectTemplate(template.id)} sx={{ height: '100%' }}>
                    {/* Template Image with Fallback */}
                    <CardMedia
                      component="img"
                      image={imageErrors.has(template.id) ? getFallbackImageUrl(template.id) : template.imageUrl}
                      alt={template.name}
                      onError={() => handleImageError(template.id)}
                      sx={{
                        height: 400,
                        objectFit: 'contain',
                        p: 1,
                        bgcolor: '#fafafa',
                      }}
                    />

                    {/* Template Label */}
                    <CardContent
                      sx={{
                        p: 1.5,
                        textAlign: 'center',
                        bgcolor: '#fff',
                        borderTop: '1px solid #e0e0e0',
                      }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          color: '#424242',
                        }}>
                        {template.name}
                      </Typography>
                      {template.recommended && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'inline-block',
                            mt: 0.5,
                            px: 1,
                            py: 0.25,
                            bgcolor: '#e3f2fd',
                            color: '#1976d2',
                            borderRadius: 0.5,
                            fontWeight: 600,
                            fontSize: '0.6875rem',
                          }}>
                          Đề xuất
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Empty State */}
        {!loading && filteredTemplates.length === 0 && (
          <Fade in>
            <Box
              sx={{
                p: 6,
                textAlign: 'center',
                bgcolor: '#fff',
                border: '2px dashed #e0e0e0',
                borderRadius: 2,
                mt: 4,
              }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Không tìm thấy mẫu phù hợp
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {templates.length === 0 
                  ? 'Không có mẫu hóa đơn nào trong hệ thống'
                  : 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
                }
              </Typography>
            </Box>
          </Fade>
        )}
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        message={snackbar.message}
        sx={{
          '& .MuiSnackbarContent-root': {
            bgcolor: snackbar.severity === 'error' ? '#d32f2f' : 
                     snackbar.severity === 'success' ? '#2e7d32' : 
                     snackbar.severity === 'warning' ? '#ed6c02' : '#0288d1',
          },
        }}
      />
    </Box>
  )
}

export default TemplateSelection
