import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { TeacherItem } from '@/types/teacher'

interface TeacherDetailModalProps {
  teacher: TeacherItem | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (teacher: TeacherItem) => void
  onDelete?: (teacher: TeacherItem) => void
}

function statusVariant(status: TeacherItem['employmentStatus']): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (status) {
    case '在职':
      return 'success'
    case '试用':
      return 'warning'
    case '停职':
      return 'outline'
    case '离职':
      return 'secondary'
    default:
      return 'default'
  }
}

export function TeacherDetailModal({ teacher, isOpen, onClose, onEdit, onDelete }: TeacherDetailModalProps) {
  if (!isOpen || !teacher) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleEdit = () => { onEdit?.(teacher); onClose() }
  const handleDelete = () => { onDelete?.(teacher); onClose() }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="relative w-full max-w-3xl max-h[90vh] mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{teacher.name}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>工号：{teacher.teacherId}</span>
              <Badge variant={statusVariant(teacher.employmentStatus)} className="text-xs">{teacher.employmentStatus}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>编辑</Button>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleDelete}>删除</Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0"><X className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Info label="姓名" value={teacher.name} />
            <Info label="工号" value={teacher.teacherId} mono />
            <Info label="性别" value={teacher.gender} />
            <Info label="手机号" value={teacher.phone} />
            <Info label="邮箱" value={(teacher as any).email || '-'} />
            <Info label="身份证号" value={(teacher as any).idCard || (teacher as any).id_card || '-'} mono />
            <Info label="用工类型" value={teacher.employmentType} />
            <Info label="在职状态" value={teacher.employmentStatus} />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">备注</div>
            <div className="mt-1 text-sm">{teacher.remark || '—'}</div>
          </div>

          {/* 任课与职务 */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">任课与职务</div>
            {Array.isArray(teacher.assignments) && teacher.assignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {teacher.assignments!.map((a) => (
                  <div key={a.id} className="border rounded-md p-3">
                    <div className="text-sm font-medium flex flex-col gap-0.5">
                      <span>班级：{a.className || '-'}{a.classCode ? `（${a.classCode}）` : ''}</span>
                      <span>班主任：{a.headTeacherName || '-'}</span>
                      <span>课程学段：{a.courseCode ?? '-'}</span>
                      <span>课程名称：{a.courseName ?? '-'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      学科：{a.subject || '-'}，职务：{a.duty || '-'}{a.weeklyHours ? `，周课时：${a.weeklyHours}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">暂无任课记录</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-muted/50">
          <div className="text-sm text-muted-foreground">
            创建时间：{new Date(teacher.createdAt).toLocaleString('zh-CN')}
            {teacher.updatedAt !== teacher.createdAt && (
              <>
                <span className="mx-2">•</span>
                更新时间：{new Date(teacher.updatedAt).toLocaleString('zh-CN')}
              </>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={mono ? 'font-mono text-sm' : 'text-sm'}>{value}</div>
    </div>
  )
}


