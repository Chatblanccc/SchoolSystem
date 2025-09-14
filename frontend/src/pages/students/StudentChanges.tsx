import { useEffect, useState } from 'react'
import { changeService } from '@/services/changeService'
import type { StudentChangeItem, ChangeType, ChangeStatus } from '@/types/change'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StudentChangeFormModal } from '@/components/shared/StudentChangeFormModal'
import { Plus } from 'lucide-react'

const TYPE_LABELS: Record<ChangeType, string> = {
  transfer_out: '转出',
  leave: '休学',
  reinstate: '复学',
}

const STATUS_LABELS: Record<ChangeStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  approving: '审批中',
  approved: '已批准',
  scheduled: '已计划',
  effected: '已生效',
  rejected: '已驳回',
  cancelled: '已取消',
}

const STATUS_VARIANTS: Record<ChangeStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success'> = {
  draft: 'outline',
  submitted: 'secondary',
  approving: 'secondary',
  approved: 'default',
  scheduled: 'default',
  effected: 'success',
  rejected: 'destructive',
  cancelled: 'outline',
}

export default function StudentChanges() {
  const [items, setItems] = useState<StudentChangeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<ChangeType | ''>('')
  const [status, setStatus] = useState<string>('')
  const [studentId, setStudentId] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await changeService.list({ type: type || undefined, status: status || undefined, studentId: studentId || undefined })
      setItems(res.changes)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">学籍异动</h2>
        <p className="text-muted-foreground mt-2">管理转出/休学/复学申请与审批</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>筛选</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建异动
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select 
            placeholder="全部类型"
            value={type} 
            onValueChange={(value) => setType(value as ChangeType | '')}
          >
            <SelectItem value="">全部类型</SelectItem>
            <SelectItem value="transfer_out">转出</SelectItem>
            <SelectItem value="leave">休学</SelectItem>
            <SelectItem value="reinstate">复学</SelectItem>
          </Select>
          <Select 
            placeholder="全部状态"
            value={status} 
            onValueChange={(value) => setStatus(value)}
          >
            <SelectItem value="">全部状态</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </Select>
          <Input placeholder="学生ID(可选)" value={studentId} onChange={e => setStudentId(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={load} disabled={loading}>查询</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>异动列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground">加载中...</div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground">暂无数据</div>
          ) : (
            <div className="space-y-2">
              {items.map(it => (
                <div key={it.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="font-medium">
                      {it.studentName}（{it.className || '-'}）
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Badge variant="outline">{TYPE_LABELS[it.type]}</Badge>
                      <Badge variant={STATUS_VARIANTS[it.status as ChangeStatus]}>
                        {STATUS_LABELS[it.status as ChangeStatus]}
                      </Badge>
                      <span>生效日期: {it.effectiveDate || '未设定'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {it.status === 'draft' && (
                      <Button size="sm" onClick={async () => {
                        if (confirm('确定提交该异动申请？')) {
                          await changeService.submit(it.id)
                          load()
                        }
                      }}>提交</Button>
                    )}
                    {['submitted','approving'].includes(it.status) && (
                      <>
                        <Button size="sm" variant="secondary" onClick={async () => {
                          if (confirm('确定批准该异动申请？')) {
                            await changeService.approve(it.id)
                            load()
                          }
                        }}>批准</Button>
                        <Button size="sm" variant="destructive" onClick={async () => {
                          if (confirm('确定驳回该异动申请？')) {
                            await changeService.reject(it.id)
                            load()
                          }
                        }}>驳回</Button>
                      </>
                    )}
                    {['approved','scheduled','submitted'].includes(it.status) && (
                      <Button size="sm" variant="outline" onClick={async () => {
                        if (confirm('确定取消该异动申请？')) {
                          await changeService.cancel(it.id)
                          load()
                        }
                      }}>取消</Button>
                    )}
                    {['approved','scheduled'].includes(it.status) && (
                      <Button size="sm" onClick={async () => {
                        if (confirm('确定立即生效该异动？这将改变学生状态。')) {
                          await changeService.effect(it.id)
                          load()
                        }
                      }}>立即生效</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <StudentChangeFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false)
          load()
        }}
      />
    </div>
  )
}


