import { getDb } from "@/lib/mongo"
import { ObjectId } from "mongodb"
import { getProfileById } from "./ManejadorUsuarios"

/*
  ManejadorSwipes.ts

  Este archivo contiene la lógica del backend encargada de:
  - Calcular un "score de descubribilidad" para perfiles (funciones de scoring).
  - Recuperar perfiles que aún no ha visto un usuario y ordenarlos por relevancia.
  - Crear/actualizar swipes (like/pass) y detectar matches mutuos.

  Comentarios en español se añaden para explicar qué hace cada función, los
  parámetros esperados y los pasos importantes dentro de las consultas y cálculos.
*/

/**
 * Pesos de las características para el sistema de scoring.
 *
 * Estos pesos se usan para combinar diferentes sub-scores (género, intereses,
 * carrera, edad, aspecto físico) en un solo valor numérico que representa
 * la relevancia o "descubribilidad" de un perfil para otro.
 *
 * Nota: el score de conexión (última conexión) no tiene peso aquí porque se
 * aplica como una máscara multiplicativa al final (ver `calculateConnectionScore`).
 */
const FEATURE_WEIGHTS = {
  GENDER: 0.40,      // 40%
  INTERESTS: 0.20,   // 20% (reduced to make room for PHYSICAL)
  CAREER: 0.20,      // 20%
  AGE: 0.10,         // 10%
  PHYSICAL: 0.10,    // 10% - new score based on liked targets' physical attributes
} as const

/**
 * Umbral mínimo de score (30%)
 */
const MIN_SCORE_THRESHOLD = 0.30

/**
 * Calcula el score de coincidencia de género.
 *
 * Entrada:
 *  - `profileGenderSeeking`: valor definido en el perfil objetivo indicando
 *    qué géneros acepta (p. ej. "hombre", "mujer", "todos" o datos legacy).
 *  - `currentUserGender`: género del usuario actual.
 *
 * Comportamiento:
 *  - Si `profileGenderSeeking` es "todos" => score 1.
 *  - Si coincide exactamente con `currentUserGender` => score 1.
 *  - En cualquier otro caso => score 0.
 */
function calculateGenderScore(
  profileGenderSeeking: string,
  currentUserGender: string
): number {
  if (!profileGenderSeeking || profileGenderSeeking === "") {
    return 0
  }

  // Si el perfil acepta todos los géneros, dar score completo
  if (profileGenderSeeking.toLowerCase() === "todos") {
    return 1.0
  }

  // Si el perfil busca un género específico, verificar si coincide con el género del usuario actual
  if (profileGenderSeeking.toLowerCase() === currentUserGender.toLowerCase()) {
    return 1.0
  }

  return 0
}

/**
 * Calcula el score de coincidencia de intereses.
 *
 * Entrada:
 *  - `currentUserInterests`: arreglo de intereses del usuario actual.
 *  - `profileInterests`: arreglo de intereses del perfil objetivo.
 *
 * Salida:
 *  - Proporción de intereses comunes con respecto al número de intereses del usuario actual.
 *  - Se normaliza todo a minúsculas y se usa set para evitar duplicados.
 */
function calculateInterestsScore(
  currentUserInterests: string[],
  profileInterests: string[]
): number {
  if (!currentUserInterests || currentUserInterests.length === 0) {
    return 0
  }

  if (!profileInterests || profileInterests.length === 0) {
    return 0
  }

  // Normalizar intereses a minúsculas para comparación
  const currentInterestsSet = new Set(
    currentUserInterests.map((i) => i.toLowerCase().trim())
  )
  const profileInterestsSet = new Set(
    profileInterests.map((i) => i.toLowerCase().trim())
  )

  // Contar intereses comunes
  let commonCount = 0
  for (const interest of currentInterestsSet) {
    if (profileInterestsSet.has(interest)) {
      commonCount++
    }
  }

  // Retornar porcentaje: intereses comunes / total de intereses del usuario actual
  return commonCount / currentUserInterests.length
}

