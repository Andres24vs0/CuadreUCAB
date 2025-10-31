import { isAtLeast18YearsOld } from "@/lib/zodiac-utils"

// Validation result type
export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validate UCAB email format
 */
export function validateUcabEmail(email: string): ValidationResult {
  if (!email.endsWith("@ucab.edu.ve") && !email.endsWith("@est.ucab.edu.ve")) {
    return {
      isValid: false,
      error: "Debes usar un correo UCAB (@ucab.edu.ve o @est.ucab.edu.ve)",
    }
  }
  return { isValid: true }
}

/**
 * Validate password match
 */
export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: "Las contraseñas no coinciden",
    }
  }
  return { isValid: true }
}

/**
 * Validate password length
 */
export function validatePasswordLength(password: string, minLength: number = 8): ValidationResult {
  if (password.length < minLength) {
    return {
      isValid: false,
      error: `La contraseña debe tener al menos ${minLength} caracteres`,
    }
  }
  return { isValid: true }
}

/**
 * Validate birth date and age requirement
 */
export function validateBirthDate(birthDate: string | Date): ValidationResult {
  if (!birthDate) {
    return {
      isValid: false,
      error: "Debes ingresar tu fecha de nacimiento",
    }
  }

  const date = typeof birthDate === "string" ? new Date(birthDate) : birthDate
  if (!isAtLeast18YearsOld(date)) {
    return {
      isValid: false,
      error: "Debes tener al menos 18 años para registrarte",
    }
  }
  return { isValid: true }
}

/**
 * Validate interests array
 */
export function validateInterests(interests: string[]): ValidationResult {
  if (!Array.isArray(interests) || interests.length === 0) {
    return {
      isValid: false,
      error: "Debes seleccionar al menos un interés",
    }
  }
  return { isValid: true }
}

/**
 * Validate photos array (must have exactly 2)
 */
export function validatePhotos(photos: string[], requiredCount: number = 2): ValidationResult {
  if (!Array.isArray(photos) || photos.length !== requiredCount) {
    return {
      isValid: false,
      error: `Debes tener exactamente ${requiredCount} fotos`,
    }
  }
  return { isValid: true }
}

/**
 * Validate age range
 */
export function validateAgeRange(
  minAge: string | number | undefined,
  maxAge: string | number | undefined
): ValidationResult {
  if (!minAge || !maxAge) {
    return {
      isValid: false,
      error: "Debes especificar el rango de edad buscado",
    }
  }

  const min = typeof minAge === "string" ? Number.parseInt(minAge) : minAge
  const max = typeof maxAge === "string" ? Number.parseInt(maxAge) : maxAge

  if (min > max) {
    return {
      isValid: false,
      error: "La edad mínima no puede ser mayor que la edad máxima",
    }
  }
  return { isValid: true }
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string): ValidationResult {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return {
      isValid: false,
      error: `Debes ${fieldName}`,
    }
  }
  return { isValid: true }
}

/**
 * Validate profile update data
 */
export function validateProfileUpdate(data: {
  password?: string
  confirmPassword?: string
  intereses?: string[]
  fotos?: string[]
  edadMinima?: string | number
  edadMaxima?: string | number
}): ValidationResult {
  // Password validation if provided
  if (data.password) {
    const passwordMatch = validatePasswordMatch(data.password, data.confirmPassword || "")
    if (!passwordMatch.isValid) return passwordMatch

    const passwordLength = validatePasswordLength(data.password)
    if (!passwordLength.isValid) return passwordLength
  }

  // Interests validation
  if (data.intereses !== undefined) {
    const interests = validateInterests(data.intereses)
    if (!interests.isValid) return interests
  }

  // Photos validation
  if (data.fotos !== undefined) {
    const photos = validatePhotos(data.fotos)
    if (!photos.isValid) return photos
  }

  // Age range validation
  if (data.edadMinima !== undefined || data.edadMaxima !== undefined) {
    const ageRange = validateAgeRange(data.edadMinima, data.edadMaxima)
    if (!ageRange.isValid) return ageRange
  }

  return { isValid: true }
}

/**
 * Validate registration data
 */
export function validateRegistration(data: {
  email: string
  password: string
  confirmPassword: string
  fechaNacimiento: string
  selectedInterests: string[]
  photos: string[]
  generoPreferido: string
  edadMinima: string
  edadMaxima: string
  carreraPreferida: string
}): ValidationResult {
  // Email validation
  const email = validateUcabEmail(data.email)
  if (!email.isValid) return email

  // Password validation
  const passwordMatch = validatePasswordMatch(data.password, data.confirmPassword)
  if (!passwordMatch.isValid) return passwordMatch

  const passwordLength = validatePasswordLength(data.password)
  if (!passwordLength.isValid) return passwordLength

  // Birth date validation
  const birthDate = validateBirthDate(data.fechaNacimiento)
  if (!birthDate.isValid) return birthDate

  // Interests validation
  const interests = validateInterests(data.selectedInterests)
  if (!interests.isValid) return interests

  // Photos validation
  const photos = validatePhotos(data.photos)
  if (!photos.isValid) return photos

  // Gender preference validation
  const genderPref = validateRequired(data.generoPreferido, "seleccionar un género buscado")
  if (!genderPref.isValid) return genderPref

  // Age range validation
  const ageRange = validateAgeRange(data.edadMinima, data.edadMaxima)
  if (!ageRange.isValid) return ageRange

  // Career preference validation
  const careerPref = validateRequired(data.carreraPreferida, "seleccionar una preferencia de carrera")
  if (!careerPref.isValid) return careerPref

  return { isValid: true }
}

