import React, { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectItem } from "@/components/ui/select"
import type { StudentStatus } from "@/types/student"
import { studentService } from "@/services/studentService"

interface StudentBulkActionModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
  ids?: string[]
}

export function StudentBulkActionModal({ isOpen, onClose, onUpdated, ids }: StudentBulkActionModalProps) {
  const [status, setStatus] = useState<StudentStatus>("在校")
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const submit = async () => {
    try {
      setSubmitting(true)
      await studentService.bulkUpdateStatus(ids, status)
      onUpdated()
      onClose()
    } catch (e) {
      alert('批量操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative w-full max-w-md mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">批量更新学生状态</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-sm text-muted-foreground">对当前已选择或当前页学生批量更新状态</div>
          <div>
            <div className="text-sm mb-1">设置为</div>
            <Select value={status} onValueChange={(v) => setStatus(v as StudentStatus)} className="w-full">
              <SelectItem value="在校">在校</SelectItem>
              <SelectItem value="请假">请假</SelectItem>
              <SelectItem value="转学">转学</SelectItem>
              <SelectItem value="休学">休学</SelectItem>
              <SelectItem value="毕业">毕业</SelectItem>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? '处理中...' : '确认更新'}</Button>
        </div>
      </div>
    </div>
  )
}


