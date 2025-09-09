import { useMemo, useState, useEffect, useRef } from "react"
import { Eye, Users as UsersIcon, Edit, Trash2, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VirtualTable, useVirtualTableColumns, type VirtualTableColumn } from "@/components/ui/virtual-table"
import type { ClassItem, ClassStatus } from "@/types/class"

interface SimpleVirtualClassTableProps {
  classes: ClassItem[]
  onEdit?: (classItem: ClassItem) => void
  onDelete?: (classItem: ClassItem) => void
  onViewDetail?: (classItem: ClassItem) => void
  onViewStudents?: (classItem: ClassItem) => void
  onAssignHeadTeacher?: (classItem: ClassItem) => void
  height?: number
}

function getStatusVariant(status: ClassStatus): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" {
  switch (status) {
    case '在读':
      return 'success'
    case '已结班':
      return 'secondary'
    case '归档':
      return 'outline'
    default:
      return 'default'
  }
}

export function SimpleVirtualClassTable({
  classes,
  onEdit,
  onDelete,
  onViewDetail,
  onViewStudents,
  onAssignHeadTeacher,
  height = 500
}: SimpleVirtualClassTableProps) {
  const { createColumn } = useVirtualTableColumns<ClassItem>()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectAllRef = useRef<HTMLInputElement>(null)

  // 同步 indeterminate 状态
  const isAllSelected = classes.length > 0 && selectedIds.size === classes.length
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < classes.length
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  // 数据变化时清理无效选中项
  useEffect(() => {
    if (selectedIds.size === 0) return
    const idSet = new Set(classes.map(c => c.id))
    const next = new Set<string>()
    selectedIds.forEach(id => { if (idSet.has(id)) next.add(id) })
    if (next.size !== selectedIds.size) setSelectedIds(next)
  }, [classes])

  const columns: VirtualTableColumn<ClassItem>[] = useMemo(() => [
    // 选择列（第一列）：联动全选/单选
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
            else setSelectedIds(new Set(classes.map(c => c.id)))
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
    createColumn('code', '编码', '6%', {
      render: (value) => <span className="font-mono text-xs md:text-sm">{value}</span>
    }),
    createColumn('name', '名称', '14%', {
      render: (value) => <span className="font-medium">{value}</span>
    }),
    createColumn('grade', '年级', '10%'),
    createColumn('headTeacherName', '班主任', '16%', {
      render: (value) => value || '-'
    }),
    createColumn('studentCount', '人数/容量', '14%', {
      render: (_, record) => (
        <span className="font-medium">{record.studentCount}/{record.capacity}</span>
      )
    }),
    createColumn('status', '状态', '14%', {
      render: (value) => (
        <Badge variant={getStatusVariant(value)} className="text-xs">{value}</Badge>
      )
    }),
    createColumn('actions', '操作', '20%', {
      render: (_, record) => (
        <div className="flex items-center gap-1 justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => { e.stopPropagation(); onAssignHeadTeacher?.(record) }}
            title="设置班主任"
            aria-label="设置班主任"
          >
            <UserCheck className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => { e.stopPropagation(); onViewDetail?.(record) }}
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => { e.stopPropagation(); onViewStudents?.(record) }}
            title="查看学生"
          >
            <UsersIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => { e.stopPropagation(); onEdit?.(record) }}
            title="编辑"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={(e) => { e.stopPropagation(); onDelete?.(record) }}
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    })
  ], [createColumn, onEdit, onDelete, onViewDetail, onViewStudents, selectedIds, isAllSelected, classes])

  if (classes.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
            <UsersIcon className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium">暂无班级数据</p>
          <p className="text-sm">请添加班级或调整筛选条件</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <VirtualTable
        data={classes}
        columns={columns}
        height={height}
        itemHeight={56}
        onRowClick={(record) => onViewDetail?.(record)}
        emptyText="暂无班级数据"
        className="w-full"
      />
      <div className="text-xs text-muted-foreground text-center">
        <p>💡 提示：点击行查看详情，仅渲染可见行以保证流畅性能</p>
      </div>
    </div>
  )
}


