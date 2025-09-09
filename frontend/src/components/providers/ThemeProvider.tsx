import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useThemeStore } from '@/stores/themeStore'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, setTheme } = useThemeStore()

  useEffect(() => {
    // 初始化主题
    setTheme(theme)
  }, [theme, setTheme])

  return <>{children}</>
}
