import { useState } from "react"
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { authService } from "@/services/authService"
import { toast } from "@/hooks/use-toast"
import LightRays from "@/components/ui/LightRays"

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* WebGL 光线背景 */}
      <div className="absolute inset-0 z-0 opacity-60">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={0.4}
          lightSpread={0.3}
          rayLength={2.5}
          intensity={1.6}
          followMouse={true}
          mouseInfluence={0.25}
          noiseAmount={0.15}
          distortion={0.1}
          fadeDistance={1.5}
          saturation={1.5}
          pulsating={true}
        />
      </div>
      
      {/* 顶部强光源 - 增强光线起点 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b from-white/10 via-white/5 to-transparent -z-20" />

      {/* 额外的光晕增强效果 */}
      <div className="absolute inset-0 -z-30 opacity-30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-full bg-gradient-to-b from-purple-500/10 to-transparent blur-2xl" />
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* 左上角 Logo */}
      <div className="fixed top-6 left-6 z-50 flex items-center gap-3 select-none">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white grid place-items-center font-bold text-xl shadow-lg">
          B
        </div>
        <div>
          <div className="text-lg font-bold tracking-tight text-white">BYSS School</div>
          <div className="text-xs text-gray-400">学校管理系统</div>
        </div>
      </div>

      {/* 登录卡片 */}
      <div className="w-full max-w-md px-4">

        <Card className="relative overflow-hidden border border-white/20 bg-white/10 backdrop-blur-3xl shadow-[0_30px_120px_-50px_rgba(99,102,241,0.9)]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-white/5 to-transparent opacity-80 mix-blend-screen" />
          <div className="pointer-events-none absolute -top-24 -right-32 h-64 w-64 rounded-full bg-purple-400/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-6rem] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />

          <CardHeader className="relative space-y-1 pb-4">
            <CardTitle className="text-2xl text-center text-white drop-shadow">登录</CardTitle>
            <CardDescription className="text-center text-white/70">使用您的账号登录系统</CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white/80">用户名</Label>
                <Input
                  id="username"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  icon={<User className="h-4 w-4" />}
                  autoComplete="username"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/60"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit()
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white/80">密码</Label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="text-xs text-white/60 hover:text-white/80 inline-flex items-center gap-1 transition-colors"
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showPassword ? "隐藏" : "显示"}
                  </button>
                </div>
                <Input
                  id="password"
                  placeholder="请输入密码"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="h-4 w-4" />}
                  autoComplete="current-password"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/60"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit()
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/30 bg-white/10 cursor-pointer text-purple-400 focus:ring-purple-400/60"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span className="text-white/70">记住我</span>
                </label>
                <a className="text-white/70 hover:text-white hover:underline" href="#">忘记密码？</a>
              </div>

              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-purple-500/80 via-indigo-500/80 to-blue-500/80 hover:from-purple-500 hover:to-blue-500 text-white border border-white/30 shadow-[0_20px_60px_-20px_rgba(59,130,246,0.7)]" disabled={loading}>
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
          <CardFooter className="relative flex flex-col gap-4 pt-4">
            <div className="text-xs text-center text-white/60">
              © {new Date().getFullYear()} BYSS School. All rights reserved.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}


