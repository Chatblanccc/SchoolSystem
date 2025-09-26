import React, { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectItem } from "@/components/ui/select"
import type { ClassItem } from "@/types/class"

interface ClassFormValues {
  name: string
  code: string
  grade: string
  headTeacherName?: string
  capacity: number
  status: "在读" | "已结班" | "归档"
  remark?: string
}

interface ClassFormModalProps {
  isOpen: boolean
  title?: string
  defaultValues?: Partial<ClassFormValues>
  onClose: () => void
  onSubmit: (values: ClassFormValues) => Promise<void> | void
  submitting?: boolean
}

export function ClassFormModal({ isOpen, title = "新增班级", defaultValues, onClose, onSubmit, submitting }: ClassFormModalProps) {
  const [values, setValues] = useState<ClassFormValues>({
    name: "",
    code: "",
    grade: "",
    headTeacherName: "",
    capacity: 50,
    status: "在读",
    remark: "",
  })

  useEffect(() => {
    if (defaultValues) {
      setValues((prev) => ({ ...prev, ...defaultValues }))
    }
  }, [defaultValues])

  if (!isOpen) return null

  const close = () => {
    if (submitting) return
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // 简单校验
    if (!values.name || !values.code) { alert("请填写班级名称与编码"); return }
    if (!values.grade) { alert("请选择年级"); return }
    const cap = Number(values.capacity)
    if (!Number.isFinite(cap) || cap < 1) { alert("容量必须为正整数"); return }
    await onSubmit(values)
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="relative w-full max-w-xl mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={close} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm mb-1">班级名称</div>
              <Input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="如 一年级1班" />
            </div>
            <div>
              <div className="text-sm mb-1">班级编码</div>
              <Input value={values.code} onChange={(e) => setValues({ ...values, code: e.target.value })} placeholder="唯一编码，如 2024-101" />
            </div>
            <div>
              <div className="text-sm mb-1">年级</div>
              <Select value={values.grade} onValueChange={(v) => setValues({ ...values, grade: v })} className="w-full">
                <SelectItem value="">请选择年级</SelectItem>
                <SelectItem value="一年级">一年级</SelectItem>
                <SelectItem value="二年级">二年级</SelectItem>
                <SelectItem value="三年级">三年级</SelectItem>
                <SelectItem value="四年级">四年级</SelectItem>
                <SelectItem value="五年级">五年级</SelectItem>
                <SelectItem value="六年级">六年级</SelectItem>
                <SelectItem value="七年级">七年级</SelectItem>
                <SelectItem value="八年级">八年级</SelectItem>
                <SelectItem value="九年级">九年级</SelectItem>
              </Select>
            </div>
            <div>
              <div className="text-sm mb-1">班主任</div>
              <Input value={values.headTeacherName || ""} onChange={(e) => setValues({ ...values, headTeacherName: e.target.value })} placeholder="如 李老师" />
            </div>
            <div>
              <div className="text-sm mb-1">容量</div>
              <Input type="number" value={values.capacity} min={1} step={1} onChange={(e) => setValues({ ...values, capacity: Number(e.target.value || 50) })} />
            </div>
            <div>
              <div className="text-sm mb-1">状态</div>
              <Select value={values.status} onValueChange={(v) => setValues({ ...values, status: v as any })} className="w-full">
                <SelectItem value="在读">在读</SelectItem>
                <SelectItem value="已结班">已结班</SelectItem>
                <SelectItem value="归档">归档</SelectItem>
              </Select>
            </div>
          </div>
          <div>
            <div className="text-sm mb-1">备注</div>
            <Input value={values.remark || ""} onChange={(e) => setValues({ ...values, remark: e.target.value })} placeholder="可选" />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button variant="outline" type="button" onClick={close}>取消</Button>
            <Button type="submit" disabled={!!submitting}>{submitting ? "提交中..." : "提交"}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}


