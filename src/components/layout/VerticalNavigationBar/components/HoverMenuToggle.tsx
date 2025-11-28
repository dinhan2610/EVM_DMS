import { useEffect } from 'react'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useLayoutContext } from '@/context/useLayoutContext'
import useViewPort from '@/hooks/useViewPort'

const HoverMenuToggle = () => {
  const {
    menu: { size },
    changeMenu: { size: changeMenuSize },
    toggleBackdrop,
  } = useLayoutContext()
  const { width } = useViewPort()

  useEffect(() => {
    if (width < 992 && size !== 'hidden') {
      changeMenuSize('hidden')
    } else if (width >= 992 && size === 'hidden') {
      changeMenuSize('default')
    }
  }, [width, size, changeMenuSize])

  const isCollapsed = size === 'sm-hover' || size === 'sm-hover-active'

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur()
    
    // Mobile: Toggle backdrop
    if (width < 992) {
      toggleBackdrop()
      return
    }
    
    // Desktop: Toggle collapse/expand
    if (isCollapsed) {
      changeMenuSize('default')
    } else {
      changeMenuSize('sm-hover')
    }
  }

  return (
    <button 
      onClick={handleToggle} 
      type="button" 
      className="button-sm-hover" 
      aria-label={isCollapsed ? 'Mở rộng menu' : 'Thu nhỏ menu'}
      title={isCollapsed ? 'Mở rộng menu' : 'Thu nhỏ menu'}
      onMouseDown={(e) => e.preventDefault()}
    >
      <span className="button-sm-hover-icon">
        <IconifyIcon icon={isCollapsed ? 'iconamoon:arrow-right-4-square-duotone' : 'iconamoon:arrow-left-4-square-duotone'} />
      </span>
    </button>
  )
}

export default HoverMenuToggle
