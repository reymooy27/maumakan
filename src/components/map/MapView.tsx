"use client";

import { usePlaces } from "@/hooks/usePlaces";
import { useMapStore } from "@/store/mapStore";
import { Place } from "@/types";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Map,
  Marker,
  Source,
  Layer,
  useMap,
  NavigationControl,
} from "react-map-gl/maplibre";
import type { LineLayerSpecification } from "maplibre-gl";
import { LngLatBounds } from "maplibre-gl";
import Supercluster from "supercluster";
import type { PointFeature } from "supercluster";
import PlaceMarker from "./PlaceMarker";
import ClusterMarker from "./ClusterMarker";

const ROUTE_LAYER: LineLayerSpecification = {
  id: "route-line",
  type: "line",
  source: "route",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": "#3b82f6",
    "line-width": 6,
    "line-opacity": 0.9,
  },
};

function MapEventHandler() {
  const map = useMap();
  const setBounds = useMapStore((s) => s.setBounds);
  const setCenter = useMapStore((s) => s.setCenter);
  const setZoom = useMapStore((s) => s.setZoom);

  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const handleMoveEnd = () => {
      const c = m.getCenter();
      const b = m.getBounds();
      const z = m.getZoom();

      setBounds({
        north: Number(b.getNorth().toFixed(4)),
        south: Number(b.getSouth().toFixed(4)),
        east: Number(b.getEast().toFixed(4)),
        west: Number(b.getWest().toFixed(4)),
      });

      setCenter([
        Math.round(c.lat * 1000000) / 1000000,
        Math.round(c.lng * 1000000) / 1000000,
      ]);
      setZoom(Math.round(z * 100) / 100);
    };

    m.on("moveend", handleMoveEnd);
    return () => {
      m.off("moveend", handleMoveEnd);
    };
  }, [map, setBounds, setCenter, setZoom]);

  return null;
}

function ViewSync() {
  const map = useMap();
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);

  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const mapCenter = m.getCenter();
    const isSameCenter =
      Math.abs(mapCenter.lat - center[0]) < 0.0001 &&
      Math.abs(mapCenter.lng - center[1]) < 0.0001;
    const isSameZoom = Math.abs(m.getZoom() - zoom) < 0.1;

    if (!isSameCenter || !isSameZoom) {
      m.flyTo({ center: [center[1], center[0]], zoom, duration: 1000 });
    }
  }, [center, zoom, map]);

  return null;
}

function UserLocationMarker() {
  const userLocation = useMapStore((s) => s.userLocation);
  const setUserLocation = useMapStore((s) => s.setUserLocation);
  const setCenter = useMapStore((s) => s.setCenter);
  const map = useMap();

  useEffect(() => {
    const m = map.current;
    if (!m) return;

    if (!userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [
            pos.coords.latitude,
            pos.coords.longitude,
          ];
          setUserLocation(coords);
          setCenter(coords);
          m.flyTo({
            center: [coords[1], coords[0]],
            zoom: 15,
            duration: 1000,
          });
        },
        (err) => console.error("Geolocation error:", err),
      );
    }
  }, [map, userLocation, setUserLocation, setCenter]);

  if (!userLocation) return null;

  return (
    <Marker longitude={userLocation[1]} latitude={userLocation[0]}>
      <div
        className="relative flex justify-center items-center w-6 h-6"
        title="Lokasi Anda Saat Ini"
      >
        <div className="absolute w-full h-full bg-blue-500 rounded-full animate-ping opacity-75" />
        <div className="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg" />
      </div>
    </Marker>
  );
}

function LocateControl({
  position,
}: {
  position: [number, number] | null;
}) {
  const map = useMap();
  const selectedPlace = useMapStore((s) => s.selectedPlace);
  const filterPanelOpen = useMapStore((s) => s.filterPanelOpen);

  const isSidebarOpen = !!selectedPlace;
  const isFilterOpen = filterPanelOpen;

  return (
    <div
      className={`
        absolute bottom-6 right-4 z-[1000]
        transition-all duration-300 ease-in-out
        ${
          isSidebarOpen
            ? "-translate-y-[45vh] md:translate-y-0 md:-translate-x-[384px]"
            : isFilterOpen
              ? "md:-translate-x-[320px]"
              : "translate-x-0 translate-y-0"
        }
      `}
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const m = map.current;
          if (!m) return;
          if (position) {
            m.flyTo({
              center: [position[1], position[0]],
              zoom: 15,
              duration: 1000,
            });
          } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
              const coords: [number, number] = [
                pos.coords.latitude,
                pos.coords.longitude,
              ];
              m.flyTo({
                center: [coords[1], coords[0]],
                zoom: 15,
                duration: 1000,
              });
            });
          }
        }}
        disabled={!position && !navigator.geolocation}
        className="bg-white hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-blue-600 w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-colors"
        title="Ke Lokasi Saya"
      >
        <LocateFixed size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function RouteFitter({
  geometry,
  isRouting,
}: {
  geometry: [number, number][] | null;
  isRouting: boolean;
}) {
  const map = useMap();
  const prevIsRouting = useRef(false);

  useEffect(() => {
    const m = map.current;
    if (!m || !geometry || geometry.length === 0) return;

    const bounds = new LngLatBounds();
    geometry.forEach(([lat, lng]) => bounds.extend([lng, lat]));

    if (isRouting) {
      if (!prevIsRouting.current) {
        const center = bounds.getCenter();
        m.setCenter([center.lng, center.lat]);
        m.setZoom(Math.max(m.getZoom(), 15));
      }
    } else {
      m.fitBounds(bounds, { padding: 50, duration: 1000 });
    }

    prevIsRouting.current = isRouting;
  }, [geometry, map, isRouting]);

  return null;
}

