'use client';

import { useMapStore } from '@/store/mapStore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Search, MapPin, Map as MapIcon, Star } from 'lucide-react';
import { Place } from '@/types';

/* ── snap-point heights (vh) ── */
const SNAP_PEEK = 25;
const SNAP_FULL = 75;
const DISMISS_THRESHOLD = 20;

export default function SearchSidebar() {
  const {
    searchSidebarOpen,
    setSearchSidebarOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    center,
    setCenter,
    setSelectedPlace,
    setZoom,
    setHoveredPlaceId,
  } = useMapStore();

  /* ── bottom-sheet state (mobile) ── */
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(SNAP_FULL);
  const [sheetHeight, setSheetHeight] = useState(SNAP_FULL);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Fetch and sort results ── */
  useEffect(() => {
    let active = true;

    async function fetchResults() {
      if (!searchSidebarOpen || !searchQuery.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch all places matching the query, regardless of map bounds
        const url = `/api/places?search=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!active) return;

        if (Array.isArray(data)) {
          // Calculate distance to map center for sorting
          const R = 6371; // Earth radius in km
          const withDistances = data.map((p: Place) => {
            const dLat = ((p.lat - center[0]) * Math.PI) / 180;
            const dLon = ((p.lng - center[1]) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) ** 2 +
              Math.cos((center[0] * Math.PI) / 180) *
                Math.cos((p.lat * Math.PI) / 180) *
                Math.sin(dLon / 2) ** 2;
            const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return { ...p, distance };
          });

          // Sort by distance (closest first) and take top 5
          withDistances.sort((a, b) => a.distance - b.distance);
          setSearchResults(withDistances.slice(0, 5));
        } else {
          setSearchResults([]);
          setError(data.error || 'Failed to fetch results');
        }
      } catch (err) {
        if (!active) return;
        setSearchResults([]);
        setError('Network error');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchResults();

    return () => { active = false; };
  }, [searchSidebarOpen, searchQuery, center, setSearchResults]);

  /* ── open / close animation ── */
  useEffect(() => {
    if (searchSidebarOpen) {
      setSheetHeight(SNAP_FULL);
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [searchSidebarOpen]);

  const close = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setSearchSidebarOpen(false);
      setSearchQuery(''); // Clear map filter when sidebar explicitly closed
    }, 250);
  }, [setSearchSidebarOpen, setSearchQuery]);

  /* ── drag handlers ── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const content = contentRef.current;
    if (content && content.contains(e.target as Node) && content.scrollTop > 0) return;

    dragging.current = true;
    startY.current = e.clientY;
    startHeight.current = sheetHeight;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [sheetHeight]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const deltaY = startY.current - e.clientY;
    const deltaVh = (deltaY / window.innerHeight) * 100;
    const newHeight = Math.max(10, Math.min(SNAP_FULL, startHeight.current + deltaVh));
    setSheetHeight(newHeight);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);

    if (sheetHeight < DISMISS_THRESHOLD) {
      close();
    } else if (sheetHeight < (SNAP_PEEK + SNAP_FULL) / 2) {
      setSheetHeight(SNAP_PEEK);
    } else {
      setSheetHeight(SNAP_FULL);
    }
  }, [sheetHeight, close]);

  if (!searchSidebarOpen) return null;

  return (
    <>
      {/* ── Desktop: left sidebar ── */}
      <aside
        className={`
          hidden md:flex fixed top-0 left-0 h-full w-full max-w-sm z-50
          bg-gray-900/98 backdrop-blur-lg border-r border-gray-800
          flex-col overflow-hidden shadow-2xl
          transition-transform duration-300 ease-out
          ${isVisible ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent
          results={searchResults}
          isLoading={isLoading}
          error={error}
          query={searchQuery}
          onClose={close}
          onSelectPlace={(p) => {
            setSelectedPlace(p);
            setCenter([p.lat, p.lng]);
            setZoom(16);
            close();
          }}
          onHoverPlace={(p) => setHoveredPlaceId(p ? p.id : null)}
        />
      </aside>

      {/* ── Mobile: bottom sheet ── */}
      <div
        ref={sheetRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ height: `${sheetHeight}vh` }}
        className={`
          md:hidden fixed bottom-0 left-0 right-0 z-50
          bg-gray-900 border-t border-gray-800 rounded-t-2xl
          flex flex-col overflow-hidden touch-none shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
          ${isDragging ? '' : 'transition-[height] duration-300 ease-out'}
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
          transition-transform duration-300
        `}
      >
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 p-1.5 bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain"
          onTouchStart={(e) => {
            if (contentRef.current && contentRef.current.scrollTop > 0) {
              e.stopPropagation();
            }
          }}
        >
          <SidebarContent
            results={searchResults}
            isLoading={isLoading}
            error={error}
            query={searchQuery}
            onClose={close}
            onSelectPlace={(p) => {
              setSelectedPlace(p);
              setCenter([p.lat, p.lng]);
              setZoom(16);
              close();
            }}
            onHoverPlace={(p) => setHoveredPlaceId(p ? p.id : null)}
          />
        </div>
      </div>
    </>
  );
}

function SidebarContent({
  results,
  isLoading,
  error,
  query,
  onClose,
  onSelectPlace,
  onHoverPlace,
}: {
  results: Place[];
  isLoading: boolean;
  error: string | null;
  query: string;
  onClose: () => void;
  onSelectPlace: (place: Place) => void;
  onHoverPlace: (place: Place | null) => void;
}) {
  const { setSearchQuery } = useMapStore();
  const [localQuery, setLocalQuery] = useState(query);

  const handleSearch = () => {
    if (localQuery.trim()) {
      setSearchQuery(localQuery);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearAndClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* ── Header ── */}
      <div className="px-5 pt-8 pb-4 flex-shrink-0 border-b border-gray-800 relative z-10">
        <button
          onClick={clearAndClose}
          className="absolute top-4 right-4 z-10 p-1.5 bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer hidden md:flex"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-orange-500" />
          Search
        </h2>
        
        {/* Inline Search Bar */}
        <div className="relative flex items-center w-full mb-3">
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search here..."
            className="
              w-full pl-4 pr-10 py-2.5
              bg-gray-800 rounded-xl
              text-sm text-white placeholder-gray-500
              focus:outline-none focus:ring-1 focus:ring-orange-500
              transition-all duration-200
            "
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 p-1.5 text-gray-400 hover:text-orange-500 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Top results for <span className="text-white font-medium">"{query}"</span>
        </p>
      </div>

      {/* ── Results List ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-800/50 rounded-xl p-4 flex gap-4 animate-pulse">
              <div className="w-16 h-16 bg-gray-700 rounded-lg flex-shrink-0"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="text-center text-red-400 p-8 border border-red-500/20 rounded-xl bg-red-500/10">
            {error}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center p-8 text-gray-500 flex flex-col items-center">
            <Search className="w-12 h-12 mb-3 text-gray-700" />
            <p>No results found for "{query}"</p>
          </div>
        ) : (
          results.map((place) => (
            <button
              key={place.id}
              onClick={() => onSelectPlace(place)}
              onMouseEnter={() => onHoverPlace(place)}
              onMouseLeave={() => onHoverPlace(null)}
              className="w-full text-left bg-gray-800/40 hover:bg-gray-800 p-3 rounded-xl flex gap-4 transition-colors cursor-pointer group border border-transparent hover:border-gray-700"
            >
              <div 
                className="w-20 h-20 rounded-lg bg-gray-700 bg-cover bg-center flex-shrink-0 relative overflow-hidden"
                style={{ backgroundImage: `url(${place.imageUrl ?? 'https://images.unsplash.com/photo-1548811579-017fc2a7f23e?auto=format&fit=crop&w=500&q=80'})` }}
              >
                <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-yellow-400 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-current" />
                  {place.rating.toFixed(1)}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <h3 className="font-bold text-white text-base truncate pr-2 group-hover:text-orange-400 transition-colors">
                  {place.name}
                </h3>
                <p className="text-xs text-orange-500 font-medium uppercase mt-0.5">
                  {place.type.replace('_', ' ')}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <MapIcon className="w-3 h-3" />
                    {place.distance ? `${place.distance.toFixed(1)} km` : 'Near'}
                  </span>
                  <span className="text-gray-600 px-0.5">•</span>
                  <span className="flex items-center gap-1 truncate max-w-full">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{place.address}</span>
                  </span>
                </div>
                {/* Visual cue if it matched a menu item */}
                {query.length > 0 && place.menuItems?.some(m => m.name.toLowerCase().includes(query.toLowerCase())) && (
                  <p className="text-xs text-green-400 mt-1.5 truncate">
                    Found in menu: {place.menuItems.find(m => m.name.toLowerCase().includes(query.toLowerCase()))?.name}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
