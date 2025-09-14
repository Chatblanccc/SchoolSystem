import { create } from 'zustand'

interface AuthInfoState {
  isAdmin: boolean
  setIsAdmin: (isAdmin: boolean) => void
}

export const useAuthInfoStore = create<AuthInfoState>()((set) => ({
  isAdmin: false,
  setIsAdmin: (isAdmin) => set({ isAdmin })
}))


