import React, { useState } from 'react'
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
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  HelpOutline as HelpOutlineIcon,
  InfoOutlined as InfoIcon,
  PlayCircleOutline as PlayCircleIcon,
} from '@mui/icons-material'

// Interface cho template
interface TemplateOption {
  id: number
  name: string
  imagePath: string
  category: 'GTGT' | 'Banhang' | 'Universal'
  description: string
  recommended?: boolean
}

// Danh sách 11 khung hóa đơn
const templateOptions: TemplateOption[] = [
  {
    id: 1,
    name: 'Mẫu tiêu chuẩn 01',
    imagePath: '/khunghoadon/khunghoadon1.png',
    category: 'GTGT',
    description: 'Mẫu hóa đơn GTGT tiêu chuẩn, phổ biến nhất',
    recommended: true,
  },
  {
    id: 2,
    name: 'Mẫu tiêu chuẩn 02',
    imagePath: '/khunghoadon/khunghoadon2.png',
    category: 'GTGT',
    description: 'Mẫu hóa đơn GTGT cải tiến với bố cục rõ ràng',
  },
  {
    id: 3,
    name: 'Mẫu bán hàng 01',
    imagePath: '/khunghoadon/khunghoadon3.png',
    category: 'Banhang',
    description: 'Mẫu hóa đơn bán hàng đơn giản',
    recommended: true,
  },
  {
    id: 4,
    name: 'Mẫu bán hàng 02',
    imagePath: '/khunghoadon/khunghoadon4.png',
    category: 'Banhang',
    description: 'Mẫu hóa đơn bán hàng chi tiết',
  },
  {
    id: 5,
    name: 'Mẫu chuyên nghiệp 01',
    imagePath: '/khunghoadon/khunghoadon5.png',
    category: 'Universal',
    description: 'Mẫu đa năng cho mọi loại hóa đơn',
  },
  {
    id: 6,
    name: 'Mẫu chuyên nghiệp 02',
    imagePath: '/khunghoadon/khunghoadon6.png',
    category: 'Universal',
    description: 'Mẫu hiện đại với thiết kế sang trọng',
  },
  {
    id: 7,
    name: 'Mẫu GTGT 03',
    imagePath: '/khunghoadon/khunghoadon7.png',
    category: 'GTGT',
    description: 'Mẫu GTGT phù hợp cho doanh nghiệp lớn',
  },
  {
    id: 8,
    name: 'Mẫu GTGT 04',
    imagePath: '/khunghoadon/khunghoadon8.png',
    category: 'GTGT',
    description: 'Mẫu GTGT tối ưu cho in ấn',
  },
  {
    id: 9,
    name: 'Mẫu bán hàng 03',
    imagePath: '/khunghoadon/khunghoadon9.png',
    category: 'Banhang',
    description: 'Mẫu bán hàng nhỏ gọn',
  },
  {
    id: 10,
    name: 'Mẫu đa năng 01',
    imagePath: '/khunghoadon/khunghoadon10.png',
    category: 'Universal',
    description: 'Mẫu linh hoạt cho mọi ngành nghề',
  },
  {
    id: 11,
    name: 'Mẫu đa năng 02',
    imagePath: '/khunghoadon/khunghoadon11.png',
    category: 'Universal',
    description: 'Mẫu tối giản, dễ tùy chỉnh',
  },
]

const TemplateSelection: React.FC = () => {
  const navigate = useNavigate()
  const [searchQuery] = useState('')
  const [selectedCategory] = useState<'All' | 'GTGT' | 'Banhang' | 'Universal'>('All')
  const [templateType, setTemplateType] = useState('Loại hoá đơn')
  const [baseType, setBaseType] = useState('Mẫu cơ bản')
  const [paperSize, setPaperSize] = useState('A4')
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  // Filter templates
  const filteredTemplates = templateOptions.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Handle template selection
  const handleSelectTemplate = (templateId: number) => {
    // Navigate to editor with selected template
    navigate(`/admin/templates/new?templateId=${templateId}`)
  }

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
                  boxShadow: 'none',
                  cursor: 'pointer',
                  bgcolor: '#fff',
                }}>
                <CardActionArea onClick={() => handleSelectTemplate(template.id)} sx={{ height: '100%' }}>
                  {/* Template Image */}
                  <CardMedia
                    component="img"
                    image={template.imagePath}
                    alt={template.name}
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
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
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
                Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
              </Typography>
            </Box>
          </Fade>
        )}
      </Box>
    </Box>
  )
}

export default TemplateSelection
