"use client"

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ucab-maroon to-ucab-golden p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex justify-center">
          <Image src="/logo-cuadre-ucab.png" alt="CuadreUCAB Logo" width={200} height={200} className="h-auto w-48" />
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/register"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "w-full bg-ucab-maroon text-lg font-semibold text-white hover:bg-ucab-maroon/90"
            )}
          >
            Registrarse
          </Link>
          <Link
            href="/auth/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full border-2 border-ucab-maroon bg-white text-lg font-semibold text-ucab-maroon hover:bg-ucab-maroon/10"
            )}
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
