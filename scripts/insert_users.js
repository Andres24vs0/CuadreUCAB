// Script para insertar 30 usuarios en MongoDB
// Ejecutar con: mongosh <nombre_bd> scripts/insert-30-usuarios.js
// O copiar y pegar directamente en mongosh

// Configuración - CAMBIA ESTO según tu base de datos
const DB_NAME = "cuadreucab"; // Ajusta al nombre de tu BD si es diferente

// Usar la base de datos
use(DB_NAME);

print("🚀 Iniciando inserción de 30 usuarios...\n");

// Arrays de datos
const NOMBRES = [
  "María",
  "José",
  "Ana",
  "Luis",
  "Carmen",
  "Carlos",
  "Laura",
  "Juan",
  "Isabel",
  "Diego",
  "Sofía",
  "Andrés",
  "Valentina",
  "Sebastián",
  "Camila",
  "Miguel",
  "Nicolás",
  "Daniela",
  "Fernanda",
  "Alejandro",
  "Gabriela",
  "Ricardo",
  "Paola",
  "Roberto",
  "Andrea",
  "Fernando",
  "Patricia",
  "Francisco",
  "Mónica",
  "Javier",
  "Claudia",
  "Antonio",
  "Diana",
  "Eduardo",
  "Mariana",
  "Pablo",
  "Alejandra",
  "Sergio",
  "Viviana",
  "Rafael",
  "Cristina",
  "Ángel",
  "Gloria",
  "Manuel",
  "Lucía",
  "Oscar",
  "Tatiana",
  "Jorge",
  "Adriana",
  "Héctor",
];

const CARRERAS = [
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
];

const COLORES_OJOS = [
  "marrón",
  "verde",
  "azul",
  "gris",
  "avellana",
  "negro",
  "ámbar",
];

const COLORES_CABELLO = [
  "negro",
  "castaño oscuro",
  "castaño",
  "castaño claro",
  "rubio",
  "rubio platino",
  "pelirrojo",
  "gris",
  "blanco",
  "azul",
  "rojo",
  "rosa",
  "morado",
  "verde",
  "turquesa",
  "naranja",
];

const GENEROS = ["masculino", "femenino", "otro"];

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
];

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
];

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
];

// Funciones auxiliares
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function normalizeNameForEmail(name) {
  // Convertir nombre a formato email: "María" -> "maria"
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/\s+/g, ""); // Eliminar espacios
}

// Generar 30 usuarios
const usuarios = [];
const nombresUsados = new Set();

for (let i = 0; i < 30; i++) {
  // Obtener un nombre único
  let nombre;
  do {
    nombre = randomItem(NOMBRES);
  } while (nombresUsados.has(nombre) && nombresUsados.size < NOMBRES.length);
  nombresUsados.add(nombre);

  // Generar email: [nombre]@est.ucab.edu.ve
  const nombreEmail = normalizeNameForEmail(nombre);
  const email = `${nombreEmail}@est.ucab.edu.ve`;

  const genero = randomItem(GENEROS);
  const fechaNacimiento = randomDate(
    new Date(1998, 0, 1),
    new Date(2005, 11, 31)
  );
  const edad = new Date().getFullYear() - fechaNacimiento.getFullYear();
  const carrera = randomItem(CARRERAS);

  // Genero buscado: 70% todos, 30% específico
  const generoBuscado = Math.random() > 0.3 ? "todos" : genero;

  const colorOjos = randomItem(COLORES_OJOS);
  const colorCabello = randomItem(COLORES_CABELLO);

  // Intereses: entre 3 y 8
  const numIntereses = Math.floor(Math.random() * 6) + 3;
  const interesesSeleccionados = randomItems(INTERESES, numIntereses);

  // Fotos: 2 fotos aleatorias
  const fotos = [randomItem(MOCK_PHOTOS), randomItem(MOCK_PHOTOS)];

  const now = new Date();

  const usuario = {
    email: email,
    password: "12345678", // Contraseña por defecto
    creadoEn: randomDate(new Date(2024, 0, 1), now),
    ultimaConexion: randomDate(new Date(2024, 0, 1), now),
    perfil: {
      nombre: nombre,
      genero: genero,
      bio: randomItem(BIO_TEMPLATES),
      fotos: fotos,
      intereses: interesesSeleccionados,
      atributosFisicos: {
        colorOjos: colorOjos,
        colorCabello: colorCabello,
      },
      carrera: carrera,
      preferencias: {
        generoBuscado: generoBuscado,
        rangoEdad: {
          min: Math.max(18, edad - 5),
          max: Math.min(99, edad + 5),
        },
        preferenciaCarrera: randomItem(["todas", "misma", "otra"]),
      },
      fechaNacimiento: fechaNacimiento,
    },
  };

  usuarios.push(usuario);
}

// Insertar usuarios en la colección
try {
  const result = db.usuarios.insertMany(usuarios);

  print(
    `\n✅ Se insertaron ${result.insertedIds.length} usuarios exitosamente!\n`
  );
  print("📋 Resumen de usuarios insertados:\n");

  // Mostrar los primeros 10 usuarios insertados
  const insertedIds = Object.values(result.insertedIds);
  const insertedDocs = db.usuarios
    .find({ _id: { $in: insertedIds } })
    .limit(10)
    .toArray();

  insertedDocs.forEach((doc, index) => {
    print(
      `${index + 1}. ${doc.email} - ${doc.perfil.nombre} (${
        doc.perfil.carrera
      })`
    );
  });

  if (insertedIds.length > 10) {
    print(`\n... y ${insertedIds.length - 10} usuarios más\n`);
  }

  // Verificar duplicados de email
  const emailCount = db.usuarios
    .aggregate([
      { $group: { _id: "$email", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  if (emailCount.length > 0) {
    print("\n⚠️  ADVERTENCIA: Se encontraron emails duplicados:");
    emailCount.forEach((dup) => {
      print(`   - ${dup._id}: ${dup.count} veces`);
    });
  } else {
    print("\n✅ No se encontraron emails duplicados");
  }

  // Estadísticas finales
  const totalUsuarios = db.usuarios.countDocuments();
  print(`\n📊 Total de usuarios en la base de datos: ${totalUsuarios}`);
} catch (error) {
  print(`\n❌ Error al insertar usuarios: ${error.message}\n`);

  if (error.message.includes("duplicate key")) {
    print("💡 Algunos emails ya existen en la base de datos.");
    print("   Puedes eliminar usuarios existentes con:");
    print(
      "   db.usuarios.deleteMany({ email: { $regex: /@est\\.ucab\\.edu\\.ve$/ } })"
    );
  }
}

print("\n✨ Script completado\n");
