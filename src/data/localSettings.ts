const SETTINGS_STORAGE_KEY = 'foray.local-settings.v1';

export interface LocalSettings {
  messageNotifications: boolean;
  matchNotifications: boolean;
  showCity: boolean;
  showOnlineStatus: boolean;
}

const DEFAULT_SETTINGS: LocalSettings = {
  messageNotifications: true,
  matchNotifications: true,
  showCity: true,
  showOnlineStatus: true,
};

export function loadLocalSettings(): LocalSettings {
  try {
    const value = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return value
      ? { ...DEFAULT_SETTINGS, ...(JSON.parse(value) as Partial<LocalSettings>) }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveLocalSettings(settings: LocalSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
