import { useEffect, useMemo, useState } from "react"
import { gradeService } from "@/services/gradeService"
import { classService } from "@/services/classService"
import type { ExamListItem, ScoreAnalyticsRow } from "@/types/grade"
import { Select, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { Download, ArrowUp, ChevronRight } from "lucide-react"
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts"

export default function GradeAnalytics() {
  const [exams, setExams] = useState<ExamListItem[]>([])
  const [examId, setExamId] = useState<string | undefined>(undefined)
  const [classId, setClassId] = useState<string | undefined>(undefined)
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [rows, setRows] = useState<ScoreAnalyticsRow[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailClassId, setDetailClassId] = useState<string | null>(null)
  const [thresholdOpen, setThresholdOpen] = useState(false)

  // 每科目阈值（以字符串保存便于输入控制）
  type SubjectThreshold = { excellent?: string; good?: string; low?: string; pass?: string }
  const [subjectThresholds, setSubjectThresholds] = useState<Record<string, SubjectThreshold>>({})

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
      const data = await gradeService.getScoreAnalytics({ examId, classId })
      setRows(data)
    } finally {
      setLoading(false)
    }
  }

  // 打开阈值弹窗时，用当前 rows 的科目回填默认阈值
  const openThreshold = () => {
    // 若当前还没有 rows，可提醒先选择考试或加载数据
    const defaults: Record<string, SubjectThreshold> = {}
    rows.forEach(r => {
      if (!r.courseId) return
      const prev = subjectThresholds[r.courseId] || {}
      defaults[r.courseId] = {
        excellent: prev.excellent ?? '',
        good: prev.good ?? '',
        low: prev.low ?? '',
        pass: prev.pass ?? '',
      }
    })
    setSubjectThresholds(defaults)
    setThresholdOpen(true)
  }

  // 应用每科目阈值：按 courseId 并行请求并合并结果
  const applySubjectThresholds = async () => {
    if (!examId) return
    const courseIds = Object.keys(subjectThresholds)
    if (courseIds.length === 0) { setThresholdOpen(false); return }
    setLoading(true)
    try {
      const tasks = courseIds.map(courseId => {
        const t = subjectThresholds[courseId] || {}
        return gradeService.getScoreAnalytics({
          examId,
          classId,
          courseId,
          excellent: parseRatio(t.excellent || ""),
          good: parseRatio(t.good || ""),
          low: parseRatio(t.low || ""),
          pass: parseRatio(t.pass || ""),
        })
      })
      const results = await Promise.all(tasks)
      const merged = ([] as ScoreAnalyticsRow[]).concat(...results)
      setRows(merged)
      setThresholdOpen(false)
    } catch (e) {
      // 出错时保持弹窗不关闭，便于用户调整
      console.error('applySubjectThresholds error', e)
      alert('应用阈值失败，请检查输入或稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, classId])

  const openDetail = (classId: string) => {
    setDetailClassId(classId)
    setDetailOpen(true)
  }
  const closeDetail = () => {
    setDetailOpen(false)
    setDetailClassId(null)
  }

  // 将分析结果按班级分组，便于卡片化展示
  const groupedByClass = useMemo(() => {
    const map = new Map<string, {
      classId: string
      className: string
      subjects: ScoreAnalyticsRow[]
      totalSample: number
      avgClassScore?: number | null
      avgCompareRate?: number | null
    }>()
    for (const r of rows) {
      const key = r.classId
      if (!map.has(key)) {
        map.set(key, {
          classId: r.classId,
          className: r.className,
          subjects: [],
          totalSample: 0,
          avgClassScore: null,
          avgCompareRate: null,
        })
      }
      const entry = map.get(key)!
      entry.subjects.push(r)
      entry.totalSample += Number(r.sampleSize || 0)
    }

    // 计算加权均分与平均比均率（按样本数加权）
    for (const entry of map.values()) {
      let wScoreSum = 0
      let wScoreWeight = 0
      let wCompareSum = 0
      let wCompareWeight = 0
      for (const s of entry.subjects) {
        if (s.classAvgScore != null) {
          wScoreSum += Number(s.classAvgScore) * Number(s.sampleSize || 0)
          wScoreWeight += Number(s.sampleSize || 0)
        }
        if (s.compareAvgRate != null) {
          wCompareSum += Number(s.compareAvgRate) * Number(s.sampleSize || 0)
          wCompareWeight += Number(s.sampleSize || 0)
        }
      }
      entry.avgClassScore = wScoreWeight > 0 ? wScoreSum / wScoreWeight : null
      entry.avgCompareRate = wCompareWeight > 0 ? wCompareSum / wCompareWeight : null
    }

    return Array.from(map.values()).sort((a, b) => a.className.localeCompare(b.className, 'zh-CN'))
  }, [rows])

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
          <Button variant="secondary" onClick={openThreshold}>应用阈值</Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (!examId) return
              void gradeService.exportScoreAnalytics({ examId, classId, format: 'csv' })
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-2xl shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((__, j) => (
                    <Skeleton key={j} className="h-5 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groupedByClass.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          暂无分析数据
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groupedByClass.map(group => (
            <Card key={group.classId} className="rounded-2xl shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-base font-semibold">{group.className}</CardTitle>
                </div>
                <div className="text-right text-xs text-muted-foreground flex items-center gap-2">
                {group.avgCompareRate != null ? (
                    <div className="flex items-center gap-1">
                      <span>比均率：{(Number(group.avgCompareRate) * 100).toFixed(1)}%</span>
                      {(Number(group.avgCompareRate) * 100) < 100 && (
                        <ArrowUp className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  ) : (
                    <div>
                      班均分：{group.avgClassScore != null ? Number(group.avgClassScore).toFixed(2) : '-'}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                  <span>样本数：{group.totalSample}</span>
                  <span>班均分：{group.avgClassScore != null ? Number(group.avgClassScore).toFixed(2) : '-'}</span>
                  {group.avgCompareRate != null && (
                    <span>比均率：{(Number(group.avgCompareRate) * 100).toFixed(1)}%</span>
                  )}
                  <Button size="sm" className="ml-auto" onClick={() => openDetail(group.classId)}>查看详情</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 详情弹窗 */}
      {detailOpen && (() => {
        const group = groupedByClass.find(g => g.classId === detailClassId)
        if (!group) return null
        const data = group.subjects.map(s => ({
          course: s.courseName,
          classAvg: s.classAvgScore ?? 0,
          gradeAvg: s.gradeAvgScore ?? 0,
          excellent: s.excellentRate ?? 0,
          good: s.goodRate ?? 0,
          low: s.lowRate ?? 0,
          pass: s.passRate ?? 0,
        }))
        return (
          <Modal isOpen={detailOpen} onClose={closeDetail} title={`${group.className} - 成绩明细`} className="max-w-4xl">
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground flex flex-wrap gap-4">
                <span>样本数：{group.totalSample}</span>
                <span>班均分：{group.avgClassScore != null ? Number(group.avgClassScore).toFixed(2) : '-'}</span>
                {group.avgCompareRate != null && (
                  <span>比均率：{(Number(group.avgCompareRate) * 100).toFixed(1)}%</span>
                )}
              </div>

              <Table className="text-center">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">科目</TableHead>
                    <TableHead className="text-center">样本数</TableHead>
                    <TableHead className="text-center">📈 优秀率</TableHead>
                    <TableHead className="text-center">良好率</TableHead>
                    <TableHead className="text-center">📉 低分率</TableHead>
                    <TableHead className="text-center">合格率</TableHead>
                    <TableHead className="text-center">班均分</TableHead>
                    <TableHead className="text-center">年级均分</TableHead>
                    <TableHead className="text-center">比均率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.subjects.map((s) => {
                    const excellentHigh = s.excellentRate != null && Number(s.excellentRate) >= 80
                    const lowHigh = s.lowRate != null && Number(s.lowRate) >= 20
                    const classHigher = s.classAvgScore != null && s.gradeAvgScore != null && Number(s.classAvgScore) > Number(s.gradeAvgScore)
                    return (
                      <TableRow key={s.courseId}>
                        <TableCell className="text-center whitespace-nowrap">{s.courseName}</TableCell>
                        <TableCell className="text-center">{s.sampleSize}</TableCell>
                        <TableCell className="text-center">
                          {s.excellentRate?.toFixed?.(2) ?? '-'}
                          {excellentHigh && <Badge variant="success" className="ml-1">高</Badge>}
                        </TableCell>
                        <TableCell className="text-center">{s.goodRate?.toFixed?.(2) ?? '-'}</TableCell>
                        <TableCell className="text-center">
                          {s.lowRate?.toFixed?.(2) ?? '-'}
                          {lowHigh && <Badge variant="destructive" className="ml-1">高</Badge>}
                        </TableCell>
                        <TableCell className="text-center">{s.passRate?.toFixed?.(2) ?? '-'}</TableCell>
                        <TableCell className="text-center">
                          {s.classAvgScore == null ? '-' : Number(s.classAvgScore).toFixed(2)}
                          {classHigher && <ArrowUp className="inline-block w-3.5 h-3.5 text-blue-600 ml-1" />}
                        </TableCell>
                        <TableCell className="text-center">{s.gradeAvgScore == null ? '-' : Number(s.gradeAvgScore).toFixed(2)}</TableCell>
                        <TableCell className="text-center">{s.compareAvgRate == null ? '-' : `${(Number(s.compareAvgRate) * 100).toFixed(1)}%`}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div>
                <div className="text-sm font-medium mb-2">班级 vs 年级 平均分对比</div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="course" angle={-30} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip formatter={(v: any, n: any) => [Number(v).toFixed(2), n]} />
                      <Bar dataKey="gradeAvg" name="年级均分" fill="#3b82f6" radius={[4,4,0,0]} />
                      <Bar dataKey="classAvg" name="班级均分" fill="#10b981" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </Modal>
        )
      })()}

      {/* 每科目阈值弹窗 */}
      {thresholdOpen && (() => {
        // 构造展示用的科目列表（来自当前 rows）
        const courseMap = new Map<string, string>()
        rows.forEach(r => { if (r.courseId && r.courseName) courseMap.set(r.courseId, r.courseName) })
        const courses = Array.from(courseMap.entries()).map(([id, name]) => ({ id, name }))
        return (
          <Modal isOpen={thresholdOpen} onClose={() => setThresholdOpen(false)} title="设置科目阈值" className="max-w-4xl">
            <div className="space-y-4">
              {courses.length === 0 ? (
                <div className="text-sm text-muted-foreground">暂无科目信息，请先选择考试并加载分析数据。</div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">为每个科目设置优秀/良好/低分/合格阈值（支持 0~1 或 0~100）</div>
                  <div className="max-h-[50vh] overflow-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/40">
                          <th className="p-2 text-center">科目</th>
                          <th className="p-2 text-center">优秀≥</th>
                          <th className="p-2 text-center">良好≥</th>
                          <th className="p-2 text-center">低分＜</th>
                          <th className="p-2 text-center">合格≥</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map(c => {
                          const t = subjectThresholds[c.id] || {}
                          return (
                            <tr key={c.id} className="border-t">
                              <td className="p-2 text-center whitespace-nowrap">{c.name}</td>
                              <td className="p-2 text-center">
                                <Input className="w-24 mx-auto" value={t.excellent ?? ''} onChange={(e) => setSubjectThresholds(prev => ({ ...prev, [c.id]: { ...prev[c.id], excellent: e.target.value } }))} placeholder="0.9" />
                              </td>
                              <td className="p-2 text-center">
                                <Input className="w-24 mx-auto" value={t.good ?? ''} onChange={(e) => setSubjectThresholds(prev => ({ ...prev, [c.id]: { ...prev[c.id], good: e.target.value } }))} placeholder="0.8" />
                              </td>
                              <td className="p-2 text-center">
                                <Input className="w-24 mx-auto" value={t.low ?? ''} onChange={(e) => setSubjectThresholds(prev => ({ ...prev, [c.id]: { ...prev[c.id], low: e.target.value } }))} placeholder="0.6" />
                              </td>
                              <td className="p-2 text-center">
                                <Input className="w-24 mx-auto" value={t.pass ?? ''} onChange={(e) => setSubjectThresholds(prev => ({ ...prev, [c.id]: { ...prev[c.id], pass: e.target.value } }))} placeholder="0.6" />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" onClick={() => setThresholdOpen(false)}>取消</Button>
                    <Button onClick={applySubjectThresholds} disabled={loading}>{loading ? '应用中...' : '应用阈值'}</Button>
                  </div>
                </>
              )}
            </div>
          </Modal>
        )
      })()}
    </div>
  )
}


