// 课程类型与开课（排课）列表类型定义

export type CourseCategory = '必修' | '选修'
export type CourseOfferingStatus = '开放' | '关闭' | '结课'
export type EnrollType = '必修' | '选修'

export interface CourseOfferingItem {
    id: string
    courseCode: string
    courseName: string
    category?: CourseCategory
    weeklyHours?: number
    teacherId?: string
    teacherName?: string
    grade?: string
    className?: string
    // 移除 weekday/room/enrollType；periods 替换为 weeklyHours
    status: CourseOfferingStatus
    enrolledCount?: number
    createdAt: string
    updatedAt: string
}

export interface CourseQueryParams {
    page?: number
    pageSize?: number
    search?: string
    grade?: string
    className?: string
    teacherId?: string
    status?: CourseOfferingStatus
    // 移除 weekday 筛选
}

export interface PaginatedCourseOfferings {
    courseOfferings: CourseOfferingItem[]
    pagination: {
        page: number
        pageSize: number
        total: number
        totalPages: number
    }
}


