import { Users, GraduationCap, BookOpen, TrendingUp } from "lucide-react"
import { StatsCard } from "@/components/shared/StatsCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { useThemeStore } from "@/stores/themeStore"
import { cn } from "@/lib/utils"

// 模拟数据
const monthlyData = [
  { month: "1月", students: 480, teachers: 45 },
  { month: "2月", students: 485, teachers: 46 },
  { month: "3月", students: 490, teachers: 46 },
  { month: "4月", students: 495, teachers: 47 },
  { month: "5月", students: 500, teachers: 48 },
  { month: "6月", students: 510, teachers: 49 },
]

const gradeDistribution = [
  { grade: "一年级", count: 80 },
  { grade: "二年级", count: 85 },
  { grade: "三年级", count: 82 },
  { grade: "四年级", count: 88 },
  { grade: "五年级", count: 86 },
  { grade: "六年级", count: 89 },
]

const coursePopularity = [
  { name: "语文", value: 95 },
  { name: "数学", value: 90 },
  { name: "英语", value: 85 },
  { name: "科学", value: 70 },
  { name: "体育", value: 60 },
]

const recentActivities = [
  { id: 1, type: "student", action: "新生入学", name: "张三", time: "10分钟前" },
  { id: 2, type: "teacher", action: "课程发布", name: "李老师", time: "30分钟前" },
  { id: 3, type: "grade", action: "成绩录入", name: "王老师", time: "1小时前" },
  { id: 4, type: "notice", action: "通知发布", name: "系统管理员", time: "2小时前" },
  { id: 5, type: "student", action: "请假申请", name: "李四", time: "3小时前" },
]

export default function Dashboard() {
  const { isDark } = useThemeStore()
  
  // 图表颜色配置
  const chartColors = {
    primary: isDark ? '#60a5fa' : '#3b82f6',
    secondary: isDark ? '#34d399' : '#10b981',
    tertiary: isDark ? '#fbbf24' : '#f59e0b',
    quaternary: isDark ? '#f87171' : '#ef4444',
    quinary: isDark ? '#a78bfa' : '#8b5cf6',
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
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">仪表盘</h2>
        <p className="text-muted-foreground">欢迎回来，这是您的学校管理概览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="学生总数"
          value="510"
          description="本学期在校学生"
          icon={Users}
          trend={{ value: 2.5, isPositive: true }}
        />
        <StatsCard
          title="教师总数"
          value="49"
          description="在职教师人数"
          icon={GraduationCap}
          trend={{ value: 4.2, isPositive: true }}
        />
        <StatsCard
          title="课程数量"
          value="156"
          description="本学期开设课程"
          icon={BookOpen}
          trend={{ value: 8.1, isPositive: true }}
        />
        <StatsCard
          title="平均出勤率"
          value="96.5%"
          description="本月平均出勤"
          icon={TrendingUp}
          trend={{ value: 1.2, isPositive: false }}
        />
      </div>

      {/* 图表区域 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 趋势图 */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>师生人数趋势</CardTitle>
            <CardDescription>过去6个月的师生人数变化</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="month" tick={{ fill: chartColors.text, fontSize: 12 }} />
                  <YAxis tick={{ fill: chartColors.text, fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
                      border: `1px solid ${chartColors.grid}`,
                      borderRadius: '8px',
                      color: chartColors.text
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="students" 
                    stroke={chartColors.primary} 
                    strokeWidth={2}
                    name="学生"
                    dot={{ fill: chartColors.primary }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="teachers" 
                    stroke={chartColors.secondary} 
                    strokeWidth={2}
                    name="教师"
                    dot={{ fill: chartColors.secondary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 课程分布饼图 */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>课程受欢迎度</CardTitle>
            <CardDescription>各科目选课人数分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={coursePopularity}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {coursePopularity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
                      border: `1px solid ${chartColors.grid}`,
                      borderRadius: '8px',
                      color: chartColors.text
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {coursePopularity.map((course, index) => (
                <div key={course.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: pieColors[index] }}
                    />
                    <span className="text-sm">{course.name}</span>
                  </div>
                  <span className="text-sm font-medium">{course.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 年级分布 */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>年级人数分布</CardTitle>
            <CardDescription>各年级学生人数统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="grade" tick={{ fill: chartColors.text, fontSize: 12 }} />
                  <YAxis tick={{ fill: chartColors.text, fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
                      border: `1px solid ${chartColors.grid}`,
                      borderRadius: '8px',
                      color: chartColors.text
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill={chartColors.primary} 
                    radius={[8, 8, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 最近活动 */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <CardDescription>系统最新动态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    activity.type === "student" && "bg-blue-500",
                    activity.type === "teacher" && "bg-green-500",
                    activity.type === "grade" && "bg-yellow-500",
                    activity.type === "notice" && "bg-purple-500"
                  )} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {activity.name} - {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


