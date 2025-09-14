import { useState } from 'react'
import { changeService } from '@/services/changeService'
import { studentService } from '@/services/studentService'
import type { ChangeType } from '@/types/change'
import type { StudentDetailView } from '@/types/student'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectItem } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Label } from '@/components/ui/label'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialStudentId?: string
}

export function StudentChangeFormModal({ isOpen, onClose, onSuccess, initialStudentId }: Props) {
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [changeType, setChangeType] = useState<ChangeType>('transfer_out')
  const [studentId, setStudentId] = useState(initialStudentId || '')
  const [student, setStudent] = useState<StudentDetailView | null>(null)
  const [formData, setFormData] = useState({
    effectiveDate: new Date().toISOString().split('T')[0],
    reason: '',
    // 转出
    targetSchoolName: '',
    targetSchoolContact: '',
    releaseDate: '',
    handoverNote: '',
    // 休学
    leaveType: '病假',
    leaveStartDate: '',
    leaveEndDate: '',
    // 复学
    reinstateReturnDate: '',
    placementPolicy: '原班' as '原班' | '新班',
    targetClassId: '',
  })

  const searchStudent = async () => {
    if (!studentId.trim()) return
    setSearching(true)
    try {
      const res = await studentService.getStudents({ search: studentId, pageSize: 1 })
      if (res.students.length > 0) {
        setStudent(res.students[0])
      } else {
        alert('未找到该学生')
      }
    } catch (e) {
      alert('查询失败')
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async () => {
    if (!student) {
      alert('请先查询并选择学生')
      return
    }

    // 验证必填字段
    if (changeType === 'leave' && (!formData.leaveStartDate || !formData.leaveEndDate)) {
      alert('请填写休学开始日期和结束日期')
      return
    }
    if (changeType === 'transfer_out' && !formData.targetSchoolName) {
      alert('请填写目标学校')
      return
    }
    if (changeType === 'reinstate' && !formData.reinstateReturnDate) {
      alert('请填写复学日期')
      return
    }

    setLoading(true)
    try {
      await changeService.create({
        studentPk: student.id,
        type: changeType,
        effectiveDate: formData.effectiveDate,
        reason: formData.reason,
        ...(changeType === 'transfer_out' && {
          targetSchoolName: formData.targetSchoolName,
          targetSchoolContact: formData.targetSchoolContact,
          releaseDate: formData.releaseDate,
          handoverNote: formData.handoverNote,
        }),
        ...(changeType === 'leave' && {
          leaveType: formData.leaveType,
          leaveStartDate: formData.leaveStartDate,
          leaveEndDate: formData.leaveEndDate,
        }),
        ...(changeType === 'reinstate' && {
          reinstateReturnDate: formData.reinstateReturnDate,
          placementPolicy: formData.placementPolicy,
          targetClassId: formData.targetClassId || undefined,
        }),
      })
      onSuccess()
      onClose()
    } catch (e: any) {
      console.error('创建异动失败:', e)
      const errorData = e?.response?.data
      if (errorData) {
        // 处理字段级别的错误
        if (typeof errorData === 'object' && !errorData.error) {
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`
              }
              return `${field}: ${messages}`
            })
            .join('\n')
          alert(`创建失败:\n${errorMessages}`)
        } else {
          alert(errorData?.error?.message || errorData?.detail || '创建失败')
        }
      } else {
        alert('创建失败，请检查网络连接')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="创建学籍异动">
      <div className="space-y-4">
        {/* 学生查询 */}
        <div>
          <Label>学生查询</Label>
          <div className="flex gap-2">
            <Input
              placeholder="输入学号或姓名"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
            <Button onClick={searchStudent} disabled={searching}>
              查询
            </Button>
          </div>
          {student && (
            <div className="mt-2 p-2 bg-muted rounded">
              {student.name} - {student.studentId} - {student.className}
            </div>
          )}
        </div>

        {/* 异动类型 */}
        <div>
          <Label>异动类型</Label>
          <Select 
            value={changeType} 
            onValueChange={(value) => setChangeType(value as ChangeType)}
          >
            <SelectItem value="transfer_out">转出</SelectItem>
            <SelectItem value="leave">休学</SelectItem>
            <SelectItem value="reinstate">复学</SelectItem>
          </Select>
        </div>

        {/* 生效日期 */}
        <div>
          <Label>生效日期</Label>
          <Input
            type="date"
            value={formData.effectiveDate}
            onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
          />
        </div>

        {/* 原因 */}
        <div>
          <Label>异动原因</Label>
          <textarea
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />
        </div>

        {/* 转出表单 */}
        {changeType === 'transfer_out' && (
          <>
            <div>
              <Label>目标学校 <span className="text-red-500">*</span></Label>
              <Input
                value={formData.targetSchoolName}
                onChange={(e) => setFormData({ ...formData, targetSchoolName: e.target.value })}
              />
            </div>
            <div>
              <Label>联系方式</Label>
              <Input
                value={formData.targetSchoolContact}
                onChange={(e) => setFormData({ ...formData, targetSchoolContact: e.target.value })}
              />
            </div>
            <div>
              <Label>放行日期</Label>
              <Input
                type="date"
                value={formData.releaseDate}
                onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
              />
            </div>
          </>
        )}

        {/* 休学表单 */}
        {changeType === 'leave' && (
          <>
            <div>
              <Label>休学类型 <span className="text-red-500">*</span></Label>
              <Select
                value={formData.leaveType}
                onValueChange={(value) => setFormData({ ...formData, leaveType: value })}
              >
                <SelectItem value="病假">病假</SelectItem>
                <SelectItem value="事假">事假</SelectItem>
                <SelectItem value="其他">其他</SelectItem>
              </Select>
            </div>
            <div>
              <Label>开始日期 <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={formData.leaveStartDate}
                onChange={(e) => {
                  const startDate = e.target.value
                  // 自动设置结束日期为开始日期后一年
                  if (startDate && !formData.leaveEndDate) {
                    const endDate = new Date(startDate)
                    endDate.setFullYear(endDate.getFullYear() + 1)
                    setFormData({ 
                      ...formData, 
                      leaveStartDate: startDate,
                      leaveEndDate: endDate.toISOString().split('T')[0]
                    })
                  } else {
                    setFormData({ ...formData, leaveStartDate: startDate })
                  }
                }}
              />
            </div>
            <div>
              <Label>结束日期 <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={formData.leaveEndDate}
                min={formData.leaveStartDate}
                onChange={(e) => setFormData({ ...formData, leaveEndDate: e.target.value })}
              />
            </div>
          </>
        )}

        {/* 复学表单 */}
        {changeType === 'reinstate' && (
          <>
            <div>
              <Label>复学日期 <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={formData.reinstateReturnDate}
                onChange={(e) => setFormData({ ...formData, reinstateReturnDate: e.target.value })}
              />
            </div>
            <div>
              <Label>安置策略</Label>
              <Select
                value={formData.placementPolicy}
                onValueChange={(value) => setFormData({ ...formData, placementPolicy: value as '原班' | '新班' })}
              >
                <SelectItem value="原班">原班</SelectItem>
                <SelectItem value="新班">新班</SelectItem>
              </Select>
            </div>
          </>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !student}>
            创建
          </Button>
        </div>
      </div>
    </Modal>
  )
}
