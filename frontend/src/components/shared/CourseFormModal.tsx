import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectItem } from '@/components/ui/select'
import { teacherService } from '@/services/teacherService'
import { classService } from '@/services/classService'
import type { TeacherItem } from '@/types/teacher'
import type { ClassItem } from '@/types/class'

interface CourseFormValues {
  courseCode: string
  courseName: string
  category: '必修' | '选修'
  weeklyHours?: number
  teacherId?: string
  teacherName?: string
  classId?: string
  className?: string
  weekday?: string
  periods?: string
  room?: string
  enrollType?: '必修' | '选修'
  status: '开放' | '关闭' | '结课'
  remark?: string
}

interface CourseFormModalProps {
  isOpen: boolean
  title?: string
  defaultValues?: Partial<CourseFormValues>
  onClose: () => void
  onSubmit: (values: CourseFormValues) => Promise<void> | void
  submitting?: boolean
  requireAssignment?: boolean
}

export function CourseFormModal({ isOpen, title = '新增开课', defaultValues, onClose, onSubmit, submitting, requireAssignment = true }: CourseFormModalProps) {
  const [values, setValues] = useState<CourseFormValues>({
    courseCode: '',
    courseName: '',
    category: '必修',
    weeklyHours: 1,
    teacherId: '',
    teacherName: '',
    classId: '',
    className: '',
    weekday: '',
    periods: '',
    room: '',
    enrollType: '必修',
    status: '开放',
    remark: ''
  })

  const [teacherOptions, setTeacherOptions] = useState<TeacherItem[]>([])
  const [classOptions, setClassOptions] = useState<ClassItem[]>([])
  const [, setLoadingOptions] = useState(false)

  useEffect(() => { if (defaultValues) setValues(prev => ({ ...prev, ...defaultValues })) }, [defaultValues])
  useEffect(() => {
    if (!isOpen) return
    const loadOptions = async () => {
      try {
        setLoadingOptions(true)
        const [teachersRes, classesRes] = await Promise.all([
          teacherService.getTeachers({ page: 1, pageSize: 200 }),
          classService.getClasses({ page: 1, pageSize: 200 })
        ])
        setTeacherOptions(teachersRes.teachers)
        setClassOptions(classesRes.classes)
        // 根据名称尝试回填 teacherId/classId（用于编辑场景）
        setValues(prev => {
          let nextTeacherId = prev.teacherId
          let nextTeacherName = prev.teacherName
          if (!nextTeacherId && (prev.teacherName || defaultValues?.teacherName)) {
            const targetName = (prev.teacherName || defaultValues?.teacherName || '').trim()
            const t = teachersRes.teachers.find(t => t.name === targetName)
            if (t) { nextTeacherId = t.id; nextTeacherName = t.name }
          }
          let nextClassId = prev.classId
          let nextClassName = prev.className
          if (!nextClassId && (prev.className || defaultValues?.className)) {
            const targetName = (prev.className || defaultValues?.className || '').trim()
            const c = classesRes.classes.find(c => c.name === targetName)
            if (c) { nextClassId = c.id; nextClassName = c.name }
          }
          return { ...prev, teacherId: nextTeacherId, teacherName: nextTeacherName, classId: nextClassId, className: nextClassName }
        })
      } catch (e) {
        console.error('加载教师/班级选项失败', e)
      } finally {
        setLoadingOptions(false)
      }
    }
    loadOptions()
  }, [isOpen])
  if (!isOpen) return null

  const close = () => { if (!submitting) onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.courseCode || !values.courseName) { alert('请填写课程编码与名称'); return }
    if (requireAssignment) {
      if (!values.teacherId) { alert('请选择授课老师'); return }
      if (!values.classId) { alert('请选择班级'); return }
    }
    await onSubmit(values)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="relative w-full max-w-2xl mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={close} className="h-8 w-8 p-0"><X className="w-4 h-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm mb-1">课程学段</div>
              <Select value={values.courseCode} onValueChange={(v) => setValues({ ...values, courseCode: v })} className="w-full">
                <SelectItem value="">请选择</SelectItem>
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
              <div className="text-sm mb-1">课程名称</div>
              <Input value={values.courseName} onChange={(e) => setValues({ ...values, courseName: e.target.value })} placeholder="如 七年级数学" />
            </div>
            <div>
              <div className="text-sm mb-1">课程类型</div>
              <Select value={values.category} onValueChange={(v) => setValues({ ...values, category: v as any })} className="w-full">
                <SelectItem value="必修">必修</SelectItem>
                <SelectItem value="选修">选修</SelectItem>
              </Select>
            </div>

            <div>
              <div className="text-sm mb-1">授课老师</div>
              <Select value={values.teacherId || ''} onValueChange={(v) => {
                const t = teacherOptions.find(t => t.id === v)
                setValues({ ...values, teacherId: v, teacherName: t?.name || '' })
              }} className="w-full">
                <SelectItem value="">请选择</SelectItem>
                {teacherOptions.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <div className="text-sm mb-1">班级</div>
              <Select value={values.classId || ''} onValueChange={(v) => {
                const c = classOptions.find(c => c.id === v)
                setValues({ ...values, classId: v, className: c?.name || '' })
              }} className="w-full">
                <SelectItem value="">请选择</SelectItem>
                {classOptions.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </Select>
            </div>

            <div>
              <div className="text-sm mb-1">周课时</div>
              <Input type="number" min={1} step={1} value={values.weeklyHours || 1} onChange={(e) => setValues({ ...values, weeklyHours: Number(e.target.value || 1) })} placeholder="如 4" />
            </div>

            {/* 移除选课类型 */}
            <div>
              <div className="text-sm mb-1">状态</div>
              <Select value={values.status} onValueChange={(v) => setValues({ ...values, status: v as any })} className="w-full">
                <SelectItem value="开放">开放</SelectItem>
                <SelectItem value="关闭">关闭</SelectItem>
                <SelectItem value="结课">结课</SelectItem>
              </Select>
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


