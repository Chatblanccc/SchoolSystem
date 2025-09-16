import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectItem } from '@/components/ui/select'
import type { LessonItem, PeriodSlot } from '@/types/timetable'
import { timetableService } from '@/services/timetableService'
import { teacherService } from '@/services/teacherService'
import { classService } from '@/services/classService'

interface TimetableEditModalProps {
  isOpen: boolean
  onClose: () => void
  lesson: LessonItem | null
  periodSlots?: PeriodSlot[]
  onSaved?: (updated: LessonItem) => void
}

export function TimetableEditModal({ isOpen, onClose, lesson, periodSlots, onSaved }: TimetableEditModalProps) {
  const [term, setTerm] = useState(lesson?.term || '')
  const [dayOfWeek, setDayOfWeek] = useState<number>(lesson?.dayOfWeek || 1)
  const [startPeriod, setStartPeriod] = useState<number | undefined>(lesson?.startPeriod)
  const [endPeriod, setEndPeriod] = useState<number | undefined>(lesson?.endPeriod ?? lesson?.startPeriod)
  const [courseName, setCourseName] = useState<string>(lesson?.courseName || '')
  const [teacherId, setTeacherId] = useState<string | undefined>(lesson?.teacherId)
  const [classId, setClassId] = useState<string | undefined>(lesson?.classId)
  const [roomName, setRoomName] = useState<string | undefined>(lesson?.roomName)
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    ;(async () => {
      try {
        const [{ teachers }, { classes }] = await Promise.all([
          teacherService.getTeachers({ page: 1, pageSize: 200 }),
          classService.getClasses({ page: 1, pageSize: 200 }),
        ])
        if (!cancelled) {
          setTeachers(teachers.map(t => ({ id: t.id, name: t.name })))
          setClasses(classes.map(c => ({ id: c.id, name: c.name })))
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [isOpen])

  useEffect(() => {
    setTerm(lesson?.term || '')
    setDayOfWeek(lesson?.dayOfWeek || 1)
    setStartPeriod(lesson?.startPeriod)
    setEndPeriod(lesson?.endPeriod ?? lesson?.startPeriod)
    setCourseName(lesson?.courseName || '')
    setTeacherId(lesson?.teacherId)
    setClassId(lesson?.classId)
    setRoomName(lesson?.roomName)
  }, [lesson])

  const periodOptions = useMemo(() => {
    const slots = periodSlots?.filter(s => !s.isBreak) || Array.from({ length: 9 }).map((_, i) => ({ no: i + 1, label: `第${i + 1}节` }))
    return slots
  }, [periodSlots])

  if (!isOpen || !lesson) return null

  const submit = async () => {
    if (!lesson) return
    setSubmitting(true)
    try {
      const payload: Partial<LessonItem> = {
        term,
        dayOfWeek,
        startPeriod,
        endPeriod: endPeriod ?? startPeriod,
        courseName,
        teacherId,
        classId,
        roomName,
      }
      const updated = await timetableService.updateLesson(lesson.id, payload)
      onSaved?.(updated)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative w-full max-w-3xl mx-4 bg-background rounded-lg shadow-lg overflow-visible">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">编辑课程</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8">关闭</Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">学期</div>
              <Select value={term} onValueChange={setTerm} className="w-full">
                <SelectItem value="2024-2025-1">2024-2025-1</SelectItem>
                <SelectItem value="2024-2025-2">2024-2025-2</SelectItem>
              </Select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">星期</div>
              <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))} className="w-full">
                {[1,2,3,4,5,6,7].map(d => (
                  <SelectItem key={d} value={String(d)}>星期{['一','二','三','四','五','六','日'][d-1]}</SelectItem>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">开始节次</div>
              <Select value={String(startPeriod ?? '')} onValueChange={(v) => setStartPeriod(Number(v))} className="w-full">
                {periodOptions.map(p => (
                  <SelectItem key={p.no} value={String(p.no)}>{p.label}</SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">结束节次</div>
              <Select value={String(endPeriod ?? startPeriod ?? '')} onValueChange={(v) => setEndPeriod(Number(v))} className="w-full">
                {periodOptions.map(p => (
                  <SelectItem key={p.no} value={String(p.no)}>{p.label}</SelectItem>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">课程名称</div>
              <Select value={courseName} onValueChange={setCourseName} className="w-full">
                {[ '语文','数学','英语','道法','历史','物理','化学','地理','生物','音乐','美术','心理','科学' ].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">教师</div>
              <Select value={teacherId || ''} onValueChange={setTeacherId as any} className="w-full">
                {(teachers).map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">班级</div>
              <Select value={classId || ''} onValueChange={setClassId as any} className="w-full">
                {(classes).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">教室（可选）</div>
              <input className="w-full h-10 px-3 rounded-md border bg-background" value={roomName || ''} onChange={(e) => setRoomName(e.target.value)} placeholder="如 教学楼A101" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button onClick={submit} disabled={submitting || !courseName || !startPeriod}>{submitting ? '保存中...' : '保存'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}


