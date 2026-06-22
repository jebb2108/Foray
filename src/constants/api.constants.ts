export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.foray.app/v1';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VALIDATE_TOKEN: '/auth/validate',
  },
  DISCOVERY: {
    FEED: '/discovery/feed',
    SEARCH: '/discovery/search',
    ITEM: (id: string) => `/discovery/items/${id}`,
    NEARBY: '/discovery/nearby',
  },
  COLLECTIONS: {
    LIST: '/collections',
    DETAIL: (id: string) => `/collections/${id}`,
    ITEMS: (id: string) => `/collections/${id}/items`,
    ITEM: (collectionId: string, itemId: string) => `/collections/${collectionId}/items/${itemId}`,
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    UPLOAD_AVATAR: '/user/avatar',
  },
} as const;

export const API_CACHE_TTL = {
  DISCOVERY_FEED: 300,
  ITEM_DETAIL: 900,
  SEARCH: 60,
  NEARBY: 120,
  COLLECTIONS: 600,
} as const;
