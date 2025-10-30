"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { RegisterForm } from "@/components/register-form"

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Test user credentials
    const testEmail = "maria.gonzalez@ucab.edu.ve"
    const testPassword = "CuadreUCAB2025"

    if (email !== testEmail) {
      setError("No hay cuenta vinculada a este correo")
      return
    }

    if (password !== testPassword) {
      setError("La contraseña colocada no es la correcta")
      return
    }

    // Successful login
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("userEmail", email)
    router.push("/descubrir")
  }

  const handleRegisterComplete = () => {
    localStorage.setItem("isAuthenticated", "true")
    router.push("/descubrir")
  }

  if (mode === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ucab-maroon to-ucab-golden p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-8 flex justify-center">
            <Image src="/logo-cuadre-ucab.png" alt="CuadreUCAB Logo" width={200} height={200} className="h-auto w-48" />
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => setMode("register")}
              className="w-full bg-ucab-maroon text-lg font-semibold text-white hover:bg-ucab-maroon/90"
              size="lg"
            >
              Registrarse
            </Button>
            <Button
              onClick={() => setMode("login")}
              className="w-full border-2 border-ucab-maroon bg-white text-lg font-semibold text-ucab-maroon hover:bg-ucab-maroon/10"
              size="lg"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === "register") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ucab-maroon to-ucab-golden p-4 py-8">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-ucab-maroon">Registro</h1>
            <Button variant="ghost" onClick={() => setMode(null)} className="text-ucab-maroon">
              Volver
            </Button>
          </div>
          <RegisterForm onComplete={handleRegisterComplete} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ucab-maroon to-ucab-golden p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ucab-maroon">Iniciar Sesión</h1>
          <Button variant="ghost" onClick={() => setMode(null)} className="text-ucab-maroon">
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

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <Button
            type="submit"
            className="w-full bg-ucab-maroon text-lg font-semibold text-white hover:bg-ucab-maroon/90"
            size="lg"
          >
            Iniciar Sesión
          </Button>
        </form>
      </div>
    </div>
  )
}
