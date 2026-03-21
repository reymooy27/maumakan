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

  // Filter panel
  filterPanelOpen: boolean;
  setFilterPanelOpen: (open: boolean) => void;

  // Filters
  filters: Filters;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Routing and User Location
  userLocation: [number, number] | null;
  setUserLocation: (location: [number, number] | null) => void;
  routeGeometry: [number, number][] | null;
  setRouteGeometry: (geometry: [number, number][] | null) => void;
}

const DEFAULT_FILTERS: Filters = {
  priceRange: [1, 2, 3, 4],
  minRating: 0,
  maxDistance: 0,
};

// Default center: Kupang, Indonesia (Changed for testing)
const DEFAULT_CENTER: [number, number] = [-10.1583, 123.5973];

export const useMapStore = create<MapStore>((set) => ({
  bounds: null,
  center: DEFAULT_CENTER,
  zoom: 13,
  setBounds: (bounds) => set({ bounds }),
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),

  selectedPlace: null,
  setSelectedPlace: (place) =>
    set({ 
      selectedPlace: place, 
      routeGeometry: null, // Clear route when selection changes
      ...(place ? { filterPanelOpen: false } : {}) 
    }),

  filterPanelOpen: false,
  setFilterPanelOpen: (open) =>
    set({ filterPanelOpen: open, ...(open ? { selectedPlace: null, routeGeometry: null } : {}) }),

  filters: DEFAULT_FILTERS,
  setFilters: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  userLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
  routeGeometry: null,
  setRouteGeometry: (geometry) => set({ routeGeometry: geometry }),
}));
