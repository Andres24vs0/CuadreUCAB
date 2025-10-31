export const CARRERAS = [
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
] as const

export const COLORES_OJOS = [
  "Marrón",
  "Verde",
  "Azul",
  "Gris",
  "Avellana",
  "Negro",
  "Ámbar",
] as const

export const COLORES_CABELLO = [
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
] as const

export const GENEROS = ["Masculino", "Femenino", "Otro"] as const

export type Carrera = typeof CARRERAS[number]
export type ColorOjos = typeof COLORES_OJOS[number]
export type ColorCabello = typeof COLORES_CABELLO[number]
export type Genero = typeof GENEROS[number]
