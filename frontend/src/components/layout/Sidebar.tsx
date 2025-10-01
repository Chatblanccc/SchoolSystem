import { useState, useEffect, useRef } from "react"
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  FileText,
  Settings,
  BarChart,
  IdCard,
  ChevronDown,
  UserPlus,
  RefreshCw,
  Search,
  Layers
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/stores/sidebarStore"
import { createPortal } from "react-dom"

type Page = 'dashboard' | 'students' | 'classes' | 'teachers' | 'courses' | 'schedule' | 'grades' | 'analytics' | 'examCreate' | 'studentStatus' | 'newStudent' | 'studentTransfer' | 'graduationQuery' | 'settings' | 'users'

interface SidebarProps {
  onNavigate?: (page: Page) => void
  currentPage?: Page
  isAdmin?: boolean
}

// 菜单项分组：学籍管理前后
const menuItemsBeforeStudentStatus = [
  { icon: LayoutDashboard, label: "仪表盘", page: "dashboard" as Page },
  { icon: Users, label: "学生管理", page: "students" as Page },
  { icon: Layers, label: "班级管理", page: "classes" as Page },
  { icon: GraduationCap, label: "教师管理", page: "teachers" as Page },
]

const menuItemsAfterStudentStatus: { icon: any; label: string; page: Page }[] = []

// 学籍管理子菜单项
const studentStatusItems = [
  { icon: UserPlus, label: "新生入学", page: "newStudent" as Page },
  { icon: RefreshCw, label: "异动办理", page: "studentTransfer" as Page },
  { icon: Search, label: "毕业查询", page: "graduationQuery" as Page },
]

// 课程管理子菜单项
const courseItems = [
  { icon: BookOpen, label: "课程列表", page: "courses" as Page },
  { icon: Calendar, label: "课程表", page: "schedule" as Page },
]

// 成绩管理子菜单项
const gradeItems = [
  { icon: FileText, label: "成绩管理", page: "grades" as Page },
  { icon: BarChart, label: "成绩分析", page: "analytics" as Page },
  // 考试创建：仅管理员显示（渲染时过滤）
  { icon: FileText, label: "考试创建", page: "examCreate" as Page },
]

