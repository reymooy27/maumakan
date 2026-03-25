'use client';

import { useMapStore } from '@/store/mapStore';
import { Bike, Car, Footprints, MapPin, Navigation2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Place } from '@/types';

/* ── snap-point heights (vh) ── */
const SNAP_MIN = 10;
const SNAP_PEEK = 25;
const SNAP_FULL = 50;  // Default open at 50%
const SNAP_MAX = 85;  // Can expand to 85% to see top map
const DISMISS_THRESHOLD = 8; // Lowered to allow snapping to SNAP_MIN

export default function DirectionSidebar() {
  const {
    selectedPlace,
    directionSidebarOpen,
    setDirectionSidebarOpen,
    transportMode,
    setTransportMode,
    userLocation,
    setRouteGeometry,
    routeData,
    setRouteData,
    isRouting,
    setIsRouting,
    setUserLocation
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
  const [routeError, setRouteError] = useState<string | null>(null);

  /* ── route fetching logic ── */
  useEffect(() => {
    let active = true;

    async function fetchRoute() {
      if (!directionSidebarOpen || !selectedPlace) return;

      if (!userLocation) {
        setRouteError('Menunggu lokasi GPS Anda...');
        return;
      }

      // Only show loading pulse if we don't have route data yet
      if (!routeData) {
        setIsLoading(true);
      }
      setRouteError(null);

      try {
        const start = `${userLocation[1]},${userLocation[0]}`;
        const end = `${selectedPlace.lng},${selectedPlace.lat}`;
        const url = `https://router.project-osrm.org/route/v1/${transportMode}/${start};${end}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        const data = await response.json();

        if (!active) return;

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          setRouteGeometry(coords);
          setRouteData({ distance: route.distance, duration: route.duration });
        } else {
          setRouteGeometry(null);
          setRouteData(null);
          setRouteError('Rute tidak ditemukan untuk mode ini.');
        }
      } catch {
        if (!active) return;
        setRouteGeometry(null);
        setRouteData(null);
        setRouteError('Gagal mengambil rute. Periksa koneksi internet.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchRoute();

    return () => { active = false; };
  }, [directionSidebarOpen, userLocation, selectedPlace, transportMode, setRouteGeometry, setRouteData]);

  /* ── open / close animation & routing height ── */
  useEffect(() => {
    if (directionSidebarOpen && selectedPlace) {
      // If routing starts, minimize the sheet to let user see map
      if (isRouting) {
        setSheetHeight(SNAP_MIN);
      } else {
        setSheetHeight(SNAP_FULL);
      }
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [directionSidebarOpen, selectedPlace, isRouting]);

  const close = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setDirectionSidebarOpen(false), 250);
  }, [setDirectionSidebarOpen]);

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
    const newHeight = Math.max(5, Math.min(SNAP_MAX, startHeight.current + deltaVh));
    setSheetHeight(newHeight);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);

    if (sheetHeight < DISMISS_THRESHOLD) {
      close();
    } else if (sheetHeight < (SNAP_MIN + SNAP_PEEK) / 2) {
      setSheetHeight(SNAP_MIN);
    } else if (sheetHeight < (SNAP_PEEK + SNAP_FULL) / 2) {
      setSheetHeight(SNAP_PEEK);
    } else if (sheetHeight < (SNAP_FULL + SNAP_MAX) / 2) {
      setSheetHeight(SNAP_FULL);
    } else {
      setSheetHeight(SNAP_MAX);
    }
  }, [sheetHeight, close]);

  /* ── watch position for active routing ── */
  useEffect(() => {
    if (!isRouting) return;

    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser Anda.');
      setIsRouting(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.error('Error watching position:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isRouting, setUserLocation, setIsRouting]);

  if (!directionSidebarOpen || !selectedPlace) return null;

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
          selectedPlace={selectedPlace}
          onClose={close}
          transportMode={transportMode}
          setTransportMode={setTransportMode}
          isLoading={isLoading}
          routeData={routeData}
          routeError={routeError}
          isMobile={false}
          isRouting={isRouting}
          setIsRouting={setIsRouting}
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
          md:hidden fixed bottom-0 left-0 right-0 z-[60]
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
          className="absolute top-4 right-4 z-20 p-2 bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-full text-white hover:text-orange-400 transition-all cursor-pointer shadow-xl"
        >
          <X className="w-5 h-5 shadow-sm" />
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
            selectedPlace={selectedPlace}
            onClose={close}
            transportMode={transportMode}
            setTransportMode={setTransportMode}
            isLoading={isLoading}
            routeData={routeData}
            routeError={routeError}
            isMobile={true}
            isRouting={isRouting}
            setIsRouting={setIsRouting}
          />
        </div>
      </div>
    </>
  );
}

function SidebarContent({
  selectedPlace,
  onClose,
  transportMode,
  setTransportMode,
  isLoading,
  routeData,
  routeError,
  isMobile,
  isRouting,
  setIsRouting
}: {
  selectedPlace: Place;
  onClose: () => void;
  transportMode: string;
  setTransportMode: (mode: 'driving' | 'foot' | 'bike') => void;
  isLoading: boolean;
  routeData: { distance: number; duration: number } | null;
  routeError: string | null;
  isMobile: boolean;
  isRouting: boolean;
  setIsRouting: (routing: boolean) => void;
}) {

  function formatDuration(seconds: number, mode: string, meters: number) {
    // OSRM public server ignores 'foot' and 'bike' and returns driving time.
    // So we manually calculate reasonable estimates based on distance.
    if (mode === 'foot') {
      // average walking speed: 5 km/h = 1.38 m/s
      seconds = meters / 1.38;
    } else if (mode === 'bike') {
      // average cycling speed: 15 km/h = 4.16 m/s
      seconds = meters / 4.16;
    }

    const min = Math.round(seconds / 60);
    if (min < 60) return `${min} min`;
    const hr = Math.floor(min / 60);
    const m = min % 60;
    return `${hr} h ${m} min`;
  }

  function formatDistance(meters: number) {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  }

  function getETA(seconds: number) {
    const now = new Date();
    const eta = new Date(now.getTime() + seconds * 1000);
    return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className={`flex flex-col ${isMobile ? '' : 'h-full'}`}>
        {/* ── Top Estimation Area (Conditional) ── */}
        {routeData && (
          <div className="bg-gray-800 border-b border-gray-700 px-5 py-3 flex items-center justify-between flex-shrink-0 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-green-400">
                {formatDuration(routeData.duration, transportMode, routeData.distance)}
              </span>
              <span className="text-gray-400 text-xs font-medium flex items-center gap-1">
                <Navigation2 className="w-3 h-3 text-orange-500 fill-orange-500" />
                {formatDistance(routeData.distance)}
              </span>
            </div>
            
            {!isRouting ? (
              <button 
                onClick={() => setIsRouting(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded-full font-bold text-xs transition-all shadow-lg active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Navigation2 className="w-3 h-3 fill-current" />
                Start
              </button>
            ) : (
              <button 
                onClick={() => setIsRouting(false)}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer border border-red-500/30"
              >
                Stop
              </button>
            )}
          </div>
        )}

        {/* ── Header Area ── */}
        <div className="bg-orange-600 px-5 pt-8 pb-5 flex-shrink-0 text-white shadow-md relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1.5 bg-orange-700/50 rounded-full text-white hover:bg-orange-700 transition-colors cursor-pointer hidden md:flex"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
              <div className="flex-1 bg-orange-700/40 rounded-lg px-3 py-1.5 text-xs text-orange-100 truncate">
                Lokasi Anda
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-3.5 h-3.5 text-orange-300 flex-shrink-0" fill="currentColor" />
              <div className="flex-1 bg-orange-700/40 rounded-lg px-3 py-1.5 text-xs text-white font-medium truncate">
                {selectedPlace.name}
              </div>
            </div>
          </div>

          {/* ── Transport Modes ── */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setTransportMode('driving')}
              className={`flex-1 py-1.5 flex justify-center items-center rounded-lg transition-colors cursor-pointer ${transportMode === 'driving' ? 'bg-white text-orange-600 shadow-sm' : 'text-orange-100 hover:bg-orange-500/50'}`}
            >
              <Car className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTransportMode('bike')}
              className={`flex-1 py-1.5 flex justify-center items-center rounded-lg transition-colors cursor-pointer ${transportMode === 'bike' ? 'bg-white text-orange-600 shadow-sm' : 'text-orange-100 hover:bg-orange-500/50'}`}
            >
              <Bike className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTransportMode('foot')}
              className={`flex-1 py-1.5 flex justify-center items-center rounded-lg transition-colors cursor-pointer ${transportMode === 'foot' ? 'bg-white text-orange-600 shadow-sm' : 'text-orange-100 hover:bg-orange-500/50'}`}
            >
              <Footprints className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Body Content ── */}
        <div className={`p-4 space-y-4 bg-gray-900 ${isMobile ? '' : 'flex-1 overflow-y-auto'}`}>
          {isLoading ? (
             <div className="bg-gray-800 rounded-xl p-5 flex flex-col gap-3 animate-pulse border border-gray-700">
               <div className="h-4 w-1/3 bg-gray-700 rounded-md"></div>
               <div className="h-3 w-1/4 bg-gray-700 rounded-md"></div>
             </div>
          ) : routeError ? (
             <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex items-center gap-3">
               <div className="w-2 h-2 bg-red-500 rounded-full" />
               {routeError}
             </div>
          ) : routeData ? (
             <div className="space-y-4">
               {isRouting && (
                 <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="text-gray-400">ETA (Estimasi Kedatangan)</span>
                      <span className="text-white font-bold">{getETA(routeData.duration)}</span>
                    </div>
                    <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden mb-4">
                      <div className="bg-orange-500 h-full w-1/3 animate-pulse" />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-500/20">
                        <Navigation2 className="w-4 h-4 fill-current animate-bounce" />
                      </div>
                      <div>
                        <p className="text-[10px] text-blue-300 font-medium uppercase tracking-wider">Navigasi Aktif</p>
                        <p className="text-xs text-white font-bold leading-tight">Menuju {selectedPlace.name}</p>
                      </div>
                    </div>
                 </div>
               )}

               {!isRouting && (
                  <div className="text-gray-500 text-xs text-center py-4 opacity-60">
                    Klik "Start" untuk memulai navigasi real-time.
                  </div>
               )}
             </div>
          ) : (
             <div className="text-gray-500 text-xs text-center py-10 opacity-60 italic">
               Pilih mode transportasi untuk melihat rute.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
