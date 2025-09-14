import { api } from "../lib/api"
import { studentService } from "./studentService"
import { teacherService } from "./teacherService"
import { classService } from "./classService"
import { courseService } from "./courseService"
import { changeService } from "./changeService"
import { timetableService } from "./timetableService"
import type { StudentChangeItem } from "@/types/change"
import type { LessonItem } from "@/types/timetable"

interface DashboardStats {
  // 基础统计
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalCourses: number
  
  // 学生状态分布
  studentStatusDistribution: Array<{
    status: string
    count: number
  }>
  
  // 教师状态分布
  teacherStatusDistribution: Array<{
    status: string
    count: number
  }>
  
  // 班级人数分布
  classStudentDistribution: Array<{
    className: string
    studentCount: number
  }>
  
  // 年级人数分布
  gradeDistribution: Array<{
    gradeName: string
    studentCount: number
  }>
  
  // 课程类型分布
  courseTypeDistribution: Array<{
    category: string
    count: number
  }>
  
  // 最近的课程调动
  recentChanges: StudentChangeItem[]
  
  // 今日课程数
  todayLessonsCount: number
}

export const dashboardService = {
  // 获取仪表盘统计数据
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // 并行请求所有需要的数据
      const [
        studentsData,
        teachersData,
        classesData,
        coursesData,
        changesData,
        todayLessons
      ] = await Promise.all([
        // 获取学生总数和列表（用于统计状态分布）
        studentService.getStudents({ page: 1, pageSize: 1000 }),
        // 获取教师总数和列表
        teacherService.getTeachers({ page: 1, pageSize: 200 }),
        // 获取班级列表（包含学生数）
        classService.getClasses({ page: 1, pageSize: 100 }),
        // 获取课程列表
        courseService.getCourseOfferings({ page: 1, pageSize: 200 }),
        // 获取最近的课程调动
        changeService.list({ page: 1, pageSize: 5 }),
        // 获取今日课程
        this.getTodayLessons()
      ])

      // 统计学生状态分布
      const studentStatusMap = new Map<string, number>()
      studentsData.students.forEach((student: any) => {
        const status = student.status || '在校'
        studentStatusMap.set(status, (studentStatusMap.get(status) || 0) + 1)
      })
      
      // 统计教师状态分布
      const teacherStatusMap = new Map<string, number>()
      teachersData.teachers.forEach((teacher: any) => {
        const status = teacher.employmentStatus || '在职'
        teacherStatusMap.set(status, (teacherStatusMap.get(status) || 0) + 1)
      })
      
      // 统计课程类型分布
      const courseTypeMap = new Map<string, number>()
      coursesData.courseOfferings.forEach((course: any) => {
        const category = course.category || '必修'
        courseTypeMap.set(category, (courseTypeMap.get(category) || 0) + 1)
      })
      
      // 统计年级人数分布（使用标准化后的字段 grade）
      const gradeMap = new Map<string, number>()
      classesData.classes.forEach((cls: any) => {
        const gradeName = cls.grade || '未知年级'
        gradeMap.set(gradeName, (gradeMap.get(gradeName) || 0) + (cls.studentCount || 0))
      })

      return {
        totalStudents: studentsData.pagination?.total || 0,
        totalTeachers: teachersData.pagination?.total || 0,
        totalClasses: classesData.pagination?.total || 0,
        totalCourses: coursesData.pagination?.total || 0,
        
        studentStatusDistribution: Array.from(studentStatusMap.entries()).map(([status, count]) => ({
          status,
          count
        })),
        
        teacherStatusDistribution: Array.from(teacherStatusMap.entries()).map(([status, count]) => ({
          status,
          count
        })),
        
        classStudentDistribution: classesData.classes
          .map((cls: any) => ({
            className: cls.name,
            studentCount: cls.studentCount || 0
          }))
          .sort((a: any, b: any) => b.studentCount - a.studentCount)
          .slice(0, 10), // 取人数前10
        
        gradeDistribution: Array.from(gradeMap.entries()).map(([gradeName, studentCount]) => ({
          gradeName,
          studentCount
        })).sort((a, b) => {
          // 按年级顺序排序
          const gradeOrder = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三']
          return gradeOrder.indexOf(a.gradeName) - gradeOrder.indexOf(b.gradeName)
        }),
        
        courseTypeDistribution: Array.from(courseTypeMap.entries()).map(([category, count]) => ({
          category,
          count
        })),
        
        recentChanges: changesData.changes,
        
        todayLessonsCount: todayLessons.length
      }
    } catch (error) {
      console.error('获取仪表盘数据失败:', error)
      // 返回默认值，避免页面崩溃
      return {
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        totalCourses: 0,
        studentStatusDistribution: [],
        teacherStatusDistribution: [],
        classStudentDistribution: [],
        gradeDistribution: [],
        courseTypeDistribution: [],
        recentChanges: [],
        todayLessonsCount: 0
      }
    }
  },

  // 获取今日课程
  async getTodayLessons(): Promise<LessonItem[]> {
    try {
      const today = new Date()
      const dayOfWeek = today.getDay() || 7 // 将周日的0转换为7
      
      // 获取全校本周课表，避免缺少 classId 造成的 404
      const lessons = await timetableService.getSchoolTimetable({
        term: 'current',
        week: 1,
      })
      
      // 筛选今天的课程
      return lessons.filter((lesson: LessonItem) => lesson.dayOfWeek === dayOfWeek)
    } catch (error) {
      console.error('获取今日课程失败:', error)
      return []
    }
  },

  // 获取实时统计数据（用于定时刷新）
  async getRealtimeStats() {
    try {
      // api 已在拦截器中返回 response.data，这里直接返回即可
      const data = await api.get('/dashboard/realtime-stats/')
      return data
    } catch (error) {
      console.error('获取实时统计失败:', error)
      return null
    }
  }
}
