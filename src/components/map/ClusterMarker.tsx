'use client';

import { Marker } from 'react-map-gl/maplibre';

interface Props {
  longitude: number;
  latitude: number;
  pointCount: number;
  onClick: () => void;
}

function getClusterSize(count: number) {
  if (count >= 100) return 'w-14 h-14 text-lg';
  if (count >= 10) return 'w-12 h-12 text-base';
  return 'w-10 h-10 text-sm';
}

export default function ClusterMarker({ longitude, latitude, pointCount, onClick }: Props) {
  return (
    <Marker longitude={longitude} latitude={latitude}>
      <button
        onClick={onClick}
        className={`
          ${getClusterSize(pointCount)}
          rounded-full bg-orange-600 border-2 border-white text-white font-bold
          shadow-lg flex items-center justify-center cursor-pointer
          hover:bg-orange-700 hover:scale-110 transition-all duration-200
        `}
      >
        {pointCount}
      </button>
    </Marker>
  );
}
