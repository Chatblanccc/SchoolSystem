import { useState } from "react"
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { authService } from "@/services/authService"
import { toast } from "@/hooks/use-toast"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(true)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!username || !password) {
      toast({ title: "请填写完整信息", description: "用户名与密码均为必填项", variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      await authService.login({ username, password })
      if (!remember) {
        // 非必需：如不记住，下次进入时清空本地 token（保持当前会话）
        // 这里仅做最简单处理：不额外持久化 refresh_token 即可（已在服务内按返回写入）
      }
      toast({ title: "登录成功", description: "正在进入系统..." })
      window.location.href = "/"
    } catch (err: any) {
      const details = err?.response?.data || err?.message || "登录失败"
      toast({ title: "登录失败", description: typeof details === "string" ? details : JSON.stringify(details), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/15 via-background to-background">       
      {/* 装饰层 */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      {/* 顶部栏：Logo + 主题切换 */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 select-none">
          <div className="h-8 w-8 rounded-lg bg-primary/90 text-primary-foreground grid place-items-center font-bold">B</div>
          <div>
            <div className="text-base font-semibold tracking-wide">BYSS School</div>
            <div className="text-xs text-muted-foreground">学校管理系统</div>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* 主体 */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* 左侧品牌宣传（大屏可见） */}
          <div className="hidden lg:block">
            <div className="mb-6">
              <h1 className="text-4xl font-bold tracking-tight">欢迎回来</h1>
              <p className="mt-3 text-muted-foreground leading-7">
                统一的中小学一体化管理平台，涵盖用户、班级、课程、师生、课表与统计分析。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FeatureItem title="高性能" desc="虚拟化表格，海量数据流畅呈现" />
              <FeatureItem title="高可用" desc="成熟后端与统一响应结构" />
              <FeatureItem title="安全合规" desc="RBAC 权限与 JWT 认证" />
              <FeatureItem title="现代化" desc="React 18 + TypeScript + Tailwind" />
            </div>
          </div>

          {/* 右侧登录卡片 */}
          <div className="w-full max-w-md mx-auto">
            <Card className="backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <CardHeader>
                <CardTitle>账号登录</CardTitle>
                <CardDescription>使用管理员或教师账号登录系统</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="username">用户名</Label>
                    <Input
                      id="username"
                      placeholder="输入用户名"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      icon={<User className="h-4 w-4" />}
                      autoComplete="username"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmit()
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">密码</Label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                        aria-label={showPassword ? "隐藏密码" : "显示密码"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showPassword ? "隐藏" : "显示"}
                      </button>
                    </div>
                    <Input
                      id="password"
                      placeholder="输入密码"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      icon={<Lock className="h-4 w-4" />}
                      autoComplete="current-password"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmit()
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      记住我
                    </label>
                    <a className="text-sm text-primary hover:underline" href="#">忘记密码？</a>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> 登录中...
                      </span>
                    ) : (
                      "登录"
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                <span>© {new Date().getFullYear()} BYSS</span>
                <span>版本 v2.2.0</span>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground leading-6">{desc}</div>
    </div>
  )
}


