'use client';

import Image from 'next/image';
import { X, Star, MapPin, DollarSign } from 'lucide-react';
import { useMapStore } from '@/store/mapStore';
import MenuList from './MenuList';

const PRICE_LABEL: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };
const TYPE_LABEL: Record<string, string> = {
  restaurant: '🍽 Restaurant',
  cafe: '☕ Cafe',
  food_stall: '🥡 Food Stall',
};

export default function PlaceSidebar() {
  const { selectedPlace, setSelectedPlace } = useMapStore();

  if (!selectedPlace) return null;

  const p = selectedPlace;

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className="fixed inset-0 bg-black/30 z-30 md:hidden"
        onClick={() => setSelectedPlace(null)}
      />

      {/* Sidebar */}
      <aside className="
        fixed top-0 right-0 h-full w-full max-w-sm z-40
        bg-gray-900/98 backdrop-blur-lg border-l border-gray-800
        flex flex-col overflow-hidden
        animate-in slide-in-from-right duration-300
      ">
        {/* Close */}
        <button
          onClick={() => setSelectedPlace(null)}
          className="absolute top-4 right-4 z-10 p-1.5 bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
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

        {/* Content */}
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
                <span className="text-sm font-semibold">{PRICE_LABEL[p.priceRange] ?? '?'}</span>
              </div>

              {/* Distance */}
              {p.distance != null && (
                <div className="flex items-center gap-1 text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{p.distance.toFixed(1)} km away</span>
                </div>
              )}
            </div>

            {p.address && (
              <p className="text-sm text-gray-500 mt-2 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {p.address}
              </p>
            )}
          </div>

          {/* Menu */}
          <div>
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
      </aside>
    </>
  );
}
