import { Navbar } from "@/components/navbar"
import { MessageCircle } from "lucide-react"

export default function ChatsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="text-center">
          <MessageCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-bold">Chats</h2>
          <p className="text-muted-foreground">Tus conversaciones aparecerán aquí</p>
        </div>
      </main>
    </div>
  )
}
