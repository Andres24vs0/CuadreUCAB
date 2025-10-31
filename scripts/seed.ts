// tsx will load .env.local via --env-file flag in package.json
// Verify environment variables are loaded
if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI not found. Make sure .env.local exists and contains MONGODB_URI=...")
}

import { getDb } from "@/lib/mongo"
import { CARRERAS, COLORES_OJOS, COLORES_CABELLO, GENEROS } from "@/lib/constants"

// Helper function to get random item from array
function randomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// Helper function to get random items from array
function randomItems<T>(array: readonly T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Generate random date between two dates
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Sample interests for users
const INTERESES = [
  "Música",
  "Deportes",
  "Cine",
  "Lectura",
  "Cocina",
  "Viajes",
  "Arte",
  "Fotografía",
  "Videojuegos",
  "Naturaleza",
  "Yoga",
  "Baile",
  "Tecnología",
  "Filosofía",
  "Historia",
  "Idiomas",
  "Mascotas",
  "Series",
  "Gastronomía",
  "Fitness",
]

// Sample names for users
const NOMBRES = [
  "María", "José", "Ana", "Luis", "Carmen", "Carlos", "Laura", "Juan", "Isabel", "Diego",
  "Sofía", "Andrés", "Valentina", "Sebastián", "Camila", "Miguel", "Nicolás", "Daniela",
  "Fernanda", "Alejandro", "Gabriela", "Ricardo", "Paola", "Roberto", "Andrea", "Fernando",
  "Patricia", "Francisco", "Mónica", "Javier", "Claudia", "Antonio", "Diana", "Eduardo",
  "Mariana", "Pablo", "Alejandra", "Sergio", "Viviana", "Rafael", "Cristina", "Ángel",
  "Gloria", "Manuel", "Lucía", "Oscar", "Tatiana", "Jorge", "Adriana", "Héctor"
]

// Sample bio templates
const BIO_TEMPLATES = [
  "Estudiante apasionado por la tecnología y la innovación. Busco conectar con personas interesantes.",
  "Amante de la música y los libros. Siempre abierto a nuevas experiencias y conversaciones.",
  "Fanático del deporte y la vida saludable. Me gusta conocer gente con valores similares.",
  "Cineasta en formación. Disfruto del arte, la cultura y las buenas conversaciones.",
  "Viajero incansable. Creo que cada persona tiene una historia única que vale la pena conocer.",
  "Ingeniero curioso. Me encanta resolver problemas y compartir conocimientos.",
  "Artista de corazón. Expreso mi creatividad a través de diferentes medios.",
  "Estudiante de humanidades. Interesado en filosofía, literatura y debates profundos.",
  "Deportista y amante de la naturaleza. Siempre activo y buscando aventuras.",
  "Músico y compositor. La música es mi forma de conectar con el mundo.",
]

// Sample message content
const MENSAJES_SAMPLE = [
  "¡Hola! Me encantó tu perfil 😊",
  "¿Cómo has estado?",
  "Me gustaría conocerte mejor",
  "Tienes muy buenos intereses, compartimos varias cosas",
  "¿Te gustaría tomar un café algún día?",
  "Hola! Vi que estudias la misma carrera, qué genial",
  "¡Qué bonitas fotos tienes!",
  "Me llamó la atención tu bio",
  "¿Cómo te ha ido con los estudios?",
  "Espero que tengas un lindo día",
  "Me encantó tu sonrisa",
  "¿Qué tal tu semana?",
  "¿Te gustaría charlar más?",
  "Tienes un perfil muy interesante",
  "Hola, ¿cómo estás?",
]

// Valid image URLs from mock profiles
const MOCK_PHOTOS = [
  "/young-woman-smiling-university-student.jpg",
  "/young-woman-reading-book-coffee-shop.jpg",
  "/young-man-smiling-university-student-casual.jpg",
  "/young-man-playing-soccer-sports.jpg",
  "/young-woman-artistic-university-student.jpg",
  "/young-woman-sunset-campus.jpg",
  "/young-man-business-student-confident.jpg",
  "/young-man-gym-fitness.jpg",
  "/young-woman-content-creator-smiling.jpg",
  "/young-woman-taking-photos-social-media.jpg",
  "/young-man-medical-student.jpg",
  "/young-man-studying-library.jpg",
]

async function seedUsuarios() {
  const db = await getDb()
  const collection = db.collection("usuarios")
  
  console.log("Seeding usuarios...")
  const usuarios = []
  
  for (let i = 0; i < 50; i++) {
    const nombre = randomItem(NOMBRES)
    const generoRaw = randomItem(GENEROS)
    // Convert to lowercase to match schema: "masculino", "femenino", "otro"
    const genero = generoRaw.toLowerCase()
    const fechaNacimiento = randomDate(new Date(1995, 0, 1), new Date(2005, 11, 31))
    const edad = new Date().getFullYear() - fechaNacimiento.getFullYear()
    const carrera = randomItem(CARRERAS)
    
    // generoBuscado can be "todos" or specific genders (sometimes "todos", sometimes specific)
    const generoBuscado = Math.random() > 0.3 ? "todos" : genero
    
    // Convert color names to lowercase to match schema
    const colorOjosRaw = randomItem(COLORES_OJOS)
    const colorCabelloRaw = randomItem(COLORES_CABELLO)
    const colorOjos = colorOjosRaw.toLowerCase()
    const colorCabello = colorCabelloRaw.toLowerCase()
    
    const usuario = {
      email: `usuario${i + 1}@${Math.random() > 0.5 ? 'ucab.edu.ve' : 'est.ucab.edu.ve'}`,
      password: "12345678",
      creadoEn: randomDate(new Date(2025, 8, 1), new Date(2025, 9, 31)), // September to October 2025
      ultimaConexion: randomDate(new Date(2024, 0, 1), new Date()),
      perfil: {
        nombre: nombre,
        genero: genero, // lowercase: "masculino", "femenino", "otro"
        bio: randomItem(BIO_TEMPLATES),
        fotos: [
          randomItem(MOCK_PHOTOS),
          randomItem(MOCK_PHOTOS),
        ],
        intereses: randomItems(INTERESES, Math.floor(Math.random() * 5) + 3),
        atributosFisicos: {
          colorOjos: colorOjos, // lowercase
          colorCabello: colorCabello, // lowercase
        },
        carrera: carrera,
        preferencias: {
          generoBuscado: generoBuscado, // "todos" or specific gender
          rangoEdad: {
            min: Math.max(18, edad - 5), // number (not Int32 object)
            max: Math.min(99, edad + 5), // number (not Int32 object)
          },
          preferenciaCarrera: randomItem(["todas", "misma", "otra"]),
        },
        fechaNacimiento: fechaNacimiento,
      },
    }
    
    usuarios.push(usuario)
  }
  
  const result = await collection.insertMany(usuarios)
  console.log(`✓ Inserted ${usuarios.length} usuarios`)
  
  // Get the inserted usuarios with their _ids
  const insertedIds = Object.values(result.insertedIds)
  const insertedUsuarios = await collection.find({ _id: { $in: insertedIds } }).toArray()
  
  return insertedUsuarios
}

async function seedSwipes(usuarios: any[]) {
  const db = await getDb()
  const collection = db.collection("swipes")
  
  console.log("Seeding swipes...")
  const swipes = []
  
  for (let i = 0; i < 50; i++) {
    // Get two different random usuarios
    const [usuario1, usuario2] = randomItems(usuarios, 2)
    const idEmisor = usuario1._id
    const idReceptor = usuario2._id
    
    // 70% chance of like, 30% chance of pass
    const accion = Math.random() > 0.3 ? "like" : "pass"
    
    const swipe = {
      idEmisor: idEmisor,
      idReceptor: idReceptor,
      accion: accion, // "like" or "pass"
      creadoEn: randomDate(new Date(2024, 0, 1), new Date()),
    }
    
    swipes.push(swipe)
  }
  
  await collection.insertMany(swipes)
  console.log(`✓ Inserted ${swipes.length} swipes`)
}

async function seedMatches(usuarios: any[]) {
  const db = await getDb()
  const collection = db.collection("matches")
  
  console.log("Seeding matches...")
  const matches = []
  
  // Create matches from pairs of usuarios
  // We'll ensure each match has unique pairs
  const usedPairs = new Set<string>()
  
  while (matches.length < 50) {
    const [usuario1, usuario2] = randomItems(usuarios, 2)
    const id1 = usuario1._id?.toString() || ""
    const id2 = usuario2._id?.toString() || ""
    
    // Create a unique pair key (ordered)
    const pairKey = [id1, id2].sort().join("-")
    
    if (!usedPairs.has(pairKey) && id1 !== id2) {
      usedPairs.add(pairKey)
      
      const creadoEn = randomDate(new Date(2024, 0, 1), new Date())
      // ultimoMensajeEn should be after creadoEn
      const ultimoMensajeEn = randomDate(creadoEn, new Date())
      // Random number of unread messages (0-10)
      const mensajesNoLeidos = Math.floor(Math.random() * 11)
      
      const match = {
        participantes: [usuario1._id, usuario2._id],
        creadoEn: creadoEn,
        ultimoMensajeEn: ultimoMensajeEn,
        mensajesNoLeidos: mensajesNoLeidos,
      }
      
      matches.push(match)
    }
  }
  
  const result = await collection.insertMany(matches)
  console.log(`✓ Inserted ${matches.length} matches`)
  
  // Get the inserted matches with their _ids
  const insertedIds = Object.values(result.insertedIds)
  const insertedMatches = await collection.find({ _id: { $in: insertedIds } }).toArray()
  
  return insertedMatches
}

async function seedMensajes(usuarios: any[], matches: any[]) {
  const db = await getDb()
  const collection = db.collection("mensajes")
  
  console.log("Seeding mensajes...")
  const mensajes = []
  
  for (let i = 0; i < 50; i++) {
    // Get a random match
    const match = randomItem(matches)
    const participantes = match.participantes || []
    
    // Ensure we have at least 2 participants
    if (participantes.length < 2) continue
    
    const usuario1Id = participantes[0]
    const usuario2Id = participantes[1]
    
    // Randomly decide which usuario sends the message
    const idEmisor = Math.random() > 0.5 ? usuario1Id : usuario2Id
    
    // Message date should be after match creation date and before or equal to ultimoMensajeEn
    const matchCreatedDate = match.creadoEn
    const lastMessageDate = match.ultimoMensajeEn || new Date()
    const messageDate = randomDate(matchCreatedDate, lastMessageDate)
    
    const mensaje = {
      idMatch: match._id,
      idEmisor: idEmisor,
      contenido: randomItem(MENSAJES_SAMPLE),
      creadoEn: messageDate,
    }
    
    mensajes.push(mensaje)
  }
  
  await collection.insertMany(mensajes)
  console.log(`✓ Inserted ${mensajes.length} mensajes`)
}

async function seed() {
  try {
    console.log("Starting database seed...\n")
    
    // Seed usuarios first (they're needed for relationships)
    const usuarios = await seedUsuarios()
    
    // Seed swipes (can reference usuarios)
    await seedSwipes(usuarios)
    
    // Seed matches (can reference usuarios)
    const matches = await seedMatches(usuarios)
    
    // Seed mensajes (needs matches)
    await seedMensajes(usuarios, matches)
    
    console.log("\n✅ Database seed completed successfully!")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    throw error
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log("\n🎉 All done!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })

