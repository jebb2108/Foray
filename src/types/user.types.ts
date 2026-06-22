export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  location: string | null;
  createdAt: string;
  stats: UserStats;
}

export interface UserStats {
  savedCount: number;
  visitsCount: number;
  reviewsCount: number;
  memberSince: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface UpdateProfileDTO {
  name?: string;
  username?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string | null;
}
