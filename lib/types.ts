import { z } from "zod"
import { CARRERAS, COLORES_OJOS, COLORES_CABELLO, GENEROS } from "@/lib/constants"
import { isAtLeast18YearsOld } from "@/lib/zodiac-utils"

// Zod Schemas
export const ucabEmailSchema = z
  .string()
  .email("Debe ser un correo válido")
  .refine(
    (email) => email.endsWith("@ucab.edu.ve") || email.endsWith("@est.ucab.edu.ve"),
    "Debes usar un correo UCAB (@ucab.edu.ve o @est.ucab.edu.ve)"
  )

export const passwordSchema = z.string().min(8, "La contraseña debe tener al menos 8 caracteres")

export const birthDateSchema = z
  .string()
  .refine(
    (date) => {
      if (!date) return false
      const birthDate = new Date(date)
      return isAtLeast18YearsOld(birthDate)
    },
    "Debes tener al menos 18 años para registrarte"
  )

export const ageRangeSchema = z
  .object({
    min: z.coerce.number().min(18).max(99),
    max: z.coerce.number().min(18).max(99),
  })
  .refine((data) => data.min <= data.max, {
    message: "La edad mínima no puede ser mayor que la edad máxima",
    path: ["max"],
  })

// API Error schema
export const apiErrorSchema = z.object({
  error: z.string().optional(),
  message: z.string().optional(),
  status: z.number().optional(),
})

export type ApiError = z.infer<typeof apiErrorSchema>

// Raw user profile schema (for API responses)
export const rawUserProfileSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  email: z.string(),
  perfil: z
    .object({
      nombre: z.string().optional(),
      genero: z.string().optional(),
      bio: z.string().optional(),
      fotos: z.array(z.string()).optional(),
      intereses: z.array(z.string()).optional(),
      atributosFisicos: z
        .object({
          colorOjos: z.string().optional(),
          colorCabello: z.string().optional(),
          color_ojos: z.string().optional(),
          color_cabello: z.string().optional(),
          carrera: z.string().optional(),
        })
        .optional(),
      carrera: z.string().optional(),
      preferencias: z
        .object({
          generoBuscado: z.union([z.string(), z.array(z.string())]).optional(),
          rangoEdad: z
            .object({
              min: z.union([z.number(), z.object({ $numberInt: z.string() })]).optional(),
              max: z.union([z.number(), z.object({ $numberInt: z.string() })]).optional(),
            })
            .optional(),
          preferenciaCarrera: z.string().optional(),
          carreraPref: z.string().optional(),
          edadMinima: z.number().optional(),
          edadMaxima: z.number().optional(),
        })
        .optional(),
      fechaNacimiento: z.union([z.date(), z.string(), z.object({ $date: z.union([z.string(), z.object({ $numberLong: z.string() })]) })]).optional(),
      fecha_nacimiento: z.union([z.date(), z.string()]).optional(),
      edad: z.number().optional(),
      generoBuscado: z.union([z.string(), z.array(z.string())]).optional(),
      rangoEdad: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
})

export type RawUserProfile = z.infer<typeof rawUserProfileSchema>

// Normalized profile schema
export const normalizedProfileSchema = z.object({
  id: z.string().optional(),
  email: z.string(),
  nombre: z.string(),
  genero: z.string(),
  carrera: z.string(),
  bio: z.string(),
  fotos: z.array(z.string()),
  intereses: z.array(z.string()),
  colorOjos: z.string(),
  colorCabello: z.string(),
  edad: z.number().optional(),
  generoPreferido: z.string(),
  edadMinima: z.number().optional(),
  edadMaxima: z.number().optional(),
  carreraPreferida: z.string(),
  fechaNacimientoISO: z.string().optional(),
  preferencias: z.object({
    generoBuscado: z.string(),
    rangoEdad: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional(),
    preferenciaCarrera: z.string(),
  }),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
})

export type NormalizedProfile = z.infer<typeof normalizedProfileSchema>

// Profile update schema
export const profileUpdateSchema = z
  .object({
    nombre: z.string().optional(),
    genero: z.string().optional(),
    bio: z.string().optional(),
    fotos: z.array(z.string()).length(2, "Debes tener exactamente 2 fotos").optional(),
    intereses: z.array(z.string()).min(1, "Debes seleccionar al menos un interés").optional(),
    atributosFisicos: z
      .object({
        colorOjos: z.string().optional(),
        colorCabello: z.string().optional(),
      })
      .optional(),
    carrera: z.string().optional(),
    preferencias: z
      .object({
        generoBuscado: z.string().optional(),
        rangoEdad: z
          .object({
            min: z.number().optional(),
            max: z.number().optional(),
          })
          .optional(),
        preferenciaCarrera: z.string().optional(),
      })
      .optional(),
    fechaNacimiento: z.string().optional(),
    password: passwordSchema.optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>

// Login schemas
export const loginRequestSchema = z.object({
  email: ucabEmailSchema,
  password: z.string().min(1, "La contraseña es requerida"),
})

export type LoginRequest = z.infer<typeof loginRequestSchema>

export const loginResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  creadoEn: z.string().optional(),
  perfil: z.any().optional(),
  ultimaConexion: z.string().optional(),
})

