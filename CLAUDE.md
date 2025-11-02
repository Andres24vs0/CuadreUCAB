# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CuadreUCAB is a dating platform built exclusively for the UCAB university community. It functions as a "Tinder for UCAB" where students can create profiles, swipe on other profiles, match with compatible users, and chat with matches.

## Technology Stack

- **Next.js 15** with App Router (React 19)
- **TypeScript** with strict mode
- **MongoDB** for data persistence
- **React Query** (@tanstack/react-query) for server state management
- **Zustand** for client state management (authentication)
- **Tailwind CSS** with Radix UI components
- **Zod** for schema validation

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint

# Database operations
npm run seed          # Seed database with sample data
npm run clear-seed    # Clear seeded data
npm run check-db      # Check database connection
```

## Architecture

### Authentication Flow

- Authentication state is managed by Zustand (`lib/stores/auth-store.ts`)
- Uses localStorage persistence with hydration pattern
- Auth state includes: `isAuthenticated`, `userId`, `userEmail`, `hasHydrated`
- Protected routes use `app/(dashboard)/layout.tsx` which redirects unauthenticated users to `/auth/login`
- The layout waits for Zustand store hydration before checking authentication
- Login sets user session via `login(userId, email)`, logout clears it

### Database Architecture

MongoDB collections:
- **usuarios**: User profiles with nested `perfil` object containing personal info, photos, interests, preferences
- **swipes**: Records of like/pass actions between users (idEmisor, idReceptor, accion)
- **matches**: Mutual likes between two users (participantes array with two user IDs)
- **mensajes**: Chat messages within matches (idMatch, idEmisor, contenido)

Database handlers:
- `lib/db/ManejadorUsuarios.ts`: User CRUD operations, profile updates
- `lib/db/ManejadorSwipes.ts`: Swipe logic, discoverable profiles with bidirectional filtering
- `lib/mongo.ts`: MongoDB connection with singleton pattern using global cache

### User Profile Structure

Profiles stored in MongoDB have this nested structure:
```typescript
{
  _id: ObjectId,
  email: string,
  password: string,
  perfil: {
    nombre: string,
    genero: "masculino" | "femenino" | "otro",
    bio: string,
    fotos: string[],  // exactly 2 photos required
    intereses: string[],
    atributosFisicos: { colorOjos: string, colorCabello: string },
    carrera: string,  // one of CARRERAS constants
    preferencias: {
      generoBuscado: string,  // "todos" or specific gender
      rangoEdad: { min: number, max: number },
      preferenciaCarrera: "todas" | "misma" | "otra"
    },
    fechaNacimiento: Date
  }
}
```

### Discovery Algorithm

The `getDiscoverableProfiles` function in `ManejadorSwipes.ts` implements sophisticated matching:

1. **Exclusion filters**: Filters out current user and previously swiped profiles
2. **Preference matching**: Applies user's gender, age range, and career preferences
3. **Bidirectional filtering**: Both users must match each other's gender preferences
4. **Priority sorting**:
   - Users seeking specific genders (not "todos") ranked higher
   - Same career matches ranked higher when applicable
5. **Completeness check**: Only shows profiles with name, photos, and preferences defined

### Route Structure

- `/` - Landing page
- `/auth/login` - Login page
- `/auth/register` - Registration flow with multi-step form
- `/(dashboard)/descubrir` - Swipe interface for discovering profiles
- `/(dashboard)/perfil` - User profile management
- `/(dashboard)/chats` - List of matches/conversations
- `/(dashboard)/chats/[chatId]` - Individual chat view

API routes in `app/api/`:
- `login/route.ts` - POST authentication
- `usuarios/route.ts` - GET all users, user by ID
- `usuarios/[id]/route.ts` - PATCH update profile
- `discover/route.ts` - GET discoverable profiles for current user
- `swipes/route.ts` - POST create swipe (like/pass)
- `uploads/route.ts` - POST image upload

### Validation Strategy

Two-layer validation approach:

1. **Zod schemas** in `lib/types.ts`:
   - `registerFormSchema` - Client-side form validation
   - `profileUpdateSchema` - Profile edit validation
   - `ucabEmailSchema` - Enforces @ucab.edu.ve or @est.ucab.edu.ve
   - `birthDateSchema` - Enforces 18+ age requirement

2. **Validation functions** in `lib/validation.ts`:
   - Reusable validation logic for common checks
   - Returns `{ isValid: boolean, error?: string }`

### Data Normalization

`lib/profile-normalizer.ts` handles inconsistencies between database schema and frontend expectations:
- Flattens nested `perfil` structure for forms
- Converts MongoDB date formats (`$date`, `$numberLong`) to ISO strings
- Normalizes color field names (color_ojos → colorOjos)
- Handles array vs string type mismatches for preferences

### Image Uploads

- Images uploaded via `api/uploads/route.ts`
- Stored in `public/uploads/` directory with timestamp prefix
- Returns relative URL path for storing in database
- Registration requires exactly 2 photos

### Constants

All domain constants defined in `lib/constants.ts`:
- `CARRERAS`: List of all UCAB degree programs (23 programs)
- `COLORES_OJOS`: Eye color options (7 colors)
- `COLORES_CABELLO`: Hair color options (16 colors)
- `GENEROS`: Gender options ("Masculino", "Femenino", "Otro")

Use these constants for validation and UI selectors. Do NOT hardcode values.

## Important Notes

### Database IDs
- MongoDB uses ObjectId for `_id` fields
- When querying, always handle both ObjectId and string formats
- Use `ObjectId.isValid(id)` before converting strings to ObjectId
- The handlers support lookup by email OR ObjectId

### UCAB Email Validation
- Users must register with `@ucab.edu.ve` or `@est.ucab.edu.ve` emails
- This is enforced in Zod schemas and validation functions

### Gender Handling
- Database stores lowercase: "masculino", "femenino", "otro"
- Constants use capitalized: "Masculino", "Femenino", "Otro"
- Always convert to lowercase before database operations

### Date Handling
- Birth dates must result in 18+ years old (validated via `isAtLeast18YearsOld` in `lib/zodiac-utils.ts`)
- Store dates as JavaScript Date objects in MongoDB
- Convert to ISO strings for API responses

### Swipe Matching Logic
- A match is created when both users swipe "like" on each other
- The `createSwipe` function automatically detects mutual likes and creates matches
- Existing swipes can be updated if user swipes again on same profile

## Environment Variables

Required in `.env.local`:
```
MONGODB_URI=mongodb+srv://...
MONGODB_DB=CuadreUCAB
```

## Path Aliases

TypeScript paths configured in `tsconfig.json`:
- `@/*` maps to project root
- Example: `import { getDb } from "@/lib/mongo"`
