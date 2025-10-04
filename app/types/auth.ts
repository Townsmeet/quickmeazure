/**
 * Authentication and user-related types
 */

export interface User {
  id: number
  name: string
  email: string
  password?: string
  avatar?: string | null
  businessName?: string | null
  phone?: string | null
  location?: string | null
  bio?: string | null
  specializations?: Record<string, string | boolean>
  services?: Record<string, string | number | boolean>
  hasCompletedSetup: boolean
  createdAt: string
  updatedAt?: string | null
  subscription?: {
    plan: string
    status: string
    expiryDate: string | null
  }
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegistrationData {
  name: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

export interface PasswordResetData {
  email: string
  token: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
  expiresIn: number
}
