// 学生状态枚举
export type StudentStatus = '在校' | '请假' | '转学' | '休学' | '毕业'

// 性别枚举
export type Gender = '男' | '女'

// 家长信息接口
export interface ParentInfo {
  fatherName?: string
  fatherPhone?: string
  motherName?: string
  motherPhone?: string
  guardianName?: string
  guardianPhone?: string
  guardianRelation?: string
}

// 学生基本信息（表格显示）
export interface StudentTableView {
  id: string
  studentId: string      // 学号
  name: string           // 姓名  
  gender: Gender         // 性别
  className: string      // 班级
  status: StudentStatus  // 状态
}

// 学生详细信息（展开/详情页）
export interface StudentDetailView extends StudentTableView {
  idCardNumber: string       // 身份证号
  guangzhouStudentId: string // 广州市学籍号（21位数字）
  nationalStudentId: string  // 全国学籍号（G+身份证号码）
  birthDate: string         // 出生日期
  homeAddress: string       // 家庭住址
  parentInfo: ParentInfo    // 家长信息
  createdAt: string         // 创建时间
  updatedAt: string         // 更新时间
}

// 学生查询参数
export interface StudentQueryParams {
  page?: number
  pageSize?: number
  search?: string      // 搜索关键词（姓名或学号）
  grade?: string       // 年级筛选
  className?: string   // 班级筛选
  status?: StudentStatus // 状态筛选
  ordering?: string    // 排序字段
  includeTransferred?: boolean // 是否包含已转出学生
}

// 分页响应
export interface PaginatedStudents {
  students: StudentDetailView[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