export type LoginResponse = z.infer<typeof loginResponseSchema>

// Register schemas
export const registerPerfilSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  fotos: z.array(z.string()).length(2, "Debes tener exactamente 2 fotos"),
  intereses: z.array(z.string()).min(1, "Debes seleccionar al menos un interés"),
  fechaNacimiento: birthDateSchema,
  genero: z.enum(["masculino", "femenino", "otro"], {
    errorMap: () => ({ message: "Debes seleccionar un género" }),
  }),
  bio: z.string().min(1, "La biografía es requerida"),
  atributosFisicos: z.object({
    colorOjos: z
      .string()
      .refine(
        (val) => COLORES_OJOS.some((color) => color.toLowerCase() === val.toLowerCase()),
        "Color de ojos inválido"
      ),
    colorCabello: z
      .string()
      .refine(
        (val) => COLORES_CABELLO.some((color) => color.toLowerCase() === val.toLowerCase()),
        "Color de cabello inválido"
      ),
  }),
  carrera: z.enum([...CARRERAS] as [string, ...string[]], {
    errorMap: () => ({ message: "Debes seleccionar una carrera" }),
  }),
  preferencias: z.object({
    generoBuscado: z.string().min(1, "Debes seleccionar un género buscado"),
    rangoEdad: z.object({
      min: z.coerce.number().min(18).max(99),
      max: z.coerce.number().min(18).max(99),
    }),
    preferenciaCarrera: z.enum(["todas", "misma", "otra"], {
      errorMap: () => ({ message: "Debes seleccionar una preferencia de carrera" }),
    }),
  }),
})

export const registerRequestSchema = z
  .object({
    email: ucabEmailSchema,
    password: passwordSchema,
    perfil: registerPerfilSchema,
  })

export type RegisterRequest = z.infer<typeof registerRequestSchema>

export const registerResponseSchema = z.object({
  id: z.string(),
})

export type RegisterResponse = z.infer<typeof registerResponseSchema>

// Upload schemas
export const uploadRequestSchema = z.object({
  filename: z.string().optional(),
  data: z.string().min(1, "Los datos de la imagen son requeridos"),
})

export type UploadRequest = z.infer<typeof uploadRequestSchema>

export const uploadResponseSchema = z.object({
  url: z.string(),
})

export type UploadResponse = z.infer<typeof uploadResponseSchema>

// Pending upload (not validated, just typed)
export interface PendingUpload {
  file: File
  dataUrl: string
  previewUrl: string
}

// Register form schema (for react-hook-form)
export const registerFormSchema = z
  .object({
    email: ucabEmailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    nombre: z.string().min(1, "El nombre es requerido"),
    fechaNacimiento: birthDateSchema,
    genero: z.enum(["masculino", "femenino", "otro"], {
      errorMap: () => ({ message: "Debes seleccionar un género" }),
    }),
    bio: z.string().min(1, "La biografía es requerida"),
    carrera: z.enum([...CARRERAS] as [string, ...string[]], {
      errorMap: () => ({ message: "Debes seleccionar una carrera" }),
    }),
    colorOjos: z
      .string()
      .refine(
        (val) => COLORES_OJOS.some((color) => color.toLowerCase() === val.toLowerCase()),
        "Color de ojos inválido"
      ),
    colorCabello: z
      .string()
      .refine(
        (val) => COLORES_CABELLO.some((color) => color.toLowerCase() === val.toLowerCase()),
        "Color de cabello inválido"
      ),
    generoPreferido: z.string().min(1, "Debes seleccionar un género buscado"),
    edadMinima: z.string().refine((val) => {
      const num = Number.parseInt(val)
      return !Number.isNaN(num) && num >= 18 && num <= 99
    }, "La edad mínima debe estar entre 18 y 99"),
    edadMaxima: z.string().refine((val) => {
      const num = Number.parseInt(val)
      return !Number.isNaN(num) && num >= 18 && num <= 99
    }, "La edad máxima debe estar entre 18 y 99"),
    carreraPreferida: z.enum(["todas", "misma", "otra"], {
      errorMap: () => ({ message: "Debes seleccionar una preferencia de carrera" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((data) => {
    const min = Number.parseInt(data.edadMinima)
    const max = Number.parseInt(data.edadMaxima)
    return min <= max
  }, {
    message: "La edad mínima no puede ser mayor que la edad máxima",
    path: ["edadMaxima"],
  })

export type RegisterFormData = z.infer<typeof registerFormSchema>

