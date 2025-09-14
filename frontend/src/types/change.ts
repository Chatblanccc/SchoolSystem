export type ChangeType = 'transfer_out' | 'leave' | 'reinstate'
export type ChangeStatus = 'draft' | 'submitted' | 'approving' | 'approved' | 'scheduled' | 'effected' | 'rejected' | 'cancelled'

export interface StudentChangeItem {
  id: string
  studentId: string
  studentName: string
  className?: string
  type: ChangeType
  status: ChangeStatus
  effectiveDate?: string
  reason?: string
  // transfer out
  targetSchoolName?: string
  targetSchoolContact?: string
  releaseDate?: string
  handoverNote?: string
  // leave
  leaveType?: string
  leaveStartDate?: string
  leaveEndDate?: string
  // reinstate
  reinstateReturnDate?: string
  placementPolicy?: '原班' | '新班' | ''
  targetClassId?: string
  // meta
  createdAt?: string
  updatedAt?: string
}

export interface PaginatedChanges {
  changes: StudentChangeItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
