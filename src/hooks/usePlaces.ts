import { useMemo } from 'react';
import useSWR from 'swr';
import { Place, Filters } from '@/types';
import { useMapStore } from '@/store/mapStore';
import { useSavedPlaces } from './useSavedPlaces';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildUrl(bounds: ReturnType<typeof useMapStore.getState>['bounds'], filters: Filters, search: string) {
  const params = new URLSearchParams();
  if (bounds) {
    params.set('north', (Math.ceil(bounds.north * 10) / 10).toString());
    params.set('south', (Math.floor(bounds.south * 10) / 10).toString());
    params.set('east', (Math.ceil(bounds.east * 10) / 10).toString());
    params.set('west', (Math.floor(bounds.west * 10) / 10).toString());
  }
  if (search) params.set('search', search);
  if (filters.minRating > 0) params.set('minRating', String(filters.minRating));
  if (filters.minPrice > 0) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice < 500000) params.set('maxPrice', String(filters.maxPrice));
  if (filters.amenities.length > 0) params.set('amenities', filters.amenities.join(','));
  if (filters.dietaryTags.length > 0) params.set('dietary', filters.dietaryTags.join(','));
  
  if (filters.isOpenNow) {
    params.set('isOpenNow', 'true');
    // Calculate current time in minutes from midnight (WITA = UTC+8)
    const now = new Date();
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const witaMinutes = (utcMinutes + 8 * 60) % 1440;
    params.set('currentTime', String(witaMinutes));
  }
  
  return `/api/places?${params.toString()}`;
}

export function usePlaces() {
  const bounds = useMapStore((s) => s.bounds);
  const filters = useMapStore((s) => s.filters);
  const searchQuery = useMapStore((s) => s.searchQuery);
  const center = useMapStore((s) => s.center);
  const { savedPlaces } = useSavedPlaces();

  const url = buildUrl(bounds, filters, searchQuery);
  
  const { data, error, isLoading } = useSWR<Place[]>(url, fetcher, {
    refreshInterval: 60_000,
    dedupingInterval: 10_000,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const places: Place[] = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    // We only re-calculate and re-reference when data or relevant filters change
    // This stops the infinite re-render loop if center changes slightly
    return data
      .map((p) => ({
        ...p,
        distance: getDistanceKm(center[0], center[1], p.lat, p.lng),
      }))
      .filter((p) => {
        if (filters.maxDistance > 0 && (p.distance ?? 0) > filters.maxDistance) return false;
        if (filters.onlySaved && !savedPlaces.some(s => s.placeId === p.id)) return false;
        return true;
      });
  }, [data, center, filters.maxDistance, filters.onlySaved, savedPlaces]);

  return { places, error, isLoading };
}
