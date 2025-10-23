import { Navbar } from "@/components/navbar"
import { User } from "lucide-react"

export default function PerfilPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="text-center">
          <User className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-bold">Tu Perfil</h2>
          <p className="text-muted-foreground">Configura tu perfil aquí</p>
        </div>
      </main>
    </div>
  )
}
