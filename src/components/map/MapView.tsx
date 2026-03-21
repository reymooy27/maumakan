'use client';

import { usePlaces } from '@/hooks/usePlaces';
import { useMapStore } from '@/store/mapStore';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import PlaceMarker from './PlaceMarker';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';

// Fix Leaflet's default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// HTML Div Icon for Heartbeat Animation
const pulsingIcon = L.divIcon({
  className: 'custom-pulsing-icon',
  html: `
    <div class="relative flex justify-center items-center w-6 h-6">
      <div class="absolute w-full h-full bg-blue-500 rounded-full animate-ping opacity-75"></div>
      <div class="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
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
  const { setCenter, userLocation, setUserLocation } = useMapStore();
  const map = useMapEvents({});

  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      setUserLocation([e.latlng.lat, e.latlng.lng]);
      setCenter([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    });
  }, [map, setCenter, setUserLocation]);

  return userLocation === null ? null : (
    <Marker position={userLocation} icon={pulsingIcon}>
      <Popup>Lokasi Anda Saat Ini</Popup>
    </Marker>
  );
}

// Custom control component that sits outside the React-Leaflet Map context
// but uses the map instance
function LocateControl({ position }: { position: [number, number] | null }) {
  const map = useMap();
  
  return (
    <div className="leaflet-bottom leaflet-right mb-6 mr-4 z-[1000] absolute bottom-0 right-0">
      <div className="leaflet-control leaflet-bar">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (position) {
              map.flyTo(position, 15, { animate: true, duration: 1 });
            } else {
              map.locate();
            }
          }}
          className="bg-white hover:bg-gray-100 text-blue-600 w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-colors"
          title="Ke Lokasi Saya"
        >
          <LocateFixed size={24} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// Auto fit bounds to route when a route is drawn
function RouteFitter({ geometry }: { geometry: [number, number][] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (geometry && geometry.length > 0) {
      const bounds = L.latLngBounds(geometry);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [geometry, map]);
  
  return null;
}

export default function MapView() {
  const { center, zoom, userLocation, routeGeometry } = useMapStore();
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
        
        {/* Draw Route Polyline if present */}
        {routeGeometry && routeGeometry.length > 0 && (
          <Polyline 
            positions={routeGeometry} 
            pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.7, dashArray: '10, 10', lineJoin: 'round' }} 
          />
        )}
        
        {/* Auto fit map bounds when a route is drawn */}
        <RouteFitter geometry={routeGeometry} />

        {places.map((place) => (
          <PlaceMarker key={place.id} place={place} />
        ))}
        
        {/* Custom Recenter Button mapped to Leaflet controls */}
        <LocateControl position={userLocation} />
      </MapContainer>
    </div>
  );
}
