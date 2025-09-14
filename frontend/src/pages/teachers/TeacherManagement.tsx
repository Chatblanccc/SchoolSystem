import { useEffect, useState } from 'react'
import { Search, Plus, Upload, Download, Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SimpleVirtualTeacherTable } from '@/components/shared/SimpleVirtualTeacherTable'
import { teacherService } from '@/services/teacherService'
import type { TeacherItem } from '@/types/teacher'
import { TeacherFormModal } from '@/components/shared/TeacherFormModal'
import { AssignTeacherToClassModal } from '@/components/shared/AssignTeacherToClassModal'
import { classService } from '@/services/classService'
import { TeacherImportModal } from '@/components/shared/TeacherImportModal'
import { TeacherExportModal } from '@/components/shared/TeacherExportModal'
import { TeacherBulkActionModal } from '@/components/shared/TeacherBulkActionModal'
import { TeacherDetailModal } from '@/components/shared/TeacherDetailModal'

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [tableHeight, setTableHeight] = useState(500)
  const [addOpen, setAddOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<TeacherItem | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState<TeacherItem | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<TeacherItem | null>(null)

  const loadTeachers = async () => {
    try {
      setLoading(true)
      const res = await teacherService.getTeachers({ page: 1, pageSize: 20, search })
      setTeachers(res.teachers)
    } catch (e) {
      console.error('加载教师失败', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeachers()
  }, [search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新增教师
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            导入
          </Button>
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            批量操作
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Input placeholder="搜索姓名/工号/手机号" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" icon={<Search className="w-4 h-4" />} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">加载数据中...</span>
          </div>
        </div>
      ) : (
        <SimpleVirtualTeacherTable 
          teachers={teachers} 
          height={tableHeight} 
          onAssignAsHeadTeacher={(t) => { setAssignTarget(t); setAssignOpen(true) }}
          onEdit={(t) => { setEditTarget(t); setEditOpen(true) }}
          onViewDetail={async (t) => {
            setDetailOpen(true)
            setDetailTarget(t)
            try {
              const full = await teacherService.getTeacher(t.id)
              if (full) setDetailTarget(full)
            } catch {}
          }}
          onSelectionChange={setSelectedIds}
        />
      )}

      {/* 新增教师弹窗 */}
      <TeacherFormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (values) => {
          try {
            await teacherService.createTeacher({
              teacherId: values.teacherId,
              name: values.name,
              gender: values.gender,
              phone: values.phone,
              email: values.email,
              idCard: values.idCard,
              employmentStatus: values.employmentStatus,
              employmentType: values.employmentType,
              remark: values.remark,
            })
            setAddOpen(false)
            loadTeachers()
          } catch (e) {
            alert('创建失败，请检查表单信息或稍后重试')
          }
        }}
      />

      {/* 将教师设为某班班主任 */}
      <AssignTeacherToClassModal
        isOpen={assignOpen}
        teacherName={assignTarget?.name || ''}
        onClose={() => { setAssignOpen(false); setAssignTarget(null) }}
        onConfirm={async (classId) => {
          if (!assignTarget || !classId) { setAssignOpen(false); setAssignTarget(null); return }
          try {
            await classService.assignHeadTeacher(classId, assignTarget.id)
            setAssignOpen(false)
            setAssignTarget(null)
            // 可选：如果当前有班级页面，也可触发其刷新；这里仅提示教师侧完成
            alert('已设置为班主任')
          } catch (e) {
            alert('设置失败，请稍后重试')
          }
        }}
      />

      {/* 导入 */}
      <TeacherImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => loadTeachers()}
      />

      {/* 导出 */}
      <TeacherExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        params={{ search }}
      />

      {/* 批量操作 */}
      <TeacherBulkActionModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        selectedIds={selectedIds}
        onUpdated={() => loadTeachers()}
      />

      {/* 详情弹窗 */}
      <TeacherDetailModal
        isOpen={detailOpen}
        teacher={detailTarget}
        onClose={() => { setDetailOpen(false); setDetailTarget(null) }}
        onEdit={(t) => { setDetailOpen(false); setEditTarget(t); setEditOpen(true) }}
        onDelete={() => alert('删除教师（可后续补充）')}
      />

      {/* 编辑教师弹窗 */}
      <TeacherFormModal
        isOpen={editOpen}
        title="编辑教师"
        defaultValues={editTarget ? {
          teacherId: editTarget.teacherId,
          name: editTarget.name,
          gender: editTarget.gender,
          phone: editTarget.phone,
          email: (editTarget as any).email || '',
          idCard: (editTarget as any).idCard || (editTarget as any).id_card || '',
          employmentStatus: editTarget.employmentStatus,
          employmentType: editTarget.employmentType,
          remark: editTarget.remark || '',
        } : undefined}
        onClose={() => { setEditOpen(false); setEditTarget(null) }}
        onSubmit={async (values) => {
          if (!editTarget) return
          try {
            await teacherService.updateTeacher(editTarget.id, {
              teacherId: values.teacherId,
              name: values.name,
              gender: values.gender,
              phone: values.phone,
              email: values.email || '',
              idCard: values.idCard,
              employmentStatus: values.employmentStatus,
              employmentType: values.employmentType,
              remark: values.remark || '',
            })
            setEditOpen(false)
            setEditTarget(null)
            await loadTeachers()
          } catch (e) {
            alert('更新失败，请检查表单信息或稍后重试')
          }
        }}
      />
    </div>
  )
}


