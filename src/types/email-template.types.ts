// Email Template Types

export interface EmailTemplate {
  id: string
  code: string // Unique key: 'INVOICE_SENT', 'PAYMENT_REMINDER', etc.
  name: string
  subject: string
  content: string // HTML content
  isActive: boolean
  isSystemTemplate: boolean // true = không được xóa, false = có thể xóa
  variables: TemplateVariable[]
  category: 'invoice' | 'payment' | 'statement' | 'system'
  createdAt: string
  updatedAt: string
}

export interface TemplateVariable {
  key: string // {{CustomerName}}
  label: string // Tên khách hàng
  description: string
  example: string // Công ty ABC
  group: 'customer' | 'invoice' | 'company' | 'payment' | 'other'
}

export interface PreviewData {
  [key: string]: string
}
