import { useEffect, useRef } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"

/**
 * Hook to track and update user activity (last connection)
 * Updates when:
 * - User closes/leaves the page
 * - Page becomes hidden (tab switch)
 * - Periodically every 2 minutes while active
 */
export function useUserActivity() {
  const userId = useAuthStore((state) => state.userId)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!userId || !hasHydrated) return

    const updateActivity = async () => {
      try {
        await fetch("/api/usuarios/activity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
          // Use keepalive to ensure the request completes even if the page is closing
          keepalive: true,
        })
      } catch (error) {
        // Silently fail - this is not critical
        console.debug("Failed to update activity:", error)
      }
    }

    // Update immediately on mount
    updateActivity()

    // Update periodically every 2 minutes while the user is active
    intervalRef.current = setInterval(updateActivity, 2 * 60 * 1000) // 2 minutes

    // Update when page visibility changes (user switches tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        updateActivity()
      }
    }

    // Update before page unloads (user closes tab/window)
    const handleBeforeUnload = () => {
      updateActivity()
    }

    // Update when page loses focus
    const handleBlur = () => {
      updateActivity()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("blur", handleBlur)

    return () => {
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      // Remove event listeners
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("blur", handleBlur)

      // Final update on cleanup
      updateActivity()
    }
  }, [userId, hasHydrated])
}
