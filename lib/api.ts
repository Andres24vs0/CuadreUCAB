import type {
  RawUserProfile,
  NormalizedProfile,
  ProfileUpdate,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UploadRequest,
  UploadResponse,
  ApiError,
} from "@/lib/types"

import { normalizeRaw } from "@/lib/profile-normalizer"

// Base API URL (relative for Next.js API routes)
const API_BASE = ""

/**
 * Centralized fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ApiError
    const error: ApiError = {
      error: errorData.error || errorData.message || `Error ${response.status}`,
      message: errorData.message,
      status: response.status,
    }
    throw error
  }

  return response.json() as Promise<T>
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(identifier: string): Promise<NormalizedProfile> {
  const raw = await apiFetch<RawUserProfile>(`/api/usuarios/${encodeURIComponent(String(identifier))}`)
  return normalizeRaw(raw)
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  identifier: string,
  updates: ProfileUpdate
): Promise<NormalizedProfile> {
  const raw = await apiFetch<RawUserProfile>(`/api/usuarios/${encodeURIComponent(String(identifier))}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  })
  return normalizeRaw(raw)
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/api/usuarios", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/login", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Upload image (base64 data URL)
 */
export async function uploadImage(dataUrl: string, filename?: string): Promise<string> {
  const response = await apiFetch<UploadResponse>("/api/uploads", {
    method: "POST",
    body: JSON.stringify({ filename, data: dataUrl } as UploadRequest),
  })
  return response.url
}

// Profile type for discover/swipe
export interface DiscoverProfile {
  id: string
  nombre: string
  fechaNacimiento: string
  genero: string
  bio: string
  fotos: string[]
  intereses: string[]
  atributosFisicos: {
    colorOjos: string
    colorCabello: string
    carrera: string
  }
  hasLikedYou?: boolean
}

/**
 * Get discoverable profiles
 */
export async function getDiscoverableProfiles(
  userId: string,
  limit?: number
): Promise<DiscoverProfile[]> {
  const params = new URLSearchParams({ userId })
  if (limit) params.append('limit', limit.toString())
  
  return apiFetch<DiscoverProfile[]>(`/api/discover?${params.toString()}`)
}

/**
 * Create a swipe (like or pass)
 */
export async function createSwipe(
  idEmisor: string,
  idReceptor: string,
  accion: "like" | "pass"
): Promise<{ isMatch: boolean; matchId?: string }> {
  return apiFetch<{ isMatch: boolean; matchId?: string }>("/api/swipes", {
    method: "POST",
    body: JSON.stringify({ idEmisor, idReceptor, accion }),
  })
}