/**
 * Calcula el score de coincidencia de carrera profesional.
 *
 * Parámetros:
 *  - `currentUserCareer`: carrera del usuario actual.
 *  - `profileCareer`: carrera del perfil objetivo.
 *  - `profileCareerPreference`: preferencia que el perfil objetivo indicó
 *    respecto a la carrera ("misma", "otra", "todas" o vacío).
 *
 * Lógica:
 *  - Si el perfil objetivo no especifica preferencia o indica "todas" => score 1.
 *  - Si indica "misma" y las carreras coinciden => score 1.
 *  - Si indica "otra" y las carreras son distintas => score 1.
 *  - En cualquier otro caso => score 0.
 */
function calculateCareerScore(
  currentUserCareer: string,
  profileCareer: string,
  profileCareerPreference: string
): number {
  if (!currentUserCareer || !profileCareer) {
    return 0
  }

  //Cuando el usuario selecciona "todas" o no especifica preferencia, se da score completo
  if(!profileCareerPreference || profileCareerPreference === "" || profileCareerPreference.toLowerCase() === "todas") {
    return 1.0
  }
  const currentCareerLower = currentUserCareer.toLowerCase().trim()
  const profileCareerLower = profileCareer.toLowerCase().trim()

  // Preferencia de misma carrera, Misma carrera = score completo
  if(profileCareerPreference.toLowerCase() === "misma" && currentCareerLower === profileCareerLower) {
      return 1.0
  }
  
  // Preferencia de carrera diferente, Carrera diferente = score completo
  if(profileCareerPreference.toLowerCase() === "otra" && currentCareerLower !== profileCareerLower) {
      return 1.0
  }

  //Si las preferencias del usuario a revisar no entra la carrera del usuario actual da score 0
  return 0
  
}

/**
 * Calcula el score de proximidad de edad.
 *
 * Comportamiento:
 *  - Si la edad del perfil está fuera del rango explícito del usuario => 0.
 *  - Si el rango es inválido (min >= max) => 1.
 *  - Se calcula la distancia a la edad ideal (centro del rango) y se normaliza.
 *  - El factor final reduce el score hasta 0.5 en los extremos y 1.0 en el centro.
 */
function calculateAgeScore(
  profileAge: number,
  currentUserMinAge: number,
  currentUserMaxAge: number
): number {
  // Si la edad del perfil está fuera del rango explícito del usuario, dar score 0
  if (typeof profileAge !== 'number' || profileAge <= 0) return 0
  if (profileAge < currentUserMinAge || profileAge > currentUserMaxAge) return 0

  const ageRange = currentUserMaxAge - currentUserMinAge
  if (ageRange <= 0) {
    return 1.0
  }

  // La edad ideal es el centro del rango
  const idealAge = (currentUserMinAge + currentUserMaxAge) / 2
  const ageDiff = Math.abs(profileAge - idealAge)
  
  // Normalizar: el score disminuye conforme la edad se aleja del ideal
  // En los extremos del rango, el score debería ser ~0.5
  // En el centro, el score debería ser 1.0
  const maxDistance = ageRange / 2
  const normalizedDistance = Math.min(ageDiff / maxDistance, 1.0)
  
  return 1.0 - (normalizedDistance * 0.5)
}

/**
 * Calcula el score de apariencia física para un candidato respecto al usuario actual.
 *
 * Propósito:
 *  - Extraer señales implícitas de preferencia del candidato analizando a quiénes ha dado
 *    "like" en el pasado. Si esas personas tienen ojos/cabello similares al `currentUser`,
 *    el candidato es probablemente más atraído por características físicas como las del usuario.
 *
 * Limitaciones y consideraciones:
 *  - Es una heurística débil: depende de que el candidato haya dado likes suficientes.
 *  - Se limita a 50 targets para controlar la latencia.
 *  - Puede considerarse para precomputación si el rendimiento es crítico.
 */
async function calculatePhysicalScore(
  candidateProfile: any,
  currentUser: any,
  usuariosCollection: any,
  swipesCollection: any
): Promise<number> {
  let physicalScore = 0
  try {
    // Extraer id del candidato (puede ser ObjectId en _id o string en id)
    const candidateId = candidateProfile._id ? candidateProfile._id.toString() : candidateProfile.id
    if (!candidateId) return 0

  // Preparar query para obtener los "likes" emitidos por el candidato
    const candidateObjId = ObjectId.isValid(candidateId) ? new ObjectId(candidateId) : null
    const candidateLikesQuery: any = candidateObjId
      ? { idEmisor: candidateObjId, accion: 'like' }
      : { idEmisor: candidateId, accion: 'like' }

    // Obtener los swipes (likes) que el candidato ha hecho
    const likedTargets = await swipesCollection.find(candidateLikesQuery).toArray()

  // Normalizar ids de los receptores de esos likes a strings
    const targetIds = likedTargets
      .map((s: any) => {
        const r = s.idReceptor
        if (r instanceof ObjectId) return r.toString()
        if (typeof r === 'string') return r
        return r?.toString() || ''
      })
      .filter(Boolean)

  // Si no hay targets liked, no hay información para calcular score físico
    if (targetIds.length === 0) return 0

    // Construir consulta para obtener los perfiles de los targets (preferir ObjectId si existen)
    const targetObjectIds = targetIds.filter((id: string) => ObjectId.isValid(id)).map((id: string) => new ObjectId(id))
    const targetQuery: any = targetObjectIds.length > 0 ? { _id: { $in: targetObjectIds } } : { email: { $in: targetIds } }

  // Limitar la búsqueda para evitar cargas grandes
    const targetProfiles = await usuariosCollection.find(targetQuery).limit(50).toArray()

    // Extraer atributos físicos del usuario actual para la comparación
    const userEyes = String(currentUser.perfil?.atributosFisicos?.colorOjos || '')
    const userHair = String(currentUser.perfil?.atributosFisicos?.colorCabello || '')
    let matchCount = 0
    let totalChecked = 0

  // Para cada target, comprobar coincidencias en ojos y cabello
    for (const t of targetProfiles) {
      const tEyes = (t.perfil?.atributosFisicos?.colorOjos ?? '') as any
      const tHair = (t.perfil?.atributosFisicos?.colorCabello ?? '') as any
      if (tEyes || tHair) {
        totalChecked++
        try {
          // Normalizar y comparar en minúsculas para evitar discrepancias simples
          const ue = String(userEyes || '').toLowerCase().trim()
          const te = String(tEyes || '').toLowerCase().trim()
          const uh = String(userHair || '').toLowerCase().trim()
          const th = String(tHair || '').toLowerCase().trim()
          // Sumar una unidad por cada coincidencia (ojos y cabello)
          if (ue && te && ue === te) matchCount++
          if (uh && th && uh === th) matchCount++
        } catch (e) {
          // Si hay problemas con coerción a string, ignorar y continuar
        }
      }
    }

    // Normalizar el score: cada target aporta hasta 2 coincidencias (ojos + cabello)
    if (totalChecked > 0) {
      const maxMatches = totalChecked * 2
      physicalScore = Math.min(1, matchCount / maxMatches)
    }
  } catch (e) {
  try { console.error('[calculatePhysicalScore] error', e) } catch {}
  }

  return physicalScore
}

/**
 * Calcula un score de conexión basado en la fecha de `ultimaConexion`.
 *
 * - Parámetro: `ultimaConexion` puede ser una string ISO, un Date, o undefined/null.
 * - Comportamiento: si la última conexión es hoy -> devuelve 1.0.
 *   Si la última conexión fue hace mucho tiempo (por ejemplo, > 365 días) -> devuelve 0 aproximado.
 *   Entre medias se aplica una interpolación exponencial o lineal (aquí se usa decaimiento exponencial suave).
 * - Retorna número en [0,1]. No tiene peso porcentual: se usa como máscara multiplicativa
 *   sobre el score total de descubribilidad.
 */
