"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InterestsSelector } from "@/components/interests-selector"
import { ImageUpload } from "@/components/image-upload"
import { CARRERAS, COLORES_OJOS, COLORES_CABELLO, GENEROS } from "@/lib/constants"
import { useRegister } from "@/lib/queries/auth-queries"
import { useUploadImage } from "@/lib/queries/upload-queries"
import { registerFormSchema, type RegisterFormData, type PendingUpload } from "@/lib/types"

interface RegisterFormProps {
  onComplete: (userId: string, email: string) => void
}

export function RegisterForm({ onComplete }: RegisterFormProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [photos, setPhotos] = useState<string[]>([])
  const [pendingFiles, setPendingFiles] = useState<PendingUpload[]>([])
  const [submitError, setSubmitError] = useState("")

  // Use TanStack Query hooks
  const registerMutation = useRegister()
  const uploadImageMutation = useUploadImage()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      nombre: "",
      fechaNacimiento: "",
      genero: undefined,
      bio: "",
      carrera: undefined,
      colorOjos: "",
      colorCabello: "",
      generoPreferido: "",
      edadMinima: "",
      edadMaxima: "",
      carreraPreferida: undefined,
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setSubmitError("")

    // Validate additional fields (interests and photos)
    if (selectedInterests.length === 0) {
      setSubmitError("Debes seleccionar al menos un interés")
      return
    }

    if (photos.length !== 2) {
      setSubmitError("Debes tener exactamente 2 fotos")
      return
    }

    try {
      // Upload pending files (if any) and replace previews
      let uploadedUrls = photos
      if (pendingFiles.length > 0) {
        const urls = await Promise.all(
          pendingFiles.map((p) => uploadImageMutation.mutateAsync({ dataUrl: p.dataUrl, filename: p.file.name }))
        )
        // Map previews to URLs
        uploadedUrls = photos.map((p) => {
          const idx = pendingFiles.findIndex((f) => f.previewUrl === p)
          return idx >= 0 ? urls[idx] : p
        })
      }

      const perfil = {
        nombre: data.nombre,
        fotos: uploadedUrls,
        intereses: selectedInterests,
        fechaNacimiento: data.fechaNacimiento,
        genero: data.genero,
        bio: data.bio,
        atributosFisicos: { colorOjos: data.colorOjos, colorCabello: data.colorCabello },
        carrera: data.carrera,
        preferencias: {
          generoBuscado: data.generoPreferido,
          rangoEdad: { 
            min: Number.parseInt(data.edadMinima), 
            max: Number.parseInt(data.edadMaxima) 
          },
          preferenciaCarrera: data.carreraPreferida,
        },
      }

      // Register user using mutation
      const response = await registerMutation.mutateAsync({
        email: data.email,
        password: data.password,
        perfil,
      })

      // The mutation's onSuccess callback handles auth store update
      // We still need to call onComplete for navigation
      onComplete(response.id, data.email)
    } catch (err: any) {
      console.error("Registro error", err)
      setSubmitError(err?.error || err?.message || "Error registrando usuario")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ucab-maroon">Información de Cuenta</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Correo UCAB *</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu.correo@ucab.edu.ve"
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Primer Nombre *</Label>
            <Input
              id="nombre"
              type="text"
              placeholder="Tu primer nombre"
              {...register("nombre")}
            />
            {errors.nombre && <p className="text-sm text-red-600">{errors.nombre.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              {...register("password")}
            />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repite tu contraseña"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ucab-maroon">Información Personal</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="fechaNacimiento">Fecha de Nacimiento *</Label>
            <Input
              id="fechaNacimiento"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              {...register("fechaNacimiento")}
            />
            {errors.fechaNacimiento && <p className="text-sm text-red-600">{errors.fechaNacimiento.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="genero">Género *</Label>
            <Controller
              name="genero"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENEROS.map((genero) => (
                      <SelectItem key={genero} value={genero.toLowerCase()}>
                        {genero}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.genero && <p className="text-sm text-red-600">{errors.genero.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="carrera">Carrera *</Label>
            <Controller
              name="carrera"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARRERAS.map((carrera) => (
                      <SelectItem key={carrera} value={carrera}>
                        {carrera}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.carrera && <p className="text-sm text-red-600">{errors.carrera.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Biografía *</Label>
          <Textarea
            id="bio"
            placeholder="Cuéntanos sobre ti..."
              {...register("bio")}
            rows={3}
          />
          {errors.bio && <p className="text-sm text-red-600">{errors.bio.message}</p>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="colorOjos">Color de Ojos *</Label>
            <Controller
              name="colorOjos"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORES_OJOS.map((color) => (
                      <SelectItem key={color} value={color.toLowerCase()}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.colorOjos && <p className="text-sm text-red-600">{errors.colorOjos.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="colorCabello">Color de Cabello *</Label>
            <Controller
              name="colorCabello"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORES_CABELLO.map((color) => (
                      <SelectItem key={color} value={color.toLowerCase()}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.colorCabello && <p className="text-sm text-red-600">{errors.colorCabello.message}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ucab-maroon">Intereses (máximo 8) *</h2>
        <InterestsSelector selectedInterests={selectedInterests} onInterestsChange={setSelectedInterests} />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ucab-maroon">Fotos (exactamente 2) *</h2>
        <ImageUpload
          photos={photos}
          onPhotosChange={setPhotos}
          onFilesSelected={(files) => setPendingFiles(files)}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ucab-maroon">Preferencias de Búsqueda</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="generoPreferido">Género Buscado *</Label>
            <Controller
              name="generoPreferido"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {GENEROS.map((genero) => (
                      <SelectItem key={genero} value={genero.toLowerCase()}>
                        {genero}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.generoPreferido && <p className="text-sm text-red-600">{errors.generoPreferido.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edadMinima">Edad Mínima *</Label>
            <Input
              id="edadMinima"
              type="number"
              min="18"
              max="99"
              placeholder="18"
              {...register("edadMinima")}
            />
            {errors.edadMinima && <p className="text-sm text-red-600">{errors.edadMinima.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edadMaxima">Edad Máxima *</Label>
            <Input
              id="edadMaxima"
              type="number"
              min="18"
              max="99"
              placeholder="99"
              {...register("edadMaxima")}
            />
            {errors.edadMaxima && <p className="text-sm text-red-600">{errors.edadMaxima.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="carreraPreferida">Preferencia de Carrera *</Label>
            <Controller
              name="carreraPreferida"
              control={control}
              render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="misma">Misma</SelectItem>
                  <SelectItem value="otra">Otra</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.carreraPreferida && <p className="text-sm text-red-600">{errors.carreraPreferida.message}</p>}
        </div>
      </div>

      {(submitError || registerMutation.isError) && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {submitError || (registerMutation.error as any)?.error || "Error registrando usuario"}
        </div>
      )}
      {(isSubmitting || registerMutation.isPending) && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-600">
          Registrando usuario...
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-ucab-maroon text-white text-lg font-semibold hover:bg-ucab-maroon/90"
        size="lg"
        disabled={isSubmitting || registerMutation.isPending}
      >
        {isSubmitting || registerMutation.isPending ? "Creando cuenta..." : "Crear Cuenta"}
      </Button>
    </form>
  )
}
