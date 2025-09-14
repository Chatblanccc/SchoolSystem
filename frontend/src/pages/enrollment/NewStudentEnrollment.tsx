import { useState } from 'react'
import { UserPlus, Upload, FileSpreadsheet, Download, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { studentService } from '@/services/studentService'
import { StudentFormModal } from '@/components/shared/StudentFormModal'
import { StudentImportModal } from '@/components/shared/StudentImportModal'
import type { StudentDetailView } from '@/types/student'

export default function NewStudentEnrollment() {
  const [singleEnrollOpen, setSingleEnrollOpen] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [recentEnrollments, setRecentEnrollments] = useState<StudentDetailView[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    todayCount: 0,
    weekCount: 0,
    monthCount: 0,
    pendingCount: 0
  })

  // 加载最近入学的学生
  const loadRecentEnrollments = async () => {
    try {
      setLoading(true)
      // 获取最近创建的学生（按创建时间倒序）
      const response = await studentService.getStudents({
        page: 1,
        pageSize: 10,
        ordering: '-created_at'
      })
      setRecentEnrollments(response.students)
      
      // TODO: 后续可以添加统计接口获取实际统计数据
      // 这里暂时使用模拟数据
      setStats({
        todayCount: 5,
        weekCount: 23,
        monthCount: 156,
        pendingCount: 3
      })
    } catch (error) {
      console.error('加载最近入学学生失败', error)
    } finally {
      setLoading(false)
    }
  }

  // 组件加载时获取数据
  useState(() => {
    const init = async () => {
      await loadRecentEnrollments()
    }
    init()
  })

  const handleSingleEnroll = async (values: any) => {
    try {
      await studentService.createStudent({
        studentId: values.studentId,
        name: values.name,
        gender: values.gender,
        birthDate: values.birthDate,
        idCardNumber: values.idCardNumber,
        guangzhouStudentId: values.guangzhouStudentId,
        nationalStudentId: values.nationalStudentId,
        homeAddress: values.homeAddress,
        status: '在校',
        classId: values.classId,
      })
      setSingleEnrollOpen(false)
      loadRecentEnrollments()
      alert('新生入学登记成功！')
    } catch (e: any) {
      alert(e?.response?.data?.error?.message || '入学登记失败，请检查信息后重试')
    }
  }

  const downloadTemplate = () => {
    const headers = '学号,姓名,性别,班级,状态,身份证号,市学籍号,国学籍号,出生日期,家庭住址'
    const example = '\n202501001,张三,男,一年级1班,在校,440103200901011234,GZ2025001,CN2025001,2009-01-01,广州市天河区xxx路xxx号'
    const content = headers + example
    
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '新生入学模板.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">新生入学</h2>
        <p className="text-muted-foreground mt-2">管理新生入学登记，支持单个录入和批量导入</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">今日入学</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCount}</div>
            <p className="text-xs text-muted-foreground">位新生</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">本周入学</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekCount}</div>
            <p className="text-xs text-muted-foreground">位新生</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">本月入学</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthCount}</div>
            <p className="text-xs text-muted-foreground">位新生</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">待审核</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">待处理</p>
          </CardContent>
        </Card>
      </div>

      {/* 操作区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 单个入学登记 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              单个入学登记
            </CardTitle>
            <CardDescription>
              为单个新生办理入学登记手续
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => setSingleEnrollOpen(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              开始登记
            </Button>
          </CardContent>
        </Card>

        {/* 批量导入 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              批量导入新生
            </CardTitle>
            <CardDescription>
              通过Excel或CSV文件批量导入新生信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => setBulkImportOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              批量导入
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={downloadTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              下载模板
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 最近入学学生列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            最近入学学生
          </CardTitle>
          <CardDescription>
            显示最近10位入学登记的新生信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-muted-foreground">加载中...</span>
              </div>
            </div>
          ) : recentEnrollments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              暂无最近入学的学生记录
            </div>
          ) : (
            <div className="space-y-3">
              {recentEnrollments.map((student) => (
                <div 
                  key={student.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {student.name.slice(0, 1)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">
                        学号：{student.studentId} | 班级：{student.className}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {student.gender}
                    </Badge>
                    <Badge variant="success" className="text-xs">
                      {student.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 单个入学登记弹窗 */}
      <StudentFormModal
        isOpen={singleEnrollOpen}
        title="新生入学登记"
        onClose={() => setSingleEnrollOpen(false)}
        onSubmit={handleSingleEnroll}
      />

      {/* 批量导入弹窗 */}
      <StudentImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onImported={() => {
          loadRecentEnrollments()
          alert('批量导入成功！')
        }}
      />
    </div>
  )
}
