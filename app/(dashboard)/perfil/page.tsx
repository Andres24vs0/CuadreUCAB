"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { useAuth } from "@/lib/queries/auth-queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InterestsSelector } from "@/components/interests-selector"
import { ImageUpload } from "@/components/image-upload"
import { Edit, LogOut, ChevronLeft, ChevronRight } from "lucide-react"
import { useUserProfile, useUpdateUserProfile } from "@/lib/queries/user-queries"
import { useUploadImage } from "@/lib/queries/upload-queries"
import { validateProfileUpdate } from "@/lib/validation"
import type { NormalizedProfile, PendingUpload } from "@/lib/types"

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
  const { userId, userEmail, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [error, setError] = useState("")
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([])

  // Get identifier from auth hook (already hydrated from layout)
  const identifier = userId || userEmail || null
  const { data: userData, isLoading, error: queryError } = useUserProfile(identifier)
  const updateProfileMutation = useUpdateUserProfile()
  const uploadImageMutation = useUploadImage()

  // Edit state: holds temporary changes while editing
  const [editData, setEditData] = useState<NormalizedProfile | null>(null)
  
  // Sync editData with userData immediately when it loads (using useEffect but with immediate effect)
  useEffect(() => {
    if (userData) {
      // Only update if we're not currently editing, or if userData actually changed
      if (!isEditing || !editData) {
        setEditData(userData)
      }
      setCurrentImageIndex(0)
    }
  }, [userData, isEditing, editData])

  const handleLogout = () => {
    logout()
    router.push("/auth")
  }

  const handleSave = async () => {
    if (!editData || !userData) return

    setError("")

    // Client-side validation
    const validation = validateProfileUpdate({
      password: editData.password,
      confirmPassword: (editData as any).confirmPassword,
      intereses: editData.intereses,
      fotos: editData.fotos,
      edadMinima: editData.edadMinima,
      edadMaxima: editData.edadMaxima,
    })

    if (!validation.isValid) {
      setError(validation.error || "Error de validación")
      return
    }

    // Determine identifier (prefer id, fallback to email)
    const updateIdentifier = editData.id ?? editData.email ?? userData.email
    if (!updateIdentifier) {
      setError('No se pudo determinar el identificador del usuario')
      return
    }

    try {
      // If there are pending file uploads, upload them first
      let finalPhotos = editData.fotos
      if (pendingUploads.length > 0) {
        const uploaded = await Promise.all(
          pendingUploads.map((p) => uploadImageMutation.mutateAsync({ dataUrl: p.dataUrl, filename: p.file.name }))
        )
        // Replace preview URLs with uploaded URLs
        finalPhotos = editData.fotos.map((f: string) => {
          const idx = pendingUploads.findIndex((p) => p.previewUrl === f)
          return idx >= 0 ? uploaded[idx] : f
        })
      }

      // Build payload matching the PATCH schema in the API
      const payload: any = {
        nombre: editData.nombre,
        genero: editData.genero,
        bio: editData.bio,
        fotos: finalPhotos,
        intereses: editData.intereses,
        atributosFisicos: {
          colorOjos: editData.colorOjos,
          colorCabello: editData.colorCabello,
        },
        carrera: editData.carrera,
        preferencias: {
          generoBuscado: editData.generoPreferido,
          rangoEdad: { min: editData.edadMinima, max: editData.edadMaxima },
          preferenciaCarrera: editData.carreraPreferida,
        },
      }

      // Include password if user wants to change it
      if (editData.password && editData.password.length >= 8) {
        payload.password = editData.password
      }

      if (editData.fechaNacimientoISO) {
        payload.fechaNacimiento = editData.fechaNacimientoISO
      }

      // Update profile using mutation
      const updated = await updateProfileMutation.mutateAsync({
        identifier: updateIdentifier,
        updates: payload,
      })

      // Update local state
      setEditData(updated)
      setPendingUploads([])
      setIsEditing(false)
      setError('')
    } catch (e: any) {
      console.error('Error updating profile', e)
      setError(e?.error || e?.message || 'Error de red al actualizar el perfil')
    }
  }

  const handleCancel = () => {
    if (userData) {
      setEditData(userData)
    }
    setIsEditing(false)
    setError("")
  }

  const updateEditData = (field: string, value: any) => {
    setEditData((prev) => {
      if (!prev) return prev
      return { ...prev, [field]: value }
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-ucab-maroon mb-2">Mi Perfil</h1>
              <p className="text-gray-600">Gestiona tu información personal y preferencias</p>
            </div>
            <div className="flex gap-3">
              {!isEditing && userData && (
                <>
                  <Button onClick={() => setIsEditing(true)} className="bg-ucab-maroon hover:bg-ucab-maroon/90">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Perfil
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="border-ucab-maroon text-ucab-maroon bg-transparent hover:bg-ucab-maroon/5"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </>
              )}
              {isEditing && userData && editData && (
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

          {/* Loading State - only show if query is actively loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-lg text-gray-600">Cargando perfil...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {queryError && !isLoading && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="font-semibold text-red-800">Error al cargar el perfil</p>
              <p className="text-sm text-red-600 mt-1">{(queryError as Error).message || "Ocurrió un error inesperado"}</p>
            </div>
          )}

          {/* Update Error State */}
          {(error || updateProfileMutation.isError) && userData && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error || (updateProfileMutation.error as any)?.error || "Error al actualizar el perfil"}
            </div>
          )}

          {/* Update Loading State */}
          {updateProfileMutation.isPending && (
            <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-600">
              Guardando cambios...
            </div>
          )}

          {/* Main Content - Only show when data is loaded */}
          {userData && editData && !queryError && (

          <div className="grid gap-6 lg:grid-cols-[350px_1fr] xl:grid-cols-[380px_1fr]">
            {/* Photos Section */}
            <Card className="shadow-lg border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-ucab-maroon">Galería de Fotos</CardTitle>
                <CardDescription>
                  {isEditing ? "Sube hasta 6 fotos de tu perfil" : `${(userData?.fotos ?? []).filter((url: string) => url && typeof url === 'string' && url.trim() !== "").length} foto(s) en tu perfil`}
                </CardDescription>
              </CardHeader>
              <CardContent>
              {isEditing ? (
                <ImageUpload
                  photos={editData.fotos}
                  onPhotosChange={(photos) => updateEditData("fotos", photos)}
                  onFilesSelected={(files) => {
                    // merge into pendingUploads, avoid duplicates by previewUrl
                    setPendingUploads((prev) => {
                      const map = new Map(prev.map((p) => [p.previewUrl, p]))
                      for (const f of files) map.set(f.previewUrl, f)
                      return Array.from(map.values())
                    })
                  }}
                />
              ) : (
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
                  {(() => {
                    // Filter out empty/invalid photo URLs and ensure we have valid photos
                    const validPhotos = (userData?.fotos ?? []).filter((url: string) => url && typeof url === 'string' && url.trim() !== "")
                    
                    // Ensure currentImageIndex is within bounds
                    const safeIndex = Math.max(0, Math.min(currentImageIndex, validPhotos.length - 1))
                    const currentPhoto = validPhotos[safeIndex]
                    
                    // Update index if it was out of bounds
                    if (currentImageIndex !== safeIndex && validPhotos.length > 0) {
                      setTimeout(() => setCurrentImageIndex(safeIndex), 0)
                    }
                    
                    return currentPhoto ? (
                      <img
                        key={`photo-${safeIndex}-${currentPhoto}`}
                        src={currentPhoto}
                        alt={`Foto ${safeIndex + 1} de ${validPhotos.length}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          console.error(`Failed to load image ${safeIndex}:`, currentPhoto)
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg"
                        }}
                      />
                    ) : (
                      <img
                        src="/placeholder.svg"
                        alt="Sin foto"
                        className="h-full w-full object-cover"
                      />
                    )
                  })()}
                  {(() => {
                    const validPhotos = (userData?.fotos ?? []).filter((url: string) => url && typeof url === 'string' && url.trim() !== "")
                    return validPhotos.length > 1
                  })() && (
                    <>
                      <button
                        onClick={() => {
                          const validPhotos = (userData?.fotos ?? []).filter((url: string) => url && typeof url === 'string' && url.trim() !== "")
                          setCurrentImageIndex((prev) => {
                            const newIndex = prev === 0 ? validPhotos.length - 1 : prev - 1
                            return Math.max(0, Math.min(newIndex, validPhotos.length - 1))
                          })
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white"
                      >
                        <ChevronLeft className="h-6 w-6 text-ucab-maroon" />
                      </button>
                      <button
                        onClick={() => {
                          const validPhotos = (userData?.fotos ?? []).filter((url: string) => url && typeof url === 'string' && url.trim() !== "")
                          setCurrentImageIndex((prev) => {
                            const newIndex = prev === validPhotos.length - 1 ? 0 : prev + 1
                            return Math.max(0, Math.min(newIndex, validPhotos.length - 1))
                          })
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white"
                      >
                        <ChevronRight className="h-6 w-6 text-ucab-maroon" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                        {(userData?.fotos ?? []).filter((url: string) => url && typeof url === 'string' && url.trim() !== "").map((_: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const validPhotos = (userData?.fotos ?? []).filter((url: string) => url && typeof url === 'string' && url.trim() !== "")
                              setCurrentImageIndex(Math.max(0, Math.min(idx, validPhotos.length - 1)))
                            }}
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
              </CardContent>
            </Card>

            {/* Profile Info */}
            <div className="space-y-6">
              <Card className="shadow-lg border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-ucab-maroon">Información Personal</CardTitle>
                  <CardDescription>Detalles básicos de tu perfil</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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

                {/* Row 1: Nombre and Edad */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    {isEditing ? (
                      <Input
                        value={editData.nombre}
                        onChange={(e) => updateEditData("nombre", e.target.value)}
                        required
                      />
                    ) : (
                      <p className="text-base">{userData.nombre}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Edad</Label>
                    <p className="text-base">{userData.edad} años</p>
                  </div>
                </div>

                {/* Row 2: Género and Carrera */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Género</Label>
                    {isEditing ? (
                      <Select value={editData.genero} onValueChange={(value: string) => updateEditData("genero", value)}>
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
                      <p className="text-base capitalize">{userData.genero}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Carrera</Label>
                    {isEditing ? (
                      <Select value={editData.carrera} onValueChange={(value: string) => updateEditData("carrera", value)}>
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
                      <p className="text-base">{userData.carrera}</p>
                    )}
                  </div>
                </div>

                {/* Row 3: Color de Cabello and Color de Ojos */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Color de Cabello</Label>
                    {isEditing ? (
                      <Select
                        value={editData.colorCabello}
                        onValueChange={(value: string) => updateEditData("colorCabello", value)}
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
                      <p className="text-base capitalize">{userData.colorCabello}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Color de Ojos</Label>
                    {isEditing ? (
                      <Select value={editData.colorOjos} onValueChange={(value: string) => updateEditData("colorOjos", value)}>
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
                      <p className="text-base capitalize">{userData.colorOjos}</p>
                    )}
                  </div>
                </div>

                {/* Last: Biografía */}
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
                </CardContent>
              </Card>

              <Card className="shadow-lg border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-ucab-maroon">Intereses</CardTitle>
                  <CardDescription>Actividades y hobbies que disfrutas</CardDescription>
                </CardHeader>
                <CardContent>
                {isEditing ? (
                  <InterestsSelector
                    selectedInterests={editData.intereses}
                    onInterestsChange={(interests) => updateEditData("intereses", interests)}
                  />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(userData.intereses) ? userData.intereses : []).map((interest: string) => (
                        <span
                          key={interest}
                          className="rounded-full bg-ucab-maroon/10 px-3 py-1 text-sm text-ucab-maroon"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                )}
                </CardContent>
              </Card>

              <Card className="shadow-lg border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-ucab-maroon">Preferencias de Búsqueda</CardTitle>
                  <CardDescription>Configura tus preferencias de coincidencias</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                <div className="space-y-2">
                  <Label>Género Buscado</Label>
                  {isEditing ? (
                    <Select
                      value={editData.generoPreferido}
                      onValueChange={(value: string) => updateEditData("generoPreferido", value)}
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
                    <p className="text-base capitalize">{userData.generoPreferido}</p>
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
                      <p className="text-base">{userData.edadMinima} años</p>
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
                      <p className="text-base">{userData.edadMaxima} años</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferencia de Carrera</Label>
                  {isEditing ? (
                    <Select
                      value={editData.carreraPreferida}
                      onValueChange={(value: string) => updateEditData("carreraPreferida", value)}
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
                    <p className="text-base capitalize">{userData.carreraPreferida}</p>
                  )}
                </div>
                </CardContent>
              </Card>
            </div>
          </div>
          )}
        </div>
      </main>
    </div>
  )
}
