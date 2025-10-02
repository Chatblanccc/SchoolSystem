import { useState } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { teacherService } from '@/services/teacherService'

interface TeacherImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImported: () => void
}

export function TeacherImportModal({ isOpen, onClose, onImported }: TeacherImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const submit = async () => {
    try {
      setSubmitting(true)
      if (!file) { alert('请先选择 CSV 文件'); return }
      await teacherService.importTeachersByFile(file)
      onImported()
      onClose()
    } catch (e) {
      alert('导入失败，请检查内容或稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const downloadTemplate = () => {
    const sample = 'teacher_id,name,gender,phone,email,id_card,employment_type,employment_status,remark\nT001,张三,男,13800000000,,4401************,全职,在职,'
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '教师导入模板.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative w-full max-w-2xl mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">导入教师</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-sm text-muted-foreground">请选择 CSV 文件，建议使用中文表头，示例：工号、姓名、性别（男/女）、手机号、邮箱、身份证号、用工类型（全职/兼职/外聘）、在职状态（在职/试用/停职/离职）、备注</div>
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="flex items-center justify-between">
            <Button variant="outline" type="button" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" /> 下载模板
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>取消</Button>
              <Button onClick={submit} disabled={submitting || !file}>{submitting ? '导入中...' : '开始导入'}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


