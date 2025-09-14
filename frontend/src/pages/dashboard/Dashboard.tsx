import { useEffect, useState } from "react"
import { Users, GraduationCap, BookOpen, School, Calendar, Clock, RefreshCw } from "lucide-react"
import { StatsCard } from "@/components/shared/StatsCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useThemeStore } from "@/stores/themeStore"
import { cn } from "@/lib/utils"
import { dashboardService } from "@/services/dashboardService"
import { toast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton.tsx"

export default function Dashboard() {
  const { isDark } = useThemeStore()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date())
  
  // 图表颜色配置
  const chartColors = {
    primary: isDark ? '#60a5fa' : '#3b82f6',
    secondary: isDark ? '#34d399' : '#10b981',
    tertiary: isDark ? '#fbbf24' : '#f59e0b',
    quaternary: isDark ? '#f87171' : '#ef4444',
    quinary: isDark ? '#a78bfa' : '#8b5cf6',
    senary: isDark ? '#f472b6' : '#ec4899',
    text: isDark ? '#e5e7eb' : '#374151',
    grid: isDark ? '#374151' : '#e5e7eb',
  }

  // 饼图颜色数组
  const pieColors = [
    chartColors.primary,
    chartColors.secondary,
    chartColors.tertiary,
    chartColors.quaternary,
    chartColors.quinary,
    chartColors.senary,
  ]

  // 加载数据
  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true)
      else setRefreshing(true)
      
      const data = await dashboardService.getDashboardStats()
      setStats(data)
      setLastUpdateTime(new Date())
      
      if (isRefresh) {
        toast({
          title: "数据已刷新",
          description: "仪表盘数据已更新到最新状态",
        })
      }
    } catch (error) {
      console.error('加载仪表盘数据失败:', error)
      toast({
        title: "加载失败",
        description: "无法加载仪表盘数据，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
    
    // 每5分钟自动刷新一次
    const interval = setInterval(() => {
      loadDashboardData(true)
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  // 计算环比增长（这里使用模拟数据，实际应该从后端获取历史数据）
  const calculateGrowth = (current: number, previous: number): string => {
    if (previous === 0) return '0'
    return ((current - previous) / previous * 100).toFixed(1)
  }

  // 格式化更新时间
  const formatUpdateTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return '刚刚更新'
    if (minutes < 60) return `${minutes}分钟前更新`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前更新`
    return date.toLocaleDateString('zh-CN')
  }

  // 状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case '在校':
      case '在职':
      case '在读':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case '转学':
      case '试用':
      case '已结班':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case '休学':
      case '停职':
      case '归档':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
      case '退学':
      case '离职':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
    }
  }

  // 获取调动类型标签
  const getChangeTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'STUDENT_COURSE_CHANGE': '学生调课',
      'TEACHER_SUBSTITUTE': '教师代课',
      'COURSE_CANCEL': '课程取消',
      'COURSE_ADJUSTMENT': '课程调整',
      'ROOM_CHANGE': '教室变更',
    }
    return typeMap[type] || type
  }

  // 获取调动状态标签
  const getChangeStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'DRAFT': '草稿',
      'SUBMITTED': '已提交',
      'APPROVED': '已批准',
      'REJECTED': '已拒绝',
      'SCHEDULED': '已安排',
      'EFFECTED': '已生效',
      'CANCELLED': '已取消'
    }
    return statusMap[status] || status
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">仪表盘</h2>
          <p className="text-muted-foreground">正在加载数据...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">白云实验学校(暨实校区)</h2>
          <p className="text-muted-foreground">学校管理系统实时数据概览</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            <Clock className="inline-block w-4 h-4 mr-1" />
            {formatUpdateTime(lastUpdateTime)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="学生总数"
          value={stats?.totalStudents?.toLocaleString() || "0"}
          description="在校学生总人数"
          icon={Users}
          trend={{ 
            value: parseFloat(calculateGrowth(stats?.totalStudents || 0, (stats?.totalStudents || 0) - 10)), 
            isPositive: true 
          }}
        />
        <StatsCard
          title="教师总数"
          value={stats?.totalTeachers?.toLocaleString() || "0"}
          description="在职教师人数"
          icon={GraduationCap}
          trend={{ 
            value: parseFloat(calculateGrowth(stats?.totalTeachers || 0, (stats?.totalTeachers || 0) - 2)), 
            isPositive: true 
          }}
        />
        <StatsCard
          title="班级总数"
          value={stats?.totalClasses?.toLocaleString() || "0"}
          description="活跃班级数量"
          icon={School}
          trend={{ 
            value: 0, 
            isPositive: true 
          }}
        />
        <StatsCard
          title="课程总数"
          value={stats?.totalCourses?.toLocaleString() || "0"}
          description="本学期开设课程"
          icon={BookOpen}
          trend={{ 
            value: parseFloat(calculateGrowth(stats?.totalCourses || 0, (stats?.totalCourses || 0) - 5)), 
            isPositive: true 
          }}
        />
      </div>

      {/* 图表区域 - 第一行 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 年级人数分布 */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>年级人数分布</CardTitle>
            <CardDescription>各年级学生人数统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats?.gradeDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.gradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis 
                      dataKey="gradeName" 
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fill: chartColors.text, fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: '8px',
                        color: chartColors.text
                      }}
                      formatter={(value) => [`${value}人`, '学生数']}
                    />
                    <Bar 
                      dataKey="studentCount" 
                      fill={chartColors.primary} 
                      radius={[8, 8, 0, 0]}
                      name="学生数"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 学生状态分布 */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>学生状态分布</CardTitle>
            <CardDescription>在校学生状态统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats?.studentStatusDistribution?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="70%">
                    <PieChart>
                      <Pie
                        data={stats.studentStatusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {stats.studentStatusDistribution.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
                          border: `1px solid ${chartColors.grid}`,
                          borderRadius: '8px',
                          color: chartColors.text
                        }}
                        formatter={(value) => [`${value}人`, '人数']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {stats.studentStatusDistribution.map((item: any, index: number) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: pieColors[index % pieColors.length] }}
                          />
                          <span className="text-sm">{item.status}</span>
                        </div>
                        <span className="text-sm font-medium">{item.count}人</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 - 第二行 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 班级人数TOP10 */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>班级人数排行</CardTitle>
            <CardDescription>学生人数最多的10个班级</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats?.classStudentDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stats.classStudentDistribution} 
                    layout="horizontal"
                    margin={{ left: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis type="number" tick={{ fill: chartColors.text, fontSize: 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="className" 
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      width={50}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: '8px',
                        color: chartColors.text
                      }}
                      formatter={(value) => [`${value}人`, '学生数']}
                    />
                    <Bar 
                      dataKey="studentCount" 
                      fill={chartColors.secondary} 
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 最近的课程调动 */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>最近课程调动</CardTitle>
            <CardDescription>近期的课程变动记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {stats?.recentChanges?.length > 0 ? (
                stats.recentChanges.map((change: any) => (
                  <div key={change.id} className="flex items-start space-x-4">
                    <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {getChangeTypeLabel(change.changeType)}
                        </p>
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(change.status))}>
                          {getChangeStatusLabel(change.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        申请人: {change.applicantName || '未知'} • {change.reason || '无备注'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(change.createdAt).toLocaleString('zh-CN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  暂无课程调动记录
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 其他统计信息 */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* 教师状态分布 */}
        <Card>
          <CardHeader>
            <CardTitle>教师状态统计</CardTitle>
            <CardDescription>各状态教师人数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.teacherStatusDistribution?.length > 0 ? (
                stats.teacherStatusDistribution.map((item: any) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">{item.count}人</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">暂无数据</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 课程类型分布 */}
        <Card>
          <CardHeader>
            <CardTitle>课程类型分布</CardTitle>
            <CardDescription>各类型课程数量</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.courseTypeDistribution?.length > 0 ? (
                stats.courseTypeDistribution.map((item: any) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <span className="text-sm">{item.category}</span>
                    <span className="text-sm font-medium">{item.count}门</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">暂无数据</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 今日课程概览 */}
        <Card>
          <CardHeader>
            <CardTitle>今日课程</CardTitle>
            <CardDescription>今天的课程安排概览</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">课程总数</span>
                </div>
                <span className="text-2xl font-bold">{stats?.todayLessonsCount || 0}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('zh-CN', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}