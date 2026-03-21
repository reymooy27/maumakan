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
  searchSidebarOpen: boolean;
  setSearchSidebarOpen: (open: boolean) => void;
  searchResults: Place[];
  setSearchResults: (results: Place[]) => void;
  hoveredPlaceId: string | null;
  setHoveredPlaceId: (id: string | null) => void;

  // Routing and User Location
  userLocation: [number, number] | null;
  setUserLocation: (location: [number, number] | null) => void;
  routeGeometry: [number, number][] | null;
  setRouteGeometry: (geometry: [number, number][] | null) => void;

  // Direction Sidebar
  directionSidebarOpen: boolean;
  setDirectionSidebarOpen: (open: boolean) => void;
  transportMode: 'driving' | 'foot' | 'bike';
  setTransportMode: (mode: 'driving' | 'foot' | 'bike') => void;
  routeData: { distance: number; duration: number } | null;
  setRouteData: (data: { distance: number; duration: number } | null) => void;
}

const DEFAULT_FILTERS: Filters = {
  minPrice: 0,
  maxPrice: 500000,
  minRating: 0,
  maxDistance: 0,
  isOpenNow: false,
  amenities: [],
  dietaryTags: [],
  onlySaved: false,
};

// Default center: Kupang, Indonesia (Changed for testing)
const DEFAULT_CENTER: [number, number] = [-10.1583, 123.5973];

export const useMapStore = create<MapStore>((set) => ({
  bounds: null,
  center: DEFAULT_CENTER,
  zoom: 13,
  setBounds: (bounds) =>
    set((state) => {
      if (
        state.bounds &&
        state.bounds.north === bounds.north &&
        state.bounds.south === bounds.south &&
        state.bounds.east === bounds.east &&
        state.bounds.west === bounds.west
      ) {
        return state;
      }
      return { bounds };
    }),
  setCenter: (center) =>
    set((state) => {
      if (state.center[0] === center[0] && state.center[1] === center[1]) {
        return state;
      }
      return { center };
    }),
  setZoom: (zoom) =>
    set((state) => {
      // Round zoom to 2 decimal places to avoid precision issues
      const roundedZoom = Math.round(zoom * 100) / 100;
      if (state.zoom === roundedZoom) return state;
      return { zoom: roundedZoom };
    }),

  selectedPlace: null,
  setSelectedPlace: (place) =>
    set({ 
      selectedPlace: place, 
      ...(place ? { filterPanelOpen: false, searchSidebarOpen: false } : {}) 
    }),

  filterPanelOpen: false,
  setFilterPanelOpen: (open) =>
    set({ 
      filterPanelOpen: open, 
      ...(open ? { selectedPlace: null, routeGeometry: null, directionSidebarOpen: false, searchSidebarOpen: false } : {}) 
    }),

  filters: DEFAULT_FILTERS,
  setFilters: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchSidebarOpen: false,
  setSearchSidebarOpen: (open) => set({ 
    searchSidebarOpen: open, 
    ...(open ? { filterPanelOpen: false, selectedPlace: null, directionSidebarOpen: false } : {}) 
  }),
  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),
  hoveredPlaceId: null,
  setHoveredPlaceId: (id) => set({ hoveredPlaceId: id }),

  userLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
  routeGeometry: null,
  setRouteGeometry: (geometry) => set({ routeGeometry: geometry }),

  directionSidebarOpen: false,
  setDirectionSidebarOpen: (open) => 
    set({ 
      directionSidebarOpen: open, 
      ...(open ? { filterPanelOpen: false, searchSidebarOpen: false } : { routeGeometry: null, routeData: null }) 
    }),
  transportMode: 'driving',
  setTransportMode: (mode) => set({ transportMode: mode }),
  routeData: null,
  setRouteData: (data) => set({ routeData: data }),
}));
