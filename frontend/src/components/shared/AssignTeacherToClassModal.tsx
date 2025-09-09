import React, { useEffect, useState } from 'react'
import { X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectItem } from '@/components/ui/select'
import { classService } from '@/services/classService'
import type { ClassItem } from '@/types/class'

interface AssignTeacherToClassModalProps {
  isOpen: boolean
  teacherName: string
  onClose: () => void
  onConfirm: (classId: string | null) => Promise<void> | void
}

export function AssignTeacherToClassModal({ isOpen, teacherName, onClose, onConfirm }: AssignTeacherToClassModalProps) {
  const [search, setSearch] = useState('')
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [classId, setClassId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const load = async () => {
      try {
        setLoading(true)
        const { classes } = await classService.getClasses({ page: 1, pageSize: 50, search })
        setClasses(classes)
      } catch (e) {
        console.error('加载班级失败', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isOpen, search])

  if (!isOpen) return null

  const close = () => { if (!loading) onClose() }

  const handleConfirm = async () => {
    await onConfirm(classId || null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="relative w-full max-w-lg mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">将教师「{teacherName}」设为班主任</h3>
          <Button variant="ghost" size="sm" onClick={close} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Input placeholder="搜索班级名称/编码" value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
            <Button variant="outline" onClick={() => setSearch(search)}>搜索</Button>
          </div>
          <div>
            <div className="text-sm mb-1">班级</div>
            <Select value={classId} onValueChange={(v) => setClassId(v)} className="w-full">
              <SelectItem value="">不选择（仅关闭）</SelectItem>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}（{c.code}）</SelectItem>
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


