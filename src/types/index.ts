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
  avgPrice: number; // IDR actual value
  openTime: number;   // Minutes from midnight
  closeTime: number;  // Minutes from midnight
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
  minPrice: number;     // IDR
  maxPrice: number;     // IDR
  minRating: number;    // 0–5
  maxDistance: number;  // km, 0 = unlimited
  isOpenNow: boolean;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
