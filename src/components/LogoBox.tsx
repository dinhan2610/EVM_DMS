import { Link } from 'react-router-dom'

import type { LogoBoxProps } from '@/types/component-props'

import logoDark from '@/assets/images/logo-dark.png'
// Light mode only - logo-light removed

const LogoBox = ({ containerClassName, textLogo }: LogoBoxProps) => {
  return (
    <div className={containerClassName ?? ''}>
      <Link to="/" className="logo-dark">
        <img src={logoDark} className={textLogo?.className} height={textLogo?.height ?? 20} width={textLogo?.width ?? 60} alt="logo" />
      </Link>
    </div>
  )
}

export default LogoBox
