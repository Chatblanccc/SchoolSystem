import { useMemo, useEffect, useRef, useState } from 'react'
import { Edit, Trash2, Eye, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VirtualTable, useVirtualTableColumns, type VirtualTableColumn } from '@/components/ui/virtual-table'
import type { TeacherItem } from '@/types/teacher'

interface SimpleVirtualTeacherTableProps {
  teachers: TeacherItem[]
  height?: number
  onViewDetail?: (teacher: TeacherItem) => void
  onEdit?: (teacher: TeacherItem) => void
  onDelete?: (teacher: TeacherItem) => void
  onAssignAsHeadTeacher?: (teacher: TeacherItem) => void
  onSelectionChange?: (ids: Set<string>) => void
}

function statusVariant(status: TeacherItem['employmentStatus']): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (status) {
    case '在职':
      return 'success'
    case '试用':
      return 'warning'
    case '停职':
      return 'outline'
    case '离职':
      return 'secondary'
    default:
      return 'default'
  }
}

export function SimpleVirtualTeacherTable({ teachers, height = 500, onViewDetail, onEdit, onDelete, onAssignAsHeadTeacher, onSelectionChange }: SimpleVirtualTeacherTableProps) {
  const { createColumn } = useVirtualTableColumns<TeacherItem>()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectAllRef = useRef<HTMLInputElement>(null)

  const isAllSelected = teachers.length > 0 && selectedIds.size === teachers.length
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < teachers.length
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  useEffect(() => {
    if (selectedIds.size === 0) return
    const idSet = new Set(teachers.map(t => t.id))
    const next = new Set<string>()
    selectedIds.forEach(id => { if (idSet.has(id)) next.add(id) })
    if (next.size !== selectedIds.size) setSelectedIds(next)
  }, [teachers])

  useEffect(() => { onSelectionChange?.(selectedIds) }, [selectedIds])

  const columns: VirtualTableColumn<TeacherItem>[] = useMemo(() => [
    // 选择列
    createColumn(
      'select',
      (
        <input
          ref={selectAllRef}
          type="checkbox"
          aria-label="select-all"
          checked={isAllSelected}
          onChange={() => {
            if (isAllSelected) setSelectedIds(new Set())
            else setSelectedIds(new Set(teachers.map(t => t.id)))
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      48,
      {
        render: (_value, record) => (
          <input
            type="checkbox"
            checked={selectedIds.has(record.id)}
            onChange={() => {
              setSelectedIds(prev => {
                const next = new Set(prev)
                if (next.has(record.id)) next.delete(record.id)
                else next.add(record.id)
                return next
              })
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        className: 'min-w-[48px]'
      }
    ),
    createColumn('teacherId', '工号', '10%', { render: (v) => <span className="font-mono text-xs md:text-sm">{v}</span> }),
    createColumn('name', '姓名', '14%', { render: (v) => <span className="font-medium">{v}</span> }),
    createColumn('gender', '性别', '8%'),
    createColumn('phone', '手机号', '18%'),
    createColumn('employmentType', '用工', '12%'),
    createColumn('employmentStatus', '状态', '12%', { render: (v) => <Badge variant={statusVariant(v as any)} className="text-xs">{v}</Badge> }),
    createColumn('actions', '操作', '20%', {
      render: (_, record) => (
        <div className="flex items-center gap-1 justify-center">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); onAssignAsHeadTeacher?.(record) }} title="设为班主任"><UserCheck className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); onViewDetail?.(record) }} title="查看详情"><Eye className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); onEdit?.(record) }} title="编辑"><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={(e) => { e.stopPropagation(); onDelete?.(record) }} title="删除"><Trash2 className="w-4 h-4" /></Button>
        </div>
      )
    })
  ], [createColumn, onViewDetail, onEdit, onDelete, onAssignAsHeadTeacher, selectedIds, isAllSelected, teachers])

  if (teachers.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium">暂无教师数据</p>
        <p className="text-sm">请添加教师或调整筛选条件</p>
      </div>
    )
  }

  return (
    <VirtualTable
      data={teachers}
      columns={columns}
      height={height}
      itemHeight={56}
      onRowClick={(record) => onViewDetail?.(record)}
      emptyText="暂无教师数据"
      className="w-full"
    />
  )
}


