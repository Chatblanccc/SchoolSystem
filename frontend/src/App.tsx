import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import Dashboard from '@/pages/dashboard/Dashboard'
import StudentManagement from '@/pages/students/StudentManagement'
import ClassManagement from '@/pages/classes/ClassManagement'
import TeacherManagement from '@/pages/teachers/TeacherManagement'
import CourseManagement from '@/pages/courses/CourseManagement'

import { ThemeProvider } from '@/components/providers/ThemeProvider'

type Page = 'dashboard' | 'students' | 'classes' | 'teachers' | 'courses' | 'schedule' | 'grades' | 'analytics' | 'studentStatus' | 'newStudent' | 'studentTransfer' | 'graduationQuery' | 'settings' 
function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

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
      case 'grades':
      case 'analytics':
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
      case 'newStudent':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">新生入学</h2>
              <p className="text-muted-foreground">新生入学功能正在开发中，敬请期待</p>
            </div>
          </div>
        )
      case 'studentTransfer':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">异动办理</h2>
              <p className="text-muted-foreground">学生异动办理功能正在开发中，敬请期待</p>
            </div>
          </div>
        )
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

  return (
    <ThemeProvider>
      <Layout onNavigate={setCurrentPage} currentPage={currentPage}>
        {renderPage()}
      </Layout>
    </ThemeProvider>
  )
}

export default App
