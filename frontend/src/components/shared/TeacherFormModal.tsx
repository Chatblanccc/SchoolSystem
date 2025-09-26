import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { EmploymentStatus, EmploymentType } from '@/types/teacher'

interface TeacherFormValues {
  teacherId: string
  name: string
  gender: '男' | '女'
  phone: string
  email?: string
  idCard: string
  employmentStatus: EmploymentStatus
  employmentType: EmploymentType
  remark?: string
}

interface TeacherFormModalProps {
  isOpen: boolean
  title?: string
  defaultValues?: Partial<TeacherFormValues>
  onClose: () => void
  onSubmit: (values: TeacherFormValues) => Promise<void> | void
  submitting?: boolean
}

export function TeacherFormModal({ isOpen, title = '新增教师', defaultValues, onClose, onSubmit, submitting }: TeacherFormModalProps) {
  const [values, setValues] = useState<TeacherFormValues>({
    teacherId: '',
    name: '',
    gender: '男',
    phone: '',
    email: '',
    idCard: '',
    employmentStatus: '在职',
    employmentType: '全职',
    remark: '',
  })

  useEffect(() => {
    if (defaultValues) setValues((prev) => ({ ...prev, ...defaultValues }))
  }, [defaultValues])

  if (!isOpen) return null

  const close = () => { if (!submitting) onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.teacherId || !values.name || !values.phone || !values.idCard) { alert('请填写必填项：工号、姓名、手机号、身份证号'); return }
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
              <div className="text-sm mb-1">工号</div>
              <Input value={values.teacherId} onChange={(e) => setValues({ ...values, teacherId: e.target.value })} placeholder="唯一工号" />
            </div>
            <div>
              <div className="text-sm mb-1">姓名</div>
              <Input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="姓名" />
            </div>
            <div>
              <div className="text-sm mb-1">性别</div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="gender" checked={values.gender==='男'} onChange={() => setValues({ ...values, gender: '男' })} />男</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="gender" checked={values.gender==='女'} onChange={() => setValues({ ...values, gender: '女' })} />女</label>
              </div>
            </div>
            <div>
              <div className="text-sm mb-1">手机号</div>
              <Input value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} placeholder="11位手机号" />
            </div>
            <div>
              <div className="text-sm mb-1">邮箱</div>
              <Input value={values.email || ''} onChange={(e) => setValues({ ...values, email: e.target.value })} placeholder="可选" />
            </div>
            <div>
              <div className="text-sm mb-1">身份证号</div>
              <Input value={values.idCard} onChange={(e) => setValues({ ...values, idCard: e.target.value })} placeholder="身份证号码" />
            </div>
            <div>
              <div className="text-sm mb-1">用工类型</div>
              <select className="w-full h-10 px-3 rounded-md border bg-background" value={values.employmentType} onChange={(e) => setValues({ ...values, employmentType: e.target.value as EmploymentType })}>
                <option value="全职">全职</option>
                <option value="兼职">兼职</option>
                <option value="外聘">外聘</option>
              </select>
            </div>
            <div>
              <div className="text-sm mb-1">在职状态</div>
              <select className="w-full h-10 px-3 rounded-md border bg-background" value={values.employmentStatus} onChange={(e) => setValues({ ...values, employmentStatus: e.target.value as EmploymentStatus })}>
                <option value="在职">在职</option>
                <option value="试用">试用</option>
                <option value="停职">停职</option>
                <option value="离职">离职</option>
              </select>
            </div>
          </div>
          <div>
            <div className="text-sm mb-1">备注</div>
            <Input value={values.remark || ''} onChange={(e) => setValues({ ...values, remark: e.target.value })} placeholder="可选" />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button variant="outline" type="button" onClick={close}>取消</Button>
            <Button type="submit" disabled={!!submitting}>{submitting ? '提交中...' : '提交'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}


