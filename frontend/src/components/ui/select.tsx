import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps {
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
}

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {}
})

export function Select({ placeholder, value, onValueChange, children, className }: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value)
  const selectRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setSelectedValue(value)
  }, [value])

  // 点击外部关闭下拉菜单
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
    setIsOpen(false)
  }

  // 获取选中项的显示文本
  const getSelectedLabel = () => {
    const items = React.Children.toArray(children) as React.ReactElement<SelectItemProps>[]
    const selectedItem = items.find(item => item.props.value === selectedValue)
    return selectedItem?.props.children || placeholder
  }

  return (
    <SelectContext.Provider value={{ value: selectedValue, onValueChange: handleValueChange, isOpen, setIsOpen }}>
      <div className="relative" ref={selectRef}>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[120px]",
            className
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={cn(
            "truncate flex-1 text-left",
            selectedValue ? "" : "text-muted-foreground"
          )}>
            {getSelectedLabel()}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
        </button>
        
        {isOpen && (
          <div className="absolute top-full mt-1 w-full min-w-max rounded-md border bg-popover p-1 shadow-lg z-[80] max-h-60 overflow-y-auto">
            {children}
          </div>
        )}
      </div>
    </SelectContext.Provider>
  )
}

export function SelectItem({ value, children }: SelectItemProps) {
  const { value: selectedValue, onValueChange } = React.useContext(SelectContext)
  
  return (
    <div
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground whitespace-nowrap",
        selectedValue === value && "bg-accent text-accent-foreground"
      )}
      onClick={() => onValueChange?.(value)}
    >
      <span className="truncate">{children}</span>
    </div>
  )
}
