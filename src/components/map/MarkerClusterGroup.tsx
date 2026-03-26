'use client';

import { createPathComponent, LeafletContextInterface } from '@react-leaflet/core';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { ReactNode } from 'react';

// Define the props for the MarkerClusterGroup component
interface MarkerClusterGroupProps {
  children: ReactNode;
  // Optional marker cluster options
  chunkedLoading?: boolean;
  showCoverageOnHover?: boolean;
  maxClusterRadius?: number;
  disableClusteringAtZoom?: number;
  spiderfyOnMaxZoom?: boolean;
}

// Create a custom Leaflet element for MarkerClusterGroup
const createMarkerClusterGroup = (props: MarkerClusterGroupProps, context: LeafletContextInterface) => {
  const clusterGroup = new L.MarkerClusterGroup({
    chunkedLoading: props.chunkedLoading ?? true,
    showCoverageOnHover: props.showCoverageOnHover ?? false,
    maxClusterRadius: props.maxClusterRadius ?? 60,
    disableClusteringAtZoom: props.disableClusteringAtZoom ?? 18,
    spiderfyOnMaxZoom: props.spiderfyOnMaxZoom ?? true,
    // Custom icon for the clusters to match the app theme
    iconCreateFunction: (cluster) => {
      const childCount = cluster.getChildCount();
      let sizeClass = 'w-10 h-10';
      let colorClass = 'bg-orange-500/80';
      
      if (childCount < 10) {
        sizeClass = 'w-10 h-10';
      } else if (childCount < 50) {
        sizeClass = 'w-12 h-12';
        colorClass = 'bg-orange-600/90';
      } else {
        sizeClass = 'w-14 h-14';
        colorClass = 'bg-orange-700';
      }

      return L.divIcon({
        html: `
          <div class="${sizeClass} ${colorClass} rounded-full border-4 border-white/30 shadow-xl flex items-center justify-center text-white font-black text-sm backdrop-blur-sm transition-transform hover:scale-110">
            <span>${childCount}</span>
          </div>
        `,
        className: 'marker-cluster-custom',
        iconSize: L.point(40, 40),
      });
    }
  });

  return {
    instance: clusterGroup,
    context: { ...context, layerContainer: clusterGroup },
  };
};

// Use createPathComponent to wrap the Leaflet MarkerClusterGroup for react-leaflet
const MarkerClusterGroup = createPathComponent(createMarkerClusterGroup);

export default MarkerClusterGroup;
