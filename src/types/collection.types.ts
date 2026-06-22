import { DiscoveryItem } from './discovery.types';

export interface Collection {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  items: DiscoveryItem[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionDTO {
  title: string;
  description?: string;
}

export interface UpdateCollectionDTO {
  title?: string;
  description?: string;
  coverImageUrl?: string | null;
}

export interface AddToCollectionDTO {
  collectionId: string;
  itemId: string;
}
