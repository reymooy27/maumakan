'use client';

import { Marker } from 'react-map-gl/maplibre';
import { Place } from '@/types';
import { useMapStore } from '@/store/mapStore';
import { useSavedPlaces } from '@/hooks/useSavedPlaces';

// Colour per place type
const TYPE_COLORS: Record<string, string> = {
  restaurant: '#f97316',
  cafe: '#a78bfa',
  food_stall: '#34d399',
};

interface Props {
  place: Place;
  longitude: number;
  latitude: number;
}

export default function PlaceMarker({ place, longitude, latitude }: Props) {
  const { setSelectedPlace, hoveredPlaceId } = useMapStore();
  const { isSaved } = useSavedPlaces();
  const color = TYPE_COLORS[place.type] ?? '#f97316';
  const isHovered = hoveredPlaceId === place.id;
  const saved = isSaved(place.id);

  // Calculate if open now
  const now = new Date();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const witaMinutes = (utcMinutes + 8 * 60) % 1440;

  let isOpen = false;
  if (place.openTime <= place.closeTime) {
    isOpen = witaMinutes >= place.openTime && witaMinutes <= place.closeTime;
  } else {
    isOpen = witaMinutes >= place.openTime || witaMinutes <= place.closeTime;
  }

  return (
    <Marker longitude={longitude} latitude={latitude}>
      <div
        className="relative cursor-pointer"
        style={{ opacity: isOpen ? 1 : 0.4, zIndex: isHovered ? 1000 : 'auto' }}
        onClick={() => setSelectedPlace(place)}
      >
        <div
          className="relative w-9 h-9 transition-transform duration-200 ease-out"
          style={{
            transform: `rotate(-45deg) scale(${isHovered ? 1.2 : 1})`,
            filter: isHovered
              ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8))'
              : 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))',
          }}
        >
          <div
            className="w-full h-full border-[3px] border-white flex items-center justify-center"
            style={{
              background: color,
              borderRadius: '50% 50% 50% 0',
            }}
          >
            <div style={{ transform: 'rotate(45deg)', color: 'white', fontSize: '14px' }}>
              🍽
            </div>
          </div>
        </div>
        {saved && (
          <div className="absolute -top-2 -right-2 bg-white rounded-full w-[18px] h-[18px] flex items-center justify-center shadow-md text-red-500 text-xs z-10">
            ♥
          </div>
        )}
      </div>
    </Marker>
  );
}
