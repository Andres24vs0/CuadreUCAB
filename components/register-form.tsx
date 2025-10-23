"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InterestsSelector } from "@/components/interests-selector"
import { ImageUpload } from "@/components/image-upload"

const carreras = [
  "Industrial",
  "Informática",
  "Arquitectura",
  "Civil",
  "Telecomunicaciones",
  "Mecatrónica",
  "Tsu Diseño Y Producción De Software",
  "Filosofía",
  "Psicología",
  "Letras",
  "Comunicación Social",
  "Educación",
  "Administración",
  "Contaduría",
  "Relaciones Industriales",
  "Sociología",
  "Economía",
  "Tsu En Seguridad Y Salud Laboral",
  "Tsu En Seguros",
  "Derecho",
  "Teología",
]

const coloresOjos = ["Marrón", "Verde", "Azul", "Gris", "Avellana", "Negro", "Ámbar"]

const coloresCabello = [
  "Negro",
  "Castaño Oscuro",
  "Castaño",
  "Castaño Claro",
  "Rubio",
  "Rubio Platino",
  "Pelirrojo",
  "Gris",
  "Blanco",
  "Azul",
  "Rojo",
  "Rosa",
  "Morado",
  "Verde",
  "Turquesa",
  "Naranja",
]

const generos = ["Masculino", "Femenino", "Otro"]

interface RegisterFormProps {
  onComplete: () => void
}

export function RegisterForm({ onComplete }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nombre: "",
    edad: "",
    genero: "",
    bio: "",
    carrera: "",
    colorOjos: "",
    colorCabello: "",
    generoPreferido: "",
    edadMinima: "",
    edadMaxima: "",
    carreraPreferida: "",
  })
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [photos, setPhotos] = useState<string[]>([])
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.email.endsWith("@ucab.edu.ve") && !formData.email.endsWith("@est.ucab.edu.ve")) {
      setError("Debes usar un correo UCAB (@ucab.edu.ve o @est.ucab.edu.ve)")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (selectedInterests.length === 0) {
      setError("Debes seleccionar al menos un interés")
      return
    }

    if (photos.length !== 2) {
      setError("Debes subir exactamente 2 fotos")
      return
    }

    if (!formData.generoPreferido) {
      setError("Debes seleccionar un género buscado")
      return
    }

    if (!formData.edadMinima || !formData.edadMaxima) {
      setError("Debes especificar el rango de edad buscado")
      return
    }

    if (Number.parseInt(formData.edadMinima) > Number.parseInt(formData.edadMaxima)) {
      setError("La edad mínima no puede ser mayor que la edad máxima")
      return
    }

    if (!formData.carreraPreferida) {
      setError("Debes seleccionar una preferencia de carrera")
      return
    }

    // Save user data (in a real app, this would be sent to a backend)
    const userData = {
      ...formData,
      intereses: selectedInterests,
      fotos: photos,
    }
    localStorage.setItem("userData", JSON.stringify(userData))
    localStorage.setItem("userEmail", formData.email)

    onComplete()
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ucab-maroon">Información de Cuenta</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Correo UCAB *</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu.correo@ucab.edu.ve"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Primer Nombre *</Label>
            <Input
              id="nombre"
              type="text"
              placeholder="Tu primer nombre"
              value={formData.nombre}
              onChange={(e) => updateFormData("nombre", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={formData.password}
              onChange={(e) => updateFormData("password", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repite tu contraseña"
              value={formData.confirmPassword}
              onChange={(e) => updateFormData("confirmPassword", e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ucab-maroon">Información Personal</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="edad">Edad *</Label>
            <Input
              id="edad"
              type="number"
              min="18"
              max="99"
              placeholder="18"
              value={formData.edad}
              onChange={(e) => updateFormData("edad", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="genero">Género *</Label>
            <Select value={formData.genero} onValueChange={(value) => updateFormData("genero", value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {generos.map((genero) => (
                  <SelectItem key={genero} value={genero.toLowerCase()}>
                    {genero}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="carrera">Carrera *</Label>
            <Select value={formData.carrera} onValueChange={(value) => updateFormData("carrera", value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {carreras.map((carrera) => (
                  <SelectItem key={carrera} value={carrera}>
                    {carrera}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Biografía *</Label>
          <Textarea
            id="bio"
            placeholder="Cuéntanos sobre ti..."
            value={formData.bio}
            onChange={(e) => updateFormData("bio", e.target.value)}
            required
            rows={3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="colorOjos">Color de Ojos *</Label>
            <Select value={formData.colorOjos} onValueChange={(value) => updateFormData("colorOjos", value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {coloresOjos.map((color) => (
                  <SelectItem key={color} value={color.toLowerCase()}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="colorCabello">Color de Cabello *</Label>
            <Select
              value={formData.colorCabello}
              onValueChange={(value) => updateFormData("colorCabello", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {coloresCabello.map((color) => (
                  <SelectItem key={color} value={color.toLowerCase()}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ucab-maroon">Intereses (máximo 8) *</h2>
        <InterestsSelector selectedInterests={selectedInterests} onInterestsChange={setSelectedInterests} />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ucab-maroon">Fotos (exactamente 2) *</h2>
        <ImageUpload photos={photos} onPhotosChange={setPhotos} />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ucab-maroon">Preferencias de Búsqueda</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="generoPreferido">Género Buscado *</Label>
            <Select
              value={formData.generoPreferido}
              onValueChange={(value) => updateFormData("generoPreferido", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {generos.map((genero) => (
                  <SelectItem key={genero} value={genero.toLowerCase()}>
                    {genero}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edadMinima">Edad Mínima *</Label>
            <Input
              id="edadMinima"
              type="number"
              min="18"
              max="99"
              placeholder="18"
              value={formData.edadMinima}
              onChange={(e) => updateFormData("edadMinima", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edadMaxima">Edad Máxima *</Label>
            <Input
              id="edadMaxima"
              type="number"
              min="18"
              max="99"
              placeholder="99"
              value={formData.edadMaxima}
              onChange={(e) => updateFormData("edadMaxima", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="carreraPreferida">Preferencia de Carrera *</Label>
          <Select
            value={formData.carreraPreferida}
            onValueChange={(value) => updateFormData("carreraPreferida", value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="misma">Misma</SelectItem>
              <SelectItem value="otra">Otra</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <Button
        type="submit"
        className="w-full bg-ucab-maroon text-white text-lg font-semibold hover:bg-ucab-maroon/90"
        size="lg"
      >
        Crear Cuenta
      </Button>
    </form>
  )
}
