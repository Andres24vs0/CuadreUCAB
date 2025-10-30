import { getDb } from "@/lib/mongo"
import { ObjectId } from "mongodb"

// Interfaz tal como se almacena en la colección (según tu ejemplo)
export interface DbUsuario {
  _id?: ObjectId
  email: string
  password?: string
  creadoEn?: Date
  perfil?: {
    nombre?: string
    genero?: string
    bio?: string
    fotos?: string[]
    intereses?: string[]
    atributosFisicos?: Record<string, unknown>
    carrera?: string
    preferencias?: any
    fechaNacimiento?: Date
  }
  ultimaConexion?: Date
  [key: string]: any
}

// Interfaz pública que exponemos en la API (sin password)
export interface PublicProfile {
  id: string
  email: string
  creadoEn?: string
  perfil: {
    nombre?: string
    genero?: string
    bio?: string
    fotos: string[]
    intereses: string[]
    atributosFisicos?: Record<string, unknown>
    carrera?: string
    preferencias?: any
    fechaNacimiento?: string | null
  }
  ultimaConexion?: string | null
}

function toPublic(doc: DbUsuario): PublicProfile {
  const id = doc._id ? doc._id.toString() : (doc.email ?? "")
  return {
    id,
    email: doc.email,
    creadoEn: doc.creadoEn ? doc.creadoEn.toISOString() : undefined,
    perfil: {
      nombre: doc.perfil?.nombre ?? undefined,
      genero: doc.perfil?.genero ?? undefined,
      bio: doc.perfil?.bio ?? undefined,
      fotos: Array.isArray(doc.perfil?.fotos) ? doc.perfil!.fotos : [],
      intereses: Array.isArray(doc.perfil?.intereses) ? doc.perfil!.intereses : [],
      atributosFisicos: doc.perfil?.atributosFisicos ?? undefined,
      carrera: doc.perfil?.carrera ?? undefined,
      preferencias: doc.perfil?.preferencias ?? undefined,
      fechaNacimiento: doc.perfil?.fechaNacimiento ? new Date(doc.perfil.fechaNacimiento).toISOString() : null,
    },
    ultimaConexion: doc.ultimaConexion ? new Date(doc.ultimaConexion).toISOString() : null,
  }
}

export async function getProfiles(): Promise<PublicProfile[]> {
  const db = await getDb()
  const rows = await db.collection("usuarios").find().toArray()
  // mapear y omitir campos sensibles como password
  return rows.map((r: any) => toPublic(r as DbUsuario))
}

export async function getProfileById(id: string): Promise<PublicProfile | null> {
  const db = await getDb()
  let query: any = { $or: [{ email: id }, { id }] }
  if (ObjectId.isValid(id)) {
    try {
      query = { $or: [{ _id: new ObjectId(id) }, { email: id }, { id }] }
    } catch {
      query = { $or: [{ email: id }, { id }] }
    }
  }
  const row = await db.collection("usuarios").findOne(query)
  return row ? toPublic(row as DbUsuario) : null
}
