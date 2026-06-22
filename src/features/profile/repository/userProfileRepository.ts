import { asArray, asString, asTrimmedString, isRecord } from '../../../shared/lib/guards';
import { createId } from '../../../shared/lib/id';
import { normalizeIsoDate, nowIso } from '../../../shared/lib/date';
import {
  createEnvelope,
  readJsonStorage,
  removeStorage,
  writeJsonStorage,
} from '../../../shared/storage/jsonStorage';
import {
  UserProfile,
  UserProfileChanges,
  UserProfileDraft,
} from '../model/userProfile';

const STORAGE_KEY = 'foray.user.v2';
const LEGACY_STORAGE_KEY = 'foray.local-user.v1';
const SCHEMA_VERSION = 2;

function normalizeInterestIds(value: unknown): string[] {
  // Интересы очищаются от дублей и ограничиваются лимитом регистрации
  return [...new Set(
    asArray(value)
      .filter((interest): interest is string => typeof interest === 'string')
      .map((interest) => interest.trim())
      .filter(Boolean),
  )].slice(0, 6);
}

function normalizeProfile(value: unknown): UserProfile | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = asTrimmedString(value.name);
  const username = asTrimmedString(value.username).replace(/^@/, '');
  const birthDate = asTrimmedString(value.birthDate);
  if (!name || !username || !birthDate) {
    return null;
  }

  const createdAt = normalizeIsoDate(value.createdAt);
  return {
    id: asTrimmedString(value.id, createId('user')),
    name,
    username,
    birthDate,
    city: asString(value.city).trim(),
    bio: asString(value.bio).trim(),
    interestIds: normalizeInterestIds(value.interestIds ?? value.interests),
    createdAt,
    updatedAt: normalizeIsoDate(value.updatedAt, createdAt),
  };
}

export function loadUserProfile(): UserProfile | null {
  const stored = readJsonStorage(STORAGE_KEY);
  if (isRecord(stored) && stored.schemaVersion === SCHEMA_VERSION) {
    const profile = normalizeProfile(stored.data);
    if (profile) {
      return saveUserProfileRecord(profile);
    }
  }

  // Старый профиль переносится без повторной регистрации
  const legacyProfile = normalizeProfile(readJsonStorage(LEGACY_STORAGE_KEY));
  if (!legacyProfile) {
    return null;
  }

  saveUserProfileRecord(legacyProfile);
  return legacyProfile;
}

function saveUserProfileRecord(profile: UserProfile): UserProfile {
  writeJsonStorage(STORAGE_KEY, createEnvelope(SCHEMA_VERSION, profile));
  return profile;
}

export function createUserProfile(draft: UserProfileDraft): UserProfile {
  const timestamp = nowIso();
  return saveUserProfileRecord({
    ...draft,
    id: createId('user'),
    name: draft.name.trim(),
    username: draft.username.trim().replace(/^@/, ''),
    birthDate: draft.birthDate.trim(),
    city: draft.city.trim(),
    bio: draft.bio.trim(),
    interestIds: normalizeInterestIds(draft.interestIds),
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export function updateUserProfile(
  current: UserProfile,
  changes: UserProfileChanges,
): UserProfile {
  return saveUserProfileRecord({
    ...current,
    ...changes,
    name: (changes.name ?? current.name).trim(),
    username: (changes.username ?? current.username).trim().replace(/^@/, ''),
    birthDate: (changes.birthDate ?? current.birthDate).trim(),
    city: (changes.city ?? current.city).trim(),
    bio: (changes.bio ?? current.bio).trim(),
    interestIds: normalizeInterestIds(changes.interestIds ?? current.interestIds),
    updatedAt: nowIso(),
  });
}

export function removeUserProfile(): void {
  removeStorage(STORAGE_KEY);
  removeStorage(LEGACY_STORAGE_KEY);
}
