import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface UserFormValues {
  username: string
  name: string
  email?: string
  isActive: boolean
  isStaff: boolean
  password?: string
}

interface UserFormModalProps {
  isOpen: boolean
  title?: string
  defaultValues?: Partial<UserFormValues>
  onClose: () => void
  onSubmit: (values: UserFormValues) => Promise<void> | void
  submitting?: boolean
}

export function UserFormModal({ isOpen, title = "新增用户", defaultValues, onClose, onSubmit, submitting }: UserFormModalProps) {
  const [values, setValues] = useState<UserFormValues>({
    username: "",
    name: "",
    email: "",
    isActive: true,
    isStaff: false,
    password: "",
  })

  useEffect(() => {
    if (defaultValues) {
      setValues((prev) => ({
        ...prev,
        ...defaultValues,
        name: defaultValues.name ?? prev.name,
        email: defaultValues.email ?? prev.email,
        password: defaultValues.password ?? "",
      }))
    }
  }, [defaultValues])

  if (!isOpen) return null

  const close = () => {
    if (submitting) return
    onClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedUsername = values.username.trim()
    const trimmedName = values.name.trim()
    const trimmedEmail = values.email?.trim() ?? ""
    const isEdit = title === "编辑用户"

    if (!trimmedUsername) {
      alert("请填写用户名")
      return
    }
    if (!trimmedName) {
      alert("请填写姓名")
      return
    }
    if (!isEdit && !values.password) {
      alert("请填写密码")
      return
    }

    await onSubmit({
      ...values,
      username: trimmedUsername,
      name: trimmedName,
      email: trimmedEmail,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div className="relative w-full max-w-xl mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={close} className="h-8 w-8 p-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm mb-1">用户名</div>
              <Input
                value={values.username}
                onChange={(event) => setValues({ ...values, username: event.target.value })}
                placeholder="必填"
              />
            </div>
            <div>
              <div className="text-sm mb-1">姓名</div>
              <Input
                value={values.name}
                onChange={(event) => setValues({ ...values, name: event.target.value })}
                placeholder="必填"
              />
            </div>
            <div>
              <div className="text-sm mb-1">邮箱</div>
              <Input
                type="email"
                value={values.email || ""}
                onChange={(event) => setValues({ ...values, email: event.target.value })}
                placeholder="可选"
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={values.isActive}
                  onChange={(event) => setValues({ ...values, isActive: event.target.checked })}
                />
                激活
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={values.isStaff}
                  onChange={(event) => setValues({ ...values, isStaff: event.target.checked })}
                />
                管理员
              </label>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm mb-1">
                密码
                {title === "编辑用户" ? <span className="ml-2 text-xs text-muted-foreground">（留空则不修改）</span> : null}
              </div>
              <Input
                type="password"
                value={values.password || ""}
                onChange={(event) => setValues({ ...values, password: event.target.value })}
                placeholder={title === "编辑用户" ? "可留空" : "必填"}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button variant="outline" type="button" onClick={close}>
              取消
            </Button>
            <Button type="submit" disabled={!!submitting}>
              {submitting ? "提交中..." : "提交"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
