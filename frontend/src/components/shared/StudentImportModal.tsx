import React, { useState } from "react"
import { X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { studentService } from "@/services/studentService"

interface StudentImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImported: () => void
}

export function StudentImportModal({ isOpen, onClose, onImported }: StudentImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!file) { alert("请选择 CSV 文件"); return }
    try {
      setSubmitting(true)
      const result = await studentService.importStudents(file)
      const errors = (result as any)?.errors || (result as any)?.details
      if (Array.isArray(errors) && errors.length > 0) {
        const first = errors[0]
        const message = first?.message ? `第 ${first.row || '-'} 行：${first.message}` : "部分数据导入失败"
        alert(message)
        return
      }
      onImported()
      onClose()
    } catch (e: any) {
      const responseData = e?.response?.data
      const details = responseData?.error?.details
      if (Array.isArray(details) && details.length > 0) {
        const lines = details.slice(0, 5).map((item: any) => `第 ${item.row || '-'} 行：${item.message || '未知错误'}`)
        const more = details.length > 5 ? `\n... 还有 ${details.length - 5} 条错误` : ''
        alert(`导入失败：\n${lines.join('\n')}${more}`)
      } else {
        alert(responseData?.error?.message || "导入失败，请检查文件格式")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const downloadTemplate = () => {
    // 中文表头模板：与后端导入映射兼容
    const headers = [
      // 学号,姓名,性别,班级,状态,身份证号,市学籍号,国学籍号,出生日期,家庭住址
      "学号,姓名,性别,班级,状态,身份证号,市学籍号,国学籍号,出生日期,家庭住址"
    ]
    const blob = new Blob([headers.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "学生导入模板.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative w-full max-w-xl mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">导入学生</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-sm text-muted-foreground">请选择 CSV 文件，建议使用中文表头，示例：学号、姓名、性别（男/女）、班级（如 一年级1班）、状态（在校/请假/转学/休学/毕业）、身份证号、市学籍号、国学籍号、出生日期（YYYY-MM-DD）、家庭住址</div>
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" /> 下载模板
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>取消</Button>
              <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "导入中..." : "开始导入"}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


