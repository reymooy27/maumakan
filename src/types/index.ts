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
  amenities?: string[];
  photos?: Photo[];
  checkIns?: CheckIn[];
  crowdReports?: CrowdReport[];
}

export interface MenuItem {
  id: string;
  placeId: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  dietaryTags?: string[];
  photos?: Photo[];
}

export interface Review {
  id: string;
  placeId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  photos?: Photo[];
}

export interface Photo {
  id: string;
  url: string;
  caption?: string;
  createdAt: string;
  userId?: string;
  placeId?: string;
  menuItemId?: string;
  reviewId?: string;
}

export interface CheckIn {
  id: string;
  userId: string;
  placeId: string;
  createdAt: string;
}

export interface CrowdReport {
  id: string;
  userId: string;
  placeId: string;
  status: string; // "Busy" | "Quiet" | "Normal"
  createdAt: string;
}

export interface Filters {
  minPrice: number;     // IDR
  maxPrice: number;     // IDR
  minRating: number;    // 0–5
  maxDistance: number;  // km, 0 = unlimited
  isOpenNow: boolean;
  amenities: string[];
  dietaryTags: string[];
  onlySaved: boolean; // New: Toggle for favorites view
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
