import axios from "axios"
import type { ExamDetail, ExamListItem, PaginatedExams, PaginatedScores, ScoreAnalyticsRow, ScoreDetail, ScoreListItem, ScoreSummaryRow } from "@/types/grade"

function mapExam(dto: any): ExamListItem {
  return {
    id: String(dto.id),
    code: dto.code,
    name: dto.name,
    term: dto.term,
    gradeName: dto.grade_name ?? dto.gradeName ?? dto.grade?.name ?? '',
    examDate: dto.exam_date ?? dto.examDate,
    createdAt: dto.created_at ?? dto.createdAt,
  }
}

function mapScore(dto: any): ScoreListItem {
  return {
    id: String(dto.id),
    studentId: dto.studentId ?? dto.student_id,
    studentName: dto.student_name ?? dto.studentName ?? '',
    className: dto.class_name ?? dto.className ?? '',
    courseName: dto.course_name ?? dto.courseName ?? '',
    score: dto.score != null ? Number(dto.score) : undefined,
    rankInClass: dto.rank_in_class ?? dto.rankInClass,
    rankInGrade: dto.rank_in_grade ?? dto.rankInGrade,
    passed: !!(dto.passed),
  }
}

export const gradeService = {
  // Exams
  async getExams(params: { page?: number; pageSize?: number; search?: string; term?: string; gradeId?: string }): Promise<PaginatedExams> {
    const { page = 1, pageSize = 20, search, term, gradeId } = params || {}
    const { data } = await axios.get("/api/v1/exams/", { params: { page, page_size: pageSize, search, term, grade: gradeId } })
    const payload = data?.data ?? data
    const results = payload?.results ?? []
    const pagination = payload?.pagination ?? {}
    return {
      exams: results.map(mapExam),
      pagination: {
        page: pagination.page ?? page,
        pageSize: pagination.page_size ?? pageSize,
        total: pagination.total_count ?? 0,
        totalPages: pagination.total_pages ?? 0,
      },
    }
  },

  async createExam(input: { code: string; name: string; term: string; gradeId?: string; gradeNameInput?: string; examDate?: string; remark?: string }): Promise<ExamDetail> {
    const payload: any = {
      code: input.code,
      name: input.name,
      term: input.term,
      exam_date: input.examDate,
      remark: input.remark,
    }
    if (input.gradeId) {
      payload.grade_id = input.gradeId
    }
    if (input.gradeNameInput) {
      payload.grade_name_input = input.gradeNameInput
    }
    const { data } = await axios.post("/api/v1/exams/", payload)
    const body = data?.data ?? data
    return {
      id: String(body.id),
      code: body.code,
      name: body.name,
      term: body.term,
      gradeId: body.grade_id ?? input.gradeId ?? '',
      examDate: body.exam_date ?? undefined,
      remark: body.remark ?? '',
    }
  },

  async deleteExam(id: string): Promise<void> {
    await axios.delete(`/api/v1/exams/${id}/`)
  },

  async exportExams(params: { term?: string; gradeId?: string; search?: string }) {
    const q = new URLSearchParams()
    if (params.term) q.set("term", params.term)
    if (params.gradeId) q.set("grade", params.gradeId)
    if (params.search) q.set("search", params.search)
    const url = `/api/v1/exams/export/?${q.toString()}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('导出失败')
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = `exams_${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  },

  // Scores
  async getScores(params: { page?: number; pageSize?: number; search?: string; examId?: string; classId?: string; courseId?: string; passed?: boolean }): Promise<PaginatedScores> {
    const { page = 1, pageSize = 20, search, examId, classId, courseId, passed } = params || {}
    const { data } = await axios.get("/api/v1/scores/", { params: { page, page_size: pageSize, search, exam: examId, class_ref: classId, course: courseId, passed } })
    const payload = data?.data ?? data
    const results = payload?.results ?? []
    const pagination = payload?.pagination ?? {}
    return {
      scores: results.map(mapScore),
      pagination: {
        page: pagination.page ?? page,
        pageSize: pagination.page_size ?? pageSize,
        total: pagination.total_count ?? 0,
        totalPages: pagination.total_pages ?? 0,
      },
    }
  },

  async createOrUpdateScore(input: { id?: string; examId: string; studentId: string; courseId: string; classId: string; score?: number; fullScore?: number }): Promise<ScoreDetail> {
    const payload: any = {
      exam_id: input.examId,
      student_id: input.studentId,
      course_id: input.courseId,
      class_id: input.classId,
      score: input.score,
      full_score: input.fullScore,
    }
    const { data } = input.id
      ? await axios.patch(`/api/v1/scores/${input.id}/`, payload)
      : await axios.post(`/api/v1/scores/`, payload)
    const body = data?.data ?? data
    return {
      id: String(body.id),
      examId: body.exam_id ?? input.examId,
      studentId: body.student_id ?? input.studentId,
      courseId: body.course_id ?? input.courseId,
      classId: body.class_id ?? input.classId,
      score: body.score != null ? Number(body.score) : undefined,
      fullScore: body.full_score != null ? Number(body.full_score) : undefined,
      rankInClass: body.rank_in_class ?? undefined,
      rankInGrade: body.rank_in_grade ?? undefined,
      passed: !!(body.passed),
      studentName: body.student_name ?? '',
      className: body.class_name ?? '',
      courseName: body.course_name ?? '',
      createdAt: body.created_at ?? undefined,
      updatedAt: body.updated_at ?? undefined,
    }
  },

  async deleteScore(id: string): Promise<void> {
    await axios.delete(`/api/v1/scores/${id}/`)
  },

  async importScores(file: File, examId: string, mode: 'append'|'overwrite' = 'append', classId?: string): Promise<{ created: number }> {
    const form = new FormData()
    form.append("file", file)
    form.append("exam_id", examId)
    form.append("mode", mode)
    if (classId) form.append("class_id", classId)
    const { data } = await axios.post("/api/v1/scores/import/", form, { headers: { "Content-Type": "multipart/form-data" } })
    return data?.data ?? data
  },

  async downloadScoreTemplate() {
    const url = `/api/v1/scores/template/`
    const res = await fetch(url)
    if (!res.ok) throw new Error('模板下载失败')
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = `成绩导入模板.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  },

  async exportScores(params: { examId?: string; classId?: string; courseId?: string; passed?: boolean; search?: string }) {
    const q = new URLSearchParams()
    if (params.examId) q.set("exam", params.examId)
    if (params.classId) q.set("class_ref", params.classId)
    if (params.courseId) q.set("course", params.courseId)
    if (params.passed != null) q.set("passed", String(params.passed))
    if (params.search) q.set("search", params.search)
    const url = `/api/v1/scores/export/?${q.toString()}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('导出失败')
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = `scores_${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  },

  async getScoreSummary(params: { examId: string; classId?: string; rank?: 'class'|'grade'; search?: string }): Promise<ScoreSummaryRow[]> {
    const { examId, classId, rank = 'class', search } = params
    const { data } = await axios.get("/api/v1/scores/summary/", { params: { exam: examId, class_ref: classId, rank, search } })
    const payload = data?.data ?? data
    const results = payload?.results ?? []
    return results
  }
  ,
  async getScoreAnalytics(params: { examId: string; classId?: string; courseId?: string; excellent?: number; good?: number; low?: number }): Promise<ScoreAnalyticsRow[]> {
    const q: any = { exam: params.examId }
    if (params.classId) q.class_ref = params.classId
    if (params.courseId) q.course = params.courseId
    if (params.excellent != null) q.excellent = params.excellent
    if (params.good != null) q.good = params.good
    if (params.low != null) q.low = params.low
    const { data } = await axios.get("/api/v1/scores/analytics/", { params: q })
    const payload = data?.data ?? data
    return payload?.results ?? []
  }
}


