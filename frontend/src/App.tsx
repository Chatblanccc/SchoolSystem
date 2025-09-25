import { useEffect, useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import Login from '@/pages/auth/Login'
import { authService } from '@/services/authService'
import Dashboard from '@/pages/dashboard/Dashboard'
import StudentManagement from '@/pages/students/StudentManagement'
import ClassManagement from '@/pages/classes/ClassManagement'
import TeacherManagement from '@/pages/teachers/TeacherManagement'
import CourseManagement from '@/pages/courses/CourseManagement'
import Timetable from '@/pages/courses/Timetable'
import NewStudentEnrollment from '@/pages/enrollment/NewStudentEnrollment'
import StudentChanges from '@/pages/students/StudentChanges'

import { ThemeProvider } from '@/components/providers/ThemeProvider'
import GradeManagement from '@/pages/grades/GradeManagement'
import GradeAnalytics from '@/pages/grades/GradeAnalytics'
import ExamCreate from '@/pages/grades/ExamCreate'
import UserManagement from '@/pages/users/UserManagement'
import { useAuthInfoStore } from '@/stores/authInfo'
import { Toaster } from '@/components/ui/toast'
import TestScroll from '@/pages/grades/TestScroll'

type Page = 'dashboard' | 'students' | 'classes' | 'teachers' | 'courses' | 'schedule' | 'grades' | 'analytics' | 'studentStatus' | 'newStudent' | 'studentTransfer' | 'graduationQuery' | 'settings' | 'users'
function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const { isAdmin, setIsAdmin } = useAuthInfoStore()

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'students':
        return <StudentManagement />
      case 'classes':
        return <ClassManagement />
      case 'teachers':
        return <TeacherManagement />
      case 'courses':
        return <CourseManagement />
      case 'schedule':
        return <Timetable />
      case 'grades':
        return <GradeManagement />
        // return <TestScroll />
      case 'analytics':
        return <GradeAnalytics />
      case 'examCreate': {
        if (!isAdmin) {
          return (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">未授权</h2>
                <p className="text-muted-foreground">只有管理员可以访问“考试创建”。</p>
              </div>
            </div>
          )
        }
        return <ExamCreate />
      }
      case 'studentStatus':
      case 'settings':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">功能开发中</h2>
              <p className="text-muted-foreground">该功能正在开发中，敬请期待</p>
            </div>
          </div>
        )
      case 'users':
        return <UserManagement />
      case 'newStudent':
        return <NewStudentEnrollment />
      case 'studentTransfer':
        return <StudentChanges />
      case 'graduationQuery':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">毕业查询</h2>
              <p className="text-muted-foreground">毕业查询功能正在开发中，敬请期待</p>
            </div>
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  const [userLoaded, setUserLoaded] = useState(false)
  const rawToken = localStorage.getItem('access_token')
  const hasValidToken = !!rawToken && rawToken !== 'undefined' && rawToken !== 'null' && rawToken.includes('.')
  const isAuthenticated = hasValidToken
  const isLoginRoute = window.location.pathname.startsWith('/login')

  useEffect(() => {
    if (!isAuthenticated) {
      // 清理无效 token，确保进入登录页
      if (rawToken && !hasValidToken) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
      setUserLoaded(true)
      return
    }
    ;(async () => {
      const user = await authService.getCurrentUser()
      if (!user) {
        // token 已失效或网络异常时，回到登录页
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return
      }
      setIsAdmin(!!(user as any)?.is_staff || !!(user as any)?.is_superuser)
      setUserLoaded(true)
    })()
  }, [isAuthenticated, hasValidToken, rawToken])

  if (!isAuthenticated && !isLoginRoute) {
    // 未登录时强制跳转到登录页
    window.history.replaceState(null, '', '/login')
  }

  return (
    <ThemeProvider>
      {(!isAuthenticated || isLoginRoute) ? (
        <Login />
      ) : (
        <Layout onNavigate={setCurrentPage} currentPage={currentPage} isAdmin={isAdmin}>
          {userLoaded ? renderPage() : null}
        </Layout>
      )}
      <Toaster />
    </ThemeProvider>
  )
}

export default App
