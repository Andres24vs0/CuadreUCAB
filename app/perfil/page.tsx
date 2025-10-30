"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InterestsSelector } from "@/components/interests-selector"
import { ImageUpload } from "@/components/image-upload"
import { Edit, LogOut } from "lucide-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { calculateAge } from "@/lib/zodiac-utils"

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

export default function PerfilPage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [userData, setUserData] = useState<any>(null)
  const [editData, setEditData] = useState<any>(null)
  const [error, setError] = useState("")

  const emptyProfile = {
    fotos: [] as string[],
    intereses: [] as string[],
    nombre: "",
    email: "",
    edad: undefined,
    genero: "",
    carrera: "",
    bio: "",
    colorOjos: "",
    colorCabello: "",
  }

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail")
    if (!userEmail) {
      router.push("/auth")
      return
    }

    const storedData = localStorage.getItem("userData")
    if (storedData) {
      try {
        const raw = JSON.parse(storedData)
        const src = raw?.perfil ?? raw

        const parseDate = (v: any): Date | undefined => {
          if (!v) return undefined
          if (v instanceof Date) return v
          if (typeof v === 'string') {
            const d = new Date(v)
            return isNaN(d.getTime()) ? undefined : d
          }
          if (typeof v === 'object') {
            // Mongo extended JSON formats
            if ('$date' in v) {
              const d = v.$date
              if (typeof d === 'string') {
                const dd = new Date(d)
                return isNaN(dd.getTime()) ? undefined : dd
              }
              if (typeof d === 'object' && ('$numberLong' in d || '$numberLong' in v)) {
                const num = Number(d.$numberLong ?? v.$numberLong)
                const dd = new Date(num)
                return isNaN(dd.getTime()) ? undefined : dd
              }
            }
            // older shape: { $date: { $numberLong: '...' } }
            if (v.$date && typeof v.$date === 'object' && '$numberLong' in v.$date) {
              const num = Number(v.$date.$numberLong)
              const dd = new Date(num)
              return isNaN(dd.getTime()) ? undefined : dd
            }
          }
          return undefined
        }

        const parseNumber = (v: any): number | undefined => {
          if (v == null) return undefined
          if (typeof v === 'number') return v
          if (typeof v === 'string' && !isNaN(Number(v))) return Number(v)
          if (typeof v === 'object') {
            if ('$numberInt' in v) return Number(v.$numberInt)
            if ('$numberLong' in v) return Number(v.$numberLong)
          }
          return undefined
        }

        const fechaN = parseDate(src?.fechaNacimiento ?? src?.perfil?.fechaNacimiento ?? src?.fecha_nacimiento)
        const edad = fechaN ? calculateAge(fechaN) : src?.edad ?? undefined

        const atributos = src?.atributosFisicos ?? src ?? {}
        const preferencias = src?.preferencias ?? src ?? {}

        const generoBuscado = Array.isArray(preferencias?.generoBuscado)
          ? preferencias.generoBuscado
          : Array.isArray(src?.generoBuscado)
          ? src.generoBuscado
          : []

        const rango = preferencias?.rangoEdad ?? src?.rangoEdad ?? {}
        const edadMin = parseNumber(rango?.min ?? rango?.min?.$numberInt ?? preferencias?.edadMinima) ?? undefined
        const edadMax = parseNumber(rango?.max ?? rango?.max?.$numberInt ?? preferencias?.edadMaxima) ?? undefined

        const normalized = {
          ...emptyProfile,
          ...src,
          // prefer email from root raw if perfil doesn't include it
          email: raw?.email ?? src?.email ?? '',
          fotos: Array.isArray(src?.fotos) ? src.fotos : [],
          intereses: Array.isArray(src?.intereses) ? src.intereses : [],
          colorOjos: atributos?.colorOjos ?? atributos?.color_ojos ?? '',
          colorCabello: atributos?.colorCabello ?? atributos?.color_cabello ?? '',
          preferencias: {
            // generoBuscado ahora puede ser string o array; normalizamos a string
            generoBuscado: Array.isArray(preferencias?.generoBuscado)
              ? preferencias.generoBuscado.join(', ')
              : typeof preferencias?.generoBuscado === 'string'
              ? preferencias.generoBuscado
              : typeof src?.generoBuscado === 'string'
              ? src.generoBuscado
              : Array.isArray(src?.generoBuscado)
              ? src.generoBuscado.join(', ')
              : '',
            rangoEdad: { min: edadMin, max: edadMax },
            preferenciaCarrera: preferencias?.preferenciaCarrera ?? preferencias?.carreraPref ?? ''
          },
          generoPreferido:
            typeof preferencias?.generoBuscado === 'string'
              ? preferencias.generoBuscado
              : Array.isArray(preferencias?.generoBuscado)
              ? preferencias.generoBuscado.join(', ')
              : '',
          edadMinima: edadMin,
          edadMaxima: edadMax,
          carreraPreferida: preferencias?.preferenciaCarrera ?? '',
          fechaNacimientoISO: fechaN ? fechaN.toISOString() : undefined,
          edad: edad,
        }
        setUserData(normalized)
        setEditData(normalized)
      } catch (e) {
        console.error("Error parsing userData from localStorage", e)
        setUserData(emptyProfile)
        setEditData(emptyProfile)
      }
    } else {
      setUserData(emptyProfile)
      setEditData(emptyProfile)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.clear()
    router.push("/auth")
  }

  const handleSave = () => {
    setError("")

    if (editData.password && editData.password !== editData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (editData.password && editData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (!Array.isArray(editData?.intereses) || editData.intereses.length === 0) {
      setError("Debes seleccionar al menos un interés")
      return
    }

    if (!Array.isArray(editData?.fotos) || editData.fotos.length !== 2) {
      setError("Debes tener exactamente 2 fotos")
      return
    }

    if (Number.parseInt(editData.edadMinima) > Number.parseInt(editData.edadMaxima)) {
      setError("La edad mínima no puede ser mayor que la edad máxima")
      return
    }

    localStorage.setItem("userData", JSON.stringify(editData))
    setUserData(editData)
    setIsEditing(false)
    setError("")
  }

  const handleCancel = () => {
    setEditData(userData)
    setIsEditing(false)
    setError("")
  }

  const updateEditData = (field: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }))
  }

  if (!userData) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <p>Cargando...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-ucab-maroon">Mi Perfil</h1>
            <div className="flex gap-3">
              {!isEditing ? (
                <>
                  <Button onClick={() => setIsEditing(true)} className="bg-ucab-maroon hover:bg-ucab-maroon/90">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Perfil
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="border-ucab-maroon text-ucab-maroon bg-transparent"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleSave} className="bg-ucab-maroon hover:bg-ucab-maroon/90">
                    Guardar Cambios
                  </Button>
                  <Button onClick={handleCancel} variant="outline">
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>

          {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Photos Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-ucab-maroon">Fotos</h2>
              {isEditing ? (
                <ImageUpload photos={editData?.fotos ?? []} onPhotosChange={(photos) => updateEditData("fotos", photos)} />
              ) : (
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={(userData?.fotos?.[currentImageIndex]) ?? "/placeholder.svg"}
                    alt={`Foto ${currentImageIndex + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {(userData?.fotos?.length ?? 0) > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) => (prev === 0 ? (userData?.fotos?.length ?? 1) - 1 : prev - 1))
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white"
                      >
                        <ChevronLeft className="h-6 w-6 text-ucab-maroon" />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) => (prev === (userData?.fotos?.length ?? 1) - 1 ? 0 : prev + 1))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white"
                      >
                        <ChevronRight className="h-6 w-6 text-ucab-maroon" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                        {(userData?.fotos ?? []).map((_: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`h-2 w-2 rounded-full transition-all ${
                              idx === currentImageIndex ? "bg-ucab-maroon w-8" : "bg-white/70"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-ucab-maroon">Información Personal</h2>

                <div className="space-y-2">
                  <Label>Correo UCAB</Label>
                  <Input value={userData.email} disabled className="bg-gray-50" />
                </div>

                {isEditing && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">Nueva Contraseña (opcional)</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Dejar vacío para no cambiar"
                        value={editData.password || ""}
                        onChange={(e) => updateEditData("password", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirmar nueva contraseña"
                        value={editData.confirmPassword || ""}
                        onChange={(e) => updateEditData("confirmPassword", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Nombre</Label>
                  {isEditing ? (
                    <Input
                      value={editData.nombre}
                      onChange={(e) => updateEditData("nombre", e.target.value)}
                      required
                    />
                  ) : (
                    <p className="text-lg">{userData.nombre}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Edad</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        min="18"
                        max="99"
                        value={editData.edad}
                        onChange={(e) => updateEditData("edad", e.target.value)}
                        required
                      />
                    ) : (
                      <p className="text-lg">{userData.edad} años</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Género</Label>
                    {isEditing ? (
                      <Select value={editData.genero} onValueChange={(value) => updateEditData("genero", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {generos.map((genero) => (
                            <SelectItem key={genero} value={genero.toLowerCase()}>
                              {genero}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-lg capitalize">{userData.genero}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Carrera</Label>
                  {isEditing ? (
                    <Select value={editData.carrera} onValueChange={(value) => updateEditData("carrera", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {carreras.map((carrera) => (
                          <SelectItem key={carrera} value={carrera}>
                            {carrera}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-lg">{userData.carrera}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Biografía</Label>
                  {isEditing ? (
                    <Textarea
                      value={editData.bio}
                      onChange={(e) => updateEditData("bio", e.target.value)}
                      rows={3}
                      required
                    />
                  ) : (
                    <p className="text-gray-700">{userData.bio}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Color de Ojos</Label>
                    {isEditing ? (
                      <Select value={editData.colorOjos} onValueChange={(value) => updateEditData("colorOjos", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {coloresOjos.map((color) => (
                            <SelectItem key={color} value={color.toLowerCase()}>
                              {color}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-lg capitalize">{userData.colorOjos}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Color de Cabello</Label>
                    {isEditing ? (
                      <Select
                        value={editData.colorCabello}
                        onValueChange={(value) => updateEditData("colorCabello", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {coloresCabello.map((color) => (
                            <SelectItem key={color} value={color.toLowerCase()}>
                              {color}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-lg capitalize">{userData.colorCabello}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-ucab-maroon">Intereses</h2>
                {isEditing ? (
                  <InterestsSelector
                    selectedInterests={editData.intereses}
                    onInterestsChange={(interests) => updateEditData("intereses", interests)}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {userData.intereses.map((interest: string) => (
                      <span
                        key={interest}
                        className="rounded-full bg-ucab-maroon/10 px-3 py-1 text-sm text-ucab-maroon"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-ucab-maroon">Preferencias de Búsqueda</h2>

                <div className="space-y-2">
                  <Label>Género Buscado</Label>
                  {isEditing ? (
                    <Select
                      value={editData.generoPreferido}
                      onValueChange={(value) => updateEditData("generoPreferido", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                  ) : (
                    <p className="text-lg capitalize">{userData.generoPreferido}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Edad Mínima</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        min="18"
                        max="99"
                        value={editData.edadMinima}
                        onChange={(e) => updateEditData("edadMinima", e.target.value)}
                        required
                      />
                    ) : (
                      <p className="text-lg">{userData.edadMinima} años</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Edad Máxima</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        min="18"
                        max="99"
                        value={editData.edadMaxima}
                        onChange={(e) => updateEditData("edadMaxima", e.target.value)}
                        required
                      />
                    ) : (
                      <p className="text-lg">{userData.edadMaxima} años</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferencia de Carrera</Label>
                  {isEditing ? (
                    <Select
                      value={editData.carreraPreferida}
                      onValueChange={(value) => updateEditData("carreraPreferida", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="misma">Misma</SelectItem>
                        <SelectItem value="otra">Otra</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-lg capitalize">{userData.carreraPreferida}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
