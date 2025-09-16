import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectItem } from '@/components/ui/select'
import { teacherService } from '@/services/teacherService'
import { classService } from '@/services/classService'

interface TimetableCreateModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTerm: string
  defaultView: 'class'|'teacher'|'room'
  defaultTargetId?: string
  onCreated?: () => Promise<void> | void
}

const SUBJECTS = ['语文','数学','英语','道法','历史','物理','化学','地理','生物','音乐','美术','心理','科学'] as const

export function TimetableCreateModal({ isOpen, onClose, defaultTerm, defaultView, defaultTargetId, onCreated }: TimetableCreateModalProps) {
  const [term, setTerm] = useState(defaultTerm)
  const [dayOfWeek, setDayOfWeek] = useState<number>(1)
  const [period, setPeriod] = useState<number>(1)
  const [subject, setSubject] = useState<string>(SUBJECTS[0])
  const [teacherId, setTeacherId] = useState<string>('')
  const [classId, setClassId] = useState<string>('')
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    ;(async () => {
      setLoadingOptions(true)
      try {
        const [{ teachers }, { classes }] = await Promise.all([
          teacherService.getTeachers({ page: 1, pageSize: 200 }),
          classService.getClasses({ page: 1, pageSize: 200 }),
        ])
        if (!cancelled) {
          setTeachers(teachers.map(t => ({ id: t.id, name: t.name })))
          setClasses(classes.map(c => ({ id: c.id, name: c.name })))
          // 依据视图上下文预选
          const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          if (defaultView === 'class' && defaultTargetId && UUID_RE.test(defaultTargetId)) setClassId(defaultTargetId)
          if (defaultView === 'teacher' && defaultTargetId && UUID_RE.test(defaultTargetId)) setTeacherId(defaultTargetId)
        }
      } catch (e) {
        console.warn('加载教师/班级失败', e)
      } finally {
        if (!cancelled) setLoadingOptions(false)
      }
    })()
    return () => { cancelled = true }
  }, [isOpen, defaultView, defaultTargetId])

  if (!isOpen) return null

  const submit = async () => {
    if (!subject || !teacherId || !classId) return
    setSubmitting(true)
    try {
      const { timetableService } = await import('@/services/timetableService')
      await timetableService.createLesson({
        term,
        dayOfWeek,
        startPeriod: period,
        endPeriod: period,
        courseName: subject,
        teacherId,
        classId,
      })
      await onCreated?.()
      onClose()
    } catch (e) {
      console.error('create lesson failed', e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative w-full max-w-3xl mx-4 bg-background rounded-lg shadow-lg overflow-visible">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">新增课程</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8">关闭</Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">学期</div>
              <Select placeholder="学期" value={term} onValueChange={setTerm} className="w-full">
                <SelectItem value="2024-2025-1">2024-2025-1</SelectItem>
                <SelectItem value="2024-2025-2">2024-2025-2</SelectItem>
              </Select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">星期</div>
              <Select placeholder="星期" value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))} className="w-full">
                {[1,2,3,4,5].map(d => (
                  <SelectItem key={d} value={String(d)}>星期{['一','二','三','四','五'][d-1]}</SelectItem>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">节次</div>
              <Select placeholder="选择节次" value={String(period)} onValueChange={(v) => setPeriod(Number(v))} className="w-full">
                {Array.from({ length: 9 }).map((_, i) => (
                  <SelectItem key={i+1} value={String(i+1)}>第{i+1}节</SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">课程名称</div>
              <Select placeholder="选择课程" value={subject} onValueChange={setSubject} className="w-full">
                {SUBJECTS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">教师</div>
              <Select placeholder="选择教师" value={teacherId} onValueChange={setTeacherId} className="w-full">
                {loadingOptions ? null : teachers.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">班级</div>
              <Select placeholder="选择班级" value={classId} onValueChange={setClassId} className="w-full">
                {loadingOptions ? null : classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button onClick={submit} disabled={submitting || !subject || !teacherId || !classId}>{submitting ? '提交中...' : '保存'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}


