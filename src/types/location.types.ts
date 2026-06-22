export interface Coordinates {
  lat: number;
  lng: number;
}

export type PermissionStatus = 'granted' | 'denied' | 'prompt';

export interface MapRegion {
  lat: number;
  lng: number;
  latDelta: number;
  lngDelta: number;
}

export interface MapPin {
  id: string;
  coordinates: Coordinates;
  title: string;
  category: string;
  color: string;
}
