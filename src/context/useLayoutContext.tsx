import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'

import useLocalStorage from '@/hooks/useLocalStorage'
import type { ChildrenType } from '@/types/component-props'
import type { LayoutState, LayoutType, MenuType, OffcanvasControlType, LayoutOffcanvasStatesType, ThemeType } from '@/types/context'
import { toggleDocumentAttribute } from '@/utils/layout'

const ThemeContext = createContext<LayoutType | undefined>(undefined)

const useLayoutContext = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useLayoutContext can only be used within LayoutProvider')
  }
  return context
}

const LayoutProvider = ({ children }: ChildrenType) => {
  // Force light mode only - clear any dark mode from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('__REBACK_NEXT_CONFIG__')
    if (stored) {
      try {
        const config = JSON.parse(stored)
        // Force override any dark settings
        if (config.theme !== 'light' || config.topbarTheme !== 'light' || config.menu?.theme !== 'light') {
          localStorage.setItem('__REBACK_NEXT_CONFIG__', JSON.stringify({
            theme: 'light',
            topbarTheme: 'light',
            menu: { theme: 'light', size: 'default' }
          }))
        }
      } catch (e) {
        // Invalid JSON, clear it
        localStorage.removeItem('__REBACK_NEXT_CONFIG__')
      }
    }
  }, [])
  
  // Force light mode only - ignore query params and localStorage
  // Define INIT_STATE outside component to avoid dependency warning
  const INIT_STATE: LayoutState = useMemo(() => ({
    theme: 'light',
    topbarTheme: 'light',
    menu: {
      theme: 'light',
      size: 'default',
    },
  }), [])

  // Force override localStorage with light mode only
  const [settings, setSettings] = useLocalStorage<LayoutState>('__REBACK_NEXT_CONFIG__', INIT_STATE, true)
  const [offcanvasStates, setOffcanvasStates] = useState<LayoutOffcanvasStatesType>({
    showThemeCustomizer: false,
    showActivityStream: false,
    showBackdrop: false,
  })

  // update settings - memoized to prevent unnecessary re-renders
  const updateSettings = useCallback((_newSettings: Partial<LayoutState>) => {
    setSettings((prevSettings) => ({ ...prevSettings, ..._newSettings }))
  }, [setSettings])

  // update theme mode
  const changeTheme = useCallback((newTheme: ThemeType) => {
    updateSettings({ theme: newTheme })
  }, [updateSettings])

  // change topbar theme
  const changeTopbarTheme = useCallback((newTheme: ThemeType) => {
    updateSettings({ topbarTheme: newTheme })
  }, [updateSettings])

  // change menu theme
  const changeMenuTheme = useCallback((newTheme: MenuType['theme']) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      menu: { ...prevSettings.menu, theme: newTheme }
    }))
  }, [setSettings])

  // change menu size
  const changeMenuSize = useCallback((newSize: MenuType['size']) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      menu: { ...prevSettings.menu, size: newSize }
    }))
  }, [setSettings])

  // toggle theme customizer offcanvas
  const toggleThemeCustomizer: OffcanvasControlType['toggle'] = useCallback(() => {
    setOffcanvasStates((prev) => ({ ...prev, showThemeCustomizer: !prev.showThemeCustomizer }))
  }, [])

  // toggle activity stream offcanvas
  const toggleActivityStream: OffcanvasControlType['toggle'] = useCallback(() => {
    setOffcanvasStates((prev) => ({ ...prev, showActivityStream: !prev.showActivityStream }))
  }, [])

  // themeCustomizer object - memoized
  const themeCustomizer: LayoutType['themeCustomizer'] = useMemo(() => ({
    open: offcanvasStates.showThemeCustomizer,
    toggle: toggleThemeCustomizer,
  }), [offcanvasStates.showThemeCustomizer, toggleThemeCustomizer])

  // activityStream object - memoized
  const activityStream: LayoutType['activityStream'] = useMemo(() => ({
    open: offcanvasStates.showActivityStream,
    toggle: toggleActivityStream,
  }), [offcanvasStates.showActivityStream, toggleActivityStream])

  // toggle backdrop - use functional update to avoid stale closure
  const toggleBackdrop = useCallback(() => {
    const htmlTag = document.getElementsByTagName('html')[0]
    setOffcanvasStates((prev) => {
      if (prev.showBackdrop) htmlTag.classList.remove('sidebar-enable')
      else htmlTag.classList.add('sidebar-enable')
      return { ...prev, showBackdrop: !prev.showBackdrop }
    })
  }, [])


  useEffect(() => {
    toggleDocumentAttribute('data-bs-theme', settings.theme)
    toggleDocumentAttribute('data-topbar-color', settings.topbarTheme)
    toggleDocumentAttribute('data-menu-color', settings.menu.theme)
    toggleDocumentAttribute('data-menu-size', settings.menu.size)
    return () => {
      toggleDocumentAttribute('data-bs-theme', settings.theme, true)
      toggleDocumentAttribute('data-topbar-color', settings.topbarTheme, true)
      toggleDocumentAttribute('data-menu-color', settings.menu.theme, true)
      toggleDocumentAttribute('data-menu-size', settings.menu.size, true)
    }
  }, [settings])

  // reset settings to initial state
  const resetSettings = useCallback(() => {
    updateSettings(INIT_STATE)
  }, [updateSettings, INIT_STATE])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      ...settings,
      themeMode: settings.theme,
      changeTheme,
      changeTopbarTheme,
      changeMenu: {
        theme: changeMenuTheme,
        size: changeMenuSize,
      },
      themeCustomizer,
      activityStream,
      toggleBackdrop,
      resetSettings,
    }),
    [
      settings,
      changeTheme,
      changeTopbarTheme,
      changeMenuTheme,
      changeMenuSize,
      themeCustomizer,
      activityStream,
      toggleBackdrop,
      resetSettings,
    ]
  )

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
      {offcanvasStates.showBackdrop && <div className="offcanvas-backdrop fade show" onClick={toggleBackdrop} />}
    </ThemeContext.Provider>
  )
}

export { LayoutProvider, useLayoutContext }
