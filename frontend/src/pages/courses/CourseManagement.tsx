import { useEffect, useState } from 'react'
import { Search, Upload, Download, Settings, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectItem } from '@/components/ui/select'
import { CompactTableSettings } from '@/components/shared/CompactTableSettings'
import { Pagination } from '@/components/shared/Pagination'
import { SimpleVirtualCourseTable } from '@/components/shared/SimpleVirtualCourseTable'
import { CourseFormModal } from '@/components/shared/CourseFormModal'
import { CourseImportModal } from '@/components/shared/CourseImportModal'
import { courseService } from '@/services/courseService'
import type { CourseOfferingItem, CourseQueryParams, PaginatedCourseOfferings } from '@/types/course'

export default function CourseManagement() {
  const [offerings, setOfferings] = useState<CourseOfferingItem[]>([])
  const [nameCache, setNameCache] = useState<Record<string, { teacherName?: string; className?: string }>>({})
  const [loading, setLoading] = useState(false)
  const [tableHeight, setTableHeight] = useState(500)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [query, setQuery] = useState<CourseQueryParams>({ page: 1, pageSize: 20, search: '', grade: '', className: '', teacherId: '', status: undefined })
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const res: PaginatedCourseOfferings = await courseService.getCourseOfferings(query)
      // 用本地缓存名称进行兜底显示
      const filled = res.courseOfferings.map(o => {
        const cache = nameCache[o.id]
        return cache ? { ...o, teacherName: o.teacherName || cache.teacherName, className: o.className || cache.className } : o
      })
      setOfferings(filled)
      setPagination(res.pagination)
    } catch (e) {
      console.error('加载课程失败', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [query.page, query.pageSize, query.search, query.grade, query.className, query.teacherId, query.status])

  const handleSearch = (search: string) => setQuery(prev => ({ ...prev, search, page: 1 }))
  const handleFilter = (key: keyof CourseQueryParams, value: string) => setQuery(prev => ({ ...prev, [key]: value === '' ? undefined : value, page: 1 }))
  const handlePageChange = (page: number) => setQuery(prev => ({ ...prev, page }))
  const handlePageSizeChange = (pageSize: number) => { setQuery(prev => ({ ...prev, pageSize, page: 1 })); setPagination(prev => ({ ...prev, pageSize })) }
  const handleTableHeightChange = (height: number) => setTableHeight(height)
  const handleRefresh = () => loadData()

  return (
    <div className="space-y-6">
      {/* 操作栏 + 筛选栏（简洁） */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新增课程
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            导入
          </Button>
          <Button variant="outline" onClick={() => courseService.exportCourseOfferings({ 
            search: query.search, grade: query.grade, className: query.className, teacherId: query.teacherId, status: query.status 
          })}>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button variant="outline" onClick={() => alert('批量操作（后续实现）')}>
            <Settings className="w-4 h-4 mr-2" />
            批量操作
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <CompactTableSettings
            pageSize={pagination.pageSize}
            onPageSizeChange={handlePageSizeChange}
            tableHeight={tableHeight}
            onTableHeightChange={handleTableHeightChange}
            onRefresh={handleRefresh}
            refreshing={loading}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Input placeholder="搜索课程/老师/班级" className="w-64" icon={<Search className="w-4 h-4" />} value={query.search || ''} onChange={(e) => handleSearch(e.target.value)} />
          <Select placeholder="年级" value={query.grade || ''} onValueChange={(v) => handleFilter('grade', v)} className="w-32">
            <SelectItem value="">全部年级</SelectItem>
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
          <Select placeholder="状态" value={query.status || ''} onValueChange={(v) => handleFilter('status', v)} className="w-32">
            <SelectItem value="">全部状态</SelectItem>
            <SelectItem value="开放">开放</SelectItem>
            <SelectItem value="关闭">关闭</SelectItem>
            <SelectItem value="结课">结课</SelectItem>
          </Select>
          {/* 移除星期筛选 */}
        </div>
      </div>

      {/* 表格 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">加载数据中...</span>
          </div>
        </div>
      ) : (
        <SimpleVirtualCourseTable
          offerings={offerings}
          height={tableHeight}
          onViewDetail={(o) => alert(`查看 ${o.courseName}`)}
          onEdit={(o) => alert(`编辑 ${o.courseName}`)}
          onDelete={(o) => alert(`删除 ${o.courseName}`)}
        />
      )}

      {/* 分页 */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        totalItems={pagination.total}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        showInfo={true}
        showPageSizeSelector={false}
      />

      {/* 新增课程弹窗 */}
      <CourseFormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (values) => {
          try {
            const created = await courseService.createCourseOffering({
              courseCode: values.courseCode,
              courseName: values.courseName,
              category: values.category,
              weeklyHours: values.weeklyHours,
              status: values.status,
              remark: values.remark,
              teacherId: values.teacherId,
              classId: values.classId,
              teacherName: values.teacherName,
              className: values.className,
            })
            // 缓存选中的教师/班级名称，用于列表兜底显示
            setNameCache(prev => ({
              ...prev,
              [created.id]: { teacherName: values.teacherName, className: values.className }
            }))
            setAddOpen(false)
            loadData()
          } catch (e) {
            alert('创建失败，请检查表单信息或稍后重试')
          }
        }}
      />

      {/* 导入课程弹窗 */}
      <CourseImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => loadData()}
      />
    </div>
  )
}