export function Sidebar({ onNavigate, currentPage = 'dashboard', isAdmin = false }: SidebarProps) {
  const { isCollapsed } = useSidebarStore()
  const [isStudentStatusExpanded, setIsStudentStatusExpanded] = useState(false)
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(false)
  const [isGradesExpanded, setIsGradesExpanded] = useState(false)
  
  // 悬停弹出菜单状态
  const [hoveredMenu, setHoveredMenu] = useState<'studentStatus' | 'courses' | 'grades' | null>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 菜单按钮引用
  const studentStatusRef = useRef<HTMLButtonElement>(null)
  const coursesRef = useRef<HTMLButtonElement>(null)
  const gradesRef = useRef<HTMLButtonElement>(null)
  
  // 更新菜单位置
  const updateMenuPosition = (ref: React.RefObject<HTMLButtonElement | null>) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.top,
        left: rect.right + 8 // 8px间距
      })
    }
  }
  
  // 延迟关闭菜单
  const scheduleCloseMenu = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredMenu(null)
    }, 150) // 150ms 延迟，给用户足够时间移动到菜单
  }
  
  // 取消关闭菜单
  const cancelCloseMenu = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }
  
  // 清理定时器
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])
  
  const handleNavigation = (page: Page) => {
    if (!isAdmin && (page === 'users' || page === 'settings')) return
    onNavigate?.(page)
  }

  // 检查是否是学籍管理相关页面
  const isStudentStatusActive = ['newStudent', 'studentTransfer', 'graduationQuery'].includes(currentPage)
  // 检查是否是课程管理相关页面
  const isCoursesActive = ['courses', 'schedule'].includes(currentPage)
  // 检查是否是成绩管理相关页面
  const isGradesActive = ['grades', 'analytics', 'examCreate'].includes(currentPage)
  
  // 处理学籍管理菜单展开/收起
  const handleStudentStatusToggle = () => {
    setIsStudentStatusExpanded(!isStudentStatusExpanded)
  }
  // 处理课程管理菜单展开/收起
  const handleCoursesToggle = () => {
    setIsCoursesExpanded(!isCoursesExpanded)
  }
  // 处理成绩管理菜单展开/收起
  const handleGradesToggle = () => {
    setIsGradesExpanded(!isGradesExpanded)
  }
  
  // 处理子菜单点击
  const handleSubMenuClick = (page: Page) => {
    handleNavigation(page)
    // 注意：不要在这里收起菜单，让用户能看到当前选中的子项
  }
  
  // 当当前页面是学籍管理相关页面时，自动展开菜单
  useEffect(() => {
    if (isStudentStatusActive) {
      setIsStudentStatusExpanded(true)
    }
  }, [isStudentStatusActive])

  // 当当前页面是课程管理相关页面时，自动展开菜单
  useEffect(() => {
    if (isCoursesActive) {
      setIsCoursesExpanded(true)
    }
  }, [isCoursesActive])

  // 当当前页面是成绩管理相关页面时，自动展开菜单
  useEffect(() => {
    if (isGradesActive) {
      setIsGradesExpanded(true)
    }
  }, [isGradesActive])

  return (
    <>
    <aside className={cn(
      "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background border-r dark:bg-card overflow-hidden",
      "transition-[width] duration-300 ease-out z-40",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <nav className="h-full flex flex-col relative">
        {/* 可滚动的菜单区域 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-2 custom-scrollbar">
          <ul className="space-y-2">
          {/* 学生管理之前的菜单项 */}
          {menuItemsBeforeStudentStatus.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.page
            return (
              <li key={item.page}>
                <button
                  onClick={() => handleNavigation(item.page)}
                  className={cn(
                    "flex items-center rounded-lg transition-all duration-200 w-full text-left relative group overflow-hidden",
                    isCollapsed ? "justify-center px-3 py-2.5" : "space-x-3 px-4 py-2.5",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-accent"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className={cn(
                    "font-medium whitespace-nowrap transition-all duration-200",
                    isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                  )}>
                    {item.label}
                  </span>
                </button>
              </li>
            )
          })}
          
          {/* 学籍管理下拉菜单 */}
          <li 
            className="relative"
            onMouseEnter={() => {
              if (isCollapsed) {
                cancelCloseMenu()
                setHoveredMenu('studentStatus')
                updateMenuPosition(studentStatusRef)
              }
            }}
            onMouseLeave={() => isCollapsed && scheduleCloseMenu()}
          >
            <div>
              {/* 父菜单按钮 */}
              <button
                ref={studentStatusRef}
                onClick={isCollapsed ? () => handleNavigation('newStudent' as Page) : handleStudentStatusToggle}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-200 w-full text-left relative group overflow-hidden",
                  isCollapsed ? "justify-center px-3 py-2.5" : "space-x-3 px-4 py-2.5",
                  isStudentStatusActive || isStudentStatusExpanded
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-accent"
                )}
                title={isCollapsed ? "学籍管理" : undefined}
              >
                <IdCard className="h-5 w-5 flex-shrink-0" />
                <span className={cn(
                  "font-medium flex-1 whitespace-nowrap transition-all duration-200",
                  isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                )}>
                  学籍管理
                </span>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-all duration-200",
                    isStudentStatusExpanded ? "rotate-90" : "rotate-0",
                    isCollapsed ? "opacity-0 w-0" : "opacity-100"
                  )} 
                />
              </button>
              
              {/* 子菜单区域 - 折叠时隐藏 */}
              {!isCollapsed && (
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isStudentStatusExpanded 
                      ? "max-h-40 opacity-100 mt-1" 
                      : "max-h-0 opacity-0"
                  )}
                >
                  <div className="ml-4 border-l border-border pl-4 space-y-1">
                    {studentStatusItems
                      .filter(item => isAdmin || item.page !== 'studentTransfer')
                      .map((item) => {
                      const Icon = item.icon
                      const isSubActive = currentPage === item.page
                      return (
                        <button
                          key={item.page}
                          onClick={() => handleSubMenuClick(item.page)}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors w-full text-left text-sm",
                            isSubActive 
                              ? "bg-accent text-accent-foreground font-medium" 
                              : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          </li>

          {/* 课程管理下拉菜单 */}
          <li 
            className="relative"
            onMouseEnter={() => {
              if (isCollapsed) {
                cancelCloseMenu()
                setHoveredMenu('courses')
                updateMenuPosition(coursesRef)
              }
            }}
            onMouseLeave={() => isCollapsed && scheduleCloseMenu()}
          >
            <div>
              <button
                ref={coursesRef}
                onClick={isCollapsed ? () => handleNavigation('courses' as Page) : handleCoursesToggle}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-200 w-full text-left relative group overflow-hidden",
                  isCollapsed ? "justify-center px-3 py-2.5" : "space-x-3 px-4 py-2.5",
                  isCoursesActive || isCoursesExpanded
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
                title={isCollapsed ? "课程管理" : undefined}
              >
                <BookOpen className="h-5 w-5 flex-shrink-0" />
                <span className={cn(
                  "font-medium flex-1 whitespace-nowrap transition-all duration-200",
                  isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                )}>
                  课程管理
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-all duration-200",
                    isCoursesExpanded ? "rotate-90" : "rotate-0",
                    isCollapsed ? "opacity-0 w-0" : "opacity-100"
                  )}
                />
              </button>

              {!isCollapsed && (
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isCoursesExpanded
                      ? "max-h-40 opacity-100 mt-1"
                      : "max-h-0 opacity-0"
                  )}
                >
                  <div className="ml-4 border-l border-border pl-4 space-y-1">
                    {courseItems.map((item) => {
                      const Icon = item.icon
                      const isSubActive = currentPage === item.page
                      return (
                        <button
                          key={item.page}
                          onClick={() => handleSubMenuClick(item.page)}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors w-full text-left text-sm",
                            isSubActive
                              ? "bg-accent text-accent-foreground font-medium"
                              : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          </li>

          {/* 教师管理（顶层） */}
          {menuItemsAfterStudentStatus.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.page
            return (
              <li key={item.page}>
                <button
                  onClick={() => handleNavigation(item.page)}
                  className={cn(
                    "flex items-center rounded-lg transition-all duration-200 w-full text-left relative group overflow-hidden",
                    isCollapsed ? "justify-center px-3 py-2.5" : "space-x-3 px-4 py-2.5",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className={cn(
                    "font-medium whitespace-nowrap transition-all duration-200",
                    isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                  )}>
                    {item.label}
                  </span>
                </button>
              </li>
            )
          })}

          {/* 成绩管理下拉菜单 */}
          <li 
            className="relative"
            onMouseEnter={() => {
              if (isCollapsed) {
                cancelCloseMenu()
                setHoveredMenu('grades')
                updateMenuPosition(gradesRef)
              }
            }}
            onMouseLeave={() => isCollapsed && scheduleCloseMenu()}
          >
            <div>
              <button
                ref={gradesRef}
                onClick={isCollapsed ? () => handleNavigation('grades' as Page) : handleGradesToggle}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-200 w-full text-left relative group overflow-hidden",
                  isCollapsed ? "justify-center px-3 py-2.5" : "space-x-3 px-4 py-2.5",
                  isGradesActive || isGradesExpanded
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
                title={isCollapsed ? "成绩管理" : undefined}
              >
                <FileText className="h-5 w-5 flex-shrink-0" />
                <span className={cn(
                  "font-medium flex-1 whitespace-nowrap transition-all duration-200",
                  isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                )}>
                  成绩管理
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-all duration-200",
                    isGradesExpanded ? "rotate-90" : "rotate-0",
                    isCollapsed ? "opacity-0 w-0" : "opacity-100"
                  )}
                />
              </button>

              {!isCollapsed && (
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isGradesExpanded
                      ? "max-h-40 opacity-100 mt-1"
                      : "max-h-0 opacity-0"
                  )}
                >
                  <div className="ml-4 border-l border-border pl-4 space-y-1">
                    {gradeItems
                      .filter(item => isAdmin || item.page !== 'examCreate')
                      .map((item) => {
                      const Icon = item.icon
                      const isSubActive = currentPage === item.page
                      return (
                        <button
                          key={item.page}
                          onClick={() => handleSubMenuClick(item.page)}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors w-full text-left text-sm",
                            isSubActive
                              ? "bg-accent text-accent-foreground font-medium"
                              : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          </li>
          </ul>
        </div>
        
        {/* 底部固定：系统设置（普通用户隐藏 用户管理 和 系统设置） */}
        <div className="px-4 pb-4 pt-2 border-t border-border">
          <ul className="space-y-2">
            {isAdmin && (
              <li>
                <button
                  onClick={() => handleNavigation('users')}
                  className={cn(
                    "flex items-center rounded-lg transition-all duration-200 w-full text-left relative group overflow-hidden",
                    isCollapsed ? "justify-center px-3 py-2.5" : "space-x-3 px-4 py-2.5",
                    currentPage === 'users'
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                  title={isCollapsed ? "用户管理" : undefined}
                >
                  <Users className="h-5 w-5 flex-shrink-0" />
                  <span className={cn(
                    "font-medium whitespace-nowrap transition-all duration-200",
                    isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                  )}>
                    用户管理
                  </span>
                </button>
              </li>
            )}
            {isAdmin && (
              <li>
                <button
                  onClick={() => handleNavigation('settings')}
                  className={cn(
                    "flex items-center rounded-lg transition-all duration-200 w-full text-left relative group overflow-hidden",
                    isCollapsed ? "justify-center px-3 py-2.5" : "space-x-3 px-4 py-2.5",
                    currentPage === 'settings'
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                  title={isCollapsed ? "系统设置" : undefined}
                >
                  <Settings className="h-5 w-5 flex-shrink-0" />
                  <span className={cn(
                    "font-medium whitespace-nowrap transition-all duration-200",
                    isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                  )}>
                    系统设置
                  </span>
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </aside>
    
    {/* 使用 Portal 渲染悬浮菜单，避免被 overflow 裁剪 */}
    {isCollapsed && hoveredMenu && createPortal(
      <div 
        className="fixed bg-background border border-border rounded-lg shadow-xl py-2 min-w-[160px] z-[100] animate-in fade-in slide-in-from-left-2 duration-200"
        style={{ top: menuPosition.top, left: menuPosition.left }}
        onMouseEnter={cancelCloseMenu}
        onMouseLeave={scheduleCloseMenu}
      >
        {hoveredMenu === 'studentStatus' && (
          <>
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">学籍管理</div>
            <div className="border-t border-border my-1" />
            {studentStatusItems
              .filter(item => isAdmin || item.page !== 'studentTransfer')
              .map((item) => {
                const Icon = item.icon
                const isSubActive = currentPage === item.page
                return (
                  <button
                    key={item.page}
                    onClick={() => {
                      cancelCloseMenu()
                      handleSubMenuClick(item.page)
                      setHoveredMenu(null)
                    }}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 transition-colors w-full text-left text-sm",
                      isSubActive 
                        ? "bg-accent text-accent-foreground font-medium" 
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
          </>
        )}
        
        {hoveredMenu === 'courses' && (
          <>
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">课程管理</div>
            <div className="border-t border-border my-1" />
            {courseItems.map((item) => {
              const Icon = item.icon
              const isSubActive = currentPage === item.page
              return (
                <button
                  key={item.page}
                  onClick={() => {
                    cancelCloseMenu()
                    handleSubMenuClick(item.page)
                    setHoveredMenu(null)
                  }}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 transition-colors w-full text-left text-sm",
                    isSubActive 
                      ? "bg-accent text-accent-foreground font-medium" 
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </>
        )}
        
        {hoveredMenu === 'grades' && (
          <>
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">成绩管理</div>
            <div className="border-t border-border my-1" />
            {gradeItems
              .filter(item => isAdmin || item.page !== 'examCreate')
              .map((item) => {
                const Icon = item.icon
                const isSubActive = currentPage === item.page
                return (
                  <button
                    key={item.page}
                    onClick={() => {
                      cancelCloseMenu()
                      handleSubMenuClick(item.page)
                      setHoveredMenu(null)
                    }}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 transition-colors w-full text-left text-sm",
                      isSubActive 
                        ? "bg-accent text-accent-foreground font-medium" 
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
          </>
        )}
      </div>,
      document.body
    )}
  </>
  )
}
