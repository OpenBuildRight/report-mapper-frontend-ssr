/**
 * Shared validation logic used by both client and server
 * These are pure functions that return error messages or null
 */

export function validateUsername(username: string): string | null {
  if (!username || username.trim().length === 0) {
    return "Username is required";
  }

  if (username.length < 3) {
    return "Username must be at least 3 characters";
  }

  if (username.length > 30) {
    return "Username must be at most 30 characters";
  }

  // Only allow alphanumeric characters and underscores
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return "Username can only contain letters, numbers, and underscores";
  }

  return null; // Valid
}

export function validatePassword(password: string): string | null {
  if (!password || password.length === 0) {
    return "Password is required";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  return null; // Valid
}

export function validateName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return "Name is required";
  }

  if (name.trim().length < 2) {
    return "Name must be at least 2 characters";
  }

  return null; // Valid
}

export function validateEmail(email: string): string | null {
  // Email is optional, so empty is valid
  if (!email || email.trim().length === 0) {
    return null;
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }

  return null; // Valid
}
