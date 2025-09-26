import React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { studentService } from "@/services/studentService"

interface StudentExportModalProps {
  isOpen: boolean
  onClose: () => void
  params: { search?: string; grade?: string; className?: string; status?: string }
}

export function StudentExportModal({ isOpen, onClose, params }: StudentExportModalProps) {
  if (!isOpen) return null

  const handleExport = async () => {
    try {
      await studentService.exportStudents(params)
      onClose()
    } catch (e: any) {
      alert(e?.message || '导出失败')
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative w-full max-w-md mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">导出学生</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="text-muted-foreground">将按当前筛选条件导出 CSV 文件。</div>
          <div>搜索关键词：{params.search || "—"}</div>
          <div>年级：{params.grade || "全部"}</div>
          <div>班级：{params.className || "全部"}</div>
          <div>状态：{params.status || "全部"}</div>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleExport}>开始导出</Button>
        </div>
      </div>
    </div>
  )
}


