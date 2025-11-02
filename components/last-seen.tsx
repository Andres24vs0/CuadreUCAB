import { useMemo } from "react"

interface LastSeenProps {
  lastConnection?: string | null
  className?: string
}

/**
 * Component to display last seen time in a human-readable format
 * Shows "En línea" if the user was active in the last 2 minutes
 */
export function LastSeen({ lastConnection, className = "" }: LastSeenProps) {
  const lastSeenText = useMemo(() => {
    if (!lastConnection) return "Desconectado"

    const now = new Date()
    const lastSeen = new Date(lastConnection)
    const diffMs = now.getTime() - lastSeen.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    // Online if last active within 2 minutes
    if (diffMinutes < 2) {
      return "En línea"
    }

    // Less than an hour
    if (diffMinutes < 60) {
      return `Hace ${diffMinutes} min`
    }

    // Less than a day
    if (diffHours < 24) {
      return `Hace ${diffHours}h`
    }

    // Less than a week
    if (diffDays < 7) {
      return `Hace ${diffDays}d`
    }

    // More than a week - show date
    return lastSeen.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    })
  }, [lastConnection])

  const isOnline = useMemo(() => {
    if (!lastConnection) return false
    const now = new Date()
    const lastSeen = new Date(lastConnection)
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / 60000)
    return diffMinutes < 2
  }, [lastConnection])

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {isOnline && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
        </span>
      )}
      <span
        className={`text-xs ${
          isOnline ? "text-green-600 font-medium" : "text-muted-foreground"
        }`}
      >
        {lastSeenText}
      </span>
    </div>
  )
}
