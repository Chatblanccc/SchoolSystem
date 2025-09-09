import type { StudentDetailView } from "@/types/student"

interface StudentDetailCardProps {
  student: StudentDetailView
}

export function StudentDetailCard({ student }: StudentDetailCardProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 学籍信息 */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">学籍信息</h4>
          <div className="space-y-1 text-sm">
            <div className="flex">
              <span className="w-20 text-muted-foreground">身份证号：</span>
              <span>{student.idCardNumber || '未填写'}</span>
            </div>
            <div className="flex">
              <span className="w-20 text-muted-foreground">市学籍号：</span>
              <span>{student.guangzhouStudentId || '未填写'}</span>
            </div>
            <div className="flex">
              <span className="w-20 text-muted-foreground">国学籍号：</span>
              <span>{student.nationalStudentId || '未填写'}</span>
            </div>
            <div className="flex">
              <span className="w-20 text-muted-foreground">出生日期：</span>
              <span>{student.birthDate || '未填写'}</span>
            </div>
          </div>
        </div>
        
        {/* 联系信息 */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">联系信息</h4>
          <div className="space-y-1 text-sm">
            <div className="flex">
              <span className="w-20 text-muted-foreground">家庭住址：</span>
              <span className="flex-1">{student.homeAddress || '未填写'}</span>
            </div>
          </div>
        </div>
        
        {/* 家长信息 */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">家长信息</h4>
          <div className="space-y-1 text-sm">
            {student.parentInfo.fatherName && (
              <div className="flex">
                <span className="w-12 text-muted-foreground">父亲：</span>
                <span className="flex-1">
                  {student.parentInfo.fatherName}
                  {student.parentInfo.fatherPhone && ` (${student.parentInfo.fatherPhone})`}
                </span>
              </div>
            )}
            {student.parentInfo.motherName && (
              <div className="flex">
                <span className="w-12 text-muted-foreground">母亲：</span>
                <span className="flex-1">
                  {student.parentInfo.motherName}
                  {student.parentInfo.motherPhone && ` (${student.parentInfo.motherPhone})`}
                </span>
              </div>
            )}
            {student.parentInfo.guardianName && (
              <div className="flex">
                <span className="w-12 text-muted-foreground">监护人：</span>
                <span className="flex-1">
                  {student.parentInfo.guardianName}
                  {student.parentInfo.guardianPhone && ` (${student.parentInfo.guardianPhone})`}
                  {student.parentInfo.guardianRelation && ` - ${student.parentInfo.guardianRelation}`}
                </span>
              </div>
            )}
            {!student.parentInfo.fatherName && !student.parentInfo.motherName && !student.parentInfo.guardianName && (
              <div className="text-muted-foreground">未填写</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
