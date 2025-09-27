import { api } from '@/lib/api'

export type AcademicSettings = {
  currentYear: string
  currentTerm: string
}

export const systemService = {
  async getAcademicSettings(): Promise<AcademicSettings> {
    const res = await api.get('/system/academic-settings/')
    const data = (res?.data ?? res) as AcademicSettings
    return data
  },

  async updateAcademicSettings(input: Partial<AcademicSettings>): Promise<AcademicSettings> {
    const res = await api.patch('/system/academic-settings/', input)
    const data = (res?.data ?? res) as AcademicSettings
    return data
  }
}


