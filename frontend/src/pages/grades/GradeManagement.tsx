import { useEffect, useMemo, useState } from "react"
import { gradeService } from "@/services/gradeService"
import { classService } from "@/services/classService"
import type { ExamListItem, ScoreSummaryRow } from "@/types/grade"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectItem } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { CompactTableSettings } from "@/components/shared/CompactTableSettings"
import { Pagination } from "@/components/shared/Pagination"
import { ScoreDetailModal } from "@/components/shared/ScoreDetailModal"
import { Download, Upload, Plus, ArrowUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function GradeManagement() {
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [tableHeight, setTableHeight] = useState(520)
  const [search, setSearch] = useState("")
  const [examId, setExamId] = useState<string | undefined>(undefined)
  const [exams, setExams] = useState<ExamListItem[]>([])
  const [classId, setClassId] = useState<string | undefined>(undefined)
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [rows, setRows] = useState<ScoreSummaryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [visibleSubjects, setVisibleSubjects] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<ScoreSummaryRow | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [importMode, setImportMode] = useState<'append'|'overwrite'>('append')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    ;(async () => {
      const res = await gradeService.getExams({ page: 1, pageSize: 200 })
      setExams(res.exams)
      if (!examId && res.exams[0]) setExamId(res.exams[0].id)
    })()
  }, [])

  // 当考试改变时，按年级加载班级下拉
  const currentExam = useMemo(() => exams.find(e => e.id === examId), [exams, examId])
  const currentExamGradeName = currentExam?.gradeName

  useEffect(() => {
    ;(async () => {
      if (!currentExamGradeName) {
        setClasses([])
        setClassId(undefined)
        return
      }
      const res = await classService.getClasses({ page: 1, pageSize: 200, grade: currentExamGradeName })
      setClasses(res.classes.map(c => ({ id: c.id, name: c.name })))
      setClassId(undefined)
    })()
  }, [currentExamGradeName])

  useEffect(() => {
    if (!examId) return
    setLoading(true)
    ;(async () => {
      try {
        const res = await gradeService.getScoreSummary({ examId, classId, search })
        console.log('Score summary response:', res)
        setRows(res)
        // 初始化学科列（仅在首次加载或空时）
        const defaultSubjects = [
          'chinese','math','english','daofa','history','physics','chemistry','geography','biology','total'
        ]
        const detected = defaultSubjects.filter(k => res.some((r: any) => r[k] != null || r[`${k}Rank`] != null))
        setVisibleSubjects(prev => prev.length ? prev : detected)
      } finally {
        setLoading(false)
      }
    })()
  }, [page, pageSize, search, examId, classId, reloadKey])

  // 简化列后无需 dash 渲染器
  const currentExamName = useMemo(() => exams.find(e => e.id === examId)?.name ?? '-', [exams, examId])

  const handleViewDetail = (row: ScoreSummaryRow) => {
    setDetailRecord(row)
    setDetailOpen(true)
  }

  // 排序
  const sortedRows = useMemo(() => {
    if (!sortKey || !sortOrder) return rows
    const safe = [...rows]
    safe.sort((a: any, b: any) => {
      const va = a[sortKey]; const vb = b[sortKey]
      const na = va == null ? -Infinity : Number(va)
      const nb = vb == null ? -Infinity : Number(vb)
      if (Number.isNaN(na) && Number.isNaN(nb)) return 0
      if (Number.isNaN(na)) return sortOrder === 'asc' ? -1 : 1
      if (Number.isNaN(nb)) return sortOrder === 'asc' ? 1 : -1
      return sortOrder === 'asc' ? na - nb : nb - na
    })
    return safe
  }, [rows, sortKey, sortOrder])

  // 分页
  const totalPages = useMemo(() => Math.max(1, Math.ceil(sortedRows.length / pageSize)), [sortedRows.length, pageSize])
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedRows.slice(start, start + pageSize)
  }, [sortedRows, page, pageSize])

  const makeSortableTitle = (key: string, label: string) => (
    <button
      className="inline-flex items-center gap-1 select-none"
      onClick={(e) => {
        e.stopPropagation()
        setPage(1)
        setSortKey(key)
        setSortOrder(prev => (sortKey !== key ? 'desc' : prev === 'desc' ? 'asc' : prev === 'asc' ? undefined : 'desc'))
      }}
      title="点击排序"
    >
      <span className="text-foreground">{label}</span>
      <ArrowUpDown className="w-3 h-3 text-foreground" />
    </button>
  )

  interface GradeTableColumn {
    key: string
    title: React.ReactNode
    width: number
    sticky?: 'left' | 'right'
    render?: (row: ScoreSummaryRow, rowIndex: number) => React.ReactNode
  }

  const columns: GradeTableColumn[] = useMemo(() => {
    const cols: GradeTableColumn[] = [
      { key: 'studentName', title: '姓名', width: 100},
      { key: 'className', title: '班级', width: 120 },
    ]

    const labelMap: Record<string, string> = {
      chinese: '语文', math: '数学', english: '英语', daofa: '道法', history: '历史', physics: '物理', chemistry: '化学', geography: '地理', biology: '生物', total: '总分'
    }

    visibleSubjects.forEach(sub => {
      cols.push({
        key: sub,
        title: makeSortableTitle(sub, labelMap[sub] || sub),
        width: 150,
        render: (record) => {
          const value = record[sub as keyof ScoreSummaryRow] as number | string | null | undefined
          const rankKey = `${sub}Rank` as keyof ScoreSummaryRow
          const rank = record[rankKey]
          const display = value == null
            ? '-'
            : typeof value === 'number'
              ? (Number.isInteger(value) ? String(value) : value.toFixed(1))
              : String(value)
          return (
            <div className="flex items-center justify-center gap-2">
              <span>{display}</span>
              {rank != null && <span className="text-xs text-muted-foreground">#{rank}</span>}
            </div>
          )
        }
      })
    })

    cols.push({
      key: 'actions',
      title: '操作',
      width: 120,
      render: (row) => (
        <Button
          variant="link"
          className="px-0"
          onClick={(e) => {
            e.stopPropagation()
            handleViewDetail(row)
          }}
        >
          查看
        </Button>
      )
    })

    return cols
  }, [currentExamName, visibleSubjects, makeSortableTitle])

  const stickyLeftOffsets = useMemo(() => {
    const offsets = new Map<string, number>()
    let acc = 0
    columns.forEach((column) => {
      if (column.sticky === 'left') {
        offsets.set(column.key, acc)
        acc += column.width
      }
    })
    return offsets
  }, [columns])

  const totalTableWidth = useMemo(
    () => columns.reduce((sum, column) => sum + column.width, 0),
    [columns]
  )

  const getCellValue = (row: ScoreSummaryRow, key: string) => {
    if (key.includes('.')) {
      return key.split('.').reduce((obj: any, part: string) => obj?.[part], row)
    }
    return row[key as keyof ScoreSummaryRow]
  }

  const handleExport = async () => {
    await gradeService.exportScores({ examId, classId, search })
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle>成绩管理</CardTitle>
          <CardDescription>按考试/班级查看与导入成绩</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
        <Select placeholder="选择考试" value={examId || ''} onValueChange={(v) => { setExamId(v || undefined); setPage(1) }} className="w-64">
          {exams.map(e => (
            <SelectItem key={e.id} value={e.id}>{e.name}（{e.term}）</SelectItem>
          ))}
        </Select>
        <Select placeholder="选择班级（可选）" value={classId || ''} onValueChange={(v) => { setClassId(v || undefined); setPage(1) }} className="w-56">
          <SelectItem value="">全部班级</SelectItem>
          {classes.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </Select>
        <Input
          className="w-64"
          placeholder="搜索 学号/姓名/课程"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        <Select placeholder="导入模式" value={importMode} onValueChange={(v) => setImportMode((v as 'append'|'overwrite') || 'append')} className="w-28">
          <SelectItem value="append">追加</SelectItem>
          <SelectItem value="overwrite">覆盖</SelectItem>
        </Select>
        <Button onClick={() => gradeService.downloadScoreTemplate()} variant="secondary" className="ml-auto"><Download className="w-4 h-4 mr-2"/>下载模板</Button>
        <Button onClick={handleExport} variant="secondary" className="ml-2"><Download className="w-4 h-4 mr-2"/>导出</Button>
        <label className="inline-flex items-center">
          <input type="file" className="hidden" accept=".csv" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f || !examId || uploading) return
            setUploading(true)
            try {
              const res = await gradeService.importScores(f, examId, importMode, importMode === 'overwrite' ? classId : undefined)
              toast({ title: '导入成功', description: `共处理 ${res?.created ?? 0} 条` })
              setReloadKey(Date.now())
              setPage(1)
            } catch (err: any) {
              // eslint-disable-next-line no-console
              console.error('importScores error', err?.response?.data || err)
              const raw = err?.response?.data?.error?.message ?? err?.message ?? err
              const msg = typeof raw === 'string' ? raw : JSON.stringify(raw)
              toast({ title: '导入失败', description: msg, variant: 'destructive' })
            } finally {
              setUploading(false)
              if (e.target) (e.target as HTMLInputElement).value = ''
            }
          }} />
          <span className="inline-flex items-center cursor-pointer border border-border bg-background hover:bg-accent rounded px-3 py-2 text-sm ml-2"><Upload className="w-4 h-4 mr-2"/>{uploading ? '导入中...' : '导入'}</span>
        </label>
        <Button variant="default" className="ml-2"><Plus className="w-4 h-4 mr-2"/>新增成绩</Button>

        {/* 分隔线 */}
        <div className="h-6 w-px bg-border mx-2" />

        {/* 与学生管理一致的紧凑设置按钮 */}
        <CompactTableSettings
          pageSize={pageSize}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          tableHeight={tableHeight}
          onTableHeightChange={setTableHeight}
          onRefresh={() => setReloadKey(Date.now())}
          refreshing={loading}
        />
          </div>

          <div className="relative">
            <ScrollArea className="rounded-lg border" style={{ height: tableHeight }} viewportClassName="scrollbar-thin">
              <table
                className="min-w-full border-collapse"
                style={{ minWidth: `${totalTableWidth}px` }}
              >
                <thead>
                  <tr>
                    {columns.map((column) => {
                      const leftOffset = stickyLeftOffsets.get(column.key)
                      const isStickyLeft = false

                      return (
                        <th
                          key={column.key}
                          className={cn(
                            "px-4 py-3 text-sm font-medium text-foreground text-center border-b border-border bg-muted",
                            isStickyLeft && "shadow-md"
                          )}
                          style={{
                            minWidth: column.width,
                            width: column.width,
                            position: 'sticky',
                            top: 0,
                            left: isStickyLeft ? leftOffset : undefined,
                            zIndex: isStickyLeft ? 60 : 50,
                            background: 'var(--muted)',
                            boxShadow: isStickyLeft ? '2px 0 4px -2px rgba(0,0,0,0.08)' : undefined,
                            borderRight: isStickyLeft ? '1px solid var(--border)' : undefined,
                          }}
                        >
                          {column.title}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.length === 0 && !loading ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        暂无成绩数据
                      </td>
                    </tr>
                  ) : (
                    pagedRows.map((row, rowIndex) => {
                      const rowKey = row.studentId ?? `${row.studentName ?? 'row'}-${rowIndex}`
                      const rowBgClass = rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'

                      return (
                        <tr key={rowKey} className={cn('border-b border-border', rowBgClass)}>
                          {columns.map((column) => {
                            const leftOffset = stickyLeftOffsets.get(column.key)
                            const isStickyLeft = false
                            const content = column.render ? column.render(row, rowIndex) : getCellValue(row, column.key) ?? '-'

                            return (
                              <td
                                key={`${rowKey}-${column.key}`}
                                className={cn(
                                  'px-4 py-2 text-sm text-center text-foreground',
                                  isStickyLeft && 'bg-background'
                                )}
                                style={{
                                  minWidth: column.width,
                                  width: column.width,
                                  position: isStickyLeft ? 'sticky' : undefined,
                                  left: isStickyLeft ? leftOffset : undefined,
                                  zIndex: isStickyLeft ? 40 : 20,
                                  boxShadow: isStickyLeft ? '2px 0 4px -2px rgba(0,0,0,0.08)' : undefined,
                                  borderRight: isStickyLeft ? '1px solid var(--border)' : undefined,
                                  background: isStickyLeft ? 'var(--background)' : undefined,
                                }}
                              >
                                {typeof content === 'string' || typeof content === 'number' ? (content === '' ? '-' : content) : content}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </ScrollArea>

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>加载中...</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={sortedRows.length}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          />
        </CardFooter>
      </Card>

      <ScoreDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        examName={currentExamName}
        record={detailRecord}
        subjects={visibleSubjects}
      />
    </>
  )
}


