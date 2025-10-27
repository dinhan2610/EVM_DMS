import type { CustomerType, SellerType, UserType, EmailType, TeamMemberType, ChatMessageType } from '@/types/data'

export const usersData: UserType[] = [
  {
    id: 'user-1',
    avatar: '/images/users/avatar-1.jpg',
    name: 'Risa Pearson',
    activityStatus: 'online',
    email: 'risa@example.com',
    phone: '+1-234-567-8900',
    languages: ['English'],
    location: 'San Francisco, USA',
    mutualCount: 12,
    time: new Date('2024-01-15'),
    status: 'Available'
  },
  {
    id: 'user-2',
    avatar: '/images/users/avatar-2.jpg',
    name: 'Jane Smith',
    activityStatus: 'offline',
    email: 'jane@example.com',
    phone: '+1-234-567-8901',
    languages: ['English'],
    location: 'Los Angeles, USA',
    mutualCount: 8,
    time: new Date('2024-01-16'),
    status: 'Busy'
  }
]

export const customersData: CustomerType[] = [
  {
    id: 'customer-1',
    image: '/images/users/avatar-1.jpg',
    name: 'Risa Pearson',
    createdAt: new Date('2024-01-15'),
    email: 'risa@example.com',
    phone: '+1-234-567-8900',
    address: '123 Market St, San Francisco, CA',
    ordersCount: 5
  }
]

export const sellersData: SellerType[] = [
  {
    id: 'seller-1',
    name: 'John Doe',
    image: '/images/users/avatar-6.jpg',
    storeName: 'Tech Store',
    review: { count: 120, stars: 4.5 },
    walletBalance: 15000,
    createdAt: new Date('2023-06-01'),
    revenue: 50000
  }
]

export const emailsData: EmailType[] = [
  {
    id: 'email-1',
    fromId: 'user-1',
    toId: 'user-2',
    subject: 'Welcome',
    content: 'Thank you for joining us!',
    label: 'Primary',
    starred: false,
    important: true,
    draft: false,
    deleted: false,
    read: false,
    createdAt: new Date('2024-01-20')
  }
]

export const teamMembersData: TeamMemberType[] = [
  {
    id: 'team-1',
    memberId: 'user-1',
    projects: 5,
    duration: '2 years',
    tasks: 120,
    role: 'Senior Developer'
  }
]

export const messages: ChatMessageType[] = [
  {
    id: 'msg-1',
    from: usersData[0],
    to: usersData[1],
    message: { type: 'text', value: 'Hello!' },
    sentOn: new Date('2024-01-20')
  }
]