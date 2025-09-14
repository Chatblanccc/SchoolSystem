import { useMemo, useEffect, useRef, useState } from "react"
import { Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VirtualTable, useVirtualTableColumns, type VirtualTableColumn } from "@/components/ui/virtual-table"
import type { StudentDetailView, StudentStatus } from "@/types/student"

interface SimpleVirtualStudentTableProps {
  students: StudentDetailView[]
  onEdit?: (student: StudentDetailView) => void
  onDelete?: (student: StudentDetailView) => void
  onViewDetail?: (student: StudentDetailView) => void
  height?: number
  canEdit?: boolean
  canDelete?: boolean
}

// 获取状态对应的 Badge 样式
function getStatusVariant(status: StudentStatus): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" {
  switch (status) {
    case '在校':
      return 'success'
    case '请假':
      return 'warning'
    case '转学':
      return 'info'
    case '休学':
      return 'secondary'
    case '毕业':
      return 'outline'
    default:
      return 'default'
  }
}

export function SimpleVirtualStudentTable({ 
  students, 
  onEdit, 
  onDelete, 
  onViewDetail,
  height = 500,
  canEdit = true,
  canDelete = true,
}: SimpleVirtualStudentTableProps) {
  const { createColumn } = useVirtualTableColumns<StudentDetailView>()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectAllRef = useRef<HTMLInputElement>(null)

  const isAllSelected = students.length > 0 && selectedIds.size === students.length
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < students.length

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  // 数据变化时清理无效选中项
  useEffect(() => {
    if (selectedIds.size === 0) return
    const idSet = new Set(students.map(s => s.id))
    const next = new Set<string>()
    selectedIds.forEach(id => { if (idSet.has(id)) next.add(id) })
    if (next.size !== selectedIds.size) setSelectedIds(next)
  }, [students, selectedIds])

  // 定义列配置：首列为选择列，固定 48px；其余列均分
  const columns: VirtualTableColumn<StudentDetailView>[] = useMemo(() => [
    createColumn('select', (
      <input
        ref={selectAllRef}
        type="checkbox"
        aria-label="select-all"
        checked={isAllSelected}
        onChange={() => {
          if (isAllSelected) setSelectedIds(new Set())
          else setSelectedIds(new Set(students.map(s => s.id)))
        }}
        onClick={(e) => e.stopPropagation()}
      />
    ), 48, {
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
    }),
    createColumn('studentId', '学号', '13%', {
      render: (value) => <span className="font-medium font-mono">{value}</span>
    }),
    createColumn('name', '姓名', '13%', {
      render: (value) => <span className="font-medium">{value}</span>
    }),
    createColumn('gender', '性别', '16.2%'),
    createColumn('className', '班级', '16.2%', {
      render: (value) => (
        <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs">
          {value}
        </span>
      )
    }),
    createColumn('status', '状态', '16.2%', {
      render: (value) => (
        <Badge variant={getStatusVariant(value)} className="text-xs">
          {value}
        </Badge>
      )
    }),
    createColumn('actions', '操作', '19%', {
      render: (_, record) => (
        <div className="flex items-center gap-1 justify-center">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetail?.(record)
            }}
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {canEdit && (
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(record)
              }}
              title="编辑"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDelete && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(record)
              }}
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )
    })
  ], [createColumn, students, selectedIds, isAllSelected, onEdit, onDelete, onViewDetail, canEdit, canDelete])

  if (students.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
            <Eye className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium">暂无学生数据</p>
          <p className="text-sm">请添加学生或调整筛选条件</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 虚拟化表格 */}
      <VirtualTable
        data={students}
        columns={columns}
        height={height}
        itemHeight={56}
        onRowClick={(record) => {
          onViewDetail?.(record)
        }}
        emptyText="暂无学生数据"
        className="w-full"
      />
      {/* 底部信息 */}
      <div className="text-xs text-muted-foreground text-center">
        <p>💡 提示：点击行查看详情，仅渲染可见行以保证流畅性能</p>
      </div>
    </div>
  )
}
