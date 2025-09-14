import { useState, useEffect } from "react"
import { Plus, Upload, Download, Settings, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectItem } from "@/components/ui/select"
import { SimpleVirtualStudentTable } from "@/components/shared/SimpleVirtualStudentTable"
import { StudentDetailModal } from "@/components/shared/StudentDetailModal"
import { StudentImportModal } from "@/components/shared/StudentImportModal"
import { StudentExportModal } from "@/components/shared/StudentExportModal"
import { StudentFormModal } from "@/components/shared/StudentFormModal"
import { Pagination } from "@/components/shared/Pagination"
import { CompactTableSettings } from "@/components/shared/CompactTableSettings"
import { studentService } from "@/services/studentService"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { StudentBulkActionModal } from "@/components/shared/StudentBulkActionModal"
import type { StudentDetailView, StudentQueryParams, PaginatedStudents } from "@/types/student"

export default function StudentManagement() {
  const [students, setStudents] = useState<StudentDetailView[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailView | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDeleteIds, setToDeleteIds] = useState<string[]>([])
  const [toDeleteNames, setToDeleteNames] = useState<string[]>([])
  const [bulkOpen, setBulkOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })
  
  // 表格显示设置
  const [tableHeight, setTableHeight] = useState(500)
  
  // 查询参数
  const [queryParams, setQueryParams] = useState<StudentQueryParams>({
    page: 1,
    pageSize: 20,
    search: '',
    grade: '',
    className: '',
    status: undefined,
    includeTransferred: false,
  })

  // 加载学生数据
  const loadStudents = async () => {
    try {
      setLoading(true)
      const result: PaginatedStudents = await studentService.getStudents(queryParams)
      setStudents(result.students)
      setPagination(result.pagination)
    } catch (error) {
      console.error('加载学生数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载和参数变化时重新加载
  useEffect(() => {
    loadStudents()
  }, [queryParams])

  // 一次性读取来自班级页的过滤参数
  useEffect(() => {
    try {
      const initClassName = sessionStorage.getItem('students:init:className')
      if (initClassName) {
        setQueryParams(prev => ({
          ...prev,
          className: initClassName,
          page: 1
        }))
        sessionStorage.removeItem('students:init:className')
      }
    } catch {}
  }, [])

  // 处理搜索
  const handleSearch = (search: string) => {
    setQueryParams(prev => ({
      ...prev,
      search,
      page: 1, // 重置到第一页
    }))
  }

  // 处理筛选
  const handleFilter = (key: keyof StudentQueryParams, value: string) => {
    setQueryParams(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
      page: 1, // 重置到第一页
    }))
  }

  // 处理分页
  const handlePageChange = (page: number) => {
    setQueryParams(prev => ({
      ...prev,
      page,
    }))
  }

  // 处理每页数量变化
  const handlePageSizeChange = (pageSize: number) => {
    setQueryParams(prev => ({
      ...prev,
      pageSize,
      page: 1, // 重置到第一页
    }))
    setPagination(prev => ({
      ...prev,
      pageSize,
    }))
  }

  // 处理表格高度变化
  const handleTableHeightChange = (height: number) => {
    setTableHeight(height)
  }

  // 处理刷新
  const handleRefresh = () => {
    loadStudents()
  }

  // 处理查看详情：先用列表数据打开，再拉取详情回填
  const handleViewDetail = async (student: StudentDetailView) => {
    setSelectedStudent(student)
    setIsModalOpen(true)
    try {
      const detail = await studentService.getStudent(student.id)
      if (detail) setSelectedStudent(detail)
    } catch (e) {
      // 保持已打开的最小信息
      console.warn('获取学生详情失败', e)
    }
  }

  // 处理编辑学生
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<StudentDetailView | null>(null)
  const handleEditStudent = async (student: StudentDetailView) => {
    // 先打开弹窗，立即显示已有基础信息
    setEditing(student)
    setEditOpen(true)
    try {
      const detail = await studentService.getStudent(student.id)
      if (detail) {
        setEditing(detail)
      }
    } catch (e) {
      console.warn('获取学生详情失败', e)
    }
  }

  // 处理删除学生
  const handleDeleteStudent = async (student: StudentDetailView) => {
    setToDeleteIds([student.id])
    setToDeleteNames([`${student.name}（${student.studentId}）`])
    setConfirmOpen(true)
  }

  // 处理新增学生
  const [addOpen, setAddOpen] = useState(false)
  const handleAddStudent = () => setAddOpen(true)

  // 处理导入
  const handleImport = () => setImportOpen(true)

  // 处理导出
  const handleExport = async () => setExportOpen(true)

  // 处理批量操作
  const handleBatchOperations = () => setBulkOpen(true)

  const handleBulkDelete = () => {
    if (students.length === 0) return
    // 简化：删除当前页所有学生
    const ids = students.map(s => s.id)
    setToDeleteIds(ids)
    setToDeleteNames(students.map(s => `${s.name}（${s.studentId}）`))
    setConfirmOpen(true)
  }

  return (
    <div className="space-y-6">

      {/* 操作栏 + 筛选栏 */}
      <div className="flex items-center justify-between">
        {/* 左侧操作按钮 */}
        <div className="flex items-center gap-3">
          <Button onClick={handleAddStudent}>
            <Plus className="w-4 h-4 mr-2" />
            新增学生
          </Button>
          <Button variant="outline" onClick={handleImport}>
            <Upload className="w-4 h-4 mr-2" />
            导入
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button variant="outline" onClick={handleBatchOperations}>
            <Settings className="w-4 h-4 mr-2" />
            批量操作
          </Button>
          <Button variant="outline" onClick={handleBulkDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            批量删除
          </Button>
          
          {/* 分隔线 */}
          <div className="h-6 w-px bg-border mx-2" />
          
          {/* 紧凑版表格设置 */}
          <CompactTableSettings
            pageSize={pagination.pageSize}
            onPageSizeChange={handlePageSizeChange}
            tableHeight={tableHeight}
            onTableHeightChange={handleTableHeightChange}
            onRefresh={handleRefresh}
            refreshing={loading}
          />
        </div>

        {/* 右侧搜索筛选 */}
        <div className="flex items-center gap-3 flex-wrap">
          <Input 
            placeholder="搜索姓名或学号..." 
            className="w-64"
            icon={<Search className="w-4 h-4" />}
            value={queryParams.search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Select 
            placeholder="年级" 
            value={queryParams.grade || ''}
            onValueChange={(value) => handleFilter('grade', value)}
            className="w-32"
          >
            <SelectItem value="">全部年级</SelectItem>
            <SelectItem value="一年级">一年级</SelectItem>
            <SelectItem value="二年级">二年级</SelectItem>
            <SelectItem value="三年级">三年级</SelectItem>
            <SelectItem value="四年级">四年级</SelectItem>
            <SelectItem value="五年级">五年级</SelectItem>
            <SelectItem value="六年级">六年级</SelectItem>
          </Select>
          <Select 
            placeholder="班级" 
            value={queryParams.className || ''}
            onValueChange={(value) => handleFilter('className', value)}
            className="w-36"
          >
            <SelectItem value="">全部班级</SelectItem>
            <SelectItem value="一年级1班">一年级1班</SelectItem>
            <SelectItem value="一年级2班">一年级2班</SelectItem>
            <SelectItem value="二年级1班">二年级1班</SelectItem>
            <SelectItem value="二年级2班">二年级2班</SelectItem>
          </Select>
          <Select 
            placeholder="状态" 
            value={queryParams.status || ''}
            onValueChange={(value) => handleFilter('status', value)}
            className="w-32"
          >
            <SelectItem value="">全部状态</SelectItem>
            <SelectItem value="在校">在校</SelectItem>
            <SelectItem value="请假">请假</SelectItem>
            <SelectItem value="转学">转学</SelectItem>
            <SelectItem value="休学">休学</SelectItem>
            <SelectItem value="毕业">毕业</SelectItem>
          </Select>
          
          {/* 显示已转出学生复选框 */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300"
              checked={queryParams.includeTransferred}
              onChange={(e) => {
                setQueryParams({ ...queryParams, includeTransferred: e.target.checked, page: 1 })
              }}
            />
            <span>显示已转出学生</span>
          </label>
        </div>
      </div>

      {/* 学生表格 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">加载数据中...</span>
          </div>
        </div>
      ) : (
        <SimpleVirtualStudentTable 
          students={students}
          onEdit={handleEditStudent}
          onDelete={handleDeleteStudent}
          onViewDetail={handleViewDetail}
          height={tableHeight}
          canEdit={true}
          canDelete={true}
        />
      )}

      {/* 分页组件 */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        totalItems={pagination.total}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        showInfo={true}
        showPageSizeSelector={false} // 因为在上面的设置中已经有了
      />

      {/* 学生详情弹窗 */}
      <StudentDetailModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
      />

      {/* 导入学生 */}
      <StudentImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={loadStudents}
      />

      {/* 导出学生 */}
      <StudentExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        params={{
          search: queryParams.search,
          grade: queryParams.grade,
          className: queryParams.className,
          status: queryParams.status as any
        }}
      />

      {/* 新增学生 */}
      <StudentFormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (values) => {
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
              status: values.status,
              classId: values.classId,
            })
            setAddOpen(false)
            loadStudents()
          } catch (e: any) {
            alert(e?.response?.data?.error?.message || '创建失败')
          }
        }}
      />

      {/* 编辑学生 */}
      <StudentFormModal
        isOpen={editOpen}
        title="编辑学生"
        defaultValues={editing ? {
          name: editing.name,
          studentId: editing.studentId,
          gender: editing.gender,
          status: editing.status,
          birthDate: editing.birthDate,
          idCardNumber: editing.idCardNumber,
          guangzhouStudentId: editing.guangzhouStudentId,
          nationalStudentId: editing.nationalStudentId,
          homeAddress: editing.homeAddress,
        } : undefined}
        initialClassName={editing?.className}
        onClose={() => setEditOpen(false)}
        onSubmit={async (values) => {
          if (!editing) return
          try {
            await studentService.updateStudent(editing.id, {
              studentId: values.studentId,
              name: values.name,
              gender: values.gender,
              birthDate: values.birthDate,
              idCardNumber: values.idCardNumber,
              guangzhouStudentId: values.guangzhouStudentId,
              nationalStudentId: values.nationalStudentId,
              homeAddress: values.homeAddress,
              status: values.status,
              classId: values.classId || undefined,
            })
            setEditOpen(false)
            setEditing(null)
            loadStudents()
          } catch (e: any) {
            alert(e?.response?.data?.error?.message || '更新失败')
          }
        }}
      />

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title={toDeleteIds.length > 1 ? "批量删除学生" : "删除学生"}
        description={
          toDeleteIds.length > 1
            ? `确定要删除当前 ${toDeleteIds.length} 名学生吗？该操作不可撤销。`
            : toDeleteNames[0]
              ? `确定要删除学生「${toDeleteNames[0]}」吗？该操作不可撤销。`
              : undefined
        }
        confirmText={toDeleteIds.length > 1 ? "批量删除" : "删除"}
        cancelText="取消"
        danger
        onCancel={() => { setConfirmOpen(false); setToDeleteIds([]); setToDeleteNames([]) }}
        onConfirm={async () => {
          try {
            if (toDeleteIds.length === 1) {
              await studentService.deleteStudent(toDeleteIds[0])
            } else if (toDeleteIds.length > 1) {
              await studentService.bulkDelete(toDeleteIds)
            }
            setConfirmOpen(false)
            setToDeleteIds([])
            setToDeleteNames([])
            loadStudents()
          } catch (e) {
            alert('删除失败，请重试')
          }
        }}
      />

      {/* 批量状态更新 */}
      <StudentBulkActionModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onUpdated={loadStudents}
        ids={students.map(s => s.id)}
      />
    </div>
  )
}
