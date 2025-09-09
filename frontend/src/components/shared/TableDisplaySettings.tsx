import { Settings, RefreshCw, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectItem } from "@/components/ui/select"
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/dropdown"
import { cn } from "@/lib/utils"

// 按钮样式常量，避免重复
const DROPDOWN_TRIGGER_CLASSES = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"

interface TableDisplaySettingsProps {
  // 每页显示数量
  pageSize: number
  onPageSizeChange: (size: number) => void
  
  // 表格高度
  tableHeight: number
  onTableHeightChange: (height: number) => void
  
  // 刷新功能
  onRefresh?: () => void
  refreshing?: boolean
  
  // 可见列设置（可选）
  visibleColumns?: string[]
  availableColumns?: { key: string; label: string }[]
  onColumnVisibilityChange?: (columnKey: string, visible: boolean) => void
  
  className?: string
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200]
const TABLE_HEIGHT_OPTIONS = [
  { value: 300, label: "低 (300px)" },
  { value: 400, label: "中等 (400px)" },
  { value: 500, label: "标准 (500px)" },
  { value: 600, label: "高 (600px)" },
  { value: 700, label: "超高 (700px)" }
]

export function TableDisplaySettings({
  pageSize,
  onPageSizeChange,
  tableHeight,
  onTableHeightChange,
  onRefresh,
  refreshing = false,
  visibleColumns = [],
  availableColumns = [],
  onColumnVisibilityChange,
  className
}: TableDisplaySettingsProps) {
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* 每页显示数量 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">每页显示</span>
        <Select 
          value={pageSize.toString()} 
          onValueChange={(value) => onPageSizeChange(parseInt(value))}
        >
          {PAGE_SIZE_OPTIONS.map(size => (
            <SelectItem key={size} value={size.toString()}>
              {size} 条
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* 表格高度设置 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">表格高度</span>
        <Select 
          value={tableHeight.toString()} 
          onValueChange={(value) => onTableHeightChange(parseInt(value))}
        >
          {TABLE_HEIGHT_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* 列显示设置 */}
      {availableColumns.length > 0 && onColumnVisibilityChange && (
        <Dropdown>
          <DropdownTrigger className={DROPDOWN_TRIGGER_CLASSES}>
            <Eye className="h-4 w-4 mr-2" />
            显示列
          </DropdownTrigger>
          <DropdownContent className="w-48">
            <div className="p-2">
              <div className="text-sm font-medium mb-2">选择显示的列</div>
              {availableColumns.map(column => (
                <div key={column.key} className="flex items-center space-x-2 py-1">
                  <button
                    onClick={() => onColumnVisibilityChange(column.key, !visibleColumns.includes(column.key))}
                    className="flex items-center space-x-2 w-full text-left hover:bg-accent rounded px-2 py-1"
                  >
                    {visibleColumns.includes(column.key) ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">{column.label}</span>
                  </button>
                </div>
              ))}
            </div>
          </DropdownContent>
        </Dropdown>
      )}

      {/* 刷新按钮 */}
      {onRefresh && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          刷新数据
        </Button>
      )}

      {/* 设置按钮（可扩展更多设置） */}
      <Dropdown>
        <DropdownTrigger className={DROPDOWN_TRIGGER_CLASSES}>
          <Settings className="h-4 w-4" />
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem onClick={() => onPageSizeChange(20)}>
            重置为默认设置
          </DropdownItem>
          <DropdownItem onClick={() => {
            onPageSizeChange(50)
            onTableHeightChange(600)
          }}>
            性能优化设置
          </DropdownItem>
          <DropdownItem onClick={() => {
            onPageSizeChange(10)
            onTableHeightChange(400)
          }}>
            紧凑显示设置
          </DropdownItem>
        </DropdownContent>
      </Dropdown>
    </div>
  )
}
