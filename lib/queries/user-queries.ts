import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUserProfile, updateUserProfile, getDiscoverableProfiles, createSwipe, type DiscoverProfile } from "@/lib/api"
import type { NormalizedProfile, ProfileUpdate } from "@/lib/types"

// Query keys
export const userKeys = {
  all: ["users"] as const,
  profile: (id: string | null | undefined) => [...userKeys.all, "profile", id] as const,
  discover: (userId: string | null | undefined) => [...userKeys.all, "discover", userId] as const,
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

/**
 * Query hook to fetch discoverable profiles
 */
export function useDiscoverableProfiles(userId: string | null | undefined, limit?: number) {
  return useQuery({
    queryKey: userKeys.discover(userId),
    queryFn: () => {
      if (!userId) throw new Error("User ID is required")
      return getDiscoverableProfiles(userId, limit)
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds - refresh frequently for new profiles
    refetchOnWindowFocus: false,
  })
}

/**
 * Mutation hook to create a swipe (like or pass)
 */
export function useCreateSwipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      idEmisor,
      idReceptor,
      accion,
    }: {
      idEmisor: string
      idReceptor: string
      accion: "like" | "pass"
    }) => createSwipe(idEmisor, idReceptor, accion),
    onSuccess: (data, variables) => {
      // Invalidate discover profiles to refresh the list
      queryClient.invalidateQueries({ queryKey: userKeys.discover(variables.idEmisor) })
    },
  })
}

