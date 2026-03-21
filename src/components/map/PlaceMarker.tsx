'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Place } from '@/types';
import { useMapStore } from '@/store/mapStore';

// Colour per place type
const TYPE_COLORS: Record<string, string> = {
  restaurant: '#f97316',
  cafe: '#a78bfa',
  food_stall: '#34d399',
};

function createIcon(color: string, isHovered: boolean = false) {
  const hoverStyles = isHovered 
    ? 'box-shadow: 0 0 20px 8px rgba(255, 255, 255, 0.8), 0 4px 12px rgba(0,0,0,0.4); transform: rotate(-45deg) scale(1.2); z-index: 1000;' 
    : 'box-shadow: 0 4px 12px rgba(0,0,0,0.4); transform: rotate(-45deg) scale(1);';

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 36px; height: 36px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transition: all 0.2s ease-out;
        ${hoverStyles}
        display:flex; align-items:center; justify-content:center;
      ">
        <div style="transform:rotate(45deg); color:white; font-size:14px;">🍽</div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

interface Props { place: Place; }

export default function PlaceMarker({ place }: Props) {
  const { setSelectedPlace, hoveredPlaceId } = useMapStore();
  const color = TYPE_COLORS[place.type] ?? '#f97316';
  const isHovered = hoveredPlaceId === place.id;

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
    <Marker
      position={[place.lat, place.lng]}
      icon={createIcon(color, isHovered)}
      opacity={isOpen ? 1 : 0.4}
      zIndexOffset={isHovered ? 1000 : 0}
      eventHandlers={{ click: () => setSelectedPlace(place) }}
    >
      <Popup autoPan={false}>
        <div className="flex flex-col gap-0.5">
          <div className="text-sm font-semibold flex items-center gap-1.5">
            {place.name}
            {!isOpen && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold">Closed</span>}
          </div>
          <div className="text-xs text-gray-400 capitalize">{place.type.replace('_', ' ')}</div>
        </div>
      </Popup>
    </Marker>
  );
}
