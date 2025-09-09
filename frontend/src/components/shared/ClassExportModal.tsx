import React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ClassExportModalProps {
  isOpen: boolean
  onClose: () => void
  params: { search?: string; grade?: string; status?: string }
}

export function ClassExportModal({ isOpen, onClose, params }: ClassExportModalProps) {
  if (!isOpen) return null

  const handleExport = async () => {
    const q = new URLSearchParams()
    if (params.search) q.set("search", params.search)
    if (params.grade) q.set("grade", params.grade)
    if (params.status) q.set("status", String(params.status))
    const url = `/api/v1/classes/export/?${q.toString()}`

    try {
      const res = await fetch(url)
      if (!res.ok) {
        // 尝试读取错误信息
        try {
          const err = await res.json()
          alert(err?.error?.message || "导出失败")
        } catch {
          alert("导出失败")
        }
        return
      }
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = objectUrl
      a.download = `classes_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
      onClose()
    } catch (e) {
      alert("导出失败，请稍后重试")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative w-full max-w-md mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">导出班级</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="text-muted-foreground">将按当前筛选条件导出 CSV 文件。</div>
          <div>搜索关键词：{params.search || "—"}</div>
          <div>年级：{params.grade || "全部"}</div>
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


