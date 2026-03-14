// Type definitions for Maumakan

export type PlaceType = 'restaurant' | 'cafe' | 'food_stall';

export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  address?: string;
  lat: number;
  lng: number;
  rating: number;
  priceRange: number; // 1–4
  imageUrl?: string;
  createdAt: string;
  menuItems?: MenuItem[];
  reviews?: Review[];
  distance?: number; // km, computed client-side
}

export interface MenuItem {
  id: string;
  placeId: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
}

export interface Review {
  id: string;
  placeId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Filters {
  priceRange: number[]; // e.g. [1, 2]
  minRating: number;    // 0–5
  maxDistance: number;  // km, 0 = unlimited
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
