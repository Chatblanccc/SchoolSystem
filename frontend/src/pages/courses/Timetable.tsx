import { useEffect, useMemo, useState } from 'react'
import { TimetableToolbar } from '@/components/shared/TimetableToolbar'
import { TimetableGrid } from '@/components/shared/TimetableGrid'
import { TimetableImportModal } from '@/components/shared/TimetableImportModal'
import { timetableService } from '@/services/timetableService'
import type { LessonItem, TimetableView, TimetableMode, PeriodSlot } from '@/types/timetable'

export default function Timetable() {
  const schoolPeriodSlots: PeriodSlot[] = [
    { no: 1, label: '第1节', startTime: '08:00', endTime: '08:40' },
    { no: 2, label: '第2节', startTime: '08:50', endTime: '09:30' },
    { no: 0, label: '大课间', startTime: '09:30', endTime: '10:00', isBreak: true },
    { no: 3, label: '第3节', startTime: '10:00', endTime: '10:40' },
    { no: 4, label: '第4节', startTime: '10:50', endTime: '11:30' },
    { no: 5, label: '第5节', startTime: '11:40', endTime: '12:20' },
    { no: 0, label: '午休', startTime: '12:20', endTime: '14:20', isBreak: true },
    { no: 6, label: '第6节', startTime: '14:20', endTime: '15:00' },
    { no: 7, label: '眼保健操', startTime: '15:00', endTime: '15:15'},
    { no: 8, label: '第7节', startTime: '15:15', endTime: '15:55' },
    { no: 9, label: '第8节', startTime: '16:10', endTime: '16:50' },
    { no: 10, label: '第9节', startTime: '17:05', endTime: '17:45' },
  ]
  const [term, setTerm] = useState('2024-2025-1')
  const [week, setWeek] = useState<number>(1)
  const [view, setView] = useState<TimetableView>('class')
  const [mode, setMode] = useState<TimetableMode>('period')
  const [showWeekend, setShowWeekend] = useState(false)
  const [targetId, setTargetId] = useState('')
  const height = 560
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [loading, setLoading] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const query = useMemo(() => ({ term, week, view, classId: view === 'class' ? targetId : undefined, teacherId: view === 'teacher' ? targetId : undefined, roomId: view === 'room' ? targetId : undefined }), [term, week, view, targetId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        // 课表数据
        const data = targetId
          ? await timetableService.getTimetable(query)
          : await timetableService.getSchoolTimetable({ term, week })
        if (!cancelled) setLessons(data)
      } catch (e) {
        console.warn('加载课程表失败，使用示例数据回退', e)
        if (!cancelled) {
          const demo: LessonItem[] = [
            { id: 'd1', term, dayOfWeek: 1, startTime: '08:00', endTime: '09:40', courseName: '语文', teacherName: '李老师', className: '一年级1班', roomName: 'A101' },
            { id: 'd2', term, dayOfWeek: 1, startTime: '10:00', endTime: '11:40', courseName: '数学', teacherName: '王老师', className: '一年级1班', roomName: 'A101' },
            { id: 'd3', term, dayOfWeek: 2, startTime: '14:00', endTime: '15:40', courseName: '英语', teacherName: '周老师', className: '一年级1班', roomName: 'A101' },
            { id: 'd4', term, dayOfWeek: 3, startTime: '08:00', endTime: '09:40', courseName: '体育', teacherName: '张老师', className: '一年级1班', roomName: '操场' },
          ]
          setLessons(demo)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [query, targetId, term])

  // 保留原始实现，无需学校矩阵视图

  return (
    <div className="space-y-4">
      <TimetableToolbar
        term={term}
        week={week}
        view={view}
        mode={mode}
        showWeekend={showWeekend}
        onTermChange={setTerm}
        onWeekChange={setWeek}
        onViewChange={(v) => { setView(v); setTargetId('') }}
        onModeChange={setMode}
        onWeekendChange={setShowWeekend}
        onTargetChange={setTargetId}
        onImport={() => setImportOpen(true)}
        onExport={() => timetableService.exportTimetable({ term, view, week, id: targetId })}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">课程表加载中...</span>
          </div>
        </div>
      ) : (
        <TimetableGrid lessons={lessons} height={height} mode={mode} showWeekend={showWeekend} periodSlots={schoolPeriodSlots} />
      )}

      <TimetableImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          setImportOpen(false)
          ;(async () => {
            setLoading(true)
            try {
              const data = targetId
                ? await timetableService.getTimetable({ term, week, view, classId: view === 'class' ? targetId : undefined, teacherId: view === 'teacher' ? targetId : undefined, roomId: view === 'room' ? targetId : undefined })
                : await timetableService.getSchoolTimetable({ term, week })
              setLessons(data)
            } finally {
              setLoading(false)
            }
          })()
        }}
        defaultTerm={term}
      />
    </div>
  )
}


