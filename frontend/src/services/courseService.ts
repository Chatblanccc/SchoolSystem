import axios from "axios"
import type { CourseOfferingItem, CourseQueryParams, PaginatedCourseOfferings } from "@/types/course"

function mapDtoToOffering(dto: any): CourseOfferingItem {
  return {
    id: String(dto.id),
    courseCode: dto.courseCode ?? dto.course_code ?? dto.code ?? '',
    courseName: dto.courseName ?? dto.course_name ?? dto.name ?? '',
    category: dto.category,
    weeklyHours: dto.weeklyHours ?? dto.weekly_hours ?? dto.periods,
    fullScore: dto.full_score ?? dto.fullScore ?? null,
    teacherId: dto.teacherId ?? dto.teacher_id,
    teacherName: dto.teacherName ?? dto.teacher_name,
    grade: dto.grade ?? dto.grade_name,
    className: dto.className ?? dto.class_name,
    status: (dto.status === '启用' ? '开放' : dto.status === '停用' ? '关闭' : dto.status) ?? '开放',
    enrolledCount: dto.enrolledCount ?? dto.enrolled_count ?? 0,
    createdAt: dto.createdAt ?? dto.created_at,
    updatedAt: dto.updatedAt ?? dto.updated_at ?? (dto.createdAt ?? dto.created_at),
  }
}

export const courseService = {
  async getCourseOfferings(params: CourseQueryParams = {}): Promise<PaginatedCourseOfferings> {
    const { page = 1, pageSize = 20, search = '', grade = '', className = '', teacherId = '', status } = params
    const mappedStatusParam = status === '开放' ? '启用' : status === '关闭' || status === '结课' ? '停用' : status
    const { data } = await axios.get("/api/v1/courses/", {
      params: {
        page,
        page_size: pageSize,
        search: search || undefined,
        grade: grade || undefined,
        className: className || undefined,
        teacher_id: teacherId || undefined,
        status: mappedStatusParam || undefined,
      }
    })

    const payload = data?.data ?? data
    const results = payload?.results ?? []
    const pagination = payload?.pagination ?? {}

    return {
      courseOfferings: results.map(mapDtoToOffering),
      pagination: {
        page: pagination.page ?? page,
        pageSize: pagination.page_size ?? pageSize,
        total: pagination.total_count ?? 0,
        totalPages: pagination.total_pages ?? 0,
      }
    }
  },

  async getCourseOffering(id: string): Promise<CourseOfferingItem | null> {
    const { data } = await axios.get(`/api/v1/courses/${id}/`)
    const payload = data?.data ?? data
    return payload ? mapDtoToOffering(payload) : null
  },

  async createCourseOffering(input: {
    courseCode: string
    courseName: string
    category?: string
    weeklyHours?: number
    fullScore?: number | null
    status?: string
    remark?: string
    teacherId?: string
    classId?: string
    teacherName?: string
    className?: string
  }): Promise<CourseOfferingItem> {
    const mappedStatus = input.status === '开放' ? '启用' : input.status === '关闭' || input.status === '结课' ? '停用' : input.status
    const payload: any = {
      code: input.courseCode,
      name: input.courseName,
      category: input.category ?? '必修',
      weekly_hours: input.weeklyHours ?? 1,
      full_score: input.fullScore ?? undefined,
      status: mappedStatus ?? '启用',
      description: input.remark || '',
    }
    // 仅在有值时传递，避免空字符串触发后端 UUID/blank 校验
    if (input.teacherId) payload.teacher_id = input.teacherId
    if (input.classId) payload.class_id = input.classId
    if (input.teacherName) payload.teacher_name_input = input.teacherName
    if (input.className) payload.class_name_input = input.className
    try {
      const { data } = await axios.post('/api/v1/courses/', payload)
      const body = data?.data ?? data
      return mapDtoToOffering(body)
    } catch (err: any) {
      console.error('createCourseOffering error', err?.response?.data || err)
      throw err
    }
  },

  async exportCourseOfferings(params: { search?: string; grade?: string; className?: string; teacherId?: string; status?: string; weekday?: number | string }) {
    const q = new URLSearchParams()
    if (params.search) q.set('search', params.search)
    if (params.grade) q.set('grade', params.grade)
    if (params.className) q.set('className', params.className)
    if (params.teacherId) q.set('teacher_id', params.teacherId)
    if (params.status) q.set('status', params.status)
    if (params.weekday !== undefined && params.weekday !== null && String(params.weekday) !== '') q.set('weekday', String(params.weekday))
    const url = `/api/v1/courses/export/?${q.toString()}`
    const res = await fetch(url)
    if (!res.ok) {
      try {
        const err = await res.json()
        throw new Error(err?.error?.message || '导出失败')
      } catch {
        throw new Error('导出失败')
      }
    }
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = `course_offerings_${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  },

  async updateCourseOffering(id: string, input: {
    courseCode?: string
    courseName?: string
    category?: string
    weeklyHours?: number
    fullScore?: number | null
    status?: string
    remark?: string
    teacherId?: string
    classId?: string
    teacherName?: string
    className?: string
  }): Promise<CourseOfferingItem> {
    const mappedStatus = input.status === '开放' ? '启用' : input.status === '关闭' || input.status === '结课' ? '停用' : input.status
    const payload: any = {
      ...(input.courseCode !== undefined ? { code: input.courseCode } : {}),
      ...(input.courseName !== undefined ? { name: input.courseName } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.weeklyHours !== undefined ? { weekly_hours: input.weeklyHours } : {}),
      ...(input.fullScore !== undefined ? { full_score: input.fullScore } : {}),
      ...(input.status !== undefined ? { status: mappedStatus } : {}),
      ...(input.remark !== undefined ? { description: input.remark || '' } : {}),
    }
    if (input.teacherId) payload.teacher_id = input.teacherId
    if (input.classId) payload.class_id = input.classId
    if (input.teacherName) payload.teacher_name_input = input.teacherName
    if (input.className) payload.class_name_input = input.className
    const { data } = await axios.patch(`/api/v1/courses/${id}/`, payload)
    const body = data?.data ?? data
    return mapDtoToOffering(body)
  },

  async deleteCourseOffering(id: string): Promise<void> {
    await axios.delete(`/api/v1/courses/${id}/`)
  }
}


