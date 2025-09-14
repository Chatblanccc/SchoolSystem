import { useEffect, useState } from "react"
import { Plus, Upload, Download, Settings, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectItem } from "@/components/ui/select"
import { Pagination } from "@/components/shared/Pagination"
import { CompactTableSettings } from "@/components/shared/CompactTableSettings"
import { SimpleVirtualClassTable } from "@/components/shared/SimpleVirtualClassTable"
import { ClassDetailModal } from "@/components/shared/ClassDetailModal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { ClassFormModal } from "@/components/shared/ClassFormModal"
import { ClassImportModal } from "@/components/shared/ClassImportModal"
import { ClassExportModal } from "@/components/shared/ClassExportModal"
import { ClassBulkActionModal } from "@/components/shared/ClassBulkActionModal"
import { classService } from "@/services/classService"
import { AssignHeadTeacherModal } from "@/components/shared/AssignHeadTeacherModal"
import type { ClassItem, ClassQueryParams, PaginatedClasses } from "@/types/class"
import { useTabStore } from "@/stores/tabStore"

export default function ClassManagement() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })
  const [tableHeight, setTableHeight] = useState(500)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<ClassItem | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<ClassItem | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<ClassItem | null>(null)

  const [queryParams, setQueryParams] = useState<ClassQueryParams>({
    page: 1,
    pageSize: 20,
    search: '',
    grade: '',
    status: undefined,
    headTeacherId: ''
  })

  const { addTab } = useTabStore()

  const loadClasses = async () => {
    try {
      setLoading(true)
      const result: PaginatedClasses = await classService.getClasses(queryParams)
      setClasses(result.classes)
      setPagination(result.pagination)
    } catch (error) {
      console.error('加载班级数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClasses()
  }, [queryParams])

  const handleSearch = (search: string) => {
    setQueryParams(prev => ({ ...prev, search, page: 1 }))
  }

  const handleFilter = (key: keyof ClassQueryParams, value: string) => {
    setQueryParams(prev => ({ ...prev, [key]: value === '' ? undefined : value, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setQueryParams(prev => ({ ...prev, page }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setQueryParams(prev => ({ ...prev, pageSize, page: 1 }))
    setPagination(prev => ({ ...prev, pageSize }))
  }

  const handleTableHeightChange = (height: number) => setTableHeight(height)
  const handleRefresh = () => loadClasses()

  const handleViewDetail = (classItem: ClassItem) => {
    setSelectedClass(classItem)
    setIsModalOpen(true)
  }

  const handleEdit = (classItem: ClassItem) => {
    setEditing(classItem)
    setEditOpen(true)
  }

  const handleDelete = (classItem: ClassItem) => {
    setToDelete(classItem)
    setConfirmOpen(true)
  }

  const handleAssignHeadTeacher = (classItem: ClassItem) => {
    setAssignTarget(classItem)
    setAssignOpen(true)
  }

  const handleAdd = () => setAddOpen(true)

  const handleImport = () => setImportOpen(true)

  const handleExport = () => setExportOpen(true)

  const handleBatchOperations = () => setBulkOpen(true)

  // 跳转学生页并设置一次性过滤
  const handleViewStudents = (classItem: ClassItem) => {
    try {
      sessionStorage.setItem('students:init:className', classItem.name)
    } catch {}
    addTab({ id: 'students', title: '学生管理', page: 'students', closable: true })
  }

  return (
    <div className="space-y-6">
      {/* 操作栏 + 筛选栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            新增班级
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
          <div className="h-6 w-px bg-border mx-2" />
          <CompactTableSettings
            pageSize={pagination.pageSize}
            onPageSizeChange={handlePageSizeChange}
            tableHeight={tableHeight}
            onTableHeightChange={handleTableHeightChange}
            onRefresh={handleRefresh}
            refreshing={loading}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Input
            placeholder="搜索名称/编码/班主任..."
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
            <SelectItem value="七年级">七年级</SelectItem>
            <SelectItem value="八年级">八年级</SelectItem>
            <SelectItem value="九年级">九年级</SelectItem>
          </Select>
          <Select
            placeholder="状态"
            value={queryParams.status || ''}
            onValueChange={(value) => handleFilter('status', value)}
            className="w-32"
          >
            <SelectItem value="">全部状态</SelectItem>
            <SelectItem value="在读">在读</SelectItem>
            <SelectItem value="已结班">已结班</SelectItem>
            <SelectItem value="归档">归档</SelectItem>
          </Select>
        </div>
      </div>

      {/* 表格 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">加载数据中...</span>
          </div>
        </div>
      ) : (
        <SimpleVirtualClassTable
          classes={classes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetail={handleViewDetail}
          onViewStudents={handleViewStudents}
          onAssignHeadTeacher={handleAssignHeadTeacher}
          height={tableHeight}
          canEdit={true}
          canDelete={true}
        />
      )}

      {/* 分页 */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        totalItems={pagination.total}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        showInfo={true}
        showPageSizeSelector={false}
      />

      {/* 详情弹窗 */}
      <ClassDetailModal
        classItem={selectedClass}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewStudents={handleViewStudents}
      />

      {/* 新增班级弹窗 */}
      <ClassFormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (values) => {
          try {
            await classService.createClass({
              name: values.name,
              code: values.code,
              grade: values.grade,
              headTeacherName: values.headTeacherName,
              capacity: values.capacity,
              status: values.status,
              remark: values.remark,
            })
            setAddOpen(false)
            loadClasses()
          } catch (e) {
            alert('创建失败，请重试')
          }
        }}
      />

      {/* 编辑班级弹窗 */}
      <ClassFormModal
        isOpen={editOpen}
        title="编辑班级"
        defaultValues={editing ? {
          name: editing.name,
          code: editing.code,
          grade: editing.grade,
          headTeacherName: editing.headTeacherName,
          capacity: editing.capacity,
          status: editing.status,
          remark: editing.remark,
        } : undefined}
        onClose={() => { setEditOpen(false); setEditing(null) }}
        onSubmit={async (values) => {
          if (!editing) return
          try {
            await classService.updateClass(editing.id, {
              name: values.name,
              code: values.code,
              grade: values.grade,
              headTeacherName: values.headTeacherName,
              capacity: values.capacity,
              status: values.status,
              remark: values.remark,
            })
            setEditOpen(false)
            setEditing(null)
            loadClasses()
          } catch (e) {
            alert('更新失败，请重试')
          }
        }}
      />

      {/* 导入弹窗 */}
      <ClassImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => loadClasses()}
      />

      {/* 导出弹窗 */}
      <ClassExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        params={{
          search: queryParams.search,
          grade: queryParams.grade,
          status: queryParams.status as any,
        }}
      />

      {/* 批量操作弹窗 */}
      <ClassBulkActionModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onUpdated={() => loadClasses()}
      />

      {/* 通用删除确认 */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="删除班级"
        description={toDelete ? `确定要删除班级「${toDelete.name}」吗？该操作不可撤销。` : ''}
        confirmText="删除"
        cancelText="取消"
        danger
        onCancel={() => { setConfirmOpen(false); setToDelete(null) }}
        onConfirm={async () => {
          if (!toDelete) return
          try {
            await classService.deleteClass(toDelete.id)
            setConfirmOpen(false)
            setToDelete(null)
            loadClasses()
          } catch (error) {
            console.error('删除班级失败:', error)
            alert('删除失败，请重试')
          }
        }}
      />

      {/* 分配班主任 */}
      <AssignHeadTeacherModal
        isOpen={assignOpen}
        classNameText={assignTarget?.name || ''}
        onClose={() => { setAssignOpen(false); setAssignTarget(null) }}
        onConfirm={async (teacherId) => {
          if (!assignTarget) return
          try {
            await classService.assignHeadTeacher(assignTarget.id, teacherId)
            setAssignOpen(false)
            setAssignTarget(null)
            loadClasses()
          } catch (e) {
            console.error('分配班主任失败', e)
            alert('分配失败，请重试')
          }
        }}
      />
    </div>
  )
}


