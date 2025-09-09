import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownProps {
  children: React.ReactNode
  className?: string
}

interface DropdownTriggerProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

interface DropdownContentProps {
  children: React.ReactNode
  className?: string
  open?: boolean
}

interface DropdownItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

const DropdownContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {}
})

export function Dropdown({ children, className }: DropdownProps) {
  const [open, setOpen] = React.useState(false)

  // 点击外部关闭
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-dropdown]')) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className={cn("relative", className)} data-dropdown>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

export function DropdownTrigger({ children, className, onClick }: DropdownTriggerProps) {
  const { open, setOpen } = React.useContext(DropdownContext)

  const handleClick = () => {
    setOpen(!open)
    onClick?.()
  }

  return (
    <button 
      className={cn("outline-none", className)} 
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

export function DropdownContent({ children, className, open: openProp }: DropdownContentProps) {
  const { open } = React.useContext(DropdownContext)
  const isOpen = openProp !== undefined ? openProp : open

  if (!isOpen) return null

  return (
    <div className={cn(
      "absolute right-0 top-full mt-2 w-48 rounded-md border bg-popover p-1 shadow-lg z-50",
      "animate-in fade-in-0 zoom-in-95",
      className
    )}>
      {children}
    </div>
  )
}

export function DropdownItem({ children, className, onClick }: DropdownItemProps) {
  const { setOpen } = React.useContext(DropdownContext)

  const handleClick = () => {
    onClick?.()
    setOpen(false)
  }

  return (
    <button
      className={cn(
        "flex w-full items-center rounded-sm px-2 py-1.5 text-sm",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:bg-accent focus:text-accent-foreground focus:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}
