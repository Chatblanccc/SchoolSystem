import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectItem } from "@/components/ui/select"
import type { StudentStatus, Gender } from "@/types/student"
import type { ClassItem } from "@/types/class"
import { classService } from "@/services/classService"

interface StudentFormValues {
  name: string
  studentId: string
  gender: Gender
  classId: string
  status: StudentStatus
  idCardNumber?: string
  guangzhouStudentId?: string
  nationalStudentId?: string
  birthDate?: string
  homeAddress?: string
}

interface StudentFormModalProps {
  isOpen: boolean
  title?: string
  defaultValues?: Partial<StudentFormValues>
  initialClassName?: string
  onClose: () => void
  onSubmit: (values: StudentFormValues) => Promise<void> | void
  submitting?: boolean
}

export function StudentFormModal({ isOpen, title = "新增学生", defaultValues, initialClassName, onClose, onSubmit, submitting }: StudentFormModalProps) {
  const [values, setValues] = useState<StudentFormValues>({
    name: "",
    studentId: "",
    gender: "男",
    classId: "",
    status: "在校",
    idCardNumber: "",
    guangzhouStudentId: "",
    nationalStudentId: "",
    birthDate: "",
    homeAddress: "",
  })

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [_loadingClasses, setLoadingClasses] = useState(false)

  useEffect(() => {
    if (defaultValues) {
      setValues((prev) => ({
        ...prev,
        ...defaultValues,
        // 确保未提供的可选字段以空字符串呈现，避免受控输入显示空
        idCardNumber: defaultValues.idCardNumber ?? prev.idCardNumber,
        guangzhouStudentId: defaultValues.guangzhouStudentId ?? prev.guangzhouStudentId,
        nationalStudentId: defaultValues.nationalStudentId ?? prev.nationalStudentId,
        birthDate: defaultValues.birthDate ?? prev.birthDate,
        homeAddress: defaultValues.homeAddress ?? prev.homeAddress,
      }))
    }
  }, [defaultValues])

  // 打开弹窗时加载班级列表
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoadingClasses(true)
        const res = await classService.getClasses({ page: 1, pageSize: 200 })
        setClasses(res.classes)
        // 如果是编辑且未设置 classId，但提供了班级名称，则根据名称匹配设定默认 classId
        if (!values.classId && initialClassName) {
          const matched = res.classes.find(c => c.name === initialClassName)
          if (matched) setValues(prev => ({ ...prev, classId: matched.id }))
        }
      } catch (e) {
        console.error('加载班级失败', e)
      } finally {
        setLoadingClasses(false)
      }
    }
    if (isOpen) loadClasses()
  }, [isOpen, initialClassName])

  if (!isOpen) return null

  const close = () => {
    if (submitting) return
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.name || !values.studentId) { alert("请填写姓名与学号"); return }
    if (!values.classId) { alert("请选择班级"); return }
    await onSubmit(values)
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="relative w-full max-w-2xl mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={close} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm mb-1">姓名</div>
              <Input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="请输入姓名" />
            </div>
            <div>
              <div className="text-sm mb-1">学号</div>
              <Input value={values.studentId} onChange={(e) => setValues({ ...values, studentId: e.target.value })} placeholder="如 202501001" />
            </div>
            <div>
              <div className="text-sm mb-1">性别</div>
              <Select value={values.gender} onValueChange={(v) => setValues({ ...values, gender: v as Gender })} className="w-full">
                <SelectItem value="男">男</SelectItem>
                <SelectItem value="女">女</SelectItem>
              </Select>
            </div>
            <div>
              <div className="text-sm mb-1">班级</div>
              <Select value={values.classId} onValueChange={(v) => setValues({ ...values, classId: v })} className="w-full">
                <SelectItem value="">请选择班级</SelectItem>
                {classes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <div className="text-sm mb-1">状态</div>
              <Select value={values.status} onValueChange={(v) => setValues({ ...values, status: v as StudentStatus })} className="w-full">
                <SelectItem value="在校">在校</SelectItem>
                <SelectItem value="请假">请假</SelectItem>
                <SelectItem value="转学">转学</SelectItem>
                <SelectItem value="休学">休学</SelectItem>
                <SelectItem value="毕业">毕业</SelectItem>
              </Select>
            </div>
            <div>
              <div className="text-sm mb-1">身份证号</div>
              <Input value={values.idCardNumber || ''} onChange={(e) => setValues({ ...values, idCardNumber: e.target.value })} />
            </div>
            <div>
              <div className="text-sm mb-1">市学籍号</div>
              <Input value={values.guangzhouStudentId || ''} onChange={(e) => setValues({ ...values, guangzhouStudentId: e.target.value })} />
            </div>
            <div>
              <div className="text-sm mb-1">国学籍号</div>
              <Input value={values.nationalStudentId || ''} onChange={(e) => setValues({ ...values, nationalStudentId: e.target.value })} />
            </div>
            <div>
              <div className="text-sm mb-1">出生日期</div>
              <Input type="date" value={values.birthDate || ''} onChange={(e) => setValues({ ...values, birthDate: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <div className="text-sm mb-1">家庭住址</div>
              <Input value={values.homeAddress || ''} onChange={(e) => setValues({ ...values, homeAddress: e.target.value })} />
            </div>
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


