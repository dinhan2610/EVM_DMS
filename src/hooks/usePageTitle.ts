import { useEffect, useRef, useCallback, useMemo } from 'react'

/**
 * Custom Hook: usePageTitle (Optimized)
 * 
 * Quản lý document title theo best practices UX với tối ưu performance:
 * - Format: [Tên Trang] | EIMS
 * - Hỗ trợ dynamic count (notifications, pending items)
 * - Tự động restore title khi user quay lại tab
 * - Memoization để tránh unnecessary re-renders
 * - Cleanup tự động để tránh memory leaks
 * 
 * @example
 * // Basic usage
 * usePageTitle('Tổng quan')  // → "Tổng quan | EIMS"
 * 
 * @example
 * // With notification count
 * usePageTitle('Duyệt hóa đơn', 5)  // → "(5) Duyệt hóa đơn | EIMS"
 * 
 * @example
 * // Dynamic title update
 * const { setTitle } = usePageTitle('Chi tiết')
 * setTitle('HD-150 - Chi tiết')
 * 
 * @example
 * // Without brand (for login page)
 * usePageTitle('Đăng nhập', 0, false)  // → "Đăng nhập"
 */

const APP_NAME = 'EIMS'
const AWAY_MESSAGE = 'Hãy quay lại! 🥺'

export const usePageTitle = (
  title: string,
  count?: number,
  includeBrand: boolean = true
) => {
  const originalTitle = useRef<string>('')
  const listenerAdded = useRef<boolean>(false)

  // 🚀 Memoize title building để tránh re-compute
  const builtTitle = useMemo(() => {
    let finalTitle = ''

    // Add count badge nếu có (ví dụ: "(5) Duyệt hóa đơn")
    if (count && count > 0) {
      finalTitle = `(${count}) ${title}`
    } else {
      finalTitle = title
    }

    // Add brand name (ví dụ: "Duyệt hóa đơn | EIMS")
    if (includeBrand) {
      finalTitle = `${finalTitle} | ${APP_NAME}`
    }

    return finalTitle
  }, [title, count, includeBrand])

  // 🚀 Memoize visibility handler để tránh re-create function
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      // User rời khỏi tab → Hiển thị message "Please come back"
      document.title = AWAY_MESSAGE
    } else {
      // User quay lại tab → Restore original title
      document.title = originalTitle.current
    }
  }, [])

  useEffect(() => {
    // Set title
    originalTitle.current = builtTitle
    document.title = builtTitle

    // Add event listener (chỉ add 1 lần)
    if (!listenerAdded.current) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      listenerAdded.current = true
    }

    // Cleanup
    return () => {
      if (listenerAdded.current) {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        listenerAdded.current = false
      }
    }
  }, [builtTitle, handleVisibilityChange])

  // 🚀 Memoize setTitle function để tránh re-create
  const setTitle = useCallback((newTitle: string, newCount?: number) => {
    const updatedTitle = newCount && newCount > 0 
      ? `(${newCount}) ${newTitle} | ${APP_NAME}`
      : `${newTitle} | ${APP_NAME}`
    
    originalTitle.current = updatedTitle
    document.title = updatedTitle
  }, [])

  return { setTitle }
}

/**
 * Helper function: buildPageTitle
 * Dùng khi cần build title nhưng không dùng hook (ví dụ: trong window.open)
 */
export const buildPageTitle = (title: string, count?: number): string => {
  if (count && count > 0) {
    return `(${count}) ${title} | ${APP_NAME}`
  }
  return `${title} | ${APP_NAME}`
}
