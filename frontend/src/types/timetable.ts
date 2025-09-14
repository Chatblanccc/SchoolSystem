export type TimetableView = 'class' | 'teacher' | 'room'
export type TimetableMode = 'time' | 'period'

export interface WeekOption {
  value: number
  label: string
}

export interface TimetableQuery {
  term: string
  week: number
  view: TimetableView
  classId?: string
  teacherId?: string
  roomId?: string
}

export interface LessonItem {
  id: string
  term: string
  dayOfWeek: number // 1-7
  startTime: string // HH:mm
  endTime: string   // HH:mm
  startPeriod?: number
  endPeriod?: number
  courseId?: string
  courseName: string
  teacherId?: string
  teacherName?: string
  classId?: string
  className?: string
  roomId?: string
  roomName?: string
  weeks?: number[]
  weekType?: 'odd' | 'even' | 'all'
  color?: string
  remark?: string
}

export interface TimetableResponse {
  success?: boolean
  data: {
    lessons: LessonItem[]
  }
}

// K12 常用节次定义（可来自后端配置，前端也保留一份默认）
export interface PeriodSlot {
  no: number
  label: string // 如 第1节
  startTime: string // HH:mm
  endTime: string   // HH:mm
  isBreak?: boolean
}



