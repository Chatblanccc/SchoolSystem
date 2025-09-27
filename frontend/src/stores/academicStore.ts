import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AcademicSettings } from '@/services/systemService'
import { systemService } from '@/services/systemService'

interface AcademicState {
  currentYear: string
  currentTerm: string
  loading: boolean
  load: () => Promise<void>
  setYear: (year: string) => Promise<void>
  setTerm: (term: string) => Promise<void>
}

export const useAcademicStore = create<AcademicState>()(
  persist(
    (set, get) => ({
      currentYear: '',
      currentTerm: '',
      loading: false,

      load: async () => {
        try {
          set({ loading: true })
          const data: AcademicSettings = await systemService.getAcademicSettings()
          set({ currentYear: data.currentYear, currentTerm: data.currentTerm })
        } finally {
          set({ loading: false })
        }
      },

      setYear: async (year: string) => {
        const res = await systemService.updateAcademicSettings({ currentYear: year })
        set({ currentYear: res.currentYear })
      },

      setTerm: async (term: string) => {
        const res = await systemService.updateAcademicSettings({ currentTerm: term })
        set({ currentTerm: res.currentTerm })
      },
    }),
    { name: 'academic-settings' }
  )
)


