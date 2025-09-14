import { Bell, Search, User, LogOut, UserCircle, UserCog, KeyRound } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useEffect, useState } from "react"
import { authService } from "@/services/authService"
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/dropdown"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { toast } from "@/hooks/use-toast"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function Header() {
  const [displayName, setDisplayName] = useState<string>("")
  const [profileOpen, setProfileOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const user = await authService.getCurrentUser()
      if (mounted) {
        setDisplayName(user?.name || user?.username || "未登录")
        setFirstName((user as any)?.first_name || "")
        setLastName((user as any)?.last_name || "")
        setEmail(user?.email || "")
      }
    })()
    return () => { mounted = false }
  }, [])

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
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          
          <Dropdown>
            <DropdownTrigger className="flex items-center space-x-2 p-2 hover:bg-accent rounded-lg transition-colors">
              <AvatarInitials name={displayName} />
              <span className="text-sm font-medium">{displayName || '加载中...'}</span>
            </DropdownTrigger>
            <DropdownContent className="w-56">
              <div className="px-3 py-2 text-sm text-muted-foreground">已登录</div>
              <DropdownItem>
                <div className="flex items-center gap-2 text-sm">
                  <UserCircle className="h-4 w-4" />
                  <span>{displayName || '未登录'}</span>
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
                <div className="flex items-center gap-2">
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
    {/* 个人资料弹窗 */}
    <Modal isOpen={profileOpen} onClose={() => setProfileOpen(false)} title="个人资料">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">姓</label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="请输入姓" />
          </div>
          <div>
            <label className="block text-sm mb-1">名</label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="请输入名" />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">邮箱</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setProfileOpen(false)}>取消</Button>
          <Button
            onClick={async () => {
              try {
                setSaving(true)
                await authService.updateProfile({ first_name: firstName, last_name: lastName, email })
                const user = await authService.getCurrentUser()
                setDisplayName(user?.name || user?.username || '')
                toast({ title: '已保存', description: '个人资料更新成功' })
                setProfileOpen(false)
              } catch (e: any) {
                toast({ title: '保存失败', description: e?.response?.data?.error?.message || e?.message, variant: 'destructive' })
              } finally {
                setSaving(false)
              }
            }}
            disabled={saving}
          >{saving ? '保存中...' : '保存'}</Button>
        </div>
      </div>
    </Modal>

    {/* 修改密码弹窗 */}
    <Modal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)} title="修改密码">
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">原密码</label>
          <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="请输入原密码" />
        </div>
        <div>
          <label className="block text-sm mb-1">新密码</label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="请输入新密码" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setPasswordOpen(false)}>取消</Button>
          <Button
            onClick={async () => {
              if (!oldPassword || !newPassword) {
                toast({ title: '校验失败', description: '请填写原密码与新密码', variant: 'destructive' })
                return
              }
              try {
                setSaving(true)
                await authService.changePassword({ old_password: oldPassword, new_password: newPassword })
                toast({ title: '修改成功', description: '密码已更新' })
                setPasswordOpen(false)
                setOldPassword('')
                setNewPassword('')
              } catch (e: any) {
                const details = e?.response?.data?.error?.details
                const msg = e?.response?.data?.error?.message || e?.message
                toast({ title: '修改失败', description: details ? JSON.stringify(details) : msg, variant: 'destructive' })
              } finally {
                setSaving(false)
              }
            }}
            disabled={saving}
          >{saving ? '提交中...' : '提交'}</Button>
        </div>
      </div>
    </Modal>
    </>
  )
}
