"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLogin } from "@/lib/queries/auth-queries"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const loginMutation = useLogin()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      // Login using mutation (onSuccess callback handles auth store update)
      await loginMutation.mutateAsync({ email, password })
      router.push("/descubrir")
    } catch (err: any) {
      console.error("Error de red:", err)
      setError(err?.error || err?.message || "Error de red al iniciar sesión")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ucab-maroon to-ucab-golden p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ucab-maroon">Iniciar Sesión</h1>
          <Button variant="ghost" onClick={() => router.push("/auth")} className="text-ucab-maroon">
            Volver
          </Button>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Correo UCAB</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu.correo@ucab.edu.ve"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-ucab-maroon/30 focus:border-ucab-maroon"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-ucab-maroon/30 focus:border-ucab-maroon"
            />
          </div>

          {(error || loginMutation.isError) && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error || (loginMutation.error as any)?.error || (loginMutation.error as any)?.message || "Error al iniciar sesión"}
            </div>
          )}
          {loginMutation.isPending && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-600">Iniciando sesión...</div>
          )}

          <Button
            type="submit"
            className="w-full bg-ucab-maroon text-lg font-semibold text-white hover:bg-ucab-maroon/90"
            size="lg"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </form>
      </div>
    </div>
  )
}

