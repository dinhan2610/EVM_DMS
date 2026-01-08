import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  
  Print,
  Download,
  ArrowBack,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import InvoiceTemplatePreview from '@/components/InvoiceTemplatePreview'
import InvoicePreviewModal from '@/components/invoices/InvoicePreviewModal'
import InvoiceTypeBadge from '@/components/invoices/InvoiceTypeBadge'
import OriginalInvoiceLink from '@/components/invoices/OriginalInvoiceLink'
import Spinner from '@/components/Spinner'
import invoiceService, { InvoiceListItem, INVOICE_STATUS } from '@/services/invoiceService'
import templateService, { TemplateResponse } from '@/services/templateService'
import { getAllCustomers, Customer } from '@/services/customerService'
import companyService, { Company } from '@/services/companyService'
import type { ProductItem, TemplateConfigProps, CustomerInfo } from '@/types/invoiceTemplate'
import { DEFAULT_TEMPLATE_VISIBILITY, DEFAULT_INVOICE_SYMBOL } from '@/types/invoiceTemplate'
import { INVOICE_INTERNAL_STATUS } from '@/constants/invoiceStatus'

// Định nghĩa status types
type InvoiceStatus = 'Nháp' | 'Đã tạo' | 'Đã ký' | 'Đã gửi' | 'Đã hủy'
type TaxStatus = 'Chờ đồng bộ' | 'Đã đồng bộ' | 'Lỗi'

// Helper functions
const getStatusColor = (
  status: InvoiceStatus
): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
  const statusColors: Record<InvoiceStatus, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
    'Nháp': 'default',
    'Đã tạo': 'info',
    'Đã ký': 'primary',
    'Đã gửi': 'secondary',
    'Đã hủy': 'error',
  }
  return statusColors[status] || 'default'
}

const getTaxStatusColor = (taxStatus: TaxStatus): 'default' | 'success' | 'warning' | 'error' => {
  const taxColors: Record<TaxStatus, 'default' | 'success' | 'warning' | 'error'> = {
    'Đã đồng bộ': 'success',
    'Chờ đồng bộ': 'warning',
    'Lỗi': 'error',
  }
  return taxColors[taxStatus] || 'default'
}

const getTaxStatusIcon = (taxStatus: TaxStatus) => {
  const icons: Record<TaxStatus, JSX.Element> = {
    'Đã đồng bộ': <CheckCircle fontSize="small" />,
    'Chờ đồng bộ': <Warning fontSize="small" />,
    'Lỗi': <ErrorIcon fontSize="small" />,
  }
  return icons[taxStatus]
}

/**
 * Map backend invoice data to ProductItem[] for InvoiceTemplatePreview
 * ✅ Include full data: vatAmount from backend
 */
const mapInvoiceToProducts = (invoice: InvoiceListItem): ProductItem[] => {
  return invoice.invoiceItems.map((item, index) => {
    const unitPrice = item.amount / item.quantity
    const vatRate = item.amount > 0 ? Math.round((item.vatAmount / item.amount) * 100) : 0
    
    return {
      stt: index + 1,
      name: item.productName || `Product ${item.productId}`,
      unit: item.unit || 'Cái',
      quantity: item.quantity,
      unitPrice: unitPrice,
      total: item.amount,
      vatRate: vatRate,
      vatAmount: item.vatAmount,
    }
  })
}

/**
 * Map template to TemplateConfigProps
 */
const mapTemplateToConfig = (template: TemplateResponse, company: Company | null): TemplateConfigProps => {
  return {
    companyLogo: template.logoUrl || null, // Logo công ty
    companyName: company?.companyName || 'Đang tải...',
    companyTaxCode: company?.taxCode || '0000000000',
    companyAddress: company?.address || 'Đang tải...',
    companyPhone: company?.contactPhone || '0000000000',
    modelCode: template.serial,
    templateCode: template.templateName,
  }
}

/**
 * Map customer to CustomerInfo (for InvoiceTemplatePreview)
 */
