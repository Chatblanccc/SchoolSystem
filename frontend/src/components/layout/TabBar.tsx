import React from "react"
import { X, Plus, LayoutDashboard, Users, GraduationCap, BookOpen, Calendar, FileText, BarChart, Settings, UserPlus, RefreshCw, Search, Layers, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type TabPage = {
  id: string
  title: string
  icon?: React.ElementType
  page: string
  closable?: boolean
}

// 页面图标映射 - 直接在这里定义
const pageIcons: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  students: Users,
  classes: Layers,
  teachers: GraduationCap,
  courses: BookOpen,
  schedule: Calendar,
  grades: FileText,
  analytics: BarChart,
  studentStatus: FileText,
  newStudent: UserPlus,
  studentTransfer: RefreshCw,
  graduationQuery: Search,
  settings: Settings
}

interface TabBarProps {
  tabs: TabPage[]
  activeTabId: string
  onTabClick: (tabId: string) => void
  onTabClose?: (tabId: string) => void
  onAddTab?: () => void
  maxTabs?: number
  onClearAll?: () => void
}

export function TabBar({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onAddTab,
  maxTabs = 10,
  onClearAll
}: TabBarProps) {

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    onTabClose?.(tabId)
  }

  return (
    <div className="flex items-center bg-background border-b">
      <div className="flex-1 flex items-center min-w-0">
        <div className="flex items-center overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => {
            // 直接从映射中获取图标
            const Icon = pageIcons[tab.page] || pageIcons[tab.id]
            const isActive = tab.id === activeTabId

            return (
              <div
                key={tab.id}
                className={cn(
                  "relative flex items-center cursor-pointer transition-all duration-200 group",
                  "min-w-[120px] max-w-[200px] px-4 py-2",
                  "border-r border-l first:border-l-0",
                  isActive 
                    ? "bg-muted/20 dark:bg-muted/30" 
                    : "hover:bg-muted/10 dark:hover:bg-muted/20"
                )}
                onClick={() => onTabClick(tab.id)}
              >
                {/* 标签内容 */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* 图标 */}
                  {Icon && (
                    <Icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  )}
                  
                  {/* 标题 */}
                  <span className={cn(
                    "text-sm truncate",
                    isActive 
                      ? "font-medium text-foreground" 
                      : "text-muted-foreground"
                  )}>
                    {tab.title}
                  </span>

                  {/* 关闭按钮 */}
                  {tab.closable !== false && (
                    <button
                      className={cn(
                        "ml-2 p-0.5 rounded hover:bg-muted transition-opacity duration-200",
                        "opacity-0 group-hover:opacity-100",
                        isActive && "opacity-100"
                      )}
                      onClick={(e) => handleTabClose(e, tab.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* 激活指示器 */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </div>
            )
          })}
          
          {/* 添加标签按钮 */}
          {onAddTab && tabs.length < maxTabs && (
            <button
              className="px-3 py-2 hover:bg-muted/10 transition-colors border-r"
              onClick={onAddTab}
              title="新建标签"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      {/* 一键清除按钮（保留仪表盘） */}
      {onClearAll && (
        <div className="border-l">
          <button
            className="px-3 py-2 hover:bg-destructive/10 transition-colors text-destructive flex items-center gap-1"
            onClick={onClearAll}
            title="清除全部标签（保留仪表盘）"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-sm">清除</span>
          </button>
        </div>
      )}
    </div>
  )
}
