import { Bell, Search, LogOut, UserCircle, UserCog, KeyRound } from "lucide-react"
import { useEffect, useState } from "react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { authService } from "@/services/authService"
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/dropdown"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { toast } from "@/hooks/use-toast"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type RawUser = {
  username?: string
  name?: string
  first_name?: string
  email?: string
}

export function Header() {
  const [displayName, setDisplayName] = useState("")
  const [profileOpen, setProfileOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [saving, setSaving] = useState(false)

  const applyUser = (raw: any) => {
    const user: RawUser | null = raw ? (raw.data ?? raw) : null
    const fallbackName = user?.username ?? ""
    const resolvedDisplay = (user?.name || fallbackName || "未登录").trim() || "未登录"
    const resolvedName = (user?.name || user?.first_name || fallbackName || "").trim()

    setDisplayName(resolvedDisplay)
    setName(resolvedName)
    setEmail(user?.email || "")
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!active) return
        applyUser(user)
      } catch {
        if (!active) return
        setDisplayName("未登录")
        setName("")
        setEmail("")
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const handleProfileSave = async () => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName) {
      toast({ title: "校验失败", description: "请填写姓名", variant: "destructive" })
      return
    }

    try {
      setSaving(true)
      // 修正：后端只接受 first_name/last_name/email 字段，不能传 name
      await authService.updateProfile({ first_name: trimmedName, email: trimmedEmail })
      const user = await authService.getCurrentUser()
      applyUser(user)
      toast({ title: "已保存", description: "个人资料更新成功" })
      setProfileOpen(false)
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error?.message || "保存失败，请稍后重试"
      toast({ title: "保存失败", description: message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSave = async () => {
    if (!oldPassword || !newPassword) {
      toast({ title: "校验失败", description: "请填写原密码与新密码", variant: "destructive" })
      return
    }

    try {
      setSaving(true)
      await authService.changePassword({ old_password: oldPassword, new_password: newPassword })
      toast({ title: "修改成功", description: "密码已更新" })
      setPasswordOpen(false)
      setOldPassword("")
      setNewPassword("")
    } catch (error: any) {
      const details = error?.response?.data?.error?.details
      const message = error?.response?.data?.error?.message || error?.message || "修改失败，请稍后重试"
      toast({ title: "修改失败", description: details ? JSON.stringify(details) : message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b dark:bg-card backdrop-blur supports-[backdrop-filter]:bg-background/95">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center flex-1">
            <h1 className="text-xl font-bold mr-8">BYSS 学校管理系统</h1>
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="搜索学生、教师、课程..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />

            <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            </button>

            <Dropdown>
              <DropdownTrigger className="flex items-center space-x-2 p-2 hover:bg-accent rounded-lg transition-colors">
                <AvatarInitials name={displayName} />
                <span className="text-sm font-medium">{displayName || "加载中..."}</span>
              </DropdownTrigger>
              <DropdownContent className="w-56">
                <div className="px-3 py-2 text-sm text-muted-foreground">已登录</div>
                <DropdownItem>
                  <div className="flex items-center gap-2 text-sm">
                    <UserCircle className="h-4 w-4" />
                    <span>{displayName || "未登录"}</span>
                  </div>
                </DropdownItem>
                <div className="my-1 h-px bg-border" />
                <DropdownItem onClick={() => setProfileOpen(true)}>
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    <span>个人资料</span>
                  </div>
                </DropdownItem>
                <DropdownItem onClick={() => setPasswordOpen(true)}>
                  <div className="flex items员 gap-2">
                    <KeyRound className="h-4 w-4" />
                    <span>修改密码</span>
                  </div>
                </DropdownItem>
                <div className="my-1 h-px bg-border" />
                <DropdownItem onClick={() => authService.logout()}>
                  <div className="flex items-center gap-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    <span>退出登录</span>
                  </div>
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        </div>
      </header>

      <Modal isOpen={profileOpen} onClose={() => setProfileOpen(false)} title="个人资料">
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">姓名</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="请输入姓名" />
          </div>
          <div>
            <label className="block text-sm mb-1">邮箱</label>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="请输入邮箱" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setProfileOpen(false)}>取消</Button>
            <Button onClick={handleProfileSave} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)} title="修改密码">
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">原密码</label>
            <Input
              type="password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              placeholder="请输入原密码"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">新密码</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="请输入新密码"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPasswordOpen(false)}>取消</Button>
            <Button onClick={handlePasswordSave} disabled={saving}>
              {saving ? "提交中..." : "提交"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
