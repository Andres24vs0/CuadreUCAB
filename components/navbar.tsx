"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Heart, MessageCircle, User } from "lucide-react"
import { useChats } from "@/lib/queries/chat-queries"
import { useMemo } from "react"

export function Navbar() {
  const pathname = usePathname()
  const { data: chats } = useChats()

  // Calculate total unread count from real chat data
  const unreadCount = useMemo(() => {
    if (!chats) return 0
    return chats.reduce((total, chat) => total + chat.unreadCount, 0)
  }, [chats])

  const navItems = [
    { href: "/descubrir", label: "Descubrir", icon: Heart },
    { href: "/chats", label: "Chats", icon: MessageCircle, badge: unreadCount },
    { href: "/perfil", label: "Perfil", icon: User },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <Link href="/descubrir" className="flex items-center gap-2">
          <Image src="/logo-cuadre-ucab.png" alt="Cuadre UCAB" width={160} height={56} className="h-14 w-auto" />
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden sm:inline">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
