import { useEffect } from 'react'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useLayoutContext } from '@/context/useLayoutContext'
import useViewPort from '@/hooks/useViewPort'

const HoverMenuToggle = () => {
  const {
    menu: { size },
    changeMenu: { size: changeMenuSize },
  } = useLayoutContext()
  const { width } = useViewPort()

  useEffect(() => {
    if (width <= 1140) {
      if (size !== 'hidden') changeMenuSize('hidden')
    }
  }, [width])

  const handleHoverMenu = () => {
    // Handle all menu sizes
    if (size === 'default' || size === 'condensed') {
      // Thu nhỏ menu
      changeMenuSize('sm-hover')
    } else if (size === 'sm-hover-active') {
      changeMenuSize('sm-hover')
    } else {
      // Mở rộng menu về default
      changeMenuSize('default')
    }
  }

  return (
    <button onClick={handleHoverMenu} type="button" className="button-sm-hover" aria-label="Toggle Menu">
      <span className="button-sm-hover-icon">
        <IconifyIcon icon="iconamoon:arrow-left-4-square-duotone" />
      </span>
    </button>
  )
}

export default HoverMenuToggle
