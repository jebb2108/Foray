import { asBoolean, isRecord } from '../../../shared/lib/guards';
import {
  createEnvelope,
  readJsonStorage,
  writeJsonStorage,
} from '../../../shared/storage/jsonStorage';
import {
  DEFAULT_PROFILE_SETTINGS,
  ProfileSettings,
} from '../model/settings';

const STORAGE_KEY = 'foray.profile-settings.v2';
const LEGACY_STORAGE_KEY = 'foray.local-settings.v1';
const SCHEMA_VERSION = 2;

function normalizeSettings(value: unknown): ProfileSettings {
  if (!isRecord(value)) {
    return DEFAULT_PROFILE_SETTINGS;
  }

  return {
    messageNotifications: asBoolean(
      value.messageNotifications,
      DEFAULT_PROFILE_SETTINGS.messageNotifications,
    ),
    matchNotifications: asBoolean(
      value.matchNotifications,
      DEFAULT_PROFILE_SETTINGS.matchNotifications,
    ),
    showCity: asBoolean(value.showCity, DEFAULT_PROFILE_SETTINGS.showCity),
    showOnlineStatus: asBoolean(
      value.showOnlineStatus,
      DEFAULT_PROFILE_SETTINGS.showOnlineStatus,
    ),
  };
}

export function loadProfileSettings(): ProfileSettings {
  const stored = readJsonStorage(STORAGE_KEY);
  if (isRecord(stored) && stored.schemaVersion === SCHEMA_VERSION) {
    const settings = normalizeSettings(stored.data);
    saveProfileSettings(settings);
    return settings;
  }

  // Настройки старой версии сразу сохраняются в текущем формате
  const legacySettings = normalizeSettings(readJsonStorage(LEGACY_STORAGE_KEY));
  saveProfileSettings(legacySettings);
  return legacySettings;
}

export function saveProfileSettings(settings: ProfileSettings): void {
  writeJsonStorage(STORAGE_KEY, createEnvelope(SCHEMA_VERSION, settings));
}