function calculateConnectionScore(ultimaConexion: any): number {
  if (!ultimaConexion) return 0

  let lastDate: Date | null = null
  if (ultimaConexion instanceof Date) {
    lastDate = ultimaConexion
  } else {
    const parsed = new Date(ultimaConexion)
    if (!isNaN(parsed.getTime())) {
      lastDate = parsed
    }
  }

  if (!lastDate) return 0

  const now = new Date()
  const msDiff = now.getTime() - lastDate.getTime()
  if (msDiff < 0) return 1 // fecha en el futuro, considerarla como muy reciente

  const days = msDiff / (1000 * 60 * 60 * 24)

  // Parámetros de decaimiento:
  // - Si fue hoy (days < 1) => 1
  // - Si fue hace 365 días o más => 0 (o cercano a 0)
  // Usamos una función de decaimiento exponencial para dar más peso a conexiones recientes.
  const MAX_DAYS = 365
  if (days <= 1) return 1

  // Decaimiento exponencial suave: score = exp( -k * days ) con k ajustado para que
  // exp(-k * MAX_DAYS) ~ 0.01 (prácticamente 0). k = -ln(0.01)/MAX_DAYS
  const k = -Math.log(0.01) / MAX_DAYS
  const score = Math.exp(-k * days)

  // Asegurar rango [0,1]
  return Math.max(0, Math.min(1, score))
}

/**
 * Calcula el score de descubribilidad para un perfil
 * @returns Score de 0 a 1 (0% a 100%)
 */
async function calculateDiscoverableScore(
  profile: any,
  currentUser: any,
  usuariosCollection: any,
  swipesCollection: any
): Promise<number> {
  const profilePreferences = profile.perfil?.preferencias || {}
  const currentUserPreferences = currentUser.perfil?.preferencias || {}
  const currentUserGender = currentUser.perfil?.genero || ""
  const currentUserCareer = currentUser.perfil?.carrera || ""
  const currentUserInterests = Array.isArray(currentUser.perfil?.intereses)
    ? currentUser.perfil.intereses
    : []
  const profileInterests = Array.isArray(profile.perfil?.intereses)
    ? profile.perfil.intereses
    : []

  // Calcular edad del perfil
  let profileAge = 0
  if (profile.perfil?.fechaNacimiento) {
    const birthDate = new Date(profile.perfil.fechaNacimiento)
    if (!isNaN(birthDate.getTime())) {
      const today = new Date()
      profileAge = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        profileAge--
      }
    }
  }

  // Obtener rango de edad del usuario actual
  const currentUserMinAge = currentUserPreferences.rangoEdad?.min || 18
  const currentUserMaxAge = currentUserPreferences.rangoEdad?.max || 99

  // Calcular score de cada característica
  const genderScore = calculateGenderScore(
    profilePreferences.generoBuscado || "",
    currentUserGender
  )

  const interestsScore = calculateInterestsScore(
    currentUserInterests,
    profileInterests
  )

  const careerScore = calculateCareerScore(
    currentUserCareer,
    profile.perfil?.carrera || "",
    profilePreferences.preferenciaCarrera || ""
  )

  const ageScore = calculateAgeScore(
    profileAge,
    currentUserMinAge,
    currentUserMaxAge
  )

  // Calcular score total ponderado (sin PHYSICAL)
  const totalScore =
    genderScore * FEATURE_WEIGHTS.GENDER +
    interestsScore * FEATURE_WEIGHTS.INTERESTS +
    careerScore * FEATURE_WEIGHTS.CAREER +
    ageScore * FEATURE_WEIGHTS.AGE

  // Compute physical score (async) and include with its weight
  let physicalScore = 0
  try {
    physicalScore = await calculatePhysicalScore(profile, currentUser, usuariosCollection, swipesCollection)
  } catch (e) {
  try { console.error('[calculateDiscoverableScore] calculatePhysicalScore failed', e) } catch {}
  }

  const finalScore = totalScore + (physicalScore * (FEATURE_WEIGHTS.PHYSICAL || 0))

  // --- Aplicar máscara de conexión ---
  // El score de conexión actúa como una máscara: reduce el score final si el
  // perfil objetivo no se ha conectado recientemente. Esto evita promover perfiles
  // que podrían estar inactivos.
  let connectionScore = 1
  try {
    connectionScore = calculateConnectionScore(profile.ultimaConexion)
  } catch (e) {
    try { console.error('[calculateDiscoverableScore] calculateConnectionScore failed', e) } catch {}
  }

  const maskedScore = finalScore * connectionScore
  // Asegurar que el valor devuelto está dentro de [0,1]
  return Math.min(Math.max(maskedScore, 0), 1)
}