function ClusteredMarkers({ places }: { places: Place[] }) {
  const map = useMap();
  const [clusters, setClusters] = useState<
    PointFeature<Record<string, unknown>>[]
  >([]);
  const superclusterRef = useRef<Supercluster | null>(null);

  // Initialize supercluster when places change
  useEffect(() => {
    const sc = new Supercluster({
      radius: 60,
      maxZoom: 16,
      minPoints: 2,
    });

    const points = places.map((p) => ({
      type: "Feature" as const,
      properties: { ...p, cluster: false, placeId: p.id },
      geometry: {
        type: "Point" as const,
        coordinates: [p.lng, p.lat],
      },
    }));

    sc.load(points);
    superclusterRef.current = sc;

    // Initial cluster computation (scheduled to avoid cascading renders)
    const m = map.current;
    if (m) {
      const id = requestAnimationFrame(() => {
        const bbox = m.getBounds();
        const zoom = Math.floor(m.getZoom());
        setClusters(
          sc.getClusters(
            [
              bbox.getWest(),
              bbox.getSouth(),
              bbox.getEast(),
              bbox.getNorth(),
            ],
            zoom,
          ),
        );
      });
      return () => cancelAnimationFrame(id);
    }
  }, [places, map]);

  // Update clusters on map move
  useEffect(() => {
    const m = map.current;
    if (!m || !superclusterRef.current) return;

    const handleMove = () => {
      const bbox = m.getBounds();
      const zoom = Math.floor(m.getZoom());
      setClusters(
        superclusterRef.current!.getClusters(
          [
            bbox.getWest(),
            bbox.getSouth(),
            bbox.getEast(),
            bbox.getNorth(),
          ],
          zoom,
        ),
      );
    };

    m.on("move", handleMove);
    return () => {
      m.off("move", handleMove);
    };
  }, [map]);

  return (
    <>
      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } =
          cluster.properties;

        if (isCluster) {
          return (
            <ClusterMarker
              key={`cluster-${cluster.id}`}
              longitude={lng}
              latitude={lat}
              pointCount={pointCount as number}
              onClick={() => {
                const expansionZoom =
                  superclusterRef.current!.getClusterExpansionZoom(
                    Number(cluster.id),
                  );
                map.current?.flyTo({
                  center: [lng, lat],
                  zoom: expansionZoom,
                  duration: 1000,
                });
              }}
            />
          );
        }

        const place = cluster.properties as unknown as Place;
        return (
          <PlaceMarker
            key={place.id}
            place={place}
            longitude={lng}
            latitude={lat}
          />
        );
      })}
    </>
  );
}

export default function MapView() {
  const routeGeometry = useMapStore((s) => s.routeGeometry);
  const isRouting = useMapStore((s) => s.isRouting);
  const userLocation = useMapStore((s) => s.userLocation);
  const { places } = usePlaces();

  // Create stable initial values. Map only uses them on mount.
  const [initialView] = useState(() => ({
    longitude: useMapStore.getState().center[1],
    latitude: useMapStore.getState().center[0],
    zoom: useMapStore.getState().zoom,
  }));

  const routeGeoJSON = useMemo(() => {
    if (!routeGeometry || routeGeometry.length === 0) return null;
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: routeGeometry.map(([lat, lng]) => [lng, lat]),
      },
    };
  }, [routeGeometry]);

  return (
    <div className="relative w-full h-full">
      <Map
        initialViewState={initialView}
        minZoom={3}
        maxZoom={22}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        dragRotate={true}
        touchZoomRotate={true}
      >
        <MapEventHandler />
        <ViewSync />
        <UserLocationMarker />

        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer {...ROUTE_LAYER} />
          </Source>
        )}

        <RouteFitter geometry={routeGeometry} isRouting={isRouting} />
        <ClusteredMarkers places={places} />
        <LocateControl position={userLocation} />

        <NavigationControl position="top-right" visualizePitch={true} />
      </Map>
    </div>
  );
}
