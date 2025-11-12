import { useLayoutContext } from '@/context/useLayoutContext'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import useViewPort from '@/hooks/useViewPort'

/**
 * Component Toggle để thu nhỏ/mở rộng menu
 * UX Improvement: Cho phép user kiểm soát menu visibility
 */
const MenuCollapseToggle = () => {
  const {
    menu: { size },
    changeMenu: { size: changeMenuSize },
  } = useLayoutContext()
  const { width } = useViewPort()

  // Chỉ hiển thị trên desktop
  if (width < 992) return null

  const isCollapsed = size === 'sm-hover' || size === 'sm-hover-active'
  const isDefaultOrCondensed = size === 'default' || size === 'condensed'

  const handleToggle = () => {
    if (isDefaultOrCondensed) {
      changeMenuSize('sm-hover')
    } else {
      changeMenuSize('default')
    }
  }

  return (
    <button
      onClick={handleToggle}
      type="button"
      className="menu-collapse-toggle"
      aria-label={isCollapsed ? 'Mở rộng menu' : 'Thu nhỏ menu'}
      title={isCollapsed ? 'Mở rộng menu' : 'Thu nhỏ menu'}
      style={{
        position: 'absolute',
        right: '-12px',
        top: '70px',
        zIndex: 1011,
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        border: '1px solid var(--bs-border-color)',
        background: 'var(--bs-body-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <IconifyIcon
        icon={isCollapsed ? 'iconamoon:arrow-right-2' : 'iconamoon:arrow-left-2'}
        style={{
          fontSize: '14px',
          transition: 'transform 0.3s ease',
        }}
      />
    </button>
  )
}

export default MenuCollapseToggle
