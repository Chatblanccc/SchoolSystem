export interface ExamListItem {
  id: string
  code: string
  name: string
  term: string
  gradeName: string
  examDate?: string
  createdAt?: string
}

export interface ExamDetail extends Omit<ExamListItem, 'gradeName' | 'createdAt'> {
  gradeId: string
  remark?: string
}

export interface ScoreListItem {
  id: string
  studentId: string
  studentName: string
  className: string
  courseName: string
  score?: number
  rankInClass?: number
  rankInGrade?: number
  passed: boolean
}

export interface ScoreDetail {
  id: string
  examId: string
  studentId: string
  courseId: string
  classId: string
  score?: number
  fullScore?: number
  rankInClass?: number
  rankInGrade?: number
  passed: boolean
  studentName: string
  className: string
  courseName: string
  createdAt?: string
  updatedAt?: string
}

export interface PaginatedExams {
  exams: ExamListItem[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

export interface PaginatedScores {
  scores: ScoreListItem[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

export interface ScoreSummaryRow {
  id: string
  studentId: string
  studentName: string
  className: string
  chinese?: number | null
  chineseRank?: number | null
  math?: number | null
  mathRank?: number | null
  english?: number | null
  englishRank?: number | null
  daofa?: number | null
  daofaRank?: number | null
  history?: number | null
  historyRank?: number | null
  physics?: number | null
  physicsRank?: number | null
  chemistry?: number | null
  chemistryRank?: number | null
  geography?: number | null
  geographyRank?: number | null
  biology?: number | null
  biologyRank?: number | null
  total?: number | null
  totalRank?: number | null
}


export interface ScoreAnalyticsRow {
  classId: string
  className: string
  courseId: string
  courseName: string
  sampleSize: number
  excellentRate: number // 优秀率 %
  goodRate: number      // 良好率 %
  lowRate: number       // 低分率 %
  aboveAvgRate: number  // 超均率 %（高于年级均分）
  passRate: number      // 合格率 %（≥合格线）
  compareAvgRate?: number | null // 比均率（班级均分 / 年级均分）
  classAvgScore?: number | null
  gradeAvgScore?: number | null
}


