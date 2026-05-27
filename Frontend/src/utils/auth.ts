// src/utils/auth.ts
export const STORAGE_KEY = 'ngo_current_user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Participant' | 'Coordinator';
  region: string;
  photoUrl?: string;
  birthDate?: string;
}

export const saveUser = (user: User): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const getUser = (): User | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearUser = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const isAuthenticated = (): boolean => {
  return getUser() !== null;
};