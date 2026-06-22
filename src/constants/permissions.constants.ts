export const PERMISSION_MESSAGES = {
  LOCATION: {
    title: 'Enable Location',
    description: 'Foray uses your location to find nearby places and measure distances.',
    settingsMessage: 'Please enable location access in Settings to use this feature.',
  },
  NOTIFICATIONS: {
    title: 'Enable Notifications',
    description: 'Get alerts about new discoveries and updates to your saved places.',
    settingsMessage: 'Please enable notifications in Settings to receive alerts.',
  },
  CAMERA: {
    title: 'Camera Access',
    description: 'Foray uses your camera to capture photos of places you visit.',
    settingsMessage: 'Please enable camera access in Settings.',
  },
  PHOTOS: {
    title: 'Photo Library',
    description: 'Access your photo library to set your profile picture.',
    settingsMessage: 'Please enable photo library access in Settings.',
  },
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'foray_auth_token',
  REFRESH_TOKEN: 'foray_refresh_token',
  ONBOARDING_COMPLETE: 'foray_onboarding_complete',
  APPEARANCE_MODE: 'appearance_mode',
  USER_PREFERENCES: 'foray_user_preferences',
  RECENT_SEARCHES: 'foray_recent_searches',
} as const;
