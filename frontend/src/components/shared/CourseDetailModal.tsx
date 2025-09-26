import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { CourseOfferingItem, CourseOfferingStatus } from '@/types/course'

interface CourseDetailModalProps {
  course: CourseOfferingItem | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (course: CourseOfferingItem) => void
  onDelete?: (course: CourseOfferingItem) => void
}

function statusVariant(status: CourseOfferingStatus): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (status) {
    case '开放':
      return 'success'
    case '关闭':
      return 'secondary'
    case '结课':
      return 'outline'
    default:
      return 'default'
  }
}

export function CourseDetailModal({ course, isOpen, onClose, onEdit, onDelete }: CourseDetailModalProps) {
  if (!isOpen || !course) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleEdit = () => { onEdit?.(course); onClose() }
  const handleDelete = () => { onDelete?.(course); onClose() }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="relative w-full max-w-3xl max-h[90vh] mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{course.courseName}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>学段：{course.courseCode || '-'}</span>
              <Badge variant={statusVariant(course.status)} className="text-xs">{course.status}</Badge>
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
            <Info label="课程名称" value={course.courseName} />
            <Info label="课程学段" value={course.courseCode || '-'} />
            <Info label="课程类型" value={course.category || '-'} />
            <Info label="周课时" value={String(course.weeklyHours ?? '-') } />
            <Info label="分值" value={course.fullScore != null ? String(course.fullScore) : '-'} />
            <Info label="授课老师" value={course.teacherName || '-'} />
            <Info label="班级" value={course.className || '-'} />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">备注</div>
            <div className="mt-1 text-sm">—</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-muted/50">
          <div className="text-sm text-muted-foreground">
            创建时间：{course.createdAt ? new Date(course.createdAt).toLocaleString('zh-CN') : '-'}
            {course.updatedAt && course.updatedAt !== course.createdAt && (
              <>
                <span className="mx-2">•</span>
                更新时间：{new Date(course.updatedAt).toLocaleString('zh-CN')}
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


