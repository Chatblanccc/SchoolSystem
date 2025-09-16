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
  async getMyTimetable(params: { term: string; week: number }): Promise<LessonItem[]> {
    const { term, week } = params
    const { data } = await axios.get(`/api/v1/timetable/me/`, { params: { term, week } })
    const body: TimetableResponse['data'] = (data?.data ?? data)
    return normalizeLessons(body)
  },
  async getTimetable(params: TimetableQuery): Promise<LessonItem[]> {
    const { view, term, week, classId, teacherId, roomId } = params
    const base = `/api/v1/timetable/${view === 'class' ? 'classes' : view === 'teacher' ? 'teachers' : 'rooms'}/`
    const id = view === 'class' ? classId : view === 'teacher' ? teacherId : roomId

    // 非法或占位 ID（如 demo-class-1）时，回退到全校课表以避免 404
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!id || !UUID_RE.test(String(id))) {
      const { data } = await axios.get(`/api/v1/timetable/school/`, { params: { term, week } })
      const body: TimetableResponse['data'] = (data?.data ?? data)
      return normalizeLessons(body)
    }

    // 正常以 UUID 访问具体视图，并补齐尾部斜杠
    const { data } = await axios.get(`${base}${id}/`, { params: { term, week } })
    const body: TimetableResponse['data'] = (data?.data ?? data)
    return normalizeLessons(body)
  },

  async getSchoolTimetable(params: { term: string; week: number }): Promise<LessonItem[]> {
    const { term, week } = params
    const { data } = await axios.get(`/api/v1/timetable/school/`, { params: { term, week } })
    const body: TimetableResponse['data'] = (data?.data ?? data)
    return normalizeLessons(body)
  },

  // 更新单条课次
  async updateLesson(id: string, input: Partial<LessonItem>) {
    const payload: any = {
      term: input.term,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      startPeriod: input.startPeriod,
      endPeriod: input.endPeriod,
      weekType: input.weekType,
      weeks: Array.isArray(input.weeks) ? input.weeks : input.weeks,
      courseId: input.courseId,
      courseName: input.courseName,
      teacherId: input.teacherId,
      teacherName: input.teacherName,
      classId: input.classId,
      className: input.className,
      roomId: input.roomId,
      roomName: input.roomName,
      remark: input.remark,
    }
    const { data } = await axios.patch(`/api/v1/timetable/lessons/${id}/update/`, payload)
    return data?.data ?? data
  },

  async createLesson(input: Partial<LessonItem> & { term: string; dayOfWeek: number; courseName: string }) {
    // 兼容后端统一响应包装
    const payload: any = {
      term: input.term,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime || undefined,
      endTime: input.endTime || undefined,
      startPeriod: input.startPeriod || undefined,
      endPeriod: input.endPeriod || undefined,
      weekType: input.weekType || 'all',
      weeks: Array.isArray(input.weeks) ? input.weeks : input.weeks,
      courseId: input.courseId,
      courseName: input.courseName,
      teacherId: input.teacherId,
      teacherName: input.teacherName,
      classId: input.classId,
      className: input.className,
      roomId: input.roomId,
      roomName: input.roomName,
      remark: input.remark,
    }
    const { data } = await axios.post('/api/v1/timetable/lessons/', payload)
    return data?.data ?? data
  },

  // 删除单条课次
  async deleteLesson(id: string) {
    const { data } = await axios.delete(`/api/v1/timetable/lessons/${id}/delete/`)
    return data?.data ?? data
  }
}


