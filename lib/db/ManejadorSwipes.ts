import { getDb } from "@/lib/mongo"
import { ObjectId } from "mongodb"
import { getProfileById } from "./ManejadorUsuarios"

/**
 * Pesos de las características para el sistema de scoring
 */
const FEATURE_WEIGHTS = {
  GENDER: 0.40,      // 40%
  INTERESTS: 0.30,   // 30%
  CAREER: 0.20,      // 20%
  AGE: 0.10,         // 10%
} as const

/**
 * Umbral mínimo de score (30%)
 */
const MIN_SCORE_THRESHOLD = 0.30

/**
 * Calcula el score de coincidencia de género
 * @returns Score de 0 a 1 (0 = no coincide, 1 = coincide perfectamente)
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
 * Calcula el score de coincidencia de intereses basado en el porcentaje de intereses comunes
 * @returns Score de 0 a 1 (porcentaje de intereses comunes)
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
 * Calcula el score de coincidencia de carrera
 * @returns Score de 0 a 1
 */
function calculateCareerScore(
  currentUserCareer: string,
  profileCareer: string
): number {
  if (!currentUserCareer || !profileCareer) {
    return 0
  }

  const currentCareerLower = currentUserCareer.toLowerCase().trim()
  const profileCareerLower = profileCareer.toLowerCase().trim()

  // Misma carrera = score completo
  if (currentCareerLower === profileCareerLower) {
    return 1.0
  }

  // Carrera diferente = score parcial (0.5)
  return 0.5
}

/**
 * Calcula el score de proximidad de edad
 * @returns Score de 0 a 1 basado en qué tan cerca está la edad del centro ideal del rango
 */
function calculateAgeScore(
  profileAge: number,
  currentUserMinAge: number,
  currentUserMaxAge: number
): number {
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
 * Calcula el score de descubribilidad para un perfil
 * @returns Score de 0 a 1 (0% a 100%)
 */
function calculateDiscoverableScore(
  profile: any,
  currentUser: any
): number {
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
    profile.perfil?.carrera || ""
  )

  const ageScore = calculateAgeScore(
    profileAge,
    currentUserMinAge,
    currentUserMaxAge
  )

  // Calcular score total ponderado
  const totalScore =
    genderScore * FEATURE_WEIGHTS.GENDER +
    interestsScore * FEATURE_WEIGHTS.INTERESTS +
    careerScore * FEATURE_WEIGHTS.CAREER +
    ageScore * FEATURE_WEIGHTS.AGE

  return Math.min(Math.max(totalScore, 0), 1)
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
  
  const swipes = await swipesCollection.find(swipeQuery).toArray()
  
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
    if (preferences.rangoEdad) {
      const minAge = preferences.rangoEdad.min || 18
      const maxAge = preferences.rangoEdad.max || 99
      const minBirthYear = new Date().getFullYear() - maxAge
      const maxBirthYear = new Date().getFullYear() - minAge
      
      if (!query["$and"]) query["$and"] = []
      query["$and"].push({
        "perfil.fechaNacimiento": {
          $gte: new Date(minBirthYear, 0, 1),
          $lte: new Date(maxBirthYear, 11, 31),
        },
      })
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
  const allProfiles = await usuariosCollection.find(query).limit(limit * 3).toArray()

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

  // Aplicar filtros mínimos obligatorios (matching bidireccional)
  const profilesPassingThreshold = allProfiles.filter((profile: any) => {
    const profilePreferences = profile.perfil?.preferencias
    if (!profilePreferences) return false

    const profileGenderSeeking = profilePreferences.generoBuscado
    
    // Umbral mínimo 1: El perfil debe estar buscando el género del usuario actual
    if (!profileGenderSeeking || profileGenderSeeking === "") {
      return false
    }
    
    const genderMatch = profileGenderSeeking === "todos" || 
      profileGenderSeeking.toLowerCase() === currentUserGender.toLowerCase()
    
    if (!genderMatch) return false
    
    // Umbral mínimo 2: La edad del usuario actual debe estar en el rango buscado por el perfil
    if (currentUserAge !== null && profilePreferences.rangoEdad) {
      const profileMinAge = profilePreferences.rangoEdad.min || 18
      const profileMaxAge = profilePreferences.rangoEdad.max || 99
      
      if (currentUserAge < profileMinAge || currentUserAge > profileMaxAge) {
        return false
      }
    }
    
    return true
  })

  // Calcular score de descubribilidad para cada perfil
  const profilesWithScores = profilesPassingThreshold.map((profile: any) => {
    const score = calculateDiscoverableScore(profile, currentUser)
    return {
      profile,
      discoverableScore: score,
    }
  })

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

      if (!existingMatch) {
        // Crear nuevo match
        await matchesCollection.insertOne({
          participantes: [idEmisorObj, idReceptorObj],
          creadoEn: new Date(),
          ultimoMensajeEn: null,
          mensajesNoLeidos: 0,
        })

        return { isMatch: true }
      }
    }
  }

  return { isMatch: false }
}

