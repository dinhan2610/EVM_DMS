import { Box, Button, Stack, Chip, Tooltip, Paper, Typography, Collapse, Fade } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ScienceIcon from '@mui/icons-material/Science';
import { useState } from 'react';

interface PrintPreviewButtonProps {
  onAddMockData?: (count: number) => void;
  currentRowCount?: number;
  showMockDataControl?: boolean;
}

/**
 * Enhanced Print Preview Button với UX/UI tối ưu
 * 
 * Features:
 * - Gradient design với animations
 * - Collapsible mock data controls
 * - Keyboard shortcuts hints
 * - Responsive layout
 * - Clear visual hierarchy
 */
export default function PrintPreviewButton({
  onAddMockData,
  currentRowCount = 0,
  showMockDataControl = false,
}: PrintPreviewButtonProps) {
  const [showMockControls, setShowMockControls] = useState(false);
  const estimatedPages = Math.ceil(currentRowCount / 25);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <Fade in timeout={600}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, md: 3 },
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(50%, -50%)',
          },
        }}>
        <Stack spacing={2.5} sx={{ position: 'relative', zIndex: 1 }}>
          {/* Header Section */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 0.5,
                fontSize: { xs: '1rem', md: '1.25rem' },
              }}>
              <PrintIcon sx={{ fontSize: { xs: 20, md: 24 } }} /> 
              In & Xuất PDF
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.95, 
                fontSize: { xs: '0.875rem', md: '0.925rem' },
                lineHeight: 1.5,
              }}>
              Xem trước và in hóa đơn với phân trang tự động
            </Typography>
          </Box>

          {/* Main Action Buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Tooltip 
              title={
                <Box sx={{ p: 0.5 }}>
                  <Typography variant="caption" display="block" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Xem Trước Bản In
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
                    • Mở Print Preview của browser<br/>
                    • Kiểm tra phân trang tự động<br/>
                    • Phím tắt: Ctrl+P (Win) / Cmd+P (Mac)
                  </Typography>
                </Box>
              }
              arrow
              placement="top">
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{
                  bgcolor: 'white',
                  color: '#667eea',
                  fontWeight: 700,
                  py: { xs: 1.25, md: 1.5 },
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#f8f9fa',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                Xem Trước Bản In
              </Button>
            </Tooltip>

            <Tooltip
              title={
                <Box sx={{ p: 0.5 }}>
                  <Typography variant="caption" display="block" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Xuất File PDF
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
                    • Mở Print Dialog<br/>
                    • Chọn "Save as PDF" làm printer<br/>
                    • Chọn vị trí lưu file
                  </Typography>
                </Box>
              }
              arrow
              placement="top">
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<PictureAsPdfIcon />}
                onClick={handleExportPDF}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  borderWidth: 2,
                  fontWeight: 700,
                  py: { xs: 1.25, md: 1.5 },
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                Xuất File PDF
              </Button>
            </Tooltip>
          </Stack>

          {/* Status Chips */}
          <Stack 
            direction="row" 
            spacing={1.5} 
            sx={{ 
              justifyContent: 'center', 
              flexWrap: 'wrap', 
              gap: 1,
            }}>
            <Chip
              label={`${currentRowCount} sản phẩm`}
              size="medium"
              icon={<Box component="span" sx={{ ml: 1.5 }}>📦</Box>}
              sx={{
                bgcolor: 'rgba(255,255,255,0.25)',
                color: 'white',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                fontSize: '0.875rem',
                height: 32,
                px: 1,
              }}
            />
            <Chip
              label={estimatedPages > 1 ? `${estimatedPages} trang` : '1 trang'}
              size="medium"
              icon={<Box component="span" sx={{ ml: 1.5 }}>📄</Box>}
              sx={{
                bgcolor: estimatedPages > 1 
                  ? 'rgba(76, 175, 80, 0.9)' 
                  : 'rgba(255,255,255,0.25)',
                color: 'white',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                fontSize: '0.875rem',
                height: 32,
                px: 1,
              }}
            />
          </Stack>

          {/* Mock Data Controls (Collapsible) */}
          {showMockDataControl && onAddMockData && (
            <>
              <Box 
                sx={{ 
                  borderTop: '1px solid rgba(255,255,255,0.3)', 
                  pt: 2,
                  mt: 1,
                }}>
                <Button
                  fullWidth
                  onClick={() => setShowMockControls(!showMockControls)}
                  endIcon={showMockControls ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  startIcon={<ScienceIcon />}
                  sx={{
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 600,
                    justifyContent: 'space-between',
                    py: 1,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                    },
                  }}>
                  {showMockControls ? 'Ẩn' : 'Hiện'} Công Cụ Test Dữ Liệu
                </Button>
              </Box>

              <Collapse in={showMockControls}>
                <Stack spacing={2}>
                  <Stack 
                    direction="row" 
                    spacing={1.5} 
                    sx={{ 
                      flexWrap: 'wrap', 
                      gap: 1,
                      justifyContent: 'center',
                    }}>
                    {[10, 50, 100].map((count) => (
                      <Button
                        key={count}
                        variant="contained"
                        size="medium"
                        onClick={() => onAddMockData(count)}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          fontWeight: 700,
                          minWidth: 90,
                          backdropFilter: 'blur(10px)',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.3)',
                            transform: 'scale(1.05)',
                          },
                          transition: 'all 0.2s',
                        }}>
                        + {count}
                      </Button>
                    ))}
                    <Button
                      variant="contained"
                      size="medium"
                      onClick={() => onAddMockData(0)}
                      sx={{
                        bgcolor: 'rgba(244, 67, 54, 0.9)',
                        color: 'white',
                        fontWeight: 700,
                        minWidth: 90,
                        '&:hover': {
                          bgcolor: 'rgba(244, 67, 54, 1)',
                          transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s',
                      }}>
                      🔄 Reset
                    </Button>
                  </Stack>

                  <Paper
                    sx={{
                      p: 1.5,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 2,
                    }}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <InfoOutlinedIcon sx={{ fontSize: 18, mt: 0.2, opacity: 0.9 }} />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          lineHeight: 1.7, 
                          opacity: 0.95,
                          fontSize: '0.8rem',
                        }}>
                        <strong>Mẹo test:</strong> Thêm nhiều sản phẩm để kiểm tra phân trang.
                        Header và footer sẽ tự động lặp lại trên mỗi trang.
                      </Typography>
                    </Stack>
                  </Paper>
                </Stack>
              </Collapse>
            </>
          )}

          {/* Instructions Box */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 2,
            }}>
            <Stack spacing={1.5}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 700, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.75,
                  fontSize: '0.925rem',
                }}>
                <InfoOutlinedIcon sx={{ fontSize: 20 }} />
                Hướng Dẫn Sử Dụng
              </Typography>
              <Box 
                component="ul" 
                sx={{ 
                  m: 0, 
                  pl: 2.5, 
                  '& li': { 
                    mb: 0.75,
                    fontSize: '0.85rem',
                    lineHeight: 1.7,
                  } 
                }}>
                <Typography component="li" variant="caption" sx={{ fontSize: 'inherit' }}>
                  <strong>In ra giấy:</strong> Click "Xem Trước Bản In" → Chọn máy in → Click "Print"
                </Typography>
                <Typography component="li" variant="caption" sx={{ fontSize: 'inherit' }}>
                  <strong>Lưu PDF:</strong> Click "Xuất File PDF" → Chọn "Save as PDF" → Chọn vị trí lưu
                </Typography>
                <Typography component="li" variant="caption" sx={{ fontSize: 'inherit' }}>
                  <strong>Phím tắt:</strong> Nhấn{' '}
                  <code 
                    style={{ 
                      background: 'rgba(255,255,255,0.25)', 
                      padding: '2px 8px', 
                      borderRadius: 4,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}>
                    Ctrl+P
                  </code>{' '}
                  (Windows) hoặc{' '}
                  <code 
                    style={{ 
                      background: 'rgba(255,255,255,0.25)', 
                      padding: '2px 8px', 
                      borderRadius: 4,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}>
                    Cmd+P
                  </code>{' '}
                  (Mac)
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Paper>
    </Fade>
  );
}
