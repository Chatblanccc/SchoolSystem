import axios from 'axios'
import type { TeacherItem, TeacherQueryParams, PaginatedTeachers, TeacherCreateInput, TeacherUpdateInput, TeacherAssignmentItem } from '@/types/teacher'

function mapDtoToTeacherItem(dto: any): TeacherItem {
  return {
    id: String(dto.id),
    teacherId: dto.teacher_id ?? dto.teacherId,
    name: dto.name,
    gender: dto.gender,
    phone: dto.phone,
    email: dto.email ?? '',
    idCard: dto.id_card ?? dto.idCard ?? '',
    employmentStatus: dto.employment_status ?? dto.employmentStatus,
    employmentType: dto.employment_type ?? dto.employmentType,
    createdAt: dto.created_at ?? dto.createdAt,
    updatedAt: dto.updated_at ?? dto.updatedAt ?? (dto.created_at ?? dto.createdAt),
    remark: dto.remark ?? '',
    assignments: Array.isArray(dto.assignments)
      ? dto.assignments.map(mapDtoToAssignment)
      : undefined,
  }
}

function mapDtoToAssignment(a: any): TeacherAssignmentItem {
  return {
    id: String(a.id),
    classId: a.class_id ? String(a.class_id) : undefined,
    className: a.class_name ?? undefined,
    classCode: a.class_code ?? undefined,
    headTeacherId: a.head_teacher_id ? String(a.head_teacher_id) : undefined,
    headTeacherName: a.head_teacher_name ?? undefined,
    courseId: a.course_id ? String(a.course_id) : a.course_id ?? null,
    courseCode: a.course_code ?? null,
    courseName: a.course_name ?? null,
    subject: a.subject ?? undefined,
    duty: a.duty ?? undefined,
    weeklyHours: typeof a.weekly_hours === 'number' ? a.weekly_hours : undefined,
    year: a.year ?? undefined,
    term: a.term ?? undefined,
  }
}

export const teacherService = {
  async getTeachers(params: TeacherQueryParams = {}): Promise<PaginatedTeachers> {
    const { page = 1, pageSize = 20, search = '', employmentStatus, employmentType } = params
    const { data } = await axios.get('/api/v1/teachers/', {
      params: {
        page,
        page_size: pageSize,
        search: search || undefined,
        employment_status: employmentStatus || undefined,
        employment_type: employmentType || undefined,
      },
    })
    const payload = data?.data ?? data
    const results = payload?.results ?? []
    const pagination = payload?.pagination ?? {}
    return {
      teachers: results.map(mapDtoToTeacherItem),
      pagination: {
        page: pagination.page ?? page,
        pageSize: pagination.page_size ?? pageSize,
        total: pagination.total_count ?? 0,
        totalPages: pagination.total_pages ?? 0,
      },
    }
  },

  async getTeacher(id: string): Promise<TeacherItem | null> {
    const { data } = await axios.get(`/api/v1/teachers/${id}/`)
    const payload = data?.data ?? data
    return payload ? mapDtoToTeacherItem(payload) : null
  },

  async createTeacher(input: TeacherCreateInput): Promise<TeacherItem> {
    const payload = {
      teacher_id: input.teacherId,
      name: input.name,
      gender: input.gender,
      phone: input.phone,
      email: input.email || '',
      id_card: input.idCard,
      employment_status: input.employmentStatus || '在职',
      employment_type: input.employmentType || '全职',
      remark: input.remark || '',
    }
    const { data } = await axios.post('/api/v1/teachers/', payload)
    const body = data?.data ?? data
    return mapDtoToTeacherItem(body)
  },

  async updateTeacher(id: string, input: TeacherUpdateInput): Promise<TeacherItem> {
    const payload: any = {}
    if (input.teacherId !== undefined) payload.teacher_id = input.teacherId
    if (input.name !== undefined) payload.name = input.name
    if (input.gender !== undefined) payload.gender = input.gender
    if (input.phone !== undefined) payload.phone = input.phone
    if (input.email !== undefined) payload.email = input.email
    if (input.idCard !== undefined) payload.id_card = input.idCard
    if (input.employmentStatus !== undefined) payload.employment_status = input.employmentStatus
    if (input.employmentType !== undefined) payload.employment_type = input.employmentType
    if (input.remark !== undefined) payload.remark = input.remark

    const { data } = await axios.patch(`/api/v1/teachers/${id}/`, payload)
    const body = data?.data ?? data
    return mapDtoToTeacherItem(body)
  },

  async deleteTeacher(id: string): Promise<void> {
    await axios.delete(`/api/v1/teachers/${id}/`)
  },

  async importTeachersByItems(items: any[]): Promise<{ created: number; updated: number }> {
    const { data } = await axios.post('/api/v1/teachers/import/', { items })
    return (data?.data ?? data) as { created: number; updated: number }
  },

  async importTeachersByFile(file: File): Promise<{ created: number; updated: number }> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await axios.post('/api/v1/teachers/import/', form)
    return (data?.data ?? data) as { created: number; updated: number }
  },

  async exportTeachers(params: TeacherQueryParams = {}): Promise<Blob> {
    const { page = 1, pageSize = 20, search = '', employmentStatus, employmentType } = params
    const res = await axios.get('/api/v1/teachers/export/', {
      params: {
        page,
        page_size: pageSize,
        search: search || undefined,
        employment_status: employmentStatus || undefined,
        employment_type: employmentType || undefined,
      },
      responseType: 'blob',
    })
    return res.data
  },

  async bulkUpdateStatus(payload: { ids?: string[]; employment_status: '在职' | '试用' | '停职' | '离职' }): Promise<{ updated: number }> {
    const { data } = await axios.post('/api/v1/teachers/bulk-update-status/', payload)
    return (data?.data ?? data) as { updated: number }
  },
}


