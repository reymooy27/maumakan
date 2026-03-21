'use client';

import { useMapStore } from '@/store/mapStore';
import { DollarSign, MapPin, Navigation, Star, X, Heart, Users, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import MenuList from './MenuList';
import { useSavedPlaces } from '@/hooks/useSavedPlaces';
import { useSession } from 'next-auth/react';

const PRICE_LABEL: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };
const TYPE_LABEL: Record<string, string> = {
  restaurant: '🍽 Restaurant',
  cafe: '☕ Cafe',
  food_stall: '🥡 Food Stall',
};

/* ── snap-point heights (vh) ─────────────────────────────── */
const SNAP_PEEK = 25;   // collapsed / peek  (% of viewport)
const SNAP_FULL = 50;   // default expanded (% of viewport)
const SNAP_MAX = 100;   // fully expanded     (% of viewport)
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
    const deltaY = startY.current - e.clientY;
    const deltaVh = (deltaY / window.innerHeight) * 100;
    const newHeight = Math.max(10, Math.min(SNAP_MAX, startHeight.current + deltaVh));
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
    } else if (sheetHeight < (SNAP_FULL + SNAP_MAX) / 2) {
      setSheetHeight(SNAP_FULL);
    } else {
      setSheetHeight(SNAP_MAX);
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
          md:hidden fixed bottom-0 left-0 right-0 z-[60]
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
          className="absolute top-4 right-4 z-20 p-2 bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-full text-white hover:text-orange-400 transition-all cursor-pointer shadow-xl"
        >
          <X className="w-5 h-5 shadow-sm" />
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
  const { isSaved, toggleSave } = useSavedPlaces();
  const { data: session } = useSession();

  // --- Lightbox state ---
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // --- Check-in state ---
  const [checkInCount, setCheckInCount] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);

  // --- Crowd state ---
  const [crowdStatus, setCrowdStatus] = useState('Unknown');
  const [crowdLoading, setCrowdLoading] = useState(false);

  // --- Photo carousel state ---
  const photoScrollRef = useRef<HTMLDivElement>(null);
  const PLACEHOLDER_PHOTOS = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
    'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=400&q=80',
  ];

  useEffect(() => {
    // Fetch check-in and crowd data on mount
    fetch(`/api/places/${p.id}/checkin`).then(r => r.json()).then(data => {
      setCheckInCount(data.count ?? 0);
    }).catch(() => {});

    fetch(`/api/places/${p.id}/crowd`).then(r => r.json()).then(data => {
      setCrowdStatus(data.status ?? 'Unknown');
    }).catch(() => {});
  }, [p.id]);

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      const res = await fetch(`/api/places/${p.id}/checkin`, { method: 'POST' });
      if (res.ok) {
        setCheckedIn(true);
        setCheckInCount(c => c + 1);
      }
    } catch {}
    setCheckInLoading(false);
  };

  const handleCrowdVote = async (status: string) => {
    setCrowdLoading(true);
    try {
      const res = await fetch(`/api/places/${p.id}/crowd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setCrowdStatus(status);
      }
    } catch {}
    setCrowdLoading(false);
  };

  const handleGetDirections = () => {
    setDirectionSidebarOpen(true);
  };

  const saved = isSaved(p.id);

  const scrollPhotos = (dir: 'left' | 'right') => {
    photoScrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  const crowdColors: Record<string, string> = {
    Busy: 'text-red-400 bg-red-500/10 border-red-500/30',
    Normal: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    Quiet: 'text-green-400 bg-green-500/10 border-green-500/30',
    Unknown: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
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
            const isOpenStatus = openMin <= closeMin 
              ? (witaMin >= openMin && witaMin <= closeMin)
              : (witaMin >= openMin || witaMin <= closeMin);
            
            const formatTime = (min: number) => {
              const h = Math.floor(min / 60).toString().padStart(2, '0');
              const m = (min % 60).toString().padStart(2, '0');
              return `${h}:${m}`;
            };

            return (
              <>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isOpenStatus ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {isOpenStatus ? 'Open Now' : 'Closed'}
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
      <div className="pt-2 flex gap-3">
        <button
          onClick={handleGetDirections}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer shadow-lg"
        >
          <Navigation className="w-5 h-5" />
          Rute
        </button>
        <button
          onClick={() => toggleSave(p.id)}
          className={`flex items-center justify-center gap-2 font-semibold py-3 px-5 rounded-xl transition-all cursor-pointer border ${
            saved 
              ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 shadow-inner' 
              : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white shadow-lg'
          }`}
          title={saved ? "Hapus dari Tersimpan" : "Simpan Tempat"}
        >
          <Heart className={`w-5 h-5 ${saved ? 'fill-current text-red-500' : ''}`} />
          {saved ? 'Tersimpan' : 'Simpan'}
        </button>
      </div>

      {/* ── Social Section: Check-In + Crowd (Only visible if the place is currently open) ── */}
      {(() => {
        const openMin = p.openTime ?? 480;
        const closeMin = p.closeTime ?? 1320;
        const now = new Date();
        const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
        const witaMin = (utcMin + 8 * 60) % 1440;
        const isOpen = openMin <= closeMin 
          ? (witaMin >= openMin && witaMin <= closeMin)
          : (witaMin >= openMin || witaMin <= closeMin);

        if (!isOpen) return null;

        return (
          <div className="pt-1 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Check-In Button */}
            <button
              onClick={handleCheckIn}
              disabled={checkedIn || checkInLoading}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${
                checkedIn 
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                  : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-blue-500/50 hover:text-blue-400'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs font-semibold">
                {checkedIn ? "I'm Here! ✓" : "I'm Here"}
              </span>
              <span className="text-[10px] text-gray-500">
                {checkInCount} {checkInCount === 1 ? 'person' : 'people'} here now
              </span>
            </button>

            {/* Crowd Status */}
            <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border ${crowdColors[crowdStatus] || crowdColors.Unknown}`}>
              <Activity className="w-5 h-5" />
              <span className="text-xs font-semibold">
                {crowdStatus === 'Unknown' ? 'No reports' : crowdStatus}
              </span>
              <div className="flex gap-1.5 mt-1">
                {['Quiet', 'Normal', 'Busy'].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleCrowdVote(s)}
                    disabled={crowdLoading}
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all cursor-pointer ${
                      crowdStatus === s
                        ? 'bg-white/10 border-current'
                        : 'border-gray-600 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Photo Gallery ── */}
      <div className="pt-2">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
          Photos
        </h2>
        <div className="relative group">
          <button
            onClick={() => scrollPhotos('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div
            ref={photoScrollRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {PLACEHOLDER_PHOTOS.map((url, i) => (
              <div
                key={i}
                onClick={() => setSelectedPhoto(url)}
                className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden bg-gray-800 snap-start relative group/photo cursor-pointer"
              >
                <img
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/photo:scale-110"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => scrollPhotos('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- Fullscreen Lightbox Modal (using Portal) --- */}
      {selectedPhoto && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in zoom-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <button 
            className="absolute top-10 right-8 z-[1001] p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPhoto(null);
            }}
          >
            <X className="w-8 h-8" />
          </button>
          
          <div 
            className="relative w-screen h-screen flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full max-w-6xl max-h-[90vh]">
              <Image 
                src={selectedPhoto} 
                alt="Fullscreen view" 
                fill 
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>,
        document.body
      )}

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
