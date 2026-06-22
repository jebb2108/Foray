export const APP_NAME = 'Foray';
export const APP_VERSION = '1.0.0';

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PREFETCH_THRESHOLD: 0.8,
  MAX_RECENT_SEARCHES: 10,
} as const;

export const DEBOUNCE = {
  SEARCH: 300,
  SCROLL: 100,
  RESIZE: 200,
} as const;

export const IMAGE = {
  CARD_SIZE: 160,
  CARD_SIZE_TABLET: 200,
  HERO_HEIGHT: 300,
  AVATAR_SIZE: 80,
  THUMBNAIL_SIZE: 64,
  MAX_QUALITY: 85,
  MAX_WIDTH: 800,
  MAX_HEIGHT: 800,
} as const;

export const CATEGORIES = [
  'Restaurants',
  'Cafes',
  'Parks',
  'Museums',
  'Shopping',
  'Nightlife',
  'Outdoors',
  'Arts',
  'Sports',
  'History',
  'Nature',
  'Entertainment',
] as const;

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'distance', label: 'Distance' },
  { value: 'rating', label: 'Rating' },
  { value: 'newest', label: 'Newest' },
] as const;
