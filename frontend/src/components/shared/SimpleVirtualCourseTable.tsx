import { useMemo, useEffect, useRef, useState } from 'react'
import { Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VirtualTable, useVirtualTableColumns, type VirtualTableColumn } from '@/components/ui/virtual-table'
import type { CourseOfferingItem, CourseOfferingStatus } from '@/types/course'

interface SimpleVirtualCourseTableProps {
  offerings: CourseOfferingItem[]
  height?: number
  onViewDetail?: (offering: CourseOfferingItem) => void
  onEdit?: (offering: CourseOfferingItem) => void
  onDelete?: (offering: CourseOfferingItem) => void
  onSelectionChange?: (ids: Set<string>) => void
}

function statusVariant(status: CourseOfferingStatus): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (status) {
    case '开放':
      return 'success'
    case '关闭':
      return 'secondary'
    case '结课':
      return 'outline'
    default:
      return 'default'
  }
}

export function SimpleVirtualCourseTable({ offerings, height = 500, onViewDetail, onEdit, onDelete, onSelectionChange }: SimpleVirtualCourseTableProps) {
  const { createColumn } = useVirtualTableColumns<CourseOfferingItem>()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectAllRef = useRef<HTMLInputElement>(null)

  const isAllSelected = offerings.length > 0 && selectedIds.size === offerings.length
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < offerings.length
  useEffect(() => { if (selectAllRef.current) selectAllRef.current.indeterminate = isIndeterminate }, [isIndeterminate])
  useEffect(() => { onSelectionChange?.(selectedIds) }, [selectedIds])
  useEffect(() => {
    if (selectedIds.size === 0) return
    const idSet = new Set(offerings.map(o => o.id))
    const next = new Set<string>()
    selectedIds.forEach(id => { if (idSet.has(id)) next.add(id) })
    if (next.size !== selectedIds.size) setSelectedIds(next)
  }, [offerings])

  const columns: VirtualTableColumn<CourseOfferingItem>[] = useMemo(() => [
    // 选择列
    createColumn(
      'select',
      (
        <input
          ref={selectAllRef}
          type="checkbox"
          aria-label="select-all"
          checked={isAllSelected}
          onChange={() => { if (isAllSelected) setSelectedIds(new Set()); else setSelectedIds(new Set(offerings.map(o => o.id))) }}
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
    createColumn('courseCode', '课程学段', '10%'),
    createColumn('courseName', '课程名称', '16%', { render: v => <span className="font-medium">{v}</span> }),
    createColumn('teacherName', '授课老师', '12%', { render: (v) => v || '-' }),
    createColumn('className', '班级', '12%', { render: (v) => v || '-' }),
    createColumn('weeklyHours', '周课时', '10%'),
    createColumn('status', '状态', '10%', { render: (v) => <Badge variant={statusVariant(v as any)} className="text-xs">{v}</Badge> }),
    createColumn('actions', '操作', '20%', {
      render: (_v, record) => (
        <div className="flex items-center gap-1 justify-center">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); onViewDetail?.(record) }} title="查看详情"><Eye className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); onEdit?.(record) }} title="编辑"><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={(e) => { e.stopPropagation(); onDelete?.(record) }} title="删除"><Trash2 className="w-4 h-4" /></Button>
        </div>
      )
    })
  ], [createColumn, onViewDetail, onEdit, onDelete, selectedIds, isAllSelected, offerings])

  if (offerings.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium">暂无课程数据</p>
        <p className="text-sm">请添加课程或调整筛选条件</p>
      </div>
    )
  }

  return (
    <VirtualTable
      data={offerings}
      columns={columns}
      height={height}
      itemHeight={56}
      onRowClick={(record) => onViewDetail?.(record)}
      emptyText="暂无课程数据"
      className="w-full"
    />
  )
}


