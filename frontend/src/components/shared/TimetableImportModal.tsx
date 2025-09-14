import { useState } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectItem } from '@/components/ui/select'
import { timetableService } from '@/services/timetableService'

interface TimetableImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImported: () => void
  defaultTerm?: string
}

export function TimetableImportModal({ isOpen, onClose, onImported, defaultTerm }: TimetableImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [term, setTerm] = useState<string>(defaultTerm || '2024-2025-1')
  const [mode, setMode] = useState<'append' | 'overwrite'>('append')
  const [submitting, setSubmitting] = useState(false)
  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!file) { alert('请选择 CSV 文件'); return }
    if (!term) { alert('请选择学期'); return }
    try {
      setSubmitting(true)
      await timetableService.importTimetable(file, { term, mode })
      onImported()
      onClose()
    } catch (e: any) {
      const err = e?.response?.data
      const msg = err?.error?.message || e?.message || '导入失败，请检查文件格式或编码（支持 UTF-8/GBK）'
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const downloadTemplate = () => {
    // 课程表样式模板（CSV），首列为时间段/节次，后续列为周一至周五；
    // 单元格格式示例：第一行“课程名”，第二行“教师@教室”。
    const header = ['节次/时间','周一','周二','周三','周四','周五']
    const rows: string[][] = []
    const slots = [
      ['08:00-08:40','"语文\n李老师@A101"','','','',''],
      ['08:50-09:30','','','','',''],
      ['大课间 09:30-10:00','','','','',''],
      ['10:00-10:40','','','','',''],
      ['10:50-11:30','','','','',''],
      ['11:40-12:20','','','','',''],
      ['午休 12:20-14:20','','','','',''],
      ['14:20-15:00','','','','',''],
      ['眼保健操 15:00-15:15','','','','',''],
      ['15:15-15:55','','','','',''],
      ['16:10-16:50','','','','',''],
      ['17:05-17:45','','','','',''],
    ]
    for (const slot of slots) {
      rows.push([slot[0], slot[1], slot[2], slot[3], slot[4], slot[5]])
    }
    const csvLines = [header.join(','), ...rows.map(r => r.join(','))]
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '课程表导入模板.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative w-full max-w-xl mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">导入课程表</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0"><X className="w-4 h-4" /></Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">学期</div>
              <Select placeholder="选择学期" value={term} onValueChange={setTerm} className="w-full">
                <SelectItem value="2024-2025-1">2024-2025-1</SelectItem>
                <SelectItem value="2024-2025-2">2024-2025-2</SelectItem>
              </Select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">导入模式</div>
              <Select placeholder="导入模式" value={mode} onValueChange={(v) => setMode(v as 'append' | 'overwrite')} className="w-full">
                <SelectItem value="append">追加（不清空现有数据）</SelectItem>
                <SelectItem value="overwrite">覆盖（清空本学期后导入）</SelectItem>
              </Select>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">请选择 CSV 或 Excel 文件（.csv/.xlsx/.xls）。支持表头同义映射：学期/term、周次/weeks、星期/day、开始时间/start_time、结束时间/end_time、开始节次/start_period、结束节次/end_period、课程名称/course_name、教师名称/teacher_name、班级名称/class_name、教室/room、单双周/week_type(单|双)、备注/remark。可直接上传你们的「模板.xlsx」。</div>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={downloadTemplate}><Download className="w-4 h-4 mr-2" /> 下载模板（CSV）</Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => {
                window.open('/api/v1/timetable/template/?mode=class', '_blank')
              }}>
                <Download className="w-4 h-4 mr-2" /> 下载模板（按班级）
              </Button>
              <Button variant="outline" onClick={() => {
                window.open('/api/v1/timetable/template/?mode=time', '_blank')
              }}>
                <Download className="w-4 h-4 mr-2" /> 下载模板（按时间）
              </Button>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>取消</Button>
              <Button onClick={handleSubmit} disabled={submitting}>{submitting ? '导入中...' : '开始导入'}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


export default TimetableImportModal

