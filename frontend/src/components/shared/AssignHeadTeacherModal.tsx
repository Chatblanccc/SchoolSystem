import { useEffect, useState } from 'react'
import { X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectItem } from '@/components/ui/select'
import { teacherService } from '@/services/teacherService'
import type { TeacherItem } from '@/types/teacher'

interface AssignHeadTeacherModalProps {
  isOpen: boolean
  classNameText: string
  onClose: () => void
  onConfirm: (teacherId: string | null) => Promise<void> | void
}

export function AssignHeadTeacherModal({ isOpen, classNameText, onClose, onConfirm }: AssignHeadTeacherModalProps) {
  const [search, setSearch] = useState('')
  const [teachers, setTeachers] = useState<TeacherItem[]>([])
  const [teacherId, setTeacherId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const load = async () => {
      try {
        setLoading(true)
        const { teachers } = await teacherService.getTeachers({ page: 1, pageSize: 50, search })
        setTeachers(teachers)
      } catch (e) {
        console.error('加载教师失败', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isOpen, search])

  if (!isOpen) return null

  const close = () => { if (!loading) onClose() }

  const handleConfirm = async () => {
    await onConfirm(teacherId || null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="relative w-full max-w-lg mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">设置班主任 · {classNameText}</h3>
          <Button variant="ghost" size="sm" onClick={close} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Input placeholder="搜索姓名/工号/手机号" value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
            <Button variant="outline" onClick={() => setSearch(search)}>搜索</Button>
          </div>
          <div>
            <div className="text-sm mb-1">教师</div>
            <Select value={teacherId} onValueChange={(v) => setTeacherId(v)} className="w-full">
              <SelectItem value="">不设置（清空班主任）</SelectItem>
              {teachers.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}（{t.teacherId}）</SelectItem>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t">
          <Button variant="outline" onClick={close}>取消</Button>
          <Button onClick={handleConfirm} disabled={loading}>{loading ? '提交中...' : '确认'}</Button>
        </div>
      </div>
    </div>
  )
}


