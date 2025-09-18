import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectItem } from '@/components/ui/select'
import { Calendar as CalendarIcon, Users, GraduationCap, MapPin } from 'lucide-react'
import type { TimetableView, WeekOption, TimetableMode } from '@/types/timetable'

interface TimetableToolbarProps {
  term: string
  week: number
  view: TimetableView
  mode?: TimetableMode
  showWeekend?: boolean
  weekOptions?: WeekOption[]
  classId?: string
  teacherId?: string
  roomId?: string
  onTermChange: (term: string) => void
  onWeekChange: (week: number) => void
  onViewChange: (view: TimetableView) => void
  onModeChange?: (mode: TimetableMode) => void
  onWeekendChange?: (show: boolean) => void
  onTargetChange: (id: string) => void
  onCreate?: () => void
}

export function TimetableToolbar(props: TimetableToolbarProps) {
  const {
    term, week, view, mode = 'period', showWeekend = false, weekOptions,
    onTermChange, onWeekChange, onViewChange, onModeChange, onWeekendChange,
    onCreate
  } = props

  const viewOptions = useMemo(() => ([
    { value: 'class', label: '班级视图', icon: Users },
    { value: 'teacher', label: '教师视图', icon: GraduationCap },
    { value: 'room', label: '教室视图', icon: MapPin },
  ] as const), [])

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Select placeholder="学期" value={term} onValueChange={(v) => onTermChange(v)} className="w-40">
          <SelectItem value="2024-2025-1">2024-2025-1</SelectItem>
          <SelectItem value="2024-2025-2">2024-2025-2</SelectItem>
        </Select>
        <Select placeholder="周次" value={String(week)} onValueChange={(v) => onWeekChange(Number(v))} className="w-28">
          {(weekOptions || Array.from({ length: 20 }).map((_, i) => ({ value: i+1, label: `第${i+1}周` }))).map(w => (
            <SelectItem key={w.value} value={String(w.value)}>
              第{w.value}周
            </SelectItem>
          ))}
        </Select>
        <Select placeholder="视图" value={view} onValueChange={(v) => onViewChange(v as TimetableView)} className="w-32">
          {viewOptions.map(({ value, label, icon: Icon }) => (
            <SelectItem key={value} value={value}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </div>
            </SelectItem>
          ))}
        </Select>
        <Select placeholder="模式" value={mode} onValueChange={(v) => onModeChange?.(v as TimetableMode)} className="w-28">
          <SelectItem value="period">按节次</SelectItem>
          <SelectItem value="time">按时间</SelectItem>
        </Select>
        <Select placeholder="周末" value={String(showWeekend)} onValueChange={(v) => onWeekendChange?.(v === 'true')} className="w-28">
          <SelectItem value="false">隐藏周末</SelectItem>
          <SelectItem value="true">显示周末</SelectItem>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        {onCreate && (
          <Button onClick={onCreate}>
            新增课程
          </Button>
        )}
        <Button>
          <CalendarIcon className="w-4 h-4 mr-2" /> 本周
        </Button>
      </div>
    </div>
  )
}


