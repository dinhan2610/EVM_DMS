import * as yup from 'yup'

import { activityStreamData, appsData, notificationsData } from '@/assets/data/topbar'
import {
  customersData,
  emailsData,
  sellersData,
  teamMembersData,
  usersData,
} from '@/assets/data/users'
import { dataTableRecords, pricingData, projectsData, timelineData, transactionsData } from '@/assets/data/other'
import { todoData } from '@/assets/data/task'

import type {
  ActivityType,
  AppType,
  CustomerType,
  EmailCountType,
  EmailType,
  Employee,
  GroupType,
  NotificationType,
  PricingType,
  ProjectType,
  SellerType,
  TeamMemberType,
  TimelineType,
  TodoType,
  TransactionType,
  UserType,
} from '@/types/data'
import { sleep } from '@/utils/promise'

// Topbar functions
export const getTopbarIntegratedApps = (): AppType[] => {
  return appsData
}

export const getNotifications = (): NotificationType[] => {
  return notificationsData
}

export const getActivityStream = async (): Promise<ActivityType[]> => {
  await sleep(500)
  return activityStreamData
}

// Customer functions
export const getAllCustomers = async (): Promise<CustomerType[]> => {
  await sleep(500)
  return customersData
}

// Seller functions
export const getAllSellers = async (): Promise<SellerType[]> => {
  await sleep(500)
  return sellersData
}

// Email functions
export const getAllEmails = async (): Promise<EmailType[]> => {
  await sleep(500)
  return emailsData
}

export const getEmailDetails = async (id: EmailType['id']): Promise<EmailType | void> => {
  await sleep(300)
  const email = emailsData.find((email) => email.id === id)
  if (!email) return
  return email
}

export const getEmailsCategoryCount = (): EmailCountType => {
  const emailCountByLabel: EmailCountType = {
    inbox: 0,
    starred: 0,
    draft: 0,
    sent: 0,
    deleted: 0,
    important: 0,
  }

  emailsData.forEach((email) => {
    if (email.starred) emailCountByLabel.starred += 1
    if (email.important) emailCountByLabel.important += 1
    if (email.draft) emailCountByLabel.draft += 1
    if (email.deleted) emailCountByLabel.deleted += 1
    if (!email.deleted && !email.draft) emailCountByLabel.inbox += 1
  })

  return emailCountByLabel
}

// User/Chat functions
export const getAllUsers = async (): Promise<UserType[]> => {
  await sleep(500)
  return usersData
}

export const getUserById = async (id: UserType['id']): Promise<UserType | void> => {
  await sleep(300)
  const user = usersData.find((user) => user.id === id)
  if (!user) return
  return user
}

// Group functions
export const getJoinedGroups = async (): Promise<GroupType[]> => {
  await sleep(300)
  // Sample groups data - replace with actual data source if available
  return [
    { id: 'group-1', name: 'Frontend Team', membersCount: 5 },
    { id: 'group-2', name: 'Backend Team', membersCount: 8 },
    { id: 'group-3', name: 'Design Team', membersCount: 4 },
    { id: 'group-4', name: 'Marketing', membersCount: 6 },
  ]
}

// Timeline functions
export const getAllTimeline = async (): Promise<TimelineType> => {
  await sleep(500)
  return timelineData
}

// Pricing functions
export const getAllPricingPlans = async (): Promise<PricingType[]> => {
  await sleep(500)
  return pricingData
}

// Project functions
export const getAllProjects = async (): Promise<ProjectType[]> => {
  await sleep(500)
  return projectsData
}

// Transaction functions
export const getAllTransactions = async (): Promise<TransactionType[]> => {
  await sleep(500)
  return transactionsData
}

// Team Member functions
export const getAllTeamMembers = async (): Promise<TeamMemberType[]> => {
  await sleep(500)
  return teamMembersData
}

// Task functions
export const getAllTasks = async (): Promise<TodoType[]> => {
  await sleep(500)
  return todoData
}

// Data Table functions
export const getAllDataTableRecords = async (): Promise<Employee[]> => {
  await sleep(500)
  return dataTableRecords
}

// Form validation
export const serverSideFormValidate = async (values: Record<string, string | boolean>) => {
  const validationSchema = yup.object().shape({
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    phone: yup.string().required('Phone is required'),
    password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'Passwords must match')
      .required('Confirm password is required'),
    country: yup.string().required('Country is required'),
    agreeTerms: yup.boolean().oneOf([true], 'You must agree to the terms'),
  })

  try {
    await validationSchema.validate(values, { abortEarly: false })
    return { success: true }
  } catch (error) {
    const validationError = error as yup.ValidationError
    return { success: false, errors: validationError.inner }
  }
}
