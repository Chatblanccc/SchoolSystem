import { Moon, Sun, Monitor, ChevronDown } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import type { Theme } from '@/stores/themeStore'
import { cn } from '@/lib/utils'
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from './dropdown'

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()

  const themes: { value: Theme; icon: React.ElementType; label: string }[] = [
    { value: 'light', icon: Sun, label: '浅色模式' },
    { value: 'dark', icon: Moon, label: '深色模式' },
    { value: 'system', icon: Monitor, label: '跟随系统' }
  ]

  const currentTheme = themes.find(t => t.value === theme)
  const CurrentIcon = currentTheme?.icon || Monitor

  return (
    <Dropdown>
      <DropdownTrigger className={cn(
        "inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg",
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "transition-colors text-sm font-medium"
      )}>
        <CurrentIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{currentTheme?.label}</span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </DropdownTrigger>
      
      <DropdownContent>
        {themes.map(({ value, icon: Icon, label }) => (
          <DropdownItem
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              "gap-2",
              theme === value && "bg-accent text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {theme === value && (
              <div className="ml-auto h-1 w-1 rounded-full bg-current" />
            )}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  )
}

export function SimpleThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center justify-center w-9 h-9 rounded-lg",
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "transition-colors"
      )}
      title={isDark ? '切换到浅色模式' : '切换到深色模式'}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">切换主题</span>
    </button>
  )
}

export function InlineThemeToggle() {
  const { theme, setTheme } = useThemeStore()

  const themes: { value: Theme; icon: React.ElementType; label: string }[] = [
    { value: 'light', icon: Sun, label: '浅色' },
    { value: 'dark', icon: Moon, label: '深色' },
    { value: 'system', icon: Monitor, label: '系统' }
  ]

  return (
    <div className="inline-flex items-center bg-muted rounded-lg p-1">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            "relative inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-sm font-medium transition-all",
            "hover:bg-background hover:text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            theme === value && "bg-background text-foreground shadow-sm"
          )}
          title={`切换到${label}模式`}
        >
          <Icon className="h-3 w-3" />
          <span className="hidden sm:inline text-xs">{label}</span>
        </button>
      ))}
    </div>
  )
}
