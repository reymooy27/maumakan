'use client';

import { usePlaces } from '@/hooks/usePlaces';
import { useMapStore } from '@/store/mapStore';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from 'react-leaflet';
import PlaceMarker from './PlaceMarker';
import L from 'leaflet';

// Fix Leaflet's default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icon for the user's current location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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

function LocationMarker() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const { setCenter } = useMapStore();
  const map = useMapEvents({});

  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      setCenter([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    });
  }, [map, setCenter]);

  return position === null ? null : (
    <Marker position={position} icon={userIcon}>
      <Popup>Lokasi Anda Saat Ini</Popup>
    </Marker>
  );
}

export default function MapView() {
  const { center, zoom } = useMapStore();
  const { places } = usePlaces();

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventHandler />
        <LocationMarker />
        {places.map((place) => (
          <PlaceMarker key={place.id} place={place} />
        ))}
      </MapContainer>
    </div>
  );
}
