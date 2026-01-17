import { lazy } from 'react'
import { Suspense } from 'react'

import ActivityStreamToggle from './components/ActivityStreamToggle'
import ProfileDropdown from './components/ProfileDropdown'

const Notifications = lazy(() => import('./components/Notifications'))

const TopNavigationBar = () => {
  return (
    <header className="topbar">
      <div className="container-xxl">
        <div className="navbar-header">
          <div className="d-flex align-items-center gap-1 ms-auto">
            {/* Notification Dropdown */}
            <Suspense>
              <Notifications />
            </Suspense>

            {/* Toggle for Activity Stream */}
            <ActivityStreamToggle />

            {/* Admin Profile Dropdown */}
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopNavigationBar
