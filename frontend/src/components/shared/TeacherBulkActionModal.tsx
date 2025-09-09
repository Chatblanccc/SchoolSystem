import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectItem } from '@/components/ui/select'
import { teacherService } from '@/services/teacherService'

interface TeacherBulkActionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedIds?: Set<string>
  onUpdated: () => void
}

export function TeacherBulkActionModal({ isOpen, onClose, selectedIds, onUpdated }: TeacherBulkActionModalProps) {
  const [status, setStatus] = useState<'在职' | '试用' | '停职' | '离职'>('在职')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const submit = async () => {
    try {
      setSubmitting(true)
      const ids = selectedIds && selectedIds.size > 0 ? Array.from(selectedIds) : undefined
      await teacherService.bulkUpdateStatus({ ids, employment_status: status })
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
          <h3 className="text-lg font-semibold">批量更新在职状态</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-sm text-muted-foreground">将对{selectedIds && selectedIds.size ? `已选择的 ${selectedIds.size} 名教师` : '当前筛选结果'}进行更新</div>
          <div>
            <div className="text-sm mb-1">设置为</div>
            <Select value={status} onValueChange={(v) => setStatus(v as any)} className="w-full">
              <SelectItem value="在职">在职</SelectItem>
              <SelectItem value="试用">试用</SelectItem>
              <SelectItem value="停职">停职</SelectItem>
              <SelectItem value="离职">离职</SelectItem>
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


