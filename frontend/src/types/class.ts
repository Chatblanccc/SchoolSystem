// 班级状态枚举
export type ClassStatus = '在读' | '已结班' | '归档'

// 班级数据模型
export interface ClassItem {
  id: string
  code: string // 班级编码（唯一）
  name: string // 班级名称（如 一年级1班）
  grade: string // 年级（如 一年级）
  headTeacherId?: string
  headTeacherName?: string
  capacity: number // 容量上限
  studentCount: number // 当前人数
  status: ClassStatus
  remark?: string
  createdAt: string
  updatedAt: string
}

// 查询参数
export interface ClassQueryParams {
  page?: number
  pageSize?: number
  search?: string // 关键词：名称/编码
  grade?: string
  status?: ClassStatus
  headTeacherId?: string
}

// 分页响应
export interface PaginatedClasses {
  classes: ClassItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}


