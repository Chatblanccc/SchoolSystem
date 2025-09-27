import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAcademicStore } from '@/stores/academicStore'
import { toast } from '@/hooks/use-toast'

export default function SystemSettings() {
  const { currentYear, currentTerm, loading, load, setYear, setTerm } = useAcademicStore()
  const [year, setYearLocal] = useState('')
  const [term, setTermLocal] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!currentYear || !currentTerm) {
      load()
    }
  }, [])

  useEffect(() => {
    setYearLocal(currentYear || '')
    setTermLocal(currentTerm || '')
  }, [currentYear, currentTerm])

  const handleSave = async () => {
    try {
      setSaving(true)
      if (year && year !== currentYear) await setYear(year)
      if (term && term !== currentTerm) await setTerm(term)
      toast({ title: '已保存', description: '学年/学期已更新' })
    } catch (e: any) {
      const message = e?.response?.data?.error?.message || '保存失败'
      toast({ title: '保存失败', description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>系统设置</CardTitle>
          <CardDescription>配置当前学年与学期，影响默认数据范围</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="text-sm text-muted-foreground mb-2">当前学年</div>
            <Input placeholder="例如 2024-2025" value={year} onChange={(e) => setYearLocal(e.target.value)} />
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-2">当前学期</div>
            <Input placeholder="例如 2024-2025-1" value={term} onChange={(e) => setTermLocal(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? '保存中...' : '保存设置'}
            </Button>
            <Button variant="outline" onClick={() => { setYearLocal(currentYear); setTermLocal(currentTerm) }} disabled={saving || loading}>重置</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


