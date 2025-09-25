import React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ScoreSummaryRow } from "@/types/grade"

interface ScoreDetailModalProps {
  isOpen: boolean
  onClose: () => void
  examName?: string
  record: ScoreSummaryRow | null
  subjects: string[]
}

export function ScoreDetailModal({ isOpen, onClose, examName, record, subjects }: ScoreDetailModalProps) {
  if (!isOpen || !record) return null

  const subjectRows = subjects.map((key) => {
    const score = (record as any)[key]
    const rank = (record as any)[`${key}Rank`]
    return { key, score, rank }
  })

  const formatValue = (v: any) => {
    if (v === null || v === undefined || v === "") return "-"
    if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(1)
    return String(v)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative w-full max-w-3xl max-h-[90vh] mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/40">
          <div className="space-y-1">
            <div className="text-lg font-semibold">成绩详情</div>
            <div className="text-sm text-muted-foreground">
              {record.studentName}（{record.studentId}） · {record.className}
            </div>
            {examName && (
              <div className="text-xs text-muted-foreground">考试：{examName}</div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 内容 */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 总分概览 */}
          <div className="mb-4 flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">总分</Badge>
            <div className="text-base">{formatValue((record as any).total)}</div>
            {((record as any).totalRank ?? null) !== null && (
              <div className="text-sm text-muted-foreground">排名：{formatValue((record as any).totalRank)}</div>
            )}
          </div>

          {/* 学科明细 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subjectRows.map(({ key, score, rank }) => (
              <div key={key} className={cn("border rounded-lg p-3 bg-card")}> 
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{subjectNameMap[key] ?? key}</div>
                  <Badge variant={scoreBadgeVariant(score)}>{formatValue(score)}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  排名：{formatValue(rank)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-end gap-2 p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  )
}

// 简单的科目名映射
const subjectNameMap: Record<string, string> = {
  chinese: "语文",
  math: "数学",
  english: "英语",
  daofa: "道法",
  history: "历史",
  physics: "物理",
  chemistry: "化学",
  geography: "地理",
  biology: "生物",
}

function scoreBadgeVariant(score: any): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" {
  if (score === null || score === undefined || score === "") return "secondary"
  const value = Number(score)
  if (Number.isNaN(value)) return "secondary"
  if (value >= 90) return "success"
  if (value >= 60) return "default"
  return "warning"
}


