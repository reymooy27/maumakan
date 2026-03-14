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

function createIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 36px; height: 36px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
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
  const { setSelectedPlace } = useMapStore();
  const color = TYPE_COLORS[place.type] ?? '#f97316';

  return (
    <Marker
      position={[place.lat, place.lng]}
      icon={createIcon(color)}
      eventHandlers={{ click: () => setSelectedPlace(place) }}
    >
      <Popup>
        <div className="text-sm font-semibold">{place.name}</div>
        <div className="text-xs text-gray-500 capitalize">{place.type.replace('_', ' ')}</div>
      </Popup>
    </Marker>
  );
}
