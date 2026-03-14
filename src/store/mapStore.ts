import { create } from 'zustand';
import { Place, Filters, MapBounds } from '@/types';

interface MapStore {
  // Map state
  bounds: MapBounds | null;
  center: [number, number];
  zoom: number;
  setBounds: (bounds: MapBounds) => void;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;

  // Selected place
  selectedPlace: Place | null;
  setSelectedPlace: (place: Place | null) => void;

  // Filters
  filters: Filters;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const DEFAULT_FILTERS: Filters = {
  priceRange: [1, 2, 3, 4],
  minRating: 0,
  maxDistance: 0,
};

// Default center: Jakarta, Indonesia
const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456];

export const useMapStore = create<MapStore>((set) => ({
  bounds: null,
  center: DEFAULT_CENTER,
  zoom: 13,
  setBounds: (bounds) => set({ bounds }),
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),

  selectedPlace: null,
  setSelectedPlace: (place) => set({ selectedPlace: place }),

  filters: DEFAULT_FILTERS,
  setFilters: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
