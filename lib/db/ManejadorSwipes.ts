import { getDb } from "@/lib/mongo"
import { ObjectId } from "mongodb"
import { getProfileById } from "./ManejadorUsuarios"

/**
 * Get profiles that the user hasn't swiped on yet
 * Filters by user preferences and excludes already swiped profiles
 */
export async function getDiscoverableProfiles(userId: string, limit: number = 50) {
  const db = await getDb()
  
  // Get current user profile to check preferences
  const currentUser = await getProfileById(userId)
  if (!currentUser || !currentUser.perfil) {
    return []
  }

  const currentUserObjId = ObjectId.isValid(userId) ? new ObjectId(userId) : null
  
  // Get all swipes from current user (profiles they've already seen)
  const swipesCollection = db.collection("swipes")
  
  // Build query to find swipes - try both ObjectId and string formats
  // MongoDB can store idEmisor as either ObjectId or string, so we need to check both
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
  console.log(`[ManejadorSwipes] Found ${swipes.length} swipes for user ${userId}`)
  
  const swipedUserIds = swipes.map((s) => {
    const receptor = s.idReceptor
    if (receptor instanceof ObjectId) return receptor.toString()
    if (typeof receptor === 'string') return receptor
    return receptor?.toString() || ""
  }).filter(Boolean)
  
  console.log(`[ManejadorSwipes] Swiped user IDs:`, swipedUserIds)
  
  // Build query to exclude swiped users and current user
  const excludedIds = [...swipedUserIds, userId].filter(Boolean)
  const excludedObjectIds = excludedIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id))
  
  // Build query conditions
  const excludeConditions: any[] = []
  
  // Exclude by _id if we have ObjectIds
  if (excludedObjectIds.length > 0) {
    excludeConditions.push({ _id: { $nin: excludedObjectIds } })
  }
  
  // Also exclude current user by email if userId is not an ObjectId
  if (!ObjectId.isValid(userId) && currentUser?.email) {
    excludeConditions.push({ email: { $ne: currentUser.email } })
  }
  
  // Exclude swiped users by email if they're not ObjectIds
  const swipedEmails = swipedUserIds.filter(id => !ObjectId.isValid(id))
  if (swipedEmails.length > 0) {
    excludeConditions.push({ email: { $nin: swipedEmails } })
  }
  
  const query: any = excludeConditions.length > 0 
    ? { $and: excludeConditions }
    : {}

  // Filter by user preferences if available
  const preferences = currentUser.perfil.preferencias
  if (preferences) {
    // Filter by gender preference
    if (preferences.generoBuscado && preferences.generoBuscado !== "todos") {
      query["perfil.genero"] = preferences.generoBuscado
    }
    
    // Filter by age range if available
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
    
    // Filter by career preference if set
    if (preferences.preferenciaCarrera === "misma" && currentUser.perfil.carrera) {
      query["perfil.carrera"] = currentUser.perfil.carrera
    }
  }

  // Only get users with complete profiles
  query["perfil.nombre"] = { $exists: true, $ne: "" }
  query["perfil.fotos"] = { $exists: true, $type: "array", $ne: [] }

  // Also exclude current user by _id if it's a valid ObjectId
  if (currentUserObjId) {
    if (!query.$and) query.$and = []
    query.$and.push({ _id: { $ne: currentUserObjId } })
  } else if (currentUser?.id && ObjectId.isValid(currentUser.id)) {
    if (!query.$and) query.$and = []
    query.$and.push({ _id: { $ne: new ObjectId(currentUser.id) } })
  }

  console.log(`[ManejadorSwipes] Query for discoverable profiles:`, JSON.stringify(query, null, 2))
  
  const usuariosCollection = db.collection("usuarios")
  const profiles = await usuariosCollection.find(query).limit(limit).toArray()
  
  console.log(`[ManejadorSwipes] Found ${profiles.length} discoverable profiles`)

  // Check if these users have liked the current user (for hasLikedYou)
  const profileIds = profiles
    .map((p) => (p._id ? p._id.toString() : ""))
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

  // Format profiles for frontend
  return profiles.map((profile: any) => {
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
    }
  })
}

/**
 * Create a swipe (like or pass)
 * Returns match information if both users liked each other
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

  // Check if swipe already exists
  const existingSwipe = await swipesCollection.findOne({
    idEmisor: idEmisorObj,
    idReceptor: idReceptorObj,
  })

  if (existingSwipe) {
    // Update existing swipe
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
    // Create new swipe
    await swipesCollection.insertOne({
      idEmisor: idEmisorObj,
      idReceptor: idReceptorObj,
      accion,
      creadoEn: new Date(),
    })
  }

  // If it's a like, check for mutual match
  if (accion === "like") {
    // Check if the other user has also liked this user
    const reverseSwipe = await swipesCollection.findOne({
      idEmisor: idReceptorObj,
      idReceptor: idEmisorObj,
      accion: "like",
    })

    if (reverseSwipe) {
      // It's a match! Create or update match
      const existingMatch = await matchesCollection.findOne({
        participantes: {
          $all: [idEmisorObj, idReceptorObj],
        },
      })

      if (!existingMatch) {
        // Create new match
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

