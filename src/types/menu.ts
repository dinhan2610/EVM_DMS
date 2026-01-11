import type { HTMLAttributeAnchorTarget, ReactNode } from 'react'
import type { UserRole } from '@/constants/roles'

export type MenuItemType = {
  key: string
  label: string
  isTitle?: boolean
  icon?: string
  url?: string
  badge?: {
    variant: string
    text: string
  }
  parentKey?: string
  target?: HTMLAttributeAnchorTarget
  isDisabled?: boolean
  children?: MenuItemType[]
  roles?: UserRole[]  // ✅ NEW: Danh sách role được phép xem menu này
}

export type TabMenuItem = {
  index: number
  name: string
  icon: string
  tab: ReactNode
}

export type SubMenus = {
  item: MenuItemType
  linkClassName?: string
  subMenuClassName?: string
  activeMenuItems?: Array<string>
  toggleMenu?: (item: MenuItemType, status: boolean) => void
  className?: string
}
