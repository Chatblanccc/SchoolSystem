import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { teacherService } from '@/services/teacherService'

interface TeacherExportModalProps {
  isOpen: boolean
  onClose: () => void
  params?: {
    search?: string
    employmentStatus?: '在职' | '试用' | '停职' | '离职'
    employmentType?: '全职' | '兼职' | '外聘'
  }
}

export function TeacherExportModal({ isOpen, onClose, params }: TeacherExportModalProps) {
  const [submitting, setSubmitting] = useState(false)
  if (!isOpen) return null

  const submit = async () => {
    try {
      setSubmitting(true)
      const blob = await teacherService.exportTeachers(params)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `教师导出_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      onClose()
    } catch (e) {
      alert('导出失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative w-full max-w-md mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">导出教师</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-5 text-sm text-muted-foreground">
          将按当前筛选条件导出教师数据为 CSV 文件。
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? '导出中...' : '开始导出'}</Button>
        </div>
      </div>
    </div>
  )
}


