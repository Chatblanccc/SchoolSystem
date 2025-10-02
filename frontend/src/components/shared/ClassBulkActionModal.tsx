import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectItem } from "@/components/ui/select"

interface ClassBulkActionModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

export function ClassBulkActionModal({ isOpen, onClose, onUpdated }: ClassBulkActionModalProps) {
  const [status, setStatus] = useState<string>("在读")
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const submit = async () => {
    try {
      setSubmitting(true)
      await fetch('/api/v1/classes/bulk-update-status/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
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
          <h3 className="text-lg font-semibold">批量操作</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-sm text-muted-foreground">对当前筛选结果批量更新状态</div>
          <div>
            <div className="text-sm mb-1">设置为</div>
            <Select value={status} onValueChange={setStatus} className="w-full">
              <SelectItem value="在读">在读</SelectItem>
              <SelectItem value="已结班">已结班</SelectItem>
              <SelectItem value="归档">归档</SelectItem>
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


