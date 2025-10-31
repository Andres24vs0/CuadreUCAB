import { useMutation } from "@tanstack/react-query"
import { login, registerUser } from "@/lib/api"
import { useAuthStore } from "@/lib/stores/auth-store"
import type { LoginRequest, RegisterRequest } from "@/lib/types"

/**
 * Convenience hook for accessing auth state and actions
 * Wraps the auth store for easier access
 */
export function useAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const userId = useAuthStore((state) => state.userId)
  const userEmail = useAuthStore((state) => state.userEmail)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)

  return {
    isAuthenticated,
    userId,
    userEmail,
    hasHydrated,
    login,
    logout,
  }
}

/**
 * Mutation hook for user login
 */
export function useLogin() {
  const loginAuth = useAuthStore((state) => state.login)

  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (response) => {
      // Update auth store on successful login
      loginAuth(response.id, response.email)
    },
  })
}

/**
 * Mutation hook for user registration
 */
export function useRegister() {
  const loginAuth = useAuthStore((state) => state.login)

  return useMutation({
    mutationFn: (data: RegisterRequest) => registerUser(data),
    onSuccess: (response, variables) => {
      // Update auth store on successful registration
      loginAuth(response.id, variables.email)
    },
  })
}

