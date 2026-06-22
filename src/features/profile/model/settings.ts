export interface ProfileSettings {
  messageNotifications: boolean;
  matchNotifications: boolean;
  showCity: boolean;
  showOnlineStatus: boolean;
}

export const DEFAULT_PROFILE_SETTINGS: ProfileSettings = {
  messageNotifications: true,
  matchNotifications: true,
  showCity: true,
  showOnlineStatus: true,
};
