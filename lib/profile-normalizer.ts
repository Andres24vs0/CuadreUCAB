import { calculateAge } from "@/lib/zodiac-utils"
import type { RawUserProfile, NormalizedProfile } from "@/lib/types"

// Empty profile template
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

// Parse date from various formats (MongoDB date formats, ISO strings, Date objects)
function parseDate(v: any): Date | undefined {
  if (!v) return undefined
  if (v instanceof Date) return v
  if (typeof v === "string") {
    const d = new Date(v)
    return isNaN(d.getTime()) ? undefined : d
  }
  if (typeof v === "object") {
    if ("$date" in v) {
      const d = v.$date
      if (typeof d === "string") {
        const dd = new Date(d)
        return isNaN(dd.getTime()) ? undefined : dd
      }
      if (typeof d === "object" && ("$numberLong" in d || "$numberLong" in v)) {
        const num = Number(d.$numberLong ?? v.$numberLong)
        const dd = new Date(num)
        return isNaN(dd.getTime()) ? undefined : dd
      }
    }
    if (v.$date && typeof v.$date === "object" && "$numberLong" in v.$date) {
      const num = Number(v.$date.$numberLong)
      const dd = new Date(num)
      return isNaN(dd.getTime()) ? undefined : dd
    }
  }
  return undefined
}

// Parse number from various formats (MongoDB number formats, strings, numbers)
function parseNumber(v: any): number | undefined {
  if (v == null) return undefined
  if (typeof v === "number") return v
  if (typeof v === "string" && !isNaN(Number(v))) return Number(v)
  if (typeof v === "object") {
    if ("$numberInt" in v) return Number(v.$numberInt)
    if ("$numberLong" in v) return Number(v.$numberLong)
  }
  return undefined
}

/**
 * Normalize raw user profile from API into UI-friendly flat shape
 * Handles various MongoDB date/number formats and nested structures
 */
export function normalizeRaw(raw: RawUserProfile | any): NormalizedProfile {
  const src = raw?.perfil ?? raw

  const fechaN = parseDate(src?.fechaNacimiento ?? src?.perfil?.fechaNacimiento ?? src?.fecha_nacimiento)
  const edad = fechaN ? calculateAge(fechaN) : (src?.edad ?? undefined)

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

  const normalized: NormalizedProfile = {
    // keep server id if present
    id: raw?.id ?? raw?._id ?? undefined,
    ...emptyProfile,
    ...src,
    email: raw?.email ?? src?.email ?? "",
    fotos: Array.isArray(src?.fotos) ? src.fotos : [],
    intereses: Array.isArray(src?.intereses) ? src.intereses : [],
    colorOjos: atributos?.colorOjos ?? atributos?.color_ojos ?? "",
    colorCabello: atributos?.colorCabello ?? atributos?.color_cabello ?? "",
    preferencias: {
      generoBuscado: Array.isArray(preferencias?.generoBuscado)
        ? preferencias.generoBuscado.join(", ")
        : typeof preferencias?.generoBuscado === "string"
          ? preferencias.generoBuscado
          : typeof src?.generoBuscado === "string"
            ? src.generoBuscado
            : Array.isArray(src?.generoBuscado)
              ? src.generoBuscado.join(", ")
              : "",
      rangoEdad: { min: edadMin, max: edadMax },
      preferenciaCarrera: preferencias?.preferenciaCarrera ?? preferencias?.carreraPref ?? "",
    },
    generoPreferido:
      typeof preferencias?.generoBuscado === "string"
        ? preferencias.generoBuscado
        : Array.isArray(preferencias?.generoBuscado)
          ? preferencias.generoBuscado.join(", ")
          : "",
    edadMinima: edadMin,
    edadMaxima: edadMax,
    carreraPreferida: preferencias?.preferenciaCarrera ?? "",
    fechaNacimientoISO: fechaN ? fechaN.toISOString() : undefined,
    edad: edad,
  }
  return normalized
}

