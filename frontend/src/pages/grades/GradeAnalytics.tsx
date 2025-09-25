import { useEffect, useMemo, useState } from "react"
import { gradeService } from "@/services/gradeService"
import { classService } from "@/services/classService"
import type { ExamListItem, ScoreAnalyticsRow } from "@/types/grade"
import { Select, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { VirtualTable, useVirtualTableColumns, type VirtualTableColumn } from "@/components/ui/virtual-table"
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown"
import { Download } from "lucide-react"

export default function GradeAnalytics() {
  const [exams, setExams] = useState<ExamListItem[]>([])
  const [examId, setExamId] = useState<string | undefined>(undefined)
  const [classId, setClassId] = useState<string | undefined>(undefined)
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [rows, setRows] = useState<ScoreAnalyticsRow[]>([])
  const [loading, setLoading] = useState(false)

  // 阈值（比例，支持 0~1 或 0~100 的输入）
  const [excellent, setExcellent] = useState<string>("0.9")
  const [good, setGood] = useState<string>("0.8")
  const [low, setLow] = useState<string>("0.6")
  const [passLine, setPassLine] = useState<string>("0.6")

  const { createColumn } = useVirtualTableColumns<ScoreAnalyticsRow>()

  useEffect(() => {
    ;(async () => {
      const res = await gradeService.getExams({ page: 1, pageSize: 200 })
      setExams(res.exams)
      if (!examId && res.exams[0]) setExamId(res.exams[0].id)
    })()
  }, [])

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

  const parseRatio = (v: string): number | undefined => {
    if (!v?.trim()) return undefined
    const n = Number(v)
    if (Number.isNaN(n)) return undefined
    if (n > 1) return n / 100
    if (n < 0) return 0
    return n
  }

  const fetchData = async () => {
    if (!examId) return
    setLoading(true)
    try {
      const data = await gradeService.getScoreAnalytics({
        examId,
        classId,
        excellent: parseRatio(excellent),
        good: parseRatio(good),
        low: parseRatio(low),
        pass: parseRatio(passLine),
      })
      setRows(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, classId])

  const columns: VirtualTableColumn<ScoreAnalyticsRow>[] = useMemo(() => {
    return [
      { ...createColumn('className', '班级', 160), sticky: 'left' },
      { ...createColumn('courseName', '科目', 160), sticky: 'left' },
      createColumn('sampleSize', '样本数', 100),
      createColumn('excellentRate', '优秀率(%)', 120, { render: (v) => v?.toFixed?.(2) ?? '-' }),
      createColumn('goodRate', '良好率(%)', 120, { render: (v) => v?.toFixed?.(2) ?? '-' }),
      createColumn('lowRate', '低分率(%)', 120, { render: (v) => v?.toFixed?.(2) ?? '-' }),
      createColumn('passRate', '合格率(%)', 120, { render: (v) => v?.toFixed?.(2) ?? '-' }),
      createColumn('aboveAvgRate', '超均率(%)', 120, { render: (v) => v?.toFixed?.(2) ?? '-' }),
      createColumn('classAvgScore', '班均分', 120, { render: (v) => v == null ? '-' : Number(v).toFixed(2) }),
      createColumn('gradeAvgScore', '年级均分', 120, { render: (v) => v == null ? '-' : Number(v).toFixed(2) }),
      createColumn('compareAvgRate', '比均率', 120, { render: (v) => v == null ? '-' : Number(v).toFixed(2) }),
    ]
  }, [createColumn])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Select placeholder="选择考试" value={examId || ''} onValueChange={(v) => setExamId(v || undefined)} className="w-64">
          {exams.map(e => (
            <SelectItem key={e.id} value={e.id}>{e.name}（{e.term}）</SelectItem>
          ))}
        </Select>

        <Select placeholder="选择班级（可选）" value={classId || ''} onValueChange={(v) => setClassId(v || undefined)} className="w-56">
          <SelectItem value="">全部班级</SelectItem>
          {classes.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </Select>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">优秀≥</span>
            <Input className="w-20" value={excellent} onChange={(e) => setExcellent(e.target.value)} placeholder="0.9" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">良好≥</span>
            <Input className="w-20" value={good} onChange={(e) => setGood(e.target.value)} placeholder="0.8" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">低分＜</span>
            <Input className="w-20" value={low} onChange={(e) => setLow(e.target.value)} placeholder="0.6" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">合格≥</span>
            <Input className="w-20" value={passLine} onChange={(e) => setPassLine(e.target.value)} placeholder="0.6" />
          </div>
          <Button variant="secondary" onClick={fetchData}>应用阈值</Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (!examId) return
              void gradeService.exportScoreAnalytics({
                examId,
                classId,
                excellent: parseRatio(excellent),
                good: parseRatio(good),
                low: parseRatio(low),
                pass: parseRatio(passLine),
                format: 'csv',
              })
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      <VirtualTable
        data={rows}
        columns={columns}
        height={520}
        itemHeight={48}
        loading={loading}
        emptyText="暂无分析数据"
      />
    </div>
  )
}


