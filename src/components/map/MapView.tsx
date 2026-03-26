'use client';

import { usePlaces } from '@/hooks/usePlaces';
import { useMapStore } from '@/store/mapStore';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import PlaceMarker from './PlaceMarker';
import MarkerClusterGroup from './MarkerClusterGroup';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';

// Fix Leaflet's default icon issue in React
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
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
  const setBounds = useMapStore((s) => s.setBounds);
  const setCenter = useMapStore((s) => s.setCenter);
  const setZoom = useMapStore((s) => s.setZoom);

  useMapEvents({
    moveend(e) {
      const map = e.target;
      const b = map.getBounds();
      
      // Update bounds for fetching
      // Rounding to 4 decimal places resolves infinite updates during micro-pans (autoPan)
      setBounds({
        north: Number(b.getNorth().toFixed(4)),
        south: Number(b.getSouth().toFixed(4)),
        east: Number(b.getEast().toFixed(4)),
        west: Number(b.getWest().toFixed(4)),
      });

      // Update center and zoom for overall app state
      const c = map.getCenter();
      setCenter([
        Math.round(c.lat * 1000000) / 1000000,
        Math.round(c.lng * 1000000) / 1000000
      ]);
      // zoom set is already rounded in store, but we can round here too
      setZoom(Math.round(map.getZoom() * 100) / 100);
    },
  });

  return null;
}

function ViewSync() {
  const map = useMap();
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);

  useEffect(() => {
    const mapCenter = map.getCenter();
    const isSameCenter = 
      Math.abs(mapCenter.lat - center[0]) < 0.0001 && 
      Math.abs(mapCenter.lng - center[1]) < 0.0001;
    const isSameZoom = Math.abs(map.getZoom() - zoom) < 0.1;

    if (!isSameCenter || !isSameZoom) {
      map.flyTo(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);

  return null;
}

function LocationMarker() {
  const userLocation = useMapStore((s) => s.userLocation);
  const setUserLocation = useMapStore((s) => s.setUserLocation);
  const setCenter = useMapStore((s) => s.setCenter);
  const map = useMap();

  useEffect(() => {
    // Only fetch location once on mount
    const onLocationFound = (e: L.LocationEvent) => {
      const coords: [number, number] = [e.latlng.lat, e.latlng.lng];
      setUserLocation(coords);
      setCenter(coords);
      map.flyTo(e.latlng, 15);
    };

    map.on("locationfound", onLocationFound);
    map.locate();

    return () => {
      map.off("locationfound", onLocationFound);
    };
  }, [map, setUserLocation, setCenter]);

  return userLocation === null ? null : (
    <Marker position={userLocation} icon={pulsingIcon}>
      <Popup autoPan={false}>Lokasi Anda Saat Ini</Popup>
    </Marker>
  );
}

// Custom control component that sits outside the React-Leaflet Map context
// but uses the map instance
function LocateControl({ position }: { position: [number, number] | null }) {
  const map = useMap();
  const selectedPlace = useMapStore((s) => s.selectedPlace);
  const filterPanelOpen = useMapStore((s) => s.filterPanelOpen);
  
  const isSidebarOpen = !!selectedPlace;
  const isFilterOpen = filterPanelOpen;
  
  return (
    <div 
      className={`
        leaflet-bottom leaflet-right mb-6 mr-4 z-[1000] absolute bottom-0 right-0 
        transition-all duration-300 ease-in-out
        ${isSidebarOpen 
          ? '-translate-y-[45vh] md:translate-y-0 md:-translate-x-[384px]' 
          : isFilterOpen 
            ? 'md:-translate-x-[320px]' 
            : 'translate-x-0 translate-y-0'}
      `}
    >
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
          disabled={!position}
          className="bg-white hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-blue-600 w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-colors"
          title="Ke Lokasi Saya"
        >
          <LocateFixed size={24} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// Auto fit bounds to route when a route is drawn or routing starts
function RouteFitter({ geometry, isRouting }: { geometry: [number, number][] | null, isRouting: boolean }) {
  const map = useMap();
  const prevIsRouting = useRef(false);
  
  useEffect(() => {
    if (geometry && geometry.length > 0) {
      const bounds = L.latLngBounds(geometry);
      
      if (isRouting) {
        // When routing starts, focus on the center of the direction line only once without animation
        if (!prevIsRouting.current) {
          map.setView(bounds.getCenter(), Math.max(map.getZoom(), 15), { animate: false });
        }
      } else {
        // Normal fit bounds when route is just previewed
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
    prevIsRouting.current = isRouting;
  }, [geometry, map, isRouting]);
  
  return null;
}

export default function MapView() {
  const routeGeometry = useMapStore((s) => s.routeGeometry);
  const isRouting = useMapStore((s) => s.isRouting);
  const userLocation = useMapStore((s) => s.userLocation);
  const { places } = usePlaces();

  // Create stable initial values. MapContainer only uses them on mount.
  // This prevents the common "snap back" issues in react-leaflet.
  const [initialView] = useState(() => ({
    center: useMapStore.getState().center,
    zoom: useMapStore.getState().zoom
  }));

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={initialView.center}
        zoom={initialView.zoom}
        minZoom={3}
        maxZoom={22}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          minZoom={3}
          maxZoom={22}
          maxNativeZoom={19}
        />
        <MapEventHandler />
        <ViewSync />
        <LocationMarker />
        
        {/* Draw Route Polyline if present */}
        {routeGeometry && routeGeometry.length > 0 && (
          <Polyline 
            positions={routeGeometry} 
            pathOptions={{ color: '#3b82f6', weight: 6, opacity: 0.9, lineJoin: 'round', lineCap: 'round' }} 
          />
        )}
        
        {/* Auto fit map bounds when a route is drawn or routing starts */}
        <RouteFitter geometry={routeGeometry} isRouting={isRouting} />

        <MarkerClusterGroup chunkedLoading={true} maxClusterRadius={50}>
          {places.map((place) => (
            <PlaceMarker key={place.id} place={place} />
          ))}
        </MarkerClusterGroup>
        
        <LocateControl position={userLocation} />
      </MapContainer>
    </div>
  );
}
