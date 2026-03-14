import useSWR from 'swr';
import { Place, Filters } from '@/types';
import { useMapStore } from '@/store/mapStore';

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
    params.set('north', String(bounds.north));
    params.set('south', String(bounds.south));
    params.set('east', String(bounds.east));
    params.set('west', String(bounds.west));
  }
  if (search) params.set('search', search);
  if (filters.minRating > 0) params.set('minRating', String(filters.minRating));
  filters.priceRange.forEach((p) => params.append('priceRange', String(p)));
  return `/api/places?${params.toString()}`;
}

export function usePlaces() {
  const { bounds, filters, searchQuery, center } = useMapStore();

  const url = buildUrl(bounds, filters, searchQuery);
  const { data, error, isLoading } = useSWR<Place[]>(url, fetcher, {
    refreshInterval: 30_000,
    dedupingInterval: 5_000,
  });

  const places: Place[] = (data ?? [])
    .map((p) => ({
      ...p,
      distance: getDistanceKm(center[0], center[1], p.lat, p.lng),
    }))
    .filter((p) => {
      if (filters.maxDistance > 0 && (p.distance ?? 0) > filters.maxDistance) return false;
      return true;
    });

  return { places, error, isLoading };
}
