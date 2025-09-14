import { useMemo } from 'react'
import type { LessonItem, TimetableMode, PeriodSlot } from '@/types/timetable'
import { timeToMinutes, getEffectiveTimes, computeTimeLayout } from '@/lib/timetable'
import { cn } from '@/lib/utils'

interface TimetableGridProps {
  lessons: LessonItem[]
  height?: number
  showNowIndicator?: boolean
  mode?: TimetableMode // time | period
  showWeekend?: boolean
  periodSlots?: PeriodSlot[]
}

const days = ['一','二','三','四','五','六','日']

// 计算课程块位置与高度（委托工具函数）
function computeLayout(lessons: LessonItem[], slots?: PeriodSlot[]) {
  return computeTimeLayout(lessons, slots)
}

export function TimetableGrid({ lessons, height = 560, showNowIndicator = true, mode = 'period', showWeekend = false, periodSlots }: TimetableGridProps) {
  // period 模式默认节次
  const defaultSlots: PeriodSlot[] = (periodSlots && periodSlots.length > 0) ? periodSlots : [
    { no: 1, label: '第1节', startTime: '08:00', endTime: '08:45' },
    { no: 2, label: '第2节', startTime: '08:55', endTime: '09:40' },
    { no: 3, label: '第3节', startTime: '10:00', endTime: '10:45' },
    { no: 4, label: '第4节', startTime: '10:55', endTime: '11:40' },
    { no: 5, label: '第5节', startTime: '11:50', endTime: '12:35' },
    { no: 0, label: '午休', startTime: '12:35', endTime: '14:00', isBreak: true },
    { no: 6, label: '第6节', startTime: '14:00', endTime: '14:45' },
    { no: 7, label: '第7节', startTime: '14:55', endTime: '15:40' },
    { no: 8, label: '第8节', startTime: '16:00', endTime: '16:45' },
    { no: 9, label: '第9节', startTime: '16:55', endTime: '17:40' },
    { no: 10, label: '晚自习', startTime: '19:00', endTime: '20:30' },
  ]

  const laidOut = useMemo(() => computeLayout(lessons, defaultSlots), [lessons, defaultSlots])

  // 生成每小时刻度
  const hours = useMemo(() => Array.from({ length: 15 }).map((_, i) => {
    const h = 7 + i
    const label = `${String(h).padStart(2,'0')}:00`
    const top = (i / 14) * 100
    return { label, top }
  }), [])

  // 当前时间红线
  const nowTop = useMemo(() => {
    const t = new Date()
    const minutes = t.getHours() * 60 + t.getMinutes()
    const start = 7 * 60 + 30
    const end = 21 * 60 + 30
    if (minutes < start || minutes > end) return null
    const ratio = (minutes - start) / (end - start)
    return ratio * 100
  }, [])

  const dayCount = showWeekend ? 7 : 5

  return (
    <div className="w-full overflow-auto border rounded-lg bg-card" style={{ height }}>
      <div className="min-w-[900px] grid" style={{ gridTemplateColumns: `120px repeat(${dayCount}, 1fr)` }}>
        {/* 表头 */}
        <div className="sticky top-0 z-10 bg-card border-b px-3 py-2 text-center text-sm text-muted-foreground">时间</div>
        {days.slice(0, dayCount).map((d, idx) => (
          <div key={idx} className={cn('sticky top-0 z-10 bg-card border-b px-3 py-2 text-center font-medium', idx === new Date().getDay() - 1 && 'text-primary')}>
            周{d}
          </div>
        ))}

        {mode === 'time' && (
          <>
            {/* 时间轴列（time 模式） */}
            <div className="relative border-r" style={{ height: height - 41 }}>
              {hours.map((h, i) => (
                <div key={i} className="absolute left-0 right-0 text-xs text-muted-foreground" style={{ top: `calc(${h.top}% - 8px)` }}>
                  <div className="px-2">{h.label}</div>
                  <div className="h-px bg-border mt-1" />
                </div>
              ))}
            </div>

            {/* 天列 */}
            {Array.from({ length: dayCount }).map((_, dayIdx) => (
              <div key={dayIdx} className="relative border-r" style={{ height: height - 41 }}>
                {hours.map((h, i) => (
                  <div key={i} className="absolute left-0 right-0" style={{ top: `calc(${h.top}% - 0.5px)` }}>
                    <div className="h-px bg-border/60" />
                  </div>
                ))}
                {laidOut.filter(l => l.dayOfWeek === dayIdx + 1).map(l => {
                  const cluster = l.__clusterSize || 1
                  const lane = l.__lane || 0
                  const leftPercent = (lane / cluster) * 100
                  const widthPercent = (1 / cluster) * 100
                  return (
                    <div
                      key={l.id}
                      className="absolute rounded-md shadow-sm border text-xs p-2 cursor-default select-none overflow-hidden"
                      style={{ top: `calc(${l.top}% + 2px)`, height: `calc(${l.height}% - 4px)`, left: `calc(${leftPercent}% + 2px)`, width: `calc(${widthPercent}% - 4px)`, backgroundColor: l.color || 'hsl(var(--primary) / 0.12)', borderColor: 'hsl(var(--primary) / 0.3)'}}
                      title={`${l.courseName}\n${l.teacherName ?? ''} @ ${l.roomName ?? ''}\n${l.startTime}-${l.endTime}`}
                    >
                      <div className="font-medium truncate">{l.courseName}</div>
                      <div className="truncate text-muted-foreground">{l.teacherName || '-'} {l.roomName ? `@ ${l.roomName}` : ''}</div>
                      <div className="truncate text-muted-foreground">{l.startTime}-{l.endTime}</div>
                    </div>
                  )
                })}
              </div>
            ))}
          </>
        )}

        {mode === 'period' && (
          <>
            {/* 节次列（period 模式） */}
            <div className="relative border-r" style={{ height: height - 41 }}>
              {defaultSlots.map((s) => (
                <div key={s.no + s.label} className={cn("flex items-center justify-between px-2 border-b last:border-b-0", s.isBreak && "bg-muted/30")}
                  style={{ height: `calc(${(height - 41) / defaultSlots.length}px)` }}>
                  <div className={cn("text-xs", s.isBreak ? "text-foreground" : "text-muted-foreground")}>{s.label}</div>
                  <div className={cn("text-[10px]", s.isBreak ? "text-foreground" : "text-muted-foreground")}>{s.startTime}-{s.endTime}</div>
                </div>
              ))}
            </div>

            {Array.from({ length: dayCount }).map((_, dayIdx) => (
              <div key={dayIdx} className="relative border-r" style={{ height: height - 41 }}>
                {/* 行栅格线 */}
                {defaultSlots.map((s) => (
                  <div key={s.no + s.label} className={cn("border-b last:border-b-0", s.isBreak && "bg-muted/30")} style={{ height: `calc(${(height - 41) / defaultSlots.length}px)` }} />
                ))}

                {/* 课程块：对齐到节次行（以时间映射到节次范围） */}
                {laidOut.filter(l => l.dayOfWeek === dayIdx + 1).map(l => {
                  // 先按时间映射；失败则按节次定位
                  const startMin = timeToMinutes(l.startTime)
                  const endMin = timeToMinutes(l.endTime)
                  let sp = !Number.isNaN(startMin) ? defaultSlots.findIndex(s => startMin < timeToMinutes(s.endTime)) : -1
                  let ep = !Number.isNaN(endMin) ? defaultSlots.findIndex(s => endMin <= timeToMinutes(s.endTime)) : -1
                  if (sp === -1 && typeof l.startPeriod === 'number') sp = defaultSlots.findIndex(s => s.no === l.startPeriod)
                  if (ep === -1 && typeof l.endPeriod === 'number') ep = defaultSlots.findIndex(s => s.no === l.endPeriod)
                  if (sp === -1 && ep !== -1) sp = ep
                  if (sp === -1) sp = 0
                  if (ep === -1) ep = sp
                  const rows = Math.max(ep - sp + 1, 1)
                  const rowHeight = (height - 41) / defaultSlots.length
                  const topPx = sp * rowHeight + 2
                  const blockHeight = rows * rowHeight - 4
                  const cluster = l.__clusterSize || 1
                  const lane = l.__lane || 0
                  const leftPercent = (lane / cluster) * 100
                  const widthPercent = (1 / cluster) * 100
                  return (
                    <div
                      key={l.id}
                      className="absolute rounded-md shadow-sm border text-xs p-2 cursor-default select-none overflow-hidden"
                      style={{ top: `${topPx}px`, height: `${blockHeight}px`, left: `calc(${leftPercent}% + 2px)`, width: `calc(${widthPercent}% - 4px)`, backgroundColor: l.color || 'hsl(var(--primary) / 0.12)', borderColor: 'hsl(var(--primary) / 0.3)'}}
                      title={`${l.courseName}\n${l.teacherName ?? ''} @ ${l.roomName ?? ''}\n${l.startTime}-${l.endTime}`}
                    >
                      <div className="font-medium truncate">{l.courseName}</div>
                      <div className="truncate text-muted-foreground">{l.teacherName || '-'} {l.roomName ? `@ ${l.roomName}` : ''}</div>
                      <div className="truncate text-muted-foreground">第{sp+1}-{sp+rows}节</div>
                    </div>
                  )
                })}
              </div>
            ))}
          </>
        )}
      </div>

      {/* 当前时间红线 */}
      {showNowIndicator && nowTop !== null && (
        <div className="pointer-events-none" style={{ position: 'relative', height: 0 }}>
          <div className="absolute left-[120px] right-0" style={{ top: `calc(${nowTop}% + 41px)` }}>
            <div className="h-0.5 bg-red-500" />
          </div>
        </div>
      )}
    </div>
  )
}


