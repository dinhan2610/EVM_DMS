import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useLayoutContext } from '@/context/useLayoutContext'

const ThemeModeToggle = () => {
  // Dark mode disabled - light mode only
  return (
    <div className="topbar-item">
      <button disabled className="topbar-button" style={{ opacity: 0.5, cursor: 'not-allowed' }} title="Dark mode disabled">
        <IconifyIcon icon="iconamoon:mode-light-duotone" className="fs-24 align-middle" />
      </button>
    </div>
  )
}

export default ThemeModeToggle
