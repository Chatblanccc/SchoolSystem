import React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StudentDetailCard } from "./StudentDetailCard"
import type { StudentDetailView, StudentStatus } from "@/types/student"

interface StudentDetailModalProps {
  student: StudentDetailView | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (student: StudentDetailView) => void
  onDelete?: (student: StudentDetailView) => void
}

// 获取状态对应的 Badge 样式
function getStatusVariant(status: StudentStatus): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" {
  switch (status) {
    case '在校':
      return 'success'
    case '请假':
      return 'warning'
    case '转学':
      return 'info'
    case '休学':
      return 'secondary'
    case '毕业':
      return 'outline'
    default:
      return 'default'
  }
}

export function StudentDetailModal({ 
  student, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete 
}: StudentDetailModalProps) {
  if (!isOpen || !student) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleEdit = () => {
    onEdit?.(student)
    onClose()
  }

  const handleDelete = () => {
    onDelete?.(student)
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-2xl font-bold">{student.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-muted-foreground">学号：{student.studentId}</span>
                <Badge variant={getStatusVariant(student.status)} className="text-xs">
                  {student.status}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleEdit}
            >
              编辑
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={handleDelete}
            >
              删除
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 内容 */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <StudentDetailCard student={student} />
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/50">
          <div className="text-sm text-muted-foreground">
            创建时间：{new Date(student.createdAt).toLocaleString('zh-CN')}
            {student.updatedAt !== student.createdAt && (
              <>
                <span className="mx-2">•</span>
                更新时间：{new Date(student.updatedAt).toLocaleString('zh-CN')}
              </>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </div>
  )
}
