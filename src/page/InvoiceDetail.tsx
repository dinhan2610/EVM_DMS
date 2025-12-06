import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Alert,
 
  
} from '@mui/material'
import {
  
  Print,
  
  ArrowBack,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import InvoiceTemplatePreview from '@/components/InvoiceTemplatePreview'

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
      vatRate: vatRate, // ✅ Tính từ vatAmount
      vatAmount: item.vatAmount, // ✅ Từ backend
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
    buyerName: invoice?.contactPerson || '',  // ✅ Lấy từ invoice.contactPerson
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
  

  // Derived data
  const status = invoice ? (INVOICE_STATUS[invoice.invoiceStatusID] as InvoiceStatus) : 'Nháp'
  const taxStatus: TaxStatus = invoice?.taxAuthorityCode ? 'Đã đồng bộ' : 'Chờ đồng bộ'
  const products = invoice ? mapInvoiceToProducts(invoice) : []
  const templateConfig = template ? mapTemplateToConfig(template, company) : null
  const customerInfo = customer && invoice ? mapCustomerToCustomerInfo(customer, invoice) : null  // ✅ Truyền thêm invoice
  
  // ✅ Calculate totals from invoice data (matching CreateVatInvoice logic)
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
        console.log('🔍 Invoice data loaded:', invoiceData)
        console.log('📝 Invoice notes:', invoiceData.notes)
        setInvoice(invoiceData)
        
        // Load template data
        const templateData = await templateService.getTemplateById(invoiceData.templateID)
        setTemplate(templateData)
        
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
  }, [id])

  
  

  const handlePrint = () => {
    window.print()
  }

  

 

  

  
     
  

  

  const handleBack = () => {
    navigate('/invoices')
  }

  // Loading state
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
    <Box sx={{ p: 3 }}>
      {/* Header - Giống TemplatePreview */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, fontSize: '1.75rem', mb: 0.5 }}>
              Chi tiết Hóa đơn
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {template?.templateName || 'Hóa đơn'} - Số: {invoice.invoiceNumber}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={status} color={getStatusColor(status)} size="small" />
              <Chip
                icon={getTaxStatusIcon(taxStatus)}
                label={taxStatus}
                color={getTaxStatusColor(taxStatus)}
                size="small"
              />
            </Stack>
          </Box>
          
          {/* Action Buttons - Giống TemplatePreview */}
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleBack}
              sx={{ textTransform: 'none' }}>
              Quay lại
            </Button>
            <Button
              variant="contained"
              startIcon={<Print />}
              onClick={handlePrint}
              sx={{ textTransform: 'none' }}>
              In hóa đơn
            </Button>
          </Stack>
      </Stack>

      {/* Preview Content - GIỐNG 100% TemplatePreview */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ maxWidth: '21cm', width: '100%' }}>
          <InvoiceTemplatePreview
            config={templateConfig}
            products={products}
            totals={invoiceTotals} // ✅ Truyền totals đã tính từ invoice data
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
            invoiceNumber={invoice.invoiceStatusID === INVOICE_INTERNAL_STATUS.DRAFT ? undefined : invoice.invoiceNumber}
            taxAuthorityCode={invoice.taxAuthorityCode}
            backgroundFrame={template?.frameUrl || ''}
            notes={invoice.notes}
          />
        </Box>
      </Box>

      

       

       
        
      </Box>
    )
  }

  export default InvoiceDetail
