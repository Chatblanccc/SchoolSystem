import axios from 'axios'
import type { TimetableQuery, TimetableResponse, LessonItem } from '@/types/timetable'

function normalizeLessons(payload: any): LessonItem[] {
  const list = payload?.lessons ?? payload ?? []
  const toHHmm = (v: any): string | undefined => {
    if (v == null) return undefined
    const s = String(v).trim()
    const m = s.match(/^(\d{1,2}):(\d{2})$/)
    if (!m) return undefined
    const hh = String(m[1]).padStart(2, '0')
    const mm = m[2]
    return `${hh}:${mm}`
  }
  return list
    .map((l: any): LessonItem => {
      const start = toHHmm(l.start_time ?? l.startTime)
      const end = toHHmm(l.end_time ?? l.endTime)
      const startPeriod = l.start_period ?? l.startPeriod
      const endPeriod = l.end_period ?? l.endPeriod
      const fallbackStart = start ?? (startPeriod != null ? `P${startPeriod}` : '')
      return {
        id: String(l.id ?? `${l.term}-${l.day_of_week ?? l.dayOfWeek}-${fallbackStart}-${l.course_name ?? l.courseName ?? ''}`),
        term: l.term,
        dayOfWeek: l.day_of_week ?? l.dayOfWeek,
        startTime: (start ?? ''),
        endTime: (end ?? ''),
        startPeriod,
        endPeriod,
        courseId: l.course_id ?? l.courseId,
        courseName: l.course_name ?? l.courseName,
        teacherId: l.teacher_id ?? l.teacherId,
        teacherName: l.teacher_name ?? l.teacherName,
        classId: l.class_id ?? l.classId,
        className: l.class_name ?? l.className,
        roomId: l.room_id ?? l.roomId,
        roomName: l.room_name ?? l.roomName,
        weeks: l.weeks,
        weekType: l.week_type ?? l.weekType,
        color: l.color,
        remark: l.remark,
      }
    })
}

export const timetableService = {
  async getTimetable(params: TimetableQuery): Promise<LessonItem[]> {
    const { view, term, week, classId, teacherId, roomId } = params
    const base = `/api/v1/timetable/${view === 'class' ? 'classes' : view === 'teacher' ? 'teachers' : 'rooms'}/`
    const id = view === 'class' ? classId : view === 'teacher' ? teacherId : roomId
    const { data } = await axios.get(`${base}${id ?? ''}`, { params: { term, week } })
    const body: TimetableResponse['data'] = (data?.data ?? data)
    return normalizeLessons(body)
  },

  async getSchoolTimetable(params: { term: string; week: number }): Promise<LessonItem[]> {
    const { term, week } = params
    const { data } = await axios.get(`/api/v1/timetable/school/`, { params: { term, week } })
    const body: TimetableResponse['data'] = (data?.data ?? data)
    return normalizeLessons(body)
  },

  async importTimetable(file: File, options: { term: string; mode?: 'append' | 'overwrite' }) {
    const form = new FormData()
    form.append('file', file)
    form.append('term', options.term)
    if (options.mode) form.append('mode', options.mode)
    const { data } = await axios.post('/api/v1/timetable/import/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async exportTimetable(params: { term: string; view: 'class'|'teacher'|'room'; week?: number; id?: string }) {
    const { term, view, week, id } = params
    const url = `/api/v1/timetable/export/?term=${encodeURIComponent(term)}&view=${view}${week ? `&week=${week}`: ''}${id ? `&id=${id}`: ''}`
    const res = await axios.get(url, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')
    link.download = `课程表_${term}_${view}_${ts}.csv`
    document.body.appendChild(link)
    link.click()
    URL.revokeObjectURL(link.href)
    link.remove()
  }
}


