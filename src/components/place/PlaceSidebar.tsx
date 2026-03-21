'use client';

import { useMapStore } from '@/store/mapStore';
import { DollarSign, MapPin, Navigation, Star, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import MenuList from './MenuList';

const PRICE_LABEL: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };
const TYPE_LABEL: Record<string, string> = {
  restaurant: '🍽 Restaurant',
  cafe: '☕ Cafe',
  food_stall: '🥡 Food Stall',
};

/* ── snap-point heights (vh) ─────────────────────────────── */
const SNAP_PEEK = 25;   // collapsed / peek  (% of viewport)
const SNAP_FULL = 75;   // fully expanded     (% of viewport) - Fixed to 75% so user can still tap outside/close
const DISMISS_THRESHOLD = 20; // below this vh → close

export default function PlaceSidebar() {
  const { selectedPlace, setSelectedPlace } = useMapStore();

  /* ── bottom-sheet state (mobile) ──────────────────────── */
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(SNAP_FULL);
  const [sheetHeight, setSheetHeight] = useState(SNAP_FULL);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  /* ── open / close animation ───────────────────────────── */
  useEffect(() => {
    if (selectedPlace) {
      setSheetHeight(SNAP_FULL);
      // Small delay for enter animation
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [selectedPlace]);

  const close = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setSelectedPlace(null), 250);
  }, [setSelectedPlace]);

  /* ── drag handlers ────────────────────────────────────── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Don't capture drag if the user is scrolling inside content
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
    const deltaY = startY.current - e.clientY; // positive = drag up
    const deltaVh = (deltaY / window.innerHeight) * 100;
    const newHeight = Math.max(10, Math.min(SNAP_FULL, startHeight.current + deltaVh));
    setSheetHeight(newHeight);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);

    // Snap to nearest point or dismiss
    if (sheetHeight < DISMISS_THRESHOLD) {
      close();
    } else if (sheetHeight < (SNAP_PEEK + SNAP_FULL) / 2) {
      setSheetHeight(SNAP_PEEK);
    } else {
      setSheetHeight(SNAP_FULL);
    }
  }, [sheetHeight, close]);

  if (!selectedPlace || useMapStore.getState().directionSidebarOpen) return null;
  const p = selectedPlace;

  return (
    <>
      {/* ── Overlay (mobile only — keeps desktop map interactive) ── */}
      <div
        className={`fixed inset-0 z-30 bg-black/40 md:hidden transition-opacity duration-250
          ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={close}
      />

      {/* ── Desktop: right sidebar ───────────────────────── */}
      <aside
        className={`
          hidden md:flex fixed top-0 right-0 h-full w-full max-w-sm z-50
          bg-gray-900/98 backdrop-blur-lg border-l border-gray-800
          flex-col overflow-hidden
          transition-transform duration-300 ease-out
          ${isVisible ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <SidebarContent place={p} onClose={close} />
      </aside>

      {/* ── Mobile: bottom sheet ─────────────────────────── */}
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
          flex flex-col overflow-hidden touch-none
          ${isDragging ? '' : 'transition-[height] duration-300 ease-out'}
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
          transition-transform duration-300
        `}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 p-1.5 bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain"
          onTouchStart={(e) => {
            // Prevent sheet drag when scrolling inside content
            if (contentRef.current && contentRef.current.scrollTop > 0) {
              e.stopPropagation();
            }
          }}
        >
          <SheetContent place={p} />
        </div>
      </div>
    </>
  );
}

/* ───────────────────────────────────────────────────────────
   Desktop sidebar content (same as before)
   ─────────────────────────────────────────────────────────── */
function SidebarContent({ place: p, onClose }: { place: NonNullable<ReturnType<typeof useMapStore.getState>['selectedPlace']>; onClose: () => void }) {
  return (
    <>
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-1.5 bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Cover image */}
      <div className="relative h-48 bg-gray-800 flex-shrink-0">
        {p.imageUrl ? (
          <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {p.type === 'cafe' ? '☕' : p.type === 'food_stall' ? '🥡' : '🍽'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
      </div>

      <PlaceDetails place={p} />
    </>
  );
}

/* ───────────────────────────────────────────────────────────
   Mobile bottom-sheet content (no cover image, compact)
   ─────────────────────────────────────────────────────────── */
function SheetContent({ place: p }: { place: NonNullable<ReturnType<typeof useMapStore.getState>['selectedPlace']> }) {
  return (
    <>
      {/* Cover image (shorter on mobile) */}
      <div className="relative h-36 bg-gray-800 flex-shrink-0">
        {p.imageUrl ? (
          <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {p.type === 'cafe' ? '☕' : p.type === 'food_stall' ? '🥡' : '🍽'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
      </div>

      <PlaceDetails place={p} />
    </>
  );
}

/* ───────────────────────────────────────────────────────────
   Shared place detail section
   ─────────────────────────────────────────────────────────── */
function PlaceDetails({ place: p }: { place: NonNullable<ReturnType<typeof useMapStore.getState>['selectedPlace']> }) {
  const { setDirectionSidebarOpen } = useMapStore();

  const handleGetDirections = () => {
    setDirectionSidebarOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Header */}
      <div>
        <p className="text-xs text-orange-400 font-medium mb-1">
          {TYPE_LABEL[p.type] ?? p.type}
        </p>
        <h1 className="text-2xl font-bold text-white leading-tight">{p.name}</h1>

        <div className="flex flex-wrap gap-3 mt-3">
          {/* Rating */}
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-semibold">{p.rating.toFixed(1)}</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-1 text-emerald-400">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-semibold">
              Rp {p.avgPrice.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Distance */}
          {p.distance != null && (
            <div className="flex items-center gap-1 text-gray-400">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{p.distance.toFixed(1)} km</span>
            </div>
          )}
        </div>

        {/* Status and Hours */}
        <div className="mt-4 flex items-center gap-2">
          {(() => {
            const openMin = p.openTime ?? 480;
            const closeMin = p.closeTime ?? 1320;
            
            const now = new Date();
            const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
            const witaMin = (utcMin + 8 * 60) % 1440;
            const isOpen = openMin <= closeMin 
              ? (witaMin >= openMin && witaMin <= closeMin)
              : (witaMin >= openMin || witaMin <= closeMin);
            
            const formatTime = (min: number) => {
              const h = Math.floor(min / 60).toString().padStart(2, '0');
              const m = (min % 60).toString().padStart(2, '0');
              return `${h}:${m}`;
            };

            return (
              <>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isOpen ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {isOpen ? 'Open Now' : 'Closed'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTime(openMin)} – {formatTime(closeMin)}
                </span>
              </>
            );
          })()}
        </div>

        {p.address && (
          <p className="text-sm text-gray-500 mt-2 flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            {p.address}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-2">
        <button
          onClick={handleGetDirections}
          className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer"
        >
          <Navigation className="w-5 h-5" />
          Arahkan Rute (Directions)
        </button>
      </div>

      {/* Menu */}
      <div className="pt-2">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
          Menu
        </h2>
        {p.menuItems && p.menuItems.length > 0 ? (
          <MenuList items={p.menuItems} />
        ) : (
          <p className="text-sm text-gray-600 italic">No menu available yet.</p>
        )}
      </div>
    </div>
  );
}
