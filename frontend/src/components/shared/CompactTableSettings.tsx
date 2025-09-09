import { Settings, RefreshCw, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectItem } from "@/components/ui/select"
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/dropdown"
import { cn } from "@/lib/utils"

interface CompactTableSettingsProps {
  // 表格设置相关属性
  pageSize: number
  onPageSizeChange: (size: number) => void
  tableHeight: number
  onTableHeightChange: (height: number) => void
  onRefresh?: () => void
  refreshing?: boolean
  
  // 组件配置
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

// 下拉触发器样式常量
const DROPDOWN_TRIGGER_CLASSES = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"

export function CompactTableSettings({
  pageSize,
  onPageSizeChange,
  tableHeight,
  onTableHeightChange,
  onRefresh,
  refreshing = false,
  className
}: CompactTableSettingsProps) {

  // 处理设置变化（下拉菜单会自动关闭）
  const handlePageSizeChange = (size: number) => {
    onPageSizeChange(size)
  }

  const handleTableHeightChange = (height: number) => {
    onTableHeightChange(height)
  }

  const handleRefresh = () => {
    onRefresh?.()
    // 刷新后不自动折叠，用户可能需要查看结果
  }

  return (
    <div className={cn("relative", className)}>
      {/* 紧凑的设置触发按钮 */}
      <Dropdown>
        <DropdownTrigger className={DROPDOWN_TRIGGER_CLASSES}>
          <Settings className="h-4 w-4" />
        </DropdownTrigger>
        
        <DropdownContent className="w-80 p-0">
          {/* 设置面板头部 */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">表格设置</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {pageSize}条/页 • {tableHeight}px高
            </div>
          </div>

          {/* 设置内容 */}
          <div className="p-4 space-y-4">
            {/* 每页显示数量 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">每页显示</span>
              <Select 
                value={pageSize.toString()} 
                onValueChange={(value) => handlePageSizeChange(parseInt(value))}
                className="w-24"
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* 表格高度设置 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">表格高度</span>
              <Select 
                value={tableHeight.toString()} 
                onValueChange={(value) => handleTableHeightChange(parseInt(value))}
                className="w-32"
              >
                {TABLE_HEIGHT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-between pt-2 border-t">
              {/* 刷新按钮 */}
              {onRefresh && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex-1 mr-2"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                  刷新数据
                </Button>
              )}

              {/* 预设配置 */}
              <Dropdown>
                <DropdownTrigger className={cn(DROPDOWN_TRIGGER_CLASSES, "flex-1")}>
                  <span className="text-sm">预设配置</span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </DropdownTrigger>
                <DropdownContent>
                  <DropdownItem onClick={() => {
                    handlePageSizeChange(20)
                    handleTableHeightChange(500)
                  }}>
                    <div className="flex flex-col">
                      <span className="font-medium">默认设置</span>
                      <span className="text-xs text-muted-foreground">20条/页，500px高</span>
                    </div>
                  </DropdownItem>
                  <DropdownItem onClick={() => {
                    handlePageSizeChange(50)
                    handleTableHeightChange(600)
                  }}>
                    <div className="flex flex-col">
                      <span className="font-medium">性能优化</span>
                      <span className="text-xs text-muted-foreground">50条/页，600px高</span>
                    </div>
                  </DropdownItem>
                  <DropdownItem onClick={() => {
                    handlePageSizeChange(10)
                    handleTableHeightChange(400)
                  }}>
                    <div className="flex flex-col">
                      <span className="font-medium">紧凑显示</span>
                      <span className="text-xs text-muted-foreground">10条/页，400px高</span>
                    </div>
                  </DropdownItem>
                </DropdownContent>
              </Dropdown>
            </div>
          </div>

          {/* 性能提示 */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border-t">
            <div className="text-xs text-blue-700 dark:text-blue-300">
              💡 <strong>性能提示：</strong>50-100条/页可获得最佳性能，虚拟化技术确保大数据量下的流畅体验
            </div>
          </div>
        </DropdownContent>
      </Dropdown>
    </div>
  )
}
