export type ViewMode = 'grid' | 'list';

export type SortOption = 'relevance' | 'distance' | 'rating' | 'newest';

export interface DiscoveryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  images: string[];
  dominantColor?: string;
  rating: number;
  reviewCount: number;
  distance: string;
  address: string;
  phone: string | null;
  website: string | null;
  hours: string | null;
  coordinates: {
    lat: number;
    lng: number;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveryFeedParams {
  page: number;
  limit?: number;
  categories?: string[];
  sortBy?: SortOption;
  lat?: number;
  lng?: number;
  maxDistance?: number;
  minRating?: number;
  query?: string;
}

export interface DiscoveryFeedResponse {
  items: DiscoveryItem[];
  total: number;
  page: number;
  hasMore: boolean;
  nextPage: number | null;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  text: string;
  createdAt: string;
}
