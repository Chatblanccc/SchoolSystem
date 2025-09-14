export type EmploymentStatus = '在职' | '试用' | '停职' | '离职'
export type EmploymentType = '全职' | '兼职' | '外聘'

export interface TeacherItem {
  id: string
  teacherId: string
  name: string
  gender: '男' | '女'
  phone: string
  email?: string
  idCard?: string
  employmentStatus: EmploymentStatus
  employmentType: EmploymentType
  createdAt: string
  updatedAt: string
  remark?: string
  assignments?: TeacherAssignmentItem[]
}

export interface TeacherQueryParams {
  page?: number
  pageSize?: number
  search?: string
  employmentStatus?: EmploymentStatus
  employmentType?: EmploymentType
}

export interface PaginatedTeachers {
  teachers: TeacherItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface TeacherCreateInput {
  teacherId: string
  name: string
  gender: '男' | '女'
  phone: string
  email?: string
  idCard: string
  employmentStatus?: EmploymentStatus
  employmentType?: EmploymentType
  remark?: string
}

export interface TeacherUpdateInput {
  teacherId?: string
  name?: string
  gender?: '男' | '女'
  phone?: string
  email?: string
  idCard?: string
  employmentStatus?: EmploymentStatus
  employmentType?: EmploymentType
  remark?: string
}

export interface TeacherAssignmentItem {
  id: string
  classId?: string
  className?: string
  classCode?: string
  headTeacherId?: string
  headTeacherName?: string
  courseId?: string | null
  courseCode?: string | null
  courseName?: string | null
  subject?: string
  duty?: string
  weeklyHours?: number
  year?: string
  term?: string
}


