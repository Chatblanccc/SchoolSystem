import type { LessonItem, PeriodSlot } from '@/types/timetable'

export function timeToMinutes(t?: string | null): number {
  if (typeof t !== 'string') return NaN
  const match = t.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return NaN
  const h = Number(match[1])
  const m = Number(match[2])
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN
  return h * 60 + m
}

export function deriveTimesFromPeriods(l: LessonItem, slots?: PeriodSlot[]): { start?: string; end?: string } {
  if (!slots) return {}
  const findSlotByNo = (no: number | undefined) => typeof no === 'number' ? (slots.find(s => s.no === no && !s.isBreak) || slots.find(s => s.no === no)) : undefined
  const sSlot = findSlotByNo(l.startPeriod)
  const eSlot = findSlotByNo(l.endPeriod)
  const start = sSlot?.startTime
  const end = (eSlot?.endTime || sSlot?.endTime)
  return { start, end }
}

export function getEffectiveTimes(l: LessonItem, slots?: PeriodSlot[]): { start: string; end: string } | null {
  const st = timeToMinutes(l.startTime)
  const et = timeToMinutes(l.endTime)
  if (!Number.isNaN(st) && !Number.isNaN(et)) return { start: l.startTime, end: l.endTime }
  const { start, end } = deriveTimesFromPeriods(l, slots)
  if (start && end && !Number.isNaN(timeToMinutes(start)) && !Number.isNaN(timeToMinutes(end))) {
    return { start, end }
  }
  return null
}

export function computeTimeLayout(lessons: LessonItem[], slots?: PeriodSlot[]) {
  const startBase = timeToMinutes('07:30')
  const endBase = timeToMinutes('21:30')
  const total = endBase - startBase
  const baseLayout = lessons
    .map(l => {
      const eff = getEffectiveTimes(l, slots)
      if (!eff) return null
      const start = timeToMinutes(eff.start)
      const end = timeToMinutes(eff.end)
      const top = ((start - startBase) / total) * 100
      const bottom = ((end - startBase) / total) * 100
      const height = Math.max(bottom - top, 2)
      return { ...l, startTime: eff.start, endTime: eff.end, top, height }
    })
    .filter(Boolean) as Array<LessonItem & { top: number; height: number }>

  const withLanes: Array<any> = []
  for (let day = 1; day <= 7; day++) {
    const dayEvents = baseLayout
      .filter(e => e.dayOfWeek === day)
      .sort((a, b) => (timeToMinutes(a.startTime) - timeToMinutes(b.startTime)))
    let active: Array<{ end: number; lane: number; idx: number }> = []
    let clusterId = 0
    let currentCluster = -1
    const clusters: Record<number, number> = {}

    for (let i = 0; i < dayEvents.length; i++) {
      const ev = dayEvents[i]
      const start = timeToMinutes(ev.startTime)
      const end = timeToMinutes(ev.endTime)

      active = active.filter(a => a.end > start)
      if (active.length === 0) {
        currentCluster += 1
        clusterId = currentCluster
        clusters[clusterId] = 0
      }

      const used = new Set(active.map(a => a.lane))
      let lane = 0
      while (used.has(lane)) lane += 1

      active.push({ end, lane, idx: i })
      clusters[clusterId] = Math.max(clusters[clusterId], lane + 1)
      withLanes.push({ ...ev, __lane: lane, __cluster: clusterId })
    }

    for (const item of withLanes) {
      if (item.dayOfWeek === day) {
        item.__clusterSize = clusters[item.__cluster] || 1
      }
    }
  }
  return withLanes
}
