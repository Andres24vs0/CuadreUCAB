import { getDb } from "@/lib/mongo"
import { ObjectId } from "mongodb"

export interface DbMensaje {
  _id?: ObjectId
  idMatch: ObjectId | string
  idEmisor: ObjectId | string
  contenido: string
  creadoEn: Date
  leido?: boolean
}

export interface DbMatch {
  _id?: ObjectId
  participantes: (ObjectId | string)[]
  creadoEn: Date
  ultimoMensajeEn: Date | null
  mensajesNoLeidos: number
}

export interface ChatWithProfile {
  id: string
  matchId: string
  otherUser: {
    id: string
    nombre: string
    email: string
    fotos: string[]
    carrera: string
  }
  lastMessage?: {
    text: string
    timestamp: string
    senderId: string
  }
  unreadCount: number
  createdAt: string
}

export interface Message {
  id: string
  matchId: string
  senderId: string
  text: string
  timestamp: string
  read: boolean
}

/**
 * Get all matches for a user with their last message and unread count
 */
export async function getUserChats(userId: string): Promise<ChatWithProfile[]> {
  const db = await getDb()
  const userObjId = ObjectId.isValid(userId) ? new ObjectId(userId) : null

  // Build query to find matches where user is a participant
  const matchQuery: any = userObjId
    ? {
        participantes: {
          $in: [userObjId, userId],
        },
      }
    : { participantes: userId }

  const matches = await db
    .collection("matches")
    .find(matchQuery)
    .sort({ ultimoMensajeEn: -1 })
    .toArray()

  const chats: ChatWithProfile[] = []

  for (const match of matches) {
    const participantes = match.participantes || []

    // Find the other user's ID
    const otherUserId = participantes.find((p: any) => {
      const pId = p instanceof ObjectId ? p.toString() : p
      const currentId = userObjId ? userObjId.toString() : userId
      return pId !== currentId
    })

    if (!otherUserId) continue

    // Get other user's profile
    const otherUserQuery = otherUserId instanceof ObjectId
      ? { _id: otherUserId }
      : ObjectId.isValid(otherUserId as string)
      ? { _id: new ObjectId(otherUserId as string) }
      : { email: otherUserId }

    const otherUserDoc = await db.collection("usuarios").findOne(otherUserQuery)
    if (!otherUserDoc) continue

    // Get last message for this match
    const lastMessage = await db
      .collection("mensajes")
      .findOne(
        { idMatch: match._id },
        { sort: { creadoEn: -1 } }
      )

    chats.push({
      id: match._id!.toString(),
      matchId: match._id!.toString(),
      otherUser: {
        id: otherUserDoc._id!.toString(),
        nombre: otherUserDoc.perfil?.nombre || "Usuario",
        email: otherUserDoc.email,
        fotos: otherUserDoc.perfil?.fotos || [],
        carrera: otherUserDoc.perfil?.carrera || "",
      },
      lastMessage: lastMessage
        ? {
            text: lastMessage.contenido,
            timestamp: new Date(lastMessage.creadoEn).toISOString(),
            senderId: lastMessage.idEmisor instanceof ObjectId
              ? lastMessage.idEmisor.toString()
              : lastMessage.idEmisor,
          }
        : undefined,
      unreadCount: match.mensajesNoLeidos || 0,
      createdAt: new Date(match.creadoEn).toISOString(),
    })
  }

  return chats
}

/**
 * Get all messages for a specific match
 */
export async function getMatchMessages(matchId: string): Promise<Message[]> {
  const db = await getDb()

  if (!ObjectId.isValid(matchId)) {
    return []
  }

  const matchObjId = new ObjectId(matchId)

  const messages = await db
    .collection("mensajes")
    .find({ idMatch: matchObjId })
    .sort({ creadoEn: 1 })
    .toArray()

  return messages.map((msg: any) => ({
    id: msg._id!.toString(),
    matchId: matchId,
    senderId: msg.idEmisor instanceof ObjectId ? msg.idEmisor.toString() : msg.idEmisor,
    text: msg.contenido,
    timestamp: new Date(msg.creadoEn).toISOString(),
    read: msg.leido || false,
  }))
}

/**
 * Send a message in a match
 */