const mapCustomerToCustomerInfo = (customer: Customer, invoice?: InvoiceListItem): CustomerInfo => {
  return {
    name: customer.customerName,
    email: customer.contactEmail,
    taxCode: customer.taxCode,
    address: customer.address,
    phone: customer.contactPhone,
    buyerName: invoice?.contactPerson || '',
  }
}

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // States
  const [invoice, setInvoice] = useState<InvoiceListItem | null>(null)
  const [template, setTemplate] = useState<TemplateResponse | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  
  const [htmlPreview, setHtmlPreview] = useState<string>('')
  const [loadingHtml, setLoadingHtml] = useState(false)
  const [useHtmlView, setUseHtmlView] = useState(true)

  // Derived data
  const status = invoice ? (INVOICE_STATUS[invoice.invoiceStatusID] as InvoiceStatus) : 'Nháp'
  const taxStatus: TaxStatus = invoice?.taxAuthorityCode ? 'Đã đồng bộ' : 'Chờ đồng bộ'
  
  // ✨ Xác định xem có nên dùng HTML view không:
  // - Hóa đơn đã phát hành (invoiceNumber > 0): Dùng HTML
  // - Hóa đơn điều chỉnh/thay thế/hủy/giải trình (invoiceType > 1): Dùng HTML từ API
  // - Hóa đơn nháp hoàn toàn mới (invoiceType = 1 && invoiceNumber = 0): Dùng React
  const isIssuedInvoice = invoice && (
    invoice.invoiceNumber > 0 || 
    (invoice.invoiceType && invoice.invoiceType > 1)
  )
  
  const products = invoice ? mapInvoiceToProducts(invoice) : []
  const templateConfig = template ? mapTemplateToConfig(template, company) : null
  const customerInfo = customer && invoice ? mapCustomerToCustomerInfo(customer, invoice) : null
  
  const invoiceTotals = invoice ? {
    subtotal: invoice.subtotalAmount,
    discount: 0, // Backend không trả discount riêng
    subtotalAfterDiscount: invoice.subtotalAmount,
    tax: invoice.vatAmount,
    total: invoice.totalAmount,
  } : undefined

  useEffect(() => {
    const fetchInvoiceDetail = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        setError(null)
        
        // Load invoice data
        const invoiceData = await invoiceService.getInvoiceById(Number(id))
        console.log('🔍 Invoice data loaded:', {
          invoiceID: invoiceData.invoiceID,
          invoiceNumber: invoiceData.invoiceNumber,
          invoiceStatusID: invoiceData.invoiceStatusID,
          taxAuthorityCode: invoiceData.taxAuthorityCode,
          notes: invoiceData.notes
        })
        console.log('📝 Full invoice data:', JSON.stringify(invoiceData, null, 2))
        setInvoice(invoiceData)
        
        // Load template data
        const templateData = await templateService.getTemplateById(invoiceData.templateID)
        setTemplate(templateData)
        
        // ✨ Load HTML preview cho:
        // 1. Hóa đơn đã phát hành (invoiceNumber > 0)
        // 2. Hóa đơn điều chỉnh/thay thế/hủy/giải trình (invoiceType > 1)
        const shouldLoadHtml = invoiceData.invoiceNumber > 0 || (invoiceData.invoiceType && invoiceData.invoiceType > 1)
        
        if (shouldLoadHtml && useHtmlView) {
          setLoadingHtml(true)
          try {
            let html = await invoiceService.getInvoiceHTML(Number(id))
            
            const cssOverride = `
              <style>
                .page-container {
                  width: 209mm !important;
                }
              </style>
            `
            
            // Insert CSS before </head> tag, or before </body> if no </head>
            if (html.includes('</head>')) {
              html = html.replace('</head>', `${cssOverride}</head>`)
            } else if (html.includes('</body>')) {
              html = html.replace('</body>', `${cssOverride}</body>`)
            } else {
              // Fallback: append to end
              html += cssOverride
            }
            
            setHtmlPreview(html)
            const typeLabel = invoiceData.invoiceType > 1 ? ` (Type: ${invoiceData.invoiceType})` : ''
            console.log(`✅ [InvoiceDetail] HTML preview loaded${typeLabel} with CSS override (width: 209mm)`)
          } catch (htmlError) {
            console.error('⚠️ [InvoiceDetail] HTML preview failed, fallback to React:', htmlError)
            setUseHtmlView(false) // Fallback to React component
          } finally {
            setLoadingHtml(false)
          }
        }
        
        // Load customer data
        const customers = await getAllCustomers()
        const matchedCustomer = customers.find(c => c.customerID === invoiceData.customerID)
        setCustomer(matchedCustomer || null)
        
        // Load company data
        const companyData = await companyService.getDefaultCompany()
        setCompany(companyData)
        
      } catch (err) {
        console.error('Failed to load invoice:', err)
        setError(err instanceof Error ? err.message : 'Không thể tải chi tiết hóa đơn')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoiceDetail()
  }, [id, useHtmlView])

  const handlePrint = () => {
    if (isIssuedInvoice && useHtmlView && htmlPreview) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlPreview)
        printWindow.document.close()
        printWindow.onload = () => {
          printWindow.print()
        }
      } else {
        alert('❌ Popup bị chặn. Vui lòng cho phép popup.')
      }
    } else {
      window.print()
    }
  }

  const handleBack = () => {
    navigate('/invoices')
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spinner />
      </Box>
    )
  }

  // Error state
  if (error || !invoice || !templateConfig) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Không tìm thấy hóa đơn'}</Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }}>Quay lại</Button>
      </Box>
    )
  }

  return (
    <>
      <Box 
        sx={{ 
          p: 3,
          width: '100%',
          maxWidth: '100vw',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, fontSize: '1.75rem', mb: 0.5 }}>
              Chi tiết Hóa đơn
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {template?.templateName || 'Hóa đơn'} - Số: {
                invoice.invoiceNumber && invoice.invoiceNumber !== 0 
                  ? invoice.invoiceNumber 
                  : '<Chưa cấp số>'
              }
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={status} color={getStatusColor(status)} size="small" />
              <Chip
                icon={getTaxStatusIcon(taxStatus)}
                label={taxStatus}
                color={getTaxStatusColor(taxStatus)}
                size="small"
              />
              {invoice.invoiceType && <InvoiceTypeBadge invoiceType={invoice.invoiceType} size="small" />}
            </Stack>
            
            {/* Display link to original invoice for adjustment/replacement/cancelled/explanation invoices */}
            {invoice.originalInvoiceID && (
              <Box sx={{ mt: 2 }}>
                <OriginalInvoiceLink 
                  originalInvoiceID={invoice.originalInvoiceID}
                  originalInvoiceNumber={invoice.originalInvoiceNumber}
                  variant="full"
                />
              </Box>
            )}
            
            {/* Display adjustment reason if exists */}
            {invoice.adjustmentReason && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Lý do điều chỉnh:
                </Typography>
                <Typography variant="body2">
                  {invoice.adjustmentReason}
                </Typography>
              </Alert>
            )}
            
            {/* ✅ Display rejection reason if invoice is REJECTED */}
            {invoice.invoiceStatusID === INVOICE_INTERNAL_STATUS.REJECTED && invoice.notes && invoice.notes.includes('Từ chối:') && (
              <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  ⚠️ Hóa đơn bị từ chối duyệt
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Lý do: {invoice.notes.replace('Từ chối: ', '')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  💡 Vui lòng chỉnh sửa hóa đơn theo yêu cầu và gửi lại duyệt
                </Typography>
              </Alert>
            )}
          </Box>
          
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleBack}
              sx={{ textTransform: 'none' }}>
              Quay lại
            </Button>
            
            {isIssuedInvoice && htmlPreview && (
              <Button
                variant="outlined"
                onClick={() => setUseHtmlView(!useHtmlView)}
                sx={{ textTransform: 'none' }}
                size="small">
                {useHtmlView ? '📄 Xem React' : '📋 Xem PDF'}
              </Button>
            )}
            
            {isIssuedInvoice && (
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={async () => {
                  try {
                    await invoiceService.saveInvoicePDF(invoice.invoiceID, invoice.invoiceNumber)
                  } catch (err) {
                    alert('Không thể tải PDF: ' + (err instanceof Error ? err.message : 'Unknown'))
                  }
                }}
                sx={{ textTransform: 'none' }}>
                Tải PDF
              </Button>
            )}
            
            <Button
              variant="contained"
              startIcon={<Print />}
              onClick={handlePrint}
              sx={{ textTransform: 'none' }}>
              In hóa đơn
            </Button>
          </Stack>
      </Stack>

      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          width: '100%',
          overflow: 'hidden', // Prevent horizontal scroll
        }}
      >
        <Box 
          sx={{ 
            maxWidth: '21cm',
            width: '100%',
            '@media (max-width: 900px)': {
              maxWidth: '100%',
              px: 1,
            },
          }}
        >
          {isIssuedInvoice && useHtmlView && loadingHtml && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <Stack alignItems="center" spacing={2}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                  Đang tải preview chính thức...
                </Typography>
              </Stack>
            </Box>
          )}
          
          {isIssuedInvoice && useHtmlView && !loadingHtml && htmlPreview && (
            <Box 
              sx={{ 
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                mb: 2,
              }}
            >
              <Alert severity="info" sx={{ borderRadius: 0 }}>
                📋 Đang xem preview chính thức (100% giống PDF). Click "📄 Xem React" để xem giao diện tương tác.
              </Alert>
              <iframe
                srcDoc={htmlPreview}
                style={{
                  width: '100%',
                  height: 'auto',
                  minHeight: '297mm', // A4 height
                  border: 'none',
                  display: 'block',
                }}
                title={`Invoice ${invoice.invoiceNumber} Preview`}
                onLoad={(e) => {
                  const iframe = e.target as HTMLIFrameElement
                  if (iframe.contentWindow) {
                    try {
                      const contentHeight = iframe.contentWindow.document.body.scrollHeight
                      iframe.style.height = contentHeight + 'px'
                    } catch (err) {
                      console.log('Cannot access iframe content height (CORS):', err)
                    }
                  }
                }}
              />
            </Box>
          )}
          
          {(!isIssuedInvoice || !useHtmlView || !htmlPreview) && (
            <>
              {isIssuedInvoice && !useHtmlView && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  📄 Đang xem giao diện React (tương tác). Click "📋 Xem PDF" để xem preview chính thức.
                </Alert>
              )}
              <InvoiceTemplatePreview
                config={templateConfig}
                products={products}
                totals={invoiceTotals}
                blankRows={5}
                visibility={DEFAULT_TEMPLATE_VISIBILITY}
                bilingual={false}
                invoiceDate={invoice.createdAt}
                invoiceType="withCode"
                symbol={DEFAULT_INVOICE_SYMBOL}
                customerVisibility={{
                  customerName: true,
                  customerTaxCode: true,
                  customerAddress: true,
                  customerPhone: true,
                  customerEmail: true,
                  paymentMethod: true,
                }}
                customerInfo={customerInfo || undefined}
                paymentMethod={invoice.paymentMethod}
                invoiceNumber={
                  (invoice.invoiceStatusID === INVOICE_INTERNAL_STATUS.DRAFT || !invoice.invoiceNumber || invoice.invoiceNumber === 0) 
                    ? undefined 
                    : invoice.invoiceNumber
                }
                taxAuthorityCode={invoice.taxAuthorityCode}
                backgroundFrame={template?.frameUrl || ''}
                notes={invoice.notes}
              />
            </>
          )}
        </Box>
      </Box>

      

       

       
      </Box>

      {invoice && invoice.invoiceNumber > 0 && (
        <InvoicePreviewModal
          open={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          invoiceId={invoice.invoiceID}
          invoiceNumber={invoice.invoiceNumber.toString()}
          invoiceType={invoice.invoiceType}
          originalInvoiceNumber={invoice.originalInvoiceNumber}
          adjustmentReason={invoice.adjustmentReason || undefined}
        />
      )}
    </>
  )
}

export default InvoiceDetail
