import { lazy, Suspense } from 'react'

import FallbackLoading from '@/components/FallbackLoading'
import LogoBox from '@/components/LogoBox'
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient'
import { getMenuItemsByRole } from '@/constants/menu-items-with-roles'
import { useAuthContext } from '@/context/useAuthContext'
import HoverMenuToggle from './components/HoverMenuToggle'

const AppMenu = lazy(() => import('./components/AppMenu'))

const VerticalNavigationBar = () => {
  const { user } = useAuthContext()
  
  // ✅ Lấy menu theo role của user
  const menuItems = getMenuItemsByRole(user?.role)

  return (
    <div className="main-nav" id="leftside-menu-container">
      <LogoBox containerClassName="logo-box" squareLogo={{ className: 'logo-sm' }} textLogo={{ className: 'logo-lg' }} />

      <HoverMenuToggle />

      <SimplebarReactClient className="scrollbar">
        <Suspense fallback={<FallbackLoading />}>
          <AppMenu menuItems={menuItems} />
        </Suspense>
      </SimplebarReactClient>
    </div>
  )
}

export default VerticalNavigationBar
