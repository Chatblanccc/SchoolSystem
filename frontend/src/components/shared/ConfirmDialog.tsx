import React from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  danger?: boolean
}

export function ConfirmDialog({
  isOpen,
  title = "确认操作",
  description,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onCancel()
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleBackdrop}>
      <div className="relative w-full max-w-md mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        {description && (
          <div className="p-5 text-sm text-muted-foreground">
            {description}
          </div>
        )}
        <div className="flex items-center justify-end gap-2 p-5 border-t">
          <Button variant="outline" onClick={onCancel}>{cancelText}</Button>
          <Button variant={danger ? "destructive" : "default"} onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  )
}


