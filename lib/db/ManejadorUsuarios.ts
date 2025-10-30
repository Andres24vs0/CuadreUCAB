import { getDb } from "@/lib/mongo"
import { ObjectId } from "mongodb"

// Interfaz tal como se almacena en la colección
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
  const id = doc._id ? doc._id.toString() : doc.email ?? ""
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
      fechaNacimiento: doc.perfil?.fechaNacimiento ? new Date(doc.perfil!.fechaNacimiento).toISOString() : null,
    },
    ultimaConexion: doc.ultimaConexion ? new Date(doc.ultimaConexion).toISOString() : null,
  }
}

export async function getProfiles(): Promise<PublicProfile[]> {
  const db = await getDb()
  const rows = await db.collection("usuarios").find().toArray()
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

/**
 * Registra un nuevo usuario en la colección `usuarios`.
 * - `user` debe contener email, password y opcional perfil completo.
 * - Retorna el id string del nuevo usuario.
 */
export async function registerUser(user: { email: string; password: string; perfil?: Partial<DbUsuario['perfil']> }) {
  const db = await getDb()
  // simple uniqueness check by email
  const exists = await db.collection('usuarios').findOne({ email: user.email })
  if (exists) {
    throw new Error('EMAIL_EXISTS')
  }

  const now = new Date()
  const doc: any = {
    email: user.email,
    password: user.password,
    creadoEn: now,
    perfil: user.perfil ?? {},
    ultimaConexion: now,
  }

  const res = await db.collection('usuarios').insertOne(doc)
  return res.insertedId.toString()
}

/**
 * Actualiza parcialmente el perfil de un usuario.
 * - `id` puede ser ObjectId string o email.
 * - `updates` es un objeto parcial con la forma de `perfil` (por ejemplo: { nombre, bio, fotos, intereses, atributosFisicos, preferencias, fechaNacimiento })
 * Convierte `fechaNacimiento` a Date si se recibe como string/ISO, y normaliza arrays.
 * Devuelve el perfil público actualizado (sin password) o null si no se encuentra.
 */
export async function updateProfile(
  id: string,
  updates: Partial<NonNullable<DbUsuario['perfil']>> & { password?: string }
): Promise<PublicProfile | null> {
  const db = await getDb()

  // Diagnostic log
  try {
    console.debug('[updateProfile] incoming id:', id)
  } catch {}

  // Normalize and prepare setFields
  const setFields: Record<string, any> = {}
  if (updates.nombre !== undefined) setFields['perfil.nombre'] = updates.nombre
  if (updates.genero !== undefined) setFields['perfil.genero'] = updates.genero
  if (updates.bio !== undefined) setFields['perfil.bio'] = updates.bio
  if (updates.carrera !== undefined) setFields['perfil.carrera'] = updates.carrera
  if (updates.atributosFisicos !== undefined) setFields['perfil.atributosFisicos'] = updates.atributosFisicos
  if (updates.fotos !== undefined) setFields['perfil.fotos'] = Array.isArray(updates.fotos) ? updates.fotos : [updates.fotos]
  if (updates.intereses !== undefined) setFields['perfil.intereses'] = Array.isArray(updates.intereses) ? updates.intereses : [updates.intereses]
  if (updates.preferencias !== undefined) setFields['perfil.preferencias'] = updates.preferencias
  if (updates.fechaNacimiento !== undefined && updates.fechaNacimiento !== null) {
    const fn = updates.fechaNacimiento
    const fecha = fn instanceof Date ? fn : new Date(fn as any)
    if (!isNaN(fecha.getTime())) setFields['perfil.fechaNacimiento'] = fecha
  }

  // Find document first (prefer _id, then exact email, then CI email)
  let existingDoc: DbUsuario | null = null
  if (ObjectId.isValid(id)) {
    try {
      existingDoc = (await db.collection('usuarios').findOne({ _id: new ObjectId(id) })) as DbUsuario | null
    } catch (e) {
      // ignore
    }
  }

  if (!existingDoc) {
    existingDoc = (await db.collection('usuarios').findOne({ email: id })) as DbUsuario | null
  }

  if (!existingDoc) {
    try {
      const maybeEmail = String(id || '')
      existingDoc = (await db.collection('usuarios').findOne({ email: { $regex: `^${maybeEmail.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, $options: 'i' } })) as DbUsuario | null
      if (existingDoc) console.debug('[updateProfile] found by CI email for id:', id)
    } catch (e) {
      console.debug('[updateProfile] ci lookup error', e)
    }
  }

  const hasPassword = (updates as any).password !== undefined
  if (Object.keys(setFields).length === 0 && !hasPassword) {
    return existingDoc ? toPublic(existingDoc) : null
  }

  // Apply update by _id when we have it
  const filter = existingDoc && existingDoc._id ? { _id: existingDoc._id } : { email: id }
  try { console.debug('[updateProfile] running update', { filter, setFields }) } catch {}
  // If password provided, set it at root level
  const finalUpdate: any = { $set: setFields }
  if ((updates as any).password !== undefined) finalUpdate.$set.password = (updates as any).password
  const updateRes = await db.collection('usuarios').updateOne(filter, finalUpdate)
  try { console.debug('[updateProfile] updateOne result', { matchedCount: updateRes.matchedCount, modifiedCount: updateRes.modifiedCount }) } catch {}

  if (updateRes.matchedCount === 0) {
    console.debug('[updateProfile] no documents matched the filter for id:', id)
    return null
  }

  const updatedDoc = (await db.collection('usuarios').findOne(filter)) as DbUsuario | null
  try { console.debug('[updateProfile] fetched updatedDoc', { id: updatedDoc?._id?.toString?.(), email: updatedDoc?.email }) } catch {}

  return updatedDoc ? toPublic(updatedDoc) : null
}