export async function sendMessage(
  matchId: string,
  senderId: string,
  contenido: string
): Promise<Message> {
  const db = await getDb()

  if (!ObjectId.isValid(matchId)) {
    throw new Error("Invalid match ID")
  }

  const matchObjId = new ObjectId(matchId)
  const senderObjId = ObjectId.isValid(senderId) ? new ObjectId(senderId) : senderId

  // Create the message
  const now = new Date()
  const messageDoc: DbMensaje = {
    idMatch: matchObjId,
    idEmisor: senderObjId,
    contenido,
    creadoEn: now,
    leido: false,
  }

  const result = await db.collection("mensajes").insertOne(messageDoc)

  // Update match's last message timestamp and increment unread count
  await db.collection("matches").updateOne(
    { _id: matchObjId },
    {
      $set: { ultimoMensajeEn: now },
      $inc: { mensajesNoLeidos: 1 },
    }
  )

  return {
    id: result.insertedId.toString(),
    matchId: matchId,
    senderId: senderObjId instanceof ObjectId ? senderObjId.toString() : senderObjId,
    text: contenido,
    timestamp: now.toISOString(),
    read: false,
  }
}

/**
 * Mark messages as read in a match
 */
export async function markMessagesAsRead(matchId: string, userId: string): Promise<void> {
  const db = await getDb()

  if (!ObjectId.isValid(matchId)) {
    throw new Error("Invalid match ID")
  }

  const matchObjId = new ObjectId(matchId)
  const userObjId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId

  // Mark all messages from other user as read
  await db.collection("mensajes").updateMany(
    {
      idMatch: matchObjId,
      idEmisor: { $ne: userObjId },
      leido: { $ne: true },
    },
    {
      $set: { leido: true },
    }
  )

  // Reset unread count for this match
  await db.collection("matches").updateOne(
    { _id: matchObjId },
    {
      $set: { mensajesNoLeidos: 0 },
    }
  )
}

/**
 * Get match by ID and verify user is a participant
 */
export async function getMatch(matchId: string, userId: string): Promise<DbMatch | null> {
  const db = await getDb()

  if (!ObjectId.isValid(matchId)) {
    return null
  }

  const matchObjId = new ObjectId(matchId)
  const userObjId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId

  const match = await db.collection("matches").findOne({
    _id: matchObjId,
    participantes: { $in: [userObjId, userId] },
  })

  return match as DbMatch | null
}

/**
 * Get the other user in a match
 */
export async function getOtherUserInMatch(matchId: string, currentUserId: string) {
  const db = await getDb()

  if (!ObjectId.isValid(matchId)) {
    return null
  }

  const matchObjId = new ObjectId(matchId)
  const match = await db.collection("matches").findOne({ _id: matchObjId })

  if (!match || !match.participantes) {
    return null
  }

  const currentUserObjId = ObjectId.isValid(currentUserId) ? new ObjectId(currentUserId) : null
  const participantes = match.participantes

  // Find the other user's ID
  const otherUserId = participantes.find((p: any) => {
    const pId = p instanceof ObjectId ? p.toString() : p
    const currentId = currentUserObjId ? currentUserObjId.toString() : currentUserId
    return pId !== currentId
  })

  if (!otherUserId) {
    return null
  }

  // Get other user's profile
  const otherUserQuery = otherUserId instanceof ObjectId
    ? { _id: otherUserId }
    : ObjectId.isValid(otherUserId as string)
    ? { _id: new ObjectId(otherUserId as string) }
    : { email: otherUserId }

  const otherUserDoc = await db.collection("usuarios").findOne(otherUserQuery)

  if (!otherUserDoc) {
    return null
  }

  return {
    id: otherUserDoc._id!.toString(),
    nombre: otherUserDoc.perfil?.nombre || "Usuario",
    email: otherUserDoc.email,
    fotos: otherUserDoc.perfil?.fotos || [],
    carrera: otherUserDoc.perfil?.carrera || "",
    genero: otherUserDoc.perfil?.genero || "",
    bio: otherUserDoc.perfil?.bio || "",
    intereses: otherUserDoc.perfil?.intereses || [],
    atributosFisicos: otherUserDoc.perfil?.atributosFisicos || {},
    fechaNacimiento: otherUserDoc.perfil?.fechaNacimiento
      ? new Date(otherUserDoc.perfil.fechaNacimiento).toISOString()
      : null,
  }
}
