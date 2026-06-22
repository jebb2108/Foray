const USER_STORAGE_KEY = 'foray.local-user.v1';

export interface LocalUserProfile {
  id: string;
  name: string;
  username: string;
  birthDate: string;
  city: string;
  bio: string;
  interests: string[];
  createdAt: string;
}

export type NewLocalUserProfile = Omit<LocalUserProfile, 'id' | 'createdAt'>;

export function loadLocalUser(): LocalUserProfile | null {
  try {
    const value = localStorage.getItem(USER_STORAGE_KEY);
    return value ? (JSON.parse(value) as LocalUserProfile) : null;
  } catch {
    return null;
  }
}

export function saveLocalUser(profile: NewLocalUserProfile): LocalUserProfile {
  const user: LocalUserProfile = {
    ...profile,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function removeLocalUser(): void {
  localStorage.removeItem(USER_STORAGE_KEY);
}
