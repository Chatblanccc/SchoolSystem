import axios from 'axios'
import type { PaginatedChanges, StudentChangeItem } from '@/types/change'

function mapDtoToChange(dto: any): StudentChangeItem {
  return {
    id: String(dto.id),
    studentId: String(dto.studentId ?? dto.student_id ?? dto.student?.id ?? ''),
    studentName: dto.studentName ?? dto.student_name ?? dto.studentName,
    className: dto.className ?? dto.class_name,
    type: dto.type,
    status: dto.status,
    effectiveDate: dto.effectiveDate ?? dto.effective_date,
    reason: dto.reason,
    targetSchoolName: dto.targetSchoolName ?? dto.target_school_name,
    targetSchoolContact: dto.targetSchoolContact ?? dto.target_school_contact,
    releaseDate: dto.releaseDate ?? dto.release_date,
    handoverNote: dto.handoverNote ?? dto.handover_note,
    leaveType: dto.leaveType ?? dto.leave_type,
    leaveStartDate: dto.leaveStartDate ?? dto.leave_start_date,
    leaveEndDate: dto.leaveEndDate ?? dto.leave_end_date,
    reinstateReturnDate: dto.reinstateReturnDate ?? dto.reinstate_return_date,
    placementPolicy: dto.placementPolicy ?? dto.placement_policy,
    targetClassId: dto.targetClassId ?? dto.target_class_id,
    createdAt: dto.createdAt ?? dto.created_at,
    updatedAt: dto.updatedAt ?? dto.updated_at ?? (dto.createdAt ?? dto.created_at),
  }
}

export const changeService = {
  async list(params: { page?: number; pageSize?: number; type?: string; status?: string; studentId?: string } = {}): Promise<PaginatedChanges> {
    const { page = 1, pageSize = 20, type, status, studentId } = params
    const { data } = await axios.get('/api/v1/changes/', {
      params: {
        page,
        page_size: pageSize,
        type: type || undefined,
        status: status || undefined,
        student_id: studentId || undefined,
      }
    })
    const payload = data?.data ?? data
    const results = payload?.results ?? []
    const pagination = payload?.pagination ?? {}
    return {
      changes: results.map(mapDtoToChange),
      pagination: {
        page: pagination.page ?? page,
        pageSize: pagination.page_size ?? pageSize,
        total: pagination.total_count ?? 0,
        totalPages: pagination.total_pages ?? 0,
      }
    }
  },

  async create(input: Partial<StudentChangeItem> & { studentPk: string; type: 'transfer_out' | 'leave' | 'reinstate' }): Promise<StudentChangeItem> {
    const payload: any = {
      studentId: input.studentPk, // 后端字段 studentId 映射到学生主键
      type: input.type,
      effective_date: input.effectiveDate,
      reason: input.reason,
      target_school_name: input.targetSchoolName,
      target_school_contact: input.targetSchoolContact,
      release_date: input.releaseDate,
      handover_note: input.handoverNote,
      leave_type: input.leaveType,
      leave_start_date: input.leaveStartDate,
      leave_end_date: input.leaveEndDate,
      reinstate_return_date: input.reinstateReturnDate,
      placement_policy: input.placementPolicy,
      target_class_id: input.targetClassId,
    }
    const { data } = await axios.post('/api/v1/changes/', payload)
    const body = data?.data ?? data
    return mapDtoToChange(body)
  },

  async submit(id: string) { await axios.post(`/api/v1/changes/${id}/submit/`) },
  async approve(id: string) { await axios.post(`/api/v1/changes/${id}/approve/`) },
  async reject(id: string) { await axios.post(`/api/v1/changes/${id}/reject/`) },
  async cancel(id: string) { await axios.post(`/api/v1/changes/${id}/cancel/`) },
  async effect(id: string) { await axios.post(`/api/v1/changes/${id}/effect/`) },
}