/**
 * Obtiene perfiles que el usuario aún no ha visto
 * Utiliza sistema de scoring con pesos de características y umbral mínimo de 30%
 * Filtra por preferencias del usuario con matching bidireccional y excluye perfiles ya vistos
 * Retorna perfiles ordenados por score de descubribilidad (mayor a menor)
 */
export async function getDiscoverableProfiles(userId: string, limit: number = 50) {
  const db = await getDb()
  
  // Obtener perfil del usuario actual para verificar preferencias
  const currentUser = await getProfileById(userId)
  if (!currentUser || !currentUser.perfil) {
    return []
  }

  const currentUserObjId = ObjectId.isValid(userId) ? new ObjectId(userId) : null
  const currentUserGender = currentUser.perfil.genero || ""
  const currentUserCareer = currentUser.perfil.carrera || ""
  
  // Obtener usuarios que el usuario actual ya ha visto
  // Colección de swipes usada varias veces en este flujo
  const swipesCollection = db.collection("swipes")
  
  // Construir query para encontrar swipes (MongoDB puede almacenar idEmisor como ObjectId o string)
  const swipeQuery: any = currentUserObjId 
    ? { 
        $or: [
          { idEmisor: currentUserObjId },
          { idEmisor: userId },
          { idEmisor: currentUserObjId.toString() }
        ]
      }
    : { idEmisor: userId }
  
  // Recuperar todos los swipes que el usuario ha emitido (para excluir perfiles ya vistos)
  const swipes = await swipesCollection.find(swipeQuery).toArray()
  
  // Extraer los ids de los receptores que el usuario ya ha visto (para excluirlos)
  // Se normalizan a string para manejar ObjectId o valores string legacy.
  const swipedUserIds = swipes.map((s) => {
    const receptor = s.idReceptor
    if (receptor instanceof ObjectId) return receptor.toString()
    if (typeof receptor === 'string') return receptor
    return receptor?.toString() || ""
  }).filter(Boolean)
  
  // Construir query para excluir usuarios ya vistos y el usuario actual
  const excludedIds = [...swipedUserIds, userId].filter(Boolean)
  const excludedObjectIds = excludedIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id))
  
  const excludeConditions: any[] = []
  
  if (excludedObjectIds.length > 0) {
    excludeConditions.push({ _id: { $nin: excludedObjectIds } })
  }
  
  if (!ObjectId.isValid(userId) && currentUser?.email) {
    excludeConditions.push({ email: { $ne: currentUser.email } })
  }
  
  const swipedEmails = swipedUserIds.filter(id => !ObjectId.isValid(id))
  if (swipedEmails.length > 0) {
    excludeConditions.push({ email: { $nin: swipedEmails } })
  }
  
  const query: any = excludeConditions.length > 0 ? { $and: excludeConditions } : {}

  // Filtrar por preferencias del usuario
  const preferences = currentUser.perfil.preferencias
  if (preferences) {
    // Filtrar por género buscado (si no es "todos")
    if (preferences.generoBuscado && preferences.generoBuscado !== "todos") {
      query["perfil.genero"] = preferences.generoBuscado
    }
    
    // Filtrar por rango de edad
    // Nota: movemos el filtrado por rango de edad a la fase en JS más abajo
    // para soportar documentos cuyo `perfil.fechaNacimiento` está guardado
    // como string (legacy). Aquí sólo guardamos las preferencias para usar
    // después en memoria.
    if (preferences.rangoEdad) {
      // El filtrado por rango de edad se aplicará en JS más abajo (soporta strings/Date)
      // No añadimos nada al query de Mongo para evitar filtrar documentos inesperadamente.
    }
    
    // Filtrar por preferencia de carrera
    if (preferences.preferenciaCarrera === "misma" && currentUserCareer) {
      query["perfil.carrera"] = currentUserCareer
    } else if (preferences.preferenciaCarrera === "otra" && currentUserCareer) {
      if (!query["$and"]) query["$and"] = []
      query["$and"].push({
        "perfil.carrera": { $ne: currentUserCareer }
      })
    }
  }

  // Solo obtener usuarios con perfiles completos
  query["perfil.nombre"] = { $exists: true, $ne: "" }
  query["perfil.fotos"] = { $exists: true, $type: "array", $ne: [] }
  query["perfil.preferencias"] = { $exists: true }

  // Excluir el usuario actual por _id
  if (currentUserObjId) {
    if (!query.$and) query.$and = []
    query.$and.push({ _id: { $ne: currentUserObjId } })
  } else if (currentUser?.id && ObjectId.isValid(currentUser.id)) {
    if (!query.$and) query.$and = []
    query.$and.push({ _id: { $ne: new ObjectId(currentUser.id) } })
  }
  
  const usuariosCollection = db.collection("usuarios")
  // Buscar candidatos que cumplan con los filtros básicos. Se solicita 3x el
  // límite final para tener margen después de aplicar scoring y truncado.
  const allProfiles = await usuariosCollection.find(query).limit(limit * 3).toArray()

  // Log de depuración: imprimir perfiles recuperados (id, nombre, email, genero)
  try {
    console.log(`DEBUG: Se recuperaron ${allProfiles.length} perfiles (pre-scoring):`)
    for (const p of allProfiles) {
      const pid = p._id ? p._id.toString() : (p.id || '')
      const nombre = p.perfil?.nombre || ''
      const email = p.email || ''
      const genero = p.perfil?.genero || ''
      const carrera =p.perfil?.carrera || ''
      console.log(` - ${pid} | ${nombre} | ${email} | ${genero} | ${carrera}`)
    }
  } catch (e) {
    try { console.error('[getDiscoverableProfiles] error logging allProfiles', e) } catch {}
  }

  // Calcular edad del usuario actual
  let currentUserAge: number | null = null
  if (currentUser.perfil?.fechaNacimiento) {
    const birthDate = new Date(currentUser.perfil.fechaNacimiento)
    if (!isNaN(birthDate.getTime())) {
      const today = new Date()
      currentUserAge = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        currentUserAge--
      }
    }
  }

  // Aplicar filtros mínimos obligatorios (matching bidireccional):
  //  - El perfil objetivo debe estar buscando el género del usuario actual (o 'todos')
  //  - El rango de edad del perfil objetivo debe incluir la edad del usuario actual
  // Esto reduce la lista antes de aplicar scoring más costoso.
  //
  // Nota: se normaliza `generoBuscado` porque puede estar almacenado en formatos legacy.
  // Además aplicamos el filtro por rango de edad en JS para soportar fechas
  // almacenadas como string (legacy) que no coincidirían con la comparación por Date en Mongo.

  function parseBirthDate(value: any): Date | null {
    if (!value) return null
    if (value instanceof Date) return value
    // Manejar exports BSON con { $date: ... }
    if (typeof value === 'object' && value.$date) {
      const d = new Date(value.$date)
      return isNaN(d.getTime()) ? null : d
    }
    if (typeof value === 'string') {
      const d = new Date(value)
      return isNaN(d.getTime()) ? null : d
    }
    try {
      const d = new Date(value)
      return isNaN(d.getTime()) ? null : d
    } catch (e) {
      return null
    }
  }

  const profilesPassingThreshold = allProfiles.filter((profile: any) => {
    const profilePreferences = profile.perfil?.preferencias
    if (!profilePreferences) return false

    // generoBuscado puede ser string o array (legacy). Normalizar a string.
    let profileGenderSeeking: string | string[] | undefined = profilePreferences.generoBuscado
    if (Array.isArray(profileGenderSeeking)) {
      profileGenderSeeking = profileGenderSeeking.find((g) => !!g) || profileGenderSeeking[0]
    }

    // Umbral mínimo 1: El perfil debe estar buscando el género del usuario actual
    if (!profileGenderSeeking || profileGenderSeeking === "") return false
    const seeking = typeof profileGenderSeeking === 'string' ? profileGenderSeeking.toLowerCase() : ''
    const currentGender = typeof currentUserGender === 'string' ? currentUserGender.toLowerCase() : ''
    const genderMatch = seeking === 'todos' || seeking === currentGender
    if (!genderMatch) return false

    // Umbral mínimo 2: La edad del usuario actual debe estar en el rango buscado por el perfil
    if (currentUserAge !== null && profilePreferences.rangoEdad) {
      const profileMinAge = profilePreferences.rangoEdad.min || 18
      const profileMaxAge = profilePreferences.rangoEdad.max || 99
      const birth = parseBirthDate(profile.perfil?.fechaNacimiento)
      if (!birth) return false
      const today = new Date()
      let pAge = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) pAge--
      if (pAge < profileMinAge || pAge > profileMaxAge) return false
    }

    return true
  })

  // Calcular score de descubribilidad para cada perfil
  // El cálculo de score puede hacer consultas adicionales (p. ej. `calculatePhysicalScore`
  // que mira los swipes del candidato) por eso es una operación async y potencialmente costosa.
  const profilesWithScores = await Promise.all(
    profilesPassingThreshold.map(async (profile: any) => {

      // calculateDiscoverableScore now includes the physical score internally
  // Para cada candidato calculamos su score combinado (gender/interests/career/age/physical)
  // `calculateDiscoverableScore` puede realizar lecturas adicionales en `swipes`/`usuarios`.
  const finalScore = await calculateDiscoverableScore(profile, currentUser, usuariosCollection, swipesCollection)
      return {
        profile,
        discoverableScore: finalScore,
      }
    })
  )

  // Filtrar por umbral mínimo de score (30%)
  const profilesAboveThreshold = profilesWithScores.filter(
    (item) => item.discoverableScore >= MIN_SCORE_THRESHOLD
  )

  // Ordenar por score de descubribilidad (mayor a menor)
  profilesAboveThreshold.sort((a, b) => b.discoverableScore - a.discoverableScore)

  // Limitar resultados
  const profilesWithScoresFinal = profilesAboveThreshold.slice(0, limit)

  // Imprimir perfiles ordenados por score en consola
  console.log(`\nPERFILES ORDENADOS POR SCORE (${profilesWithScoresFinal.length} perfiles):`)
  console.log('═'.repeat(80))
  profilesWithScoresFinal.forEach((item, index) => {
    const profile = item.profile
    const scorePercent = (item.discoverableScore * 100).toFixed(2)
    console.log(`${index + 1}. ${profile.perfil?.nombre || 'N/A'} (${profile.email || 'N/A'})`)
    console.log(`   Score: ${scorePercent}% | Género: ${profile.perfil?.genero || 'N/A'} | Edad: ${profile.perfil?.fechaNacimiento ? (new Date().getFullYear() - new Date(profile.perfil.fechaNacimiento).getFullYear()) : 'N/A'} | Carrera: ${profile.perfil?.carrera || 'N/A'}`)
  })
  console.log('═'.repeat(80) + '\n')

  // Verificar si estos usuarios han dado like al usuario actual
  const profileIds = profilesWithScoresFinal
    .map((item) => {
      const p = item.profile
      return p._id ? p._id.toString() : (p.id || "")
    })
    .filter((id) => id && ObjectId.isValid(id))
    .map((id) => new ObjectId(id))
  
  const reverseSwipes = profileIds.length > 0 ? await swipesCollection
    .find({
      idReceptor: currentUserObjId || userId,
      idEmisor: { $in: profileIds },
      accion: "like",
    })
    .toArray() : []
  
  const likedByUserIds = new Set(
    reverseSwipes.map((s) => {
      const id = s.idEmisor
      return id instanceof ObjectId ? id.toString() : (id?.toString() || "")
    })
  )

  // Formatear perfiles para el frontend, incluyendo discoverableScore
  return profilesWithScoresFinal.map((item) => {
    const profile = item.profile
    const profileId = profile._id?.toString() || profile.id || ""
    return {
      id: profileId,
      nombre: profile.perfil?.nombre || "",
      fechaNacimiento: profile.perfil?.fechaNacimiento
        ? new Date(profile.perfil.fechaNacimiento).toISOString()
        : "",
      genero: profile.perfil?.genero || "",
      bio: profile.perfil?.bio || "",
      fotos: Array.isArray(profile.perfil?.fotos) ? profile.perfil.fotos : [],
      intereses: Array.isArray(profile.perfil?.intereses) ? profile.perfil.intereses : [],
      atributosFisicos: {
        colorOjos: profile.perfil?.atributosFisicos?.colorOjos || "",
        colorCabello: profile.perfil?.atributosFisicos?.colorCabello || "",
        carrera: profile.perfil?.carrera || "",
      },
      hasLikedYou: likedByUserIds.has(profileId),
      discoverableScore: Math.round(item.discoverableScore * 100) / 100,
    }
  })
}

