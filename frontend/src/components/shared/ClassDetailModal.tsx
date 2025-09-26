import React from "react"
import { X, Users as UsersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ClassItem, ClassStatus } from "@/types/class"

interface ClassDetailModalProps {
  classItem: ClassItem | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (classItem: ClassItem) => void
  onDelete?: (classItem: ClassItem) => void
  onViewStudents?: (classItem: ClassItem) => void
}

function getStatusVariant(status: ClassStatus): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" {
  switch (status) {
    case '在读':
      return 'success'
    case '已结班':
      return 'secondary'
    case '归档':
      return 'outline'
    default:
      return 'default'
  }
}

export function ClassDetailModal({
  classItem,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onViewStudents
}: ClassDetailModalProps) {
  if (!isOpen || !classItem) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleEdit = () => {
    onEdit?.(classItem)
    onClose()
  }

  const handleDelete = () => {
    if (window.confirm(`确定要删除班级 ${classItem.name} 吗？`)) {
      onDelete?.(classItem)
      onClose()
    }
  }

  const handleViewStudents = () => {
    onViewStudents?.(classItem)
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{classItem.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>编码：{classItem.code}</span>
              <span>•</span>
              <span>年级：{classItem.grade}</span>
              <span>•</span>
              <Badge variant={getStatusVariant(classItem.status)} className="text-xs">{classItem.status}</Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleViewStudents}>
              <UsersIcon className="w-4 h-4 mr-2" />
              查看学生
            </Button>
            <Button variant="outline" size="sm" onClick={handleEdit}>编辑</Button>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleDelete}>删除</Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">基础信息</div>
              <div className="space-y-2 text-sm">
                <div>班级名称：<span className="font-medium">{classItem.name}</span></div>
                <div>年级：<span className="font-medium">{classItem.grade}</span></div>
                <div>编码：<span className="font-mono">{classItem.code}</span></div>
                <div>状态：<Badge variant={getStatusVariant(classItem.status)} className="text-xs align-middle">{classItem.status}</Badge></div>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">人员与规模</div>
              <div className="space-y-2 text-sm">
                <div>班主任：<span className="font-medium">{classItem.headTeacherName || '-'}</span></div>
                <div>容量：<span className="font-medium">{classItem.capacity}</span></div>
                <div>当前人数：<span className="font-medium">{classItem.studentCount}</span></div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">备注</div>
            <div className="text-sm whitespace-pre-wrap min-h-10">{classItem.remark || '—'}</div>
          </div>
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/50 text-sm text-muted-foreground">
          <div>
            创建时间：{new Date(classItem.createdAt).toLocaleString('zh-CN')}
            {classItem.updatedAt !== classItem.createdAt && (
              <>
                <span className="mx-2">•</span>
                更新时间：{new Date(classItem.updatedAt).toLocaleString('zh-CN')}
              </>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  )
}


