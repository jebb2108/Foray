export interface UserProfile {
  id: string;
  name: string;
  username: string;
  birthDate: string;
  city: string;
  bio: string;
  interestIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileDraft {
  name: string;
  username: string;
  birthDate: string;
  city: string;
  bio: string;
  interestIds: string[];
}

export type UserProfileChanges = Partial<UserProfileDraft>;
