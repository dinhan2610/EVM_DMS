import type { BootstrapVariantType } from './component-props'
import type { NumberRange } from './utils'

export type IdType = string

export type ReviewType = {
  count: number
  stars: number
}

export type AppType = {
  image: string
  name: string
  handle: string
}

export type NotificationType = {
  from: string
  content: string
  icon?: string
}

export type FileType = Partial<File> & {
  preview?: string
}

export type ActivityType = {
  title: string
  icon?: string
  variant?: BootstrapVariantType
  status?: 'completed' | 'latest'
  files?: FileType[]
  time: Date
  type?: 'task' | 'design' | 'achievement'
  content?: string
}

export type SaleType =
  | {
      type: 'percent'
      discount: NumberRange<0, 100>
    }
  | {
      type: 'amount'
      discount: number
    }

export type CategoryType = {
  id: IdType
  name: string
}

export type CustomerType = {
  id: IdType
  image: string
  name: string
  createdAt: Date
  email: string
  phone: string
  address: string
  ordersCount: number
}

export type SellerType = {
  id: IdType
  name: string
  image: string
  storeName: string
  review: ReviewType
  walletBalance: number
  createdAt: Date
  revenue: number
}



export type InvoiceType = {
  id: IdType
  customerId: CustomerType['id']
  customer?: CustomerType
}

export type PricingType = {
  id: IdType
  name: string
  price: number
  features: string[]
  isPopular?: boolean
  subscribed?: boolean
}

export type TimelineType = {
  [key: string]: {
    title: string
    description: string
    important?: boolean
  }[]
}

export type UserType = {
  id: IdType
  avatar: string
  name: string
  activityStatus: 'typing' | 'online' | 'offline'
  email: string
  phone: string
  languages: string[]
  location: string
  mutualCount: number
  hasRequested?: boolean
  message?: string
  time: Date
  status?: string
}

// Alias for chat/social contexts
export type SocialUserType = UserType



export type ProjectType = {
  id: IdType
  projectName: string
  client: string
  teamMembers: string[]
  deadlineDate: Date
  progressValue: number
  variant: string
}

export type TransactionType = {
  id: IdType
  date: Date
  customerId: CustomerType['id']
  customer?: CustomerType
  amount: number
  description: string
  status: 'Cr.' | 'Dr.'
}

export type TodoType = {
  id: IdType
  task: string
  createdAt: Date
  dueDate: Date
  status: 'Pending' | 'In-Progress' | 'Completed'
  priority: 'High' | 'Medium' | 'Low'
  employeeId: SellerType['id']
  employee?: SellerType
}

export type EmailLabelType = 'Primary' | 'Social' | 'Promotions' | 'Updates' | 'Forums'

export type EmailFilterType = keyof EmailCountType

export type EmailType = {
  id: IdType
  fromId: UserType['id']
  from?: UserType
  toId: UserType['id']
  to?: UserType
  subject?: string
  content?: string
  attachments?: FileType[]
  label?: EmailLabelType
  starred?: boolean
  important?: boolean
  draft?: boolean
  deleted?: boolean
  read?: boolean
  createdAt: Date
}

export type Employee = {
  id: IdType
  name: string
  email: string
  position: string
  company: string
  country: string
}

export type TeamMemberType = {
  id: IdType
  memberId: UserType['id']
  member?: UserType
  projects: number
  duration: string
  tasks: number
  role: string
}

export type ChatMessageType = {
  id: IdType
  from: UserType
  to: UserType
  message: {
    type: 'file' | 'text'
    value: FileType[] | string
  }
  sentOn?: Date
}

export type GroupType = {
  id: IdType
  name: string
  avatar?: string
  membersCount?: number
}

export type EmailCountType = {
  inbox: number
  starred: number
  draft: number
  sent: number
  deleted: number
  important: number
}