/**
 * Crea un swipe (like o pass)
 * Retorna información de match si ambos usuarios se dieron like mutuamente
 */
export async function createSwipe(
  idEmisor: string,
  idReceptor: string,
  accion: "like" | "pass"
) {
  // Función responsable de insertar o actualizar un swipe (like/pass) y
  // detectar si hay un match mutuo. Pasos principales:
  // 1. Normalizar los ids a ObjectId cuando corresponda.
  // 2. Verificar si ya existe un swipe previo -> actualizarlo.
  // 3. Si no existe -> insertar uno nuevo.
  // 4. Si la acción es 'like', comprobar si el receptor previamente dio like al emisor
  //    para crear un documento de match si es necesario.
  const db = await getDb()
  const swipesCollection = db.collection("swipes")
  const matchesCollection = db.collection("matches")

  const idEmisorObj = ObjectId.isValid(idEmisor) ? new ObjectId(idEmisor) : idEmisor
  const idReceptorObj = ObjectId.isValid(idReceptor) ? new ObjectId(idReceptor) : idReceptor

  // Verificar si el swipe ya existe
  const existingSwipe = await swipesCollection.findOne({
    idEmisor: idEmisorObj,
    idReceptor: idReceptorObj,
  })

  if (existingSwipe) {
    // Actualizar swipe existente
    await swipesCollection.updateOne(
      { _id: existingSwipe._id },
      {
        $set: {
          accion,
          creadoEn: new Date(),
        },
      }
    )
  } else {
    // Crear nuevo swipe
    await swipesCollection.insertOne({
      idEmisor: idEmisorObj,
      idReceptor: idReceptorObj,
      accion,
      creadoEn: new Date(),
    })
  }

  // Si es un like, verificar si hay match mutuo
  if (accion === "like") {
    // Verificar si el otro usuario también le dio like a este usuario
    const reverseSwipe = await swipesCollection.findOne({
      idEmisor: idReceptorObj,
      idReceptor: idEmisorObj,
      accion: "like",
    })

    if (reverseSwipe) {
      // ¡Es un match! Crear o actualizar match
      const existingMatch = await matchesCollection.findOne({
        participantes: {
          $all: [idEmisorObj, idReceptorObj],
        },
      })

      if (existingMatch) {
        // Si ya existe el match, retornar su id para que el cliente pueda abrirlo
        return { isMatch: true, matchId: existingMatch._id?.toString() }
      }

      // Crear nuevo match y retornar su id
      const insertResult = await matchesCollection.insertOne({
        participantes: [idEmisorObj, idReceptorObj],
        creadoEn: new Date(),
        ultimoMensajeEn: null,
        mensajesNoLeidos: 0,
      })

      return { isMatch: true, matchId: insertResult.insertedId.toString() }
    }
  }

  return { isMatch: false }
}

