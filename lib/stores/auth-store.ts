import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AuthState {
  isAuthenticated: boolean
  userId: string | null
  userEmail: string | null
  hasHydrated: boolean

  // Actions
  login: (userId: string, email: string) => void
  logout: () => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userId: null,
      userEmail: null,
      hasHydrated: false,

      login: (userId, email) =>
        set({ isAuthenticated: true, userId, userEmail: email }),

      logout: () =>
        set({ isAuthenticated: false, userId: null, userEmail: null }),

      setHasHydrated: (state) =>
        set({ hasHydrated: state }),
    }),
    {
      name: 'cuadre-ucab-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        userEmail: state.userEmail,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
