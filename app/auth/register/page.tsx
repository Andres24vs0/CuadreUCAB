"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RegisterForm } from "@/components/register-form"

export default function RegisterPage() {
  const router = useRouter()

  const handleRegisterComplete = (userId: string, email: string) => {
    // Auth store is already updated by the register mutation's onSuccess callback
    router.push("/descubrir")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ucab-maroon to-ucab-golden p-4 py-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ucab-maroon">Registro</h1>
          <Button variant="ghost" onClick={() => router.push("/auth")} className="text-ucab-maroon">
            Volver
          </Button>
        </div>
        <RegisterForm onComplete={handleRegisterComplete} />
      </div>
    </div>
  )
}

