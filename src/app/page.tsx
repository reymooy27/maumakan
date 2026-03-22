'use client';

import dynamic from 'next/dynamic';
import Navbar from '@/components/layout/Navbar';
import PlaceSidebar from '@/components/place/PlaceSidebar';
import DirectionSidebar from '@/components/place/DirectionSidebar';
import SearchSidebar from '@/components/search/SearchSidebar';

// Leaflet needs to be loaded client-side only
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading map…</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  return (
    <main className="fixed inset-0 w-full h-[100dvh] overflow-hidden overscroll-none">
      {/* Map sits at the very bottom of the stacking order */}
      <div className="absolute inset-0 z-0">
        <MapView />
      </div>
      {/* Navbar floats above the map */}
      <div className="relative z-50">
        <Navbar />
      </div>
      {/* Sidebars float above everything */}
      <PlaceSidebar />
      <DirectionSidebar />
      <SearchSidebar />
    </main>
  );
}
