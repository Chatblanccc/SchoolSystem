import { useEffect, type ReactNode } from "react"
import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import { TabBar } from "@/components/layout/TabBar"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { useTabStore } from "@/stores/tabStore"

type Page = 'dashboard' | 'students' | 'classes' | 'teachers' | 'courses' | 'schedule' | 'grades' | 'analytics' | 'studentStatus' | 'newStudent' | 'studentTransfer' | 'graduationQuery' | 'settings' | 'users'

interface LayoutProps {
  children: ReactNode
  onNavigate?: (page: Page) => void
  currentPage?: Page
  isAdmin?: boolean
}

// 页面标题映射
const pageTitles: Record<Page, string> = {
  dashboard: '仪表盘',
  students: '学生管理',
  classes: '班级管理',
  teachers: '教师管理',
  courses: '课程管理',
  schedule: '课程表',
  grades: '成绩管理',
  analytics: '数据分析',
  studentStatus: '学籍管理',
  newStudent: '新生入学',
  studentTransfer: '异动办理',
  graduationQuery: '毕业查询',
  settings: '系统设置',
  users: '用户管理'
}

export function Layout({ children, onNavigate, currentPage = 'dashboard', isAdmin = false }: LayoutProps) {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab, clearTabs } = useTabStore()

  // 同步标签激活状态到路由：当关闭当前激活标签后，自动跳转到新的激活标签
  useEffect(() => {
    if (!activeTabId) return
    if (activeTabId !== currentPage) {
      onNavigate?.(activeTabId as Page)
    }
  }, [activeTabId, currentPage, onNavigate])

  // 处理侧边栏导航
  const handleSidebarNavigate = (page: Page) => {
    const title = pageTitles[page]
    if (title) {
      addTab({
        id: page,
        title: title,
        page: page,
        closable: page !== 'dashboard' // 仪表盘不可关闭
      })
    }
    onNavigate?.(page)
  }

  // 处理标签点击
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    onNavigate?.(tabId as Page)
  }

  // 处理标签关闭
  const handleTabClose = (tabId: string) => {
    removeTab(tabId)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar onNavigate={handleSidebarNavigate} currentPage={currentPage} isAdmin={isAdmin} />
        <div className="flex-1 flex flex-col mt-16 ml-64">
          <ErrorBoundary fallback={
            <div className="h-10 bg-muted/20 border-b flex items-center px-4">
              <span className="text-sm text-muted-foreground">标签栏加载失败</span>
            </div>
          }>
            <TabBar
              tabs={tabs}
              activeTabId={activeTabId || currentPage}
              onTabClick={handleTabClick}
              onTabClose={handleTabClose}
              onClearAll={clearTabs}
            />
          </ErrorBoundary>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
