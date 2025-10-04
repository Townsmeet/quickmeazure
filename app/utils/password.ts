/**
 * Password validation utilities
 * Provides reusable functions for password strength checking and validation
 */

/**
 * Checks if a string contains at least one lowercase letter
 */
export const hasLowerCase = (str: string): boolean => /[a-z]/.test(str)

/**
 * Checks if a string contains at least one uppercase letter
 */
export const hasUpperCase = (str: string): boolean => /[A-Z]/.test(str)

/**
 * Checks if a string contains at least one number
 */
export const hasNumber = (str: string): boolean => /\d/.test(str)

/**
 * Checks if a string contains at least one special character
 */
export const hasSpecialChar = (str: string): boolean =>
  /[!@#$%^&*()_+\-={}();':"\\|,.<>/?]/.test(str)

/**
 * Calculates password strength score (0-4)
 * 1 point for each requirement met:
 * - At least 8 characters
 * - Contains both lowercase and uppercase letters
 * - Contains at least one number
 * - Contains at least one special character
 */
export const getPasswordStrength = (password: string): number => {
  if (!password) return 0

  let strength = 0
  if (password.length >= 8) strength++
  if (hasLowerCase(password) && hasUpperCase(password)) strength++
  if (hasNumber(password)) strength++
  if (hasSpecialChar(password)) strength++

  return strength
}

/**
 * Returns a human-readable password strength label
 */
export const getPasswordStrengthLabel = (strength: number): string => {
  if (strength === 0) return 'Very Weak'
  if (strength === 1) return 'Weak'
  if (strength === 2) return 'Moderate'
  if (strength === 3) return 'Strong'
  return 'Very Strong'
}

/**
 * Validates a password against common requirements
 * Returns an array of error messages, empty if password is valid
 */
export const validatePassword = (password: string): string[] => {
  const errors: string[] = []

  if (!password) {
    errors.push('Password is required')
    return errors
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!hasLowerCase(password) || !hasUpperCase(password)) {
    errors.push('Password must contain both lowercase and uppercase letters')
  }

  if (!hasNumber(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!hasSpecialChar(password)) {
    errors.push('Password must contain at least one special character')
  }

  return errors
}
