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
  // We remove strict bounds query here if we want to fetch more generally and cache
  // But for performance, it's common to expand bounds by a factor so we don't refetch on small pans.
  // Instead of passing the exact bounds, we can either pass a wider radius or just fetch by city/area.
  // For now, let's stick to the bounds but SWR handles the caching. To prevent refetching on every tiny drag, 
  // we could round the coordinates to a certain decimal place, but dedupingInterval does a great job here.
  if (bounds) {
    // Rounding bounds to 2 decimal places creates "cache grids"
    // reducing the number of requests while dragging
    params.set('north', (Math.ceil(bounds.north * 10) / 10).toString());
    params.set('south', (Math.floor(bounds.south * 10) / 10).toString());
    params.set('east', (Math.ceil(bounds.east * 10) / 10).toString());
    params.set('west', (Math.floor(bounds.west * 10) / 10).toString());
  }
  if (search) params.set('search', search);
  if (filters.minRating > 0) params.set('minRating', String(filters.minRating));
  filters.priceRange.forEach((p) => params.append('priceRange', String(p)));
  return `/api/places?${params.toString()}`;
}

export function usePlaces() {
  const { bounds, filters, searchQuery, center } = useMapStore();

  const url = buildUrl(bounds, filters, searchQuery);
  
  // SWR automatically caches requests based on the URL key
  // Best practice: 
  // 1. dedupingInterval (prevents multiple identical requests at the same time)
  // 2. revalidateOnFocus (don't refetch just because user switches tabs if map hasn't moved)
  // 3. keepPreviousData (keeps showing old pins while fetching new ones during pan)
  const { data, error, isLoading } = useSWR<Place[]>(url, fetcher, {
    refreshInterval: 60_000,     // Poll every minute instead of 30s
    dedupingInterval: 10_000,    // Dedupe requests within 10 seconds
    revalidateOnFocus: false,
    keepPreviousData: true,      // crucial for smooth map panning
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
