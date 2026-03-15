'use client';

import { usePlaces } from '@/hooks/usePlaces';
import { useMapStore } from '@/store/mapStore';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import PlaceMarker from './PlaceMarker';

function MapEventHandler() {
  const { setBounds, setCenter, setZoom } = useMapStore();

  useMapEvents({
    moveend(e) {
      const map = e.target;
      const b = map.getBounds();
      setBounds({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
      const c = map.getCenter();
      setCenter([c.lat, c.lng]);
      setZoom(map.getZoom());
    },
  });

  return null;
}

export default function MapView() {
  const { center, zoom } = useMapStore();
  const { places } = usePlaces();

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEventHandler />
      {places.map((place) => (
        <PlaceMarker key={place.id} place={place} />
      ))}
    </MapContainer>
  );
}
