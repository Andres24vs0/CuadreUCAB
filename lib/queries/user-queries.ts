import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUserProfile, updateUserProfile } from "@/lib/api"
import type { NormalizedProfile, ProfileUpdate } from "@/lib/types"

// Query keys
export const userKeys = {
  all: ["users"] as const,
  profile: (id: string | null | undefined) => [...userKeys.all, "profile", id] as const,
}

/**
 * Query hook to fetch user profile
 */
export function useUserProfile(userId: string | null | undefined) {
  return useQuery({
    queryKey: userKeys.profile(userId),
    queryFn: () => {
      if (!userId) throw new Error("User ID is required")
      return getUserProfile(userId)
    },
    enabled: !!userId,
    // Cache data for 5 minutes, keep in cache for 10 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    // Use cached data immediately while refetching in background
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}

/**
 * Mutation hook to update user profile
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ identifier, updates }: { identifier: string; updates: ProfileUpdate }) =>
      updateUserProfile(identifier, updates),
    onSuccess: (data, variables) => {
      // Invalidate and refetch the profile query
      queryClient.invalidateQueries({ queryKey: userKeys.profile(variables.identifier) })
    },
  })
}

