import { useEffect, useMemo, useState } from 'react'
import { TimetableToolbar } from '@/components/shared/TimetableToolbar'
import { TimetableGrid } from '@/components/shared/TimetableGrid'
import { TimetableEditModal } from '@/components/shared/TimetableEditModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
// 移除导入相关功能
import { TimetableCreateModal } from '@/components/shared/TimetableCreateModal'
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
  const [view] = useState<TimetableView>('class')
  const [mode, setMode] = useState<TimetableMode>('period')
  const [showWeekend, setShowWeekend] = useState(false)
  const [targetId] = useState('')
  const height = 560
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [loading, setLoading] = useState(false)
  // 移除导入状态
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<LessonItem | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const query = useMemo(() => ({ term, week, view, classId: view === 'class' ? targetId : undefined, teacherId: view === 'teacher' ? targetId : undefined, roomId: view === 'room' ? targetId : undefined }), [term, week, view, targetId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        // 简化：总是加载“我的课表”，后端已实现姓名/档案兜底
        const data = await timetableService.getMyTimetable({ term, week })
        if (!cancelled) setLessons(data)
      } catch (e) {
        console.warn('加载课程表失败', e)
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
        onViewChange={() => {}}
        onModeChange={setMode}
        onWeekendChange={setShowWeekend}
        onTargetChange={() => {}}
        // 已移除导入导出
        onCreate={() => setCreateOpen(true)}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">课程表加载中...</span>
          </div>
        </div>
      ) : (
        <TimetableGrid
          lessons={lessons}
          height={height}
          mode={mode}
          showWeekend={showWeekend}
          periodSlots={schoolPeriodSlots}
          onLessonClick={(l) => { setSelectedLesson(l); setEditOpen(true) }}
          onLessonDelete={(l) => { setSelectedLesson(l); setConfirmOpen(true) }}
          onLessonMove={async (id, next) => {
            try {
              await timetableService.updateLesson(id, next as any)
              const data = await timetableService.getMyTimetable({ term, week })
              setLessons(data)
            } catch (e) {
              console.warn('移动课程失败', e)
            }
          }}
        />
      )}

      {/* 已移除导入弹窗 */}

      <TimetableCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultTerm={term}
        defaultView={view}
        defaultTargetId={targetId}
        onCreated={async () => {
          setCreateOpen(false)
          setLoading(true)
          try {
            const data = await timetableService.getMyTimetable({ term, week })
            setLessons(data)
          } finally {
            setLoading(false)
          }
        }}
      />

      <TimetableEditModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        lesson={selectedLesson}
        periodSlots={schoolPeriodSlots}
        onSaved={async () => {
          setEditOpen(false)
          const data = await timetableService.getMyTimetable({ term, week })
          setLessons(data)
        }}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        title="删除课程"
        description={selectedLesson ? `确定要删除「${selectedLesson.courseName}」吗？该操作不可撤销。` : ''}
        confirmText="删除"
        cancelText="取消"
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (!selectedLesson) return
          try {
            await timetableService.deleteLesson(selectedLesson.id)
            const data = await timetableService.getMyTimetable({ term, week })
            setLessons(data)
          } finally {
            setConfirmOpen(false)
          }
        }}
      />
    </div>
  )
}


