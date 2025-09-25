import axios from "axios"
import type { StudentDetailView, StudentQueryParams, PaginatedStudents } from "@/types/student"

function mapDtoToStudent(dto: any): StudentDetailView {
  return {
    id: String(dto.id),
    studentId: dto.studentId ?? dto.student_id,
    name: dto.name,
    gender: dto.gender,
    className: dto.className ?? dto.class_name ?? dto.current_class_name ?? dto.className,
    status: dto.status ?? '在校',
    idCardNumber: dto.idCardNumber ?? dto.id_card ?? '',
    guangzhouStudentId: dto.guangzhouStudentId ?? dto.guangzhou_student_id ?? '',
    nationalStudentId: dto.nationalStudentId ?? dto.national_student_id ?? '',
    birthDate: dto.birthDate ?? dto.birth_date ?? '',
    homeAddress: dto.homeAddress ?? dto.address ?? '',
    parentInfo: dto.parentInfo ?? {},
    createdAt: dto.createdAt ?? dto.created_at,
    updatedAt: dto.updatedAt ?? dto.updated_at ?? (dto.createdAt ?? dto.created_at),
  }
}

export const studentService = {
  async getStudents(params: StudentQueryParams = {}): Promise<PaginatedStudents> {
    const { page = 1, pageSize = 20, search = "", grade = "", className = "", status, ordering, includeTransferred } = params
    const { data } = await axios.get("/api/v1/students/", {
      params: {
        page,
        page_size: pageSize,
        search: search || undefined,
        grade: grade || undefined,
        className: className || undefined,
        status: status || undefined,
        ordering: ordering || undefined,
        include_transferred: includeTransferred || undefined,
      },
    })
    const payload = data?.data ?? data
    const results = payload?.results ?? []
    const pagination = payload?.pagination ?? {}
    return {
      students: results.map(mapDtoToStudent),
      pagination: {
        page: pagination.page ?? page,
        pageSize: pagination.page_size ?? pageSize,
        total: pagination.total_count ?? 0,
        totalPages: pagination.total_pages ?? 0,
      },
    }
  },

  async getStudent(id: string): Promise<StudentDetailView | null> {
    const { data } = await axios.get(`/api/v1/students/${id}/`)
    const payload = data?.data ?? data
    return payload ? mapDtoToStudent(payload) : null
  },

  async createStudent(input: Partial<StudentDetailView> & { classId?: string; classNameInput?: string }): Promise<StudentDetailView> {
    const payload: any = {
      studentId: input.studentId,
      name: input.name,
      gender: input.gender,
      birthDate: input.birthDate,
      idCardNumber: input.idCardNumber,
      guangzhouStudentId: input.guangzhouStudentId,
      nationalStudentId: input.nationalStudentId,
      homeAddress: input.homeAddress,
      status: input.status ?? '在校',
      ...(input.classId ? { class_id: input.classId } : {}),
      ...(input.classNameInput ? { class_name_input: input.classNameInput } : {}),
    }
    const { data } = await axios.post("/api/v1/students/", payload)
    const body = data?.data ?? data
    return mapDtoToStudent(body)
  },

  async updateStudent(id: string, input: Partial<StudentDetailView> & { classId?: string; classNameInput?: string }): Promise<StudentDetailView> {
    const payload: any = {
      studentId: input.studentId,
      name: input.name,
      gender: input.gender,
      birthDate: input.birthDate,
      idCardNumber: input.idCardNumber,
      guangzhouStudentId: input.guangzhouStudentId,
      nationalStudentId: input.nationalStudentId,
      homeAddress: input.homeAddress,
      status: input.status,
      ...(input.classId ? { class_id: input.classId } : {}),
      ...(input.classNameInput ? { class_name_input: input.classNameInput } : {}),
    }
    const { data } = await axios.patch(`/api/v1/students/${id}/`, payload)
    const body = data?.data ?? data
    return mapDtoToStudent(body)
  },

  async deleteStudent(id: string, options?: { force?: boolean }): Promise<void> {
    const force = options?.force ?? true
    await axios.delete(`/api/v1/students/${id}/`, { params: { force } })
  },

  async importStudents(file: File): Promise<{ created: number; updated?: number; errors?: any[] }> {
    const form = new FormData()
    form.append("file", file)
    const { data } = await axios.post("/api/v1/students/import/", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return data?.data ?? data
  },

  async exportStudents(params: { search?: string; grade?: string; className?: string; status?: string; includeTransferred?: boolean }) {
    const q = new URLSearchParams()
    if (params.search) q.set("search", params.search)
    if (params.grade) q.set("grade", params.grade)
    if (params.className) q.set("className", params.className)
    if (params.status) q.set("status", String(params.status))
    if (params.includeTransferred) q.set("include_transferred", "true")
    const url = `/api/v1/students/export/?${q.toString()}`
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
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = `students_${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  },

  async bulkDelete(ids: string[], options?: { force?: boolean }): Promise<{ deleted: number }> {
    const force = options?.force ?? true
    const { data } = await axios.post("/api/v1/students/bulk-delete/", { ids, force })
    return data?.data ?? data
  },

  async bulkUpdateStatus(ids: string[] | undefined, statusValue: string): Promise<{ updated: number }> {
    const payload: any = { status: statusValue }
    if (Array.isArray(ids) && ids.length > 0) payload.ids = ids
    const { data } = await axios.post("/api/v1/students/bulk-update-status/", payload)
    return data?.data ?? data
  }
}
