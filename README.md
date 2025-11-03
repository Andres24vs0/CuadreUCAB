# CuadreUCAB

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/andres24vs-gmailcoms-projects/v0-cuadre-ucab)

## Descripción

CuadreUCAB es una plataforma diseñada exclusivamente para la comunidad universitaria de la UCAB. 

Buscamos que CuadreUCAB sea el Tinder de la UCAB, evitando momentos incómodos y creando un ambiente más relajado donde los estudiantes puedan conocerse y formar conexiones de manera natural.

## Tecnologías

- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático
- **React Query** - Gestión de estado del servidor
- **Zustand** - Gestión de estado global
- **MongoDB** - Base de datos
- **Tailwind CSS** - Estilos
- **Radix UI** - Componentes accesibles

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build
```

## Características

- Sistema de autenticación
- Perfiles personalizables
- Galería de fotos
- Sistema de matches y coincidencias
- Chat en tiempo real
- Preferencias de búsqueda avanzadas

## Funcionalidades Detalladas

### 🔐 Sistema de Autenticación
- **Autenticación exclusiva para UCAB**: Validación de emails con dominio `@ucab.edu.ve` o `@est.ucab.edu.ve`
- **Validación de edad**: Requisito mínimo de 18 años para registrarse
- **Gestión de sesión**: Estado de autenticación persistente con Zustand y localStorage
- **Rutas protegidas**: Dashboard protegido con redirección automática a login si no está autenticado
- **Actualización de actividad**: Tracking automático de última conexión del usuario

### 👤 Perfiles Personalizables
- **Información básica**: Nombre, género (Masculino/Femenino/Otro), biografía
- **Atributos físicos**: Color de ojos (7 opciones) y color de cabello (16 opciones)
- **Carrera universitaria**: Selección entre 23 carreras disponibles de la UCAB
- **Galería de fotos**: Requisito de exactamente 2 fotos por perfil
- **Intereses**: Selección múltiple de intereses personales
- **Fecha de nacimiento**: Cálculo automático de edad
- **Edición de perfil**: Actualización completa del perfil con validación en tiempo real

### 💘 Sistema de Swipes y Matches
- **Swipe Like/Pass**: Sistema de deslizar para indicar interés (like) o rechazo (pass)
- **Detección de matches**: Cuando dos usuarios se dan like mutuamente, se crea automáticamente un match
- **Historial de swipes**: Registro de todas las acciones (like/pass) para evitar mostrar perfiles ya vistos
- **Indicador de interés mutuo**: Señalización cuando alguien ya te dio like antes de que tú lo veas

### 💬 Chat en Tiempo Real
- **Mensajería instantánea**: Chat en tiempo real usando Pusher para comunicación bidireccional
- **Lista de conversaciones**: Vista de todos los matches con último mensaje y contador de no leídos
- **Estado de lectura**: Marcado automático de mensajes como leídos al visualizarlos
- **Indicador de "Última conexión"**: Muestra cuándo un usuario estuvo activo por última vez
- **Estado en línea**: Indicador visual cuando un usuario está activo (conectado en los últimos 2 minutos)
- **Auto-scroll inteligente**: Desplazamiento automático a nuevos mensajes

### 🔍 Algoritmo de Descubrimiento Inteligente
- **Sistema de scoring avanzado**: Algoritmo que calcula la compatibilidad entre perfiles
- **Filtrado bidireccional**: Solo muestra perfiles donde ambos usuarios cumplen las preferencias del otro
- **Preferencias personalizables**:
  - Género buscado (Masculino, Femenino, Otro, o Todos)
  - Rango de edad (mínimo y máximo)
  - Preferencia de carrera (Todas, Misma carrera, Otra carrera)
- **Ordenamiento por relevancia**: Los perfiles se muestran ordenados por score de descubribilidad de mayor a menor

### 📊 Activity Tracking
- **Actualización periódica**: Última conexión se actualiza cada 2 minutos mientras el usuario está activo
- **Eventos de actividad**: Actualización automática al cambiar de pestaña, cerrar la ventana o perder el foco
- **Cálculo de score de conexión**: Los perfiles inactivos tienen menor prioridad en el algoritmo de matching

## Arquitectura del Sistema

### Base de Datos (MongoDB)

El proyecto utiliza MongoDB con las siguientes colecciones:

#### Colección `usuarios`
Almacena información de usuarios y sus perfiles:
```typescript
{
  _id: ObjectId,
  email: string,                    // Email UCAB único
  password: string,                 // Hash de contraseña
  creadoEn: Date,
  ultimaConexion: Date,
  perfil: {
    nombre: string,
    genero: "masculino" | "femenino" | "otro",
    bio: string,
    fotos: string[],                // Array de exactamente 2 URLs
    intereses: string[],
    atributosFisicos: {
      colorOjos: string,
      colorCabello: string
    },
    carrera: string,                // Una de las 23 carreras UCAB
    preferencias: {
      generoBuscado: string,        // "todos" o género específico
      rangoEdad: {
        min: number,                // Mínimo 18
        max: number                 // Máximo 99
      },
      preferenciaCarrera: "todas" | "misma" | "otra"
    },
    fechaNacimiento: Date
  }
}
```

#### Colección `swipes`
Registra todas las acciones de swipe (like/pass):
```typescript
{
  _id: ObjectId,
  idEmisor: ObjectId | string,      // Usuario que realiza el swipe
  idReceptor: ObjectId | string,    // Usuario objetivo
  accion: "like" | "pass",
  creadoEn: Date
}
```

#### Colección `matches`
Almacena los matches mutuos entre usuarios:
```typescript
{
  _id: ObjectId,
  participantes: [ObjectId, ObjectId],  // Array de 2 IDs de usuario
  creadoEn: Date,
  ultimoMensajeEn: Date | null,
  mensajesNoLeidos: number
}
```

#### Colección `mensajes`
Almacena los mensajes del chat:
```typescript
{
  _id: ObjectId,
  idMatch: ObjectId,                // ID del match asociado
  idEmisor: ObjectId | string,      // Usuario que envía el mensaje
  contenido: string,
  creadoEn: Date,
  leido: boolean
}
```

### Gestión de Estado

- **Zustand** (`lib/stores/auth-store.ts`): Maneja el estado de autenticación del cliente con persistencia en localStorage
- **React Query** (`lib/queries/`): Gestiona el estado del servidor, caché de datos y sincronización con la API
- **Hooks personalizados**: 
  - `usePusherChat`: Suscripción a eventos de chat en tiempo real
  - `useUserActivity`: Tracking automático de actividad del usuario

### Flujo de Autenticación

1. Usuario inicia sesión en `/auth/login`
2. Validación de credenciales en backend (`/api/login`)
3. Estado almacenado en Zustand con persistencia en localStorage
4. Layout del dashboard verifica autenticación antes de renderizar
5. Redirección automática a `/auth/login` si no está autenticado
6. Actualización periódica de `ultimaConexion` mientras el usuario está activo

## Sistema de Scoring

El algoritmo de descubribilidad calcula la relevancia de cada perfil usando un sistema de pesos ponderados:

### Pesos de Características

| Característica | Peso | Descripción |
|---------------|------|-------------|
| **Género** | 40% | Coincidencia entre el género buscado del perfil objetivo y el género del usuario actual |
| **Intereses** | 20% | Porcentaje de intereses comunes entre ambos usuarios |
| **Carrera** | 20% | Coincidencia basada en la preferencia de carrera (misma/otra/todas) |
| **Edad** | 10% | Proximidad de la edad al centro del rango de preferencia |
| **Atributos Físicos** | 10% | Análisis de patrones basado en likes previos del candidato |

### Umbral Mínimo

- **30% de score mínimo**: Solo se muestran perfiles que superen este umbral
- Los perfiles por debajo del umbral son filtrados automáticamente

### Filtrado Bidireccional

Antes de calcular el score, se aplican filtros obligatorios:

1. **Filtro de género**: El perfil objetivo debe estar buscando el género del usuario actual (o "todos")
2. **Filtro de edad**: La edad del usuario actual debe estar dentro del rango de preferencias del perfil objetivo
3. **Filtro de carrera**: Si el perfil objetivo tiene preferencia de carrera, debe cumplirse

### Score de Conexión

- **Factor multiplicativo**: Se aplica al score final como máscara
- **Decaimiento exponencial**: 
  - Última conexión hoy → Score 1.0
  - 365 días sin conexión → Score ~0.01
  - Interpolación exponencial entre estos valores
- **Objetivo**: Priorizar usuarios activos sobre inactivos

### Algoritmo de Ordenamiento

1. **Filtrado inicial**: Excluir usuario actual y perfiles ya vistos (swipes previos)
2. **Filtrado por preferencias básicas**: Género, edad, carrera
3. **Cálculo de scores**: Para cada candidato, calcular score ponderado
4. **Filtrado por umbral**: Eliminar perfiles con score < 30%
5. **Ordenamiento**: De mayor a menor score
6. **Límite de resultados**: Retornar máximo 50 perfiles más relevantes

### Score de Atributos Físicos

El sistema analiza los likes previos del candidato para inferir preferencias:
- Obtiene hasta 50 perfiles a los que el candidato ha dado like
- Compara color de ojos y cabello de esos perfiles con el usuario actual
- Calcula un score basado en coincidencias encontradas
- Es una heurística que mejora con más datos de interacción

## API Endpoints

### Autenticación

#### `POST /api/login`
Autentica un usuario y retorna su información.

**Body:**
```json
{
  "email": "usuario@est.ucab.edu.ve",
  "password": "contraseña123"
}
```

**Response:**
```json
{
  "id": "user_id",
  "email": "usuario@est.ucab.edu.ve",
  "creadoEn": "2024-01-01T00:00:00.000Z",
  "perfil": { ... }
}
```

### Usuarios

#### `GET /api/usuarios`
Obtiene todos los usuarios del sistema (para desarrollo/administración).

#### `GET /api/usuarios/[id]`
Obtiene un usuario específico por ID.

**Response:**
```json
{
  "id": "user_id",
  "email": "usuario@est.ucab.edu.ve",
  "perfil": { ... }
}
```

#### `PATCH /api/usuarios/[id]`
Actualiza el perfil de un usuario.

**Body:**
```json
{
  "nombre": "Nuevo nombre",
  "bio": "Nueva biografía",
  "fotos": ["url1", "url2"],
  "intereses": ["Música", "Deportes"],
  ...
}
```

#### `POST /api/usuarios/activity`
Actualiza la última conexión de un usuario.

**Body:**
```json
{
  "userId": "user_id"
}
```

### Descubrimiento

#### `GET /api/discover`
Obtiene perfiles descubribles para el usuario actual.

**Query Parameters:**
- `limit` (opcional): Número máximo de perfiles a retornar (default: 50)

**Response:**
```json
[
  {
    "id": "profile_id",
    "nombre": "Nombre",
    "genero": "masculino",
    "bio": "Biografía",
    "fotos": ["url1", "url2"],
    "intereses": ["Música"],
    "atributosFisicos": { ... },
    "discoverableScore": 0.85,
    "hasLikedYou": false
  }
]
```

### Swipes

#### `POST /api/swipes`
Crea o actualiza un swipe (like/pass).

**Body:**
```json
{
  "idEmisor": "user_id",
  "idReceptor": "target_user_id",
  "accion": "like" | "pass"
}
```

**Response:**
```json
{
  "isMatch": true,
  "matchId": "match_id"  // Solo presente si hay match
}
```

### Chat

#### `GET /api/chats`
Obtiene todos los chats (matches) del usuario actual.

**Response:**
```json
[
  {
    "id": "match_id",
    "matchId": "match_id",
    "otherUser": {
      "id": "user_id",
      "nombre": "Nombre",
      "email": "email@est.ucab.edu.ve",
      "fotos": ["url1"],
      "carrera": "Informática",
      "ultimaConexion": "2024-01-01T00:00:00.000Z"
    },
    "lastMessage": {
      "text": "Último mensaje",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "senderId": "user_id"
    },
    "unreadCount": 2,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### `GET /api/chats/[chatId]`
Obtiene información detallada de un chat específico.

**Response:**
```json
{
  "id": "match_id",
  "otherUser": { ... },
  "messages": [
    {
      "id": "message_id",
      "matchId": "match_id",
      "senderId": "user_id",
      "text": "Mensaje",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "read": true
    }
  ]
}
```

#### `POST /api/chats/[chatId]/messages`
Envía un mensaje en un chat.

**Body:**
```json
{
  "userId": "user_id",
  "text": "Contenido del mensaje"
}
```

**Response:**
```json
{
  "id": "message_id",
  "matchId": "match_id",
  "senderId": "user_id",
  "text": "Contenido del mensaje",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "read": false
}
```

### Uploads

#### `POST /api/uploads`
Sube una imagen al servidor.

**Body:**
```json
{
  "filename": "imagen.jpg",
  "data": "base64_encoded_image_data"
}
```

**Response:**
```json
{
  "url": "/uploads/timestamp-filename.jpg"
}
```

## Estructura del Proyecto

```
CuadreUCAB/
├── app/                          # Rutas Next.js (App Router)
│   ├── (dashboard)/             # Rutas protegidas del dashboard
│   │   ├── chats/               # Sistema de chat
│   │   │   ├── [chatId]/       # Chat individual
│   │   │   └── page.tsx        # Lista de chats
│   │   ├── descubrir/          # Página de descubrimiento/swipe
│   │   └── perfil/             # Página de perfil del usuario
│   ├── api/                     # API Routes
│   │   ├── chats/              # Endpoints de chat
│   │   ├── discover/           # Endpoint de descubrimiento
│   │   ├── login/              # Endpoint de autenticación
│   │   ├── swipes/             # Endpoint de swipes
│   │   ├── uploads/            # Endpoint de subida de imágenes
│   │   └── usuarios/           # Endpoints de usuarios
│   ├── auth/                    # Rutas de autenticación
│   │   ├── login/              # Página de login
│   │   └── register/           # Página de registro
│   ├── layout.tsx              # Layout raíz
│   └── page.tsx                # Página de inicio (redirección)
├── components/                   # Componentes React
│   ├── ui/                     # Componentes UI reutilizables (Radix UI)
│   ├── image-upload.tsx        # Componente de subida de imágenes
│   ├── interests-selector.tsx  # Selector de intereses
│   ├── last-seen.tsx           # Indicador de última conexión
│   ├── match-modal.tsx         # Modal de match
│   ├── navbar.tsx              # Barra de navegación
│   ├── profile-card.tsx        # Tarjeta de perfil
│   └── register-form.tsx       # Formulario de registro
├── lib/                         # Utilidades y lógica de negocio
│   ├── db/                     # Manejadores de base de datos
│   │   ├── ManejadorMensajes.ts    # Lógica de mensajes y chat
│   │   ├── ManejadorSwipes.ts      # Lógica de swipes y matches
│   │   └── ManejadorUsuarios.ts    # CRUD de usuarios
│   ├── hooks/                  # Hooks personalizados
│   │   ├── usePusherChat.ts       # Hook para chat en tiempo real
│   │   └── useUserActivity.ts     # Hook para tracking de actividad
│   ├── queries/                # React Query hooks y funciones
│   │   ├── auth-queries.ts        # Queries de autenticación
│   │   ├── chat-queries.ts        # Queries de chat
│   │   ├── upload-queries.ts      # Queries de upload
│   │   └── user-queries.ts        # Queries de usuarios
│   ├── stores/                 # Zustand stores
│   │   └── auth-store.ts          # Store de autenticación
│   ├── api.ts                  # Funciones cliente de API
│   ├── constants.ts            # Constantes (carreras, colores, géneros)
│   ├── mongo.ts                # Configuración de MongoDB
│   ├── pusher-client.ts        # Cliente Pusher (frontend)
│   ├── pusher-server.ts        # Servidor Pusher (backend)
│   ├── types.ts                # Tipos TypeScript y schemas Zod
│   └── validation.ts           # Funciones de validación
├── scripts/                     # Scripts de utilidad
│   ├── seed.ts                 # Script para poblar BD con datos de prueba
│   ├── clear-seed.ts           # Script para limpiar datos de prueba
│   └── test-mongo.js           # Script para probar conexión MongoDB
└── public/                      # Archivos estáticos
    └── uploads/                # Imágenes subidas por usuarios
```

### Archivos Clave

- **`lib/db/ManejadorSwipes.ts`**: Contiene toda la lógica del algoritmo de scoring y descubrimiento
- **`lib/db/ManejadorMensajes.ts`**: Gestiona mensajes, matches y funcionalidades de chat
- **`lib/db/ManejadorUsuarios.ts`**: Operaciones CRUD de usuarios y perfiles
- **`lib/stores/auth-store.ts`**: Estado global de autenticación con persistencia
- **`components/register-form.tsx`**: Formulario multi-paso de registro con validación completa

## Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# MongoDB
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/
MONGODB_DB=cuadre_ucab

# Pusher (Chat en tiempo real)
PUSHER_APP_ID=tu_app_id
PUSHER_KEY=tu_key
PUSHER_SECRET=tu_secret
PUSHER_CLUSTER=tu_cluster  # Ejemplo: mt1, us2, eu, etc.

# Pusher (Frontend - debe empezar con NEXT_PUBLIC_)
NEXT_PUBLIC_PUSHER_KEY=tu_key
NEXT_PUBLIC_PUSHER_CLUSTER=tu_cluster
```

### Configuración de MongoDB

1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un nuevo cluster
3. Obtén la connection string y reemplázala en `MONGODB_URI`
4. Asegúrate de que la IP desde donde conectas esté en la whitelist

### Configuración de Pusher

1. Crea una cuenta en [Pusher](https://pusher.com/)
2. Crea una nueva aplicación
3. Copia las credenciales (App ID, Key, Secret, Cluster) a tu `.env.local`

## Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo en http://localhost:3000

# Producción
npm run build        # Compila la aplicación para producción
npm start            # Ejecuta la versión compilada (requiere build previo)

# Base de datos
npm run seed         # Pobla la base de datos con datos de prueba
npm run clear-seed   # Elimina los datos de prueba generados por seed
npm run check-db     # Verifica la conexión con MongoDB

# Linting
npm run lint         # Ejecuta ESLint para verificar el código
```

### Script de Seed

El script `seed.ts` genera usuarios de prueba con:
- Perfiles completos con información aleatoria
- Fotos de placeholder
- Intereses y preferencias variados
- Edades entre 18-25 años
- Distribución de carreras y géneros

**Uso:**
```bash
npm run seed
```

**Importante**: El script requiere que las variables de entorno estén configuradas correctamente.

## Características Adicionales

### Validación de Datos
- **Zod Schemas**: Validación robusta en cliente y servidor
- **Validación de email UCAB**: Solo acepta `@ucab.edu.ve` o `@est.ucab.edu.ve`
- **Validación de edad**: Requiere mínimo 18 años al registrarse
- **Validación de fotos**: Requiere exactamente 2 fotos por perfil

### Normalización de Datos
- **`lib/profile-normalizer.ts`**: Convierte datos de MongoDB a formato esperado por el frontend
- Maneja inconsistencias entre ObjectId y strings
- Normaliza formatos de fechas (Date, ISO string, BSON `$date`)
- Convierte nombres de campos legacy (ej: `color_ojos` → `colorOjos`)

### Componentes UI
- **Radix UI**: Componentes accesibles y personalizables
- **Tailwind CSS**: Estilos utilitarios y responsive
- **Tema oscuro/claro**: Soporte para ambos modos (Next Themes)

### Seguridad
- Contraseñas hasheadas antes de almacenar
- Validación de acceso a matches (solo participantes pueden ver/editar)
- Validación de ownership en endpoints de actualización de perfil