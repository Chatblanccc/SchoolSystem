import { useState } from "react"
import { ChevronDown, ChevronUp, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TableDisplaySettings } from "./TableDisplaySettings"
import { cn } from "@/lib/utils"

interface CollapsibleTableSettingsProps {
  // 表格设置相关属性
  pageSize: number
  onPageSizeChange: (size: number) => void
  tableHeight: number
  onTableHeightChange: (height: number) => void
  onRefresh?: () => void
  refreshing?: boolean
  
  // 可见列设置（可选）
  visibleColumns?: string[]
  availableColumns?: { key: string; label: string }[]
  onColumnVisibilityChange?: (columnKey: string, visible: boolean) => void
  
  // 组件配置
  defaultExpanded?: boolean
  className?: string
}

export function CollapsibleTableSettings({
  pageSize,
  onPageSizeChange,
  tableHeight,
  onTableHeightChange,
  onRefresh,
  refreshing = false,
  visibleColumns = [],
  availableColumns = [],
  onColumnVisibilityChange,
  defaultExpanded = false,
  className
}: CollapsibleTableSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // 处理设置变化时自动折叠
  const handlePageSizeChange = (size: number) => {
    onPageSizeChange(size)
    // 延迟折叠，让用户看到变化效果
    setTimeout(() => setIsExpanded(false), 1000)
  }

  const handleTableHeightChange = (height: number) => {
    onTableHeightChange(height)
    // 延迟折叠，让用户看到变化效果
    setTimeout(() => setIsExpanded(false), 1000)
  }

  const handleRefresh = () => {
    onRefresh?.()
    // 刷新后不自动折叠，用户可能需要查看结果
  }

  return (
    <div className={cn("border rounded-lg bg-card", className)}>
      {/* 折叠触发器 */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-sm font-medium">表格设置</span>
            <div className="text-xs text-muted-foreground">
              {isExpanded ? "点击收起设置面板" : "自定义表格显示和性能参数"}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 当前设置的快速预览 */}
          {!isExpanded && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{pageSize}条/页</span>
              <span>•</span>
              <span>{tableHeight}px高</span>
            </div>
          )}
          
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 可折叠内容 */}
      {isExpanded && (
        <div className="border-t bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              调整表格显示参数以获得最佳性能和体验
            </div>
            <TableDisplaySettings
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              tableHeight={tableHeight}
              onTableHeightChange={handleTableHeightChange}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              visibleColumns={visibleColumns}
              availableColumns={availableColumns}
              onColumnVisibilityChange={onColumnVisibilityChange}
            />
          </div>
          
          {/* 设置提示 */}
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-xs text-blue-700 dark:text-blue-300">
              💡 <strong>性能提示：</strong>
              <ul className="mt-1 space-y-1 ml-4">
                <li>• 每页显示50-100条数据可获得最佳性能</li>
                <li>• 表格高度500-600px适合大多数屏幕</li>
                <li>• 虚拟化技术确保大数据量下的流畅体验</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
