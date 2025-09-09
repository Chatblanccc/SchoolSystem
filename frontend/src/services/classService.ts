import axios from "axios"
import type { ClassItem, ClassQueryParams, PaginatedClasses } from "@/types/class"

function mapDtoToClassItem(dto: any): ClassItem {
  return {
    id: String(dto.id),
    code: dto.code,
    name: dto.name,
    grade: dto.grade ?? dto.grade_name ?? "",
    headTeacherId: dto.headTeacherId ?? dto.head_teacher_id,
    headTeacherName: dto.headTeacherName ?? dto.head_teacher_name,
    capacity: dto.capacity,
    studentCount: dto.studentCount ?? dto.student_count ?? 0,
    status: dto.status,
    remark: dto.remark,
    createdAt: dto.createdAt ?? dto.created_at,
    updatedAt: dto.updatedAt ?? dto.updated_at ?? (dto.createdAt ?? dto.created_at),
  }
}

export const classService = {
  async getClasses(params: ClassQueryParams = {}): Promise<PaginatedClasses> {
    const { page = 1, pageSize = 20, search = "", grade = "", status, headTeacherId } = params

    const { data } = await axios.get("/api/v1/classes/", {
      params: {
        page,
        page_size: pageSize,
        search: search || undefined,
        grade: grade || undefined,
        status: status || undefined,
        head_teacher_id: headTeacherId || undefined,
      },
    })

    // 兼容 BYSS 统一响应格式
    const payload = data?.data ?? data
    const results = payload?.results ?? []
    const pagination = payload?.pagination ?? {}

    return {
      classes: results.map(mapDtoToClassItem),
      pagination: {
        page: pagination.page ?? page,
        pageSize: pagination.page_size ?? pageSize,
        total: pagination.total_count ?? 0,
        totalPages: pagination.total_pages ?? 0,
      },
    }
  },

  async getClass(id: string): Promise<ClassItem | null> {
    const { data } = await axios.get(`/api/v1/classes/${id}/`)
    const payload = data?.data ?? data
    return payload ? mapDtoToClassItem(payload) : null
  },

  async createClass(input: Partial<ClassItem>): Promise<ClassItem> {
    const payload: any = {
      code: input.code,
      name: input.name,
      // 通过 grade_name_input 让后端按年级名创建/关联
      grade_name_input: input.grade,
      head_teacher_name: input.headTeacherName,
      capacity: input.capacity ?? 50,
      status: input.status ?? "在读",
      remark: input.remark,
    }
    try {
      const { data } = await axios.post("/api/v1/classes/", payload)
      const body = data?.data ?? data
      return mapDtoToClassItem(body)
    } catch (err: any) {
      // 打印后端错误详情便于排查
      console.error('createClass error', err?.response?.data || err)
      throw err
    }
  },

  async updateClass(id: string, input: Partial<ClassItem>): Promise<ClassItem> {
    const payload: any = {
      code: input.code,
      name: input.name,
      ...(input.grade ? { grade_name_input: input.grade } : {}),
      head_teacher_name: input.headTeacherName,
      capacity: input.capacity,
      status: input.status,
      remark: input.remark,
    }
    const { data } = await axios.patch(`/api/v1/classes/${id}/`, payload)
    const body = data?.data ?? data
    return mapDtoToClassItem(body)
  },

  async deleteClass(id: string): Promise<void> {
    await axios.delete(`/api/v1/classes/${id}/`)
  },

  async assignHeadTeacher(id: string, teacherId: string | null): Promise<ClassItem> {
    const { data } = await axios.post(`/api/v1/classes/${id}/assign-teacher/`, {
      teacher_id: teacherId || undefined,
    })
    const body = data?.data ?? data
    return mapDtoToClassItem(body)
  },
}

