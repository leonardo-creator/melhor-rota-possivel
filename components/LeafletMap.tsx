'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default marker icons in Next.js/Leaflet
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LeafletMapProps {
  markers?: {
    lat: number;
    lng: number;
    title: string;
    description?: string;
  }[];
  route?: [number, number][]; // Array of [lat, lng]
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function LeafletMap({ markers = [], route = [] }: LeafletMapProps) {
  // Default center (Brazil) if no markers
  const defaultCenter: [number, number] = [-14.2350, -51.9253];
  const center = markers.length > 0 ? [markers[0].lat, markers[0].lng] : defaultCenter;
  const zoom = markers.length > 0 ? 12 : 4;

  return (
    <div className="h-full w-full relative z-0">
       <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        className="h-full w-full rounded-lg shadow-inner"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapUpdater center={center} />

        {markers.map((marker, index) => (
          <Marker key={index} position={[marker.lat, marker.lng]}>
            <Popup>
              <strong>{marker.title}</strong>
              {marker.description && <p>{marker.description}</p>}
            </Popup>
          </Marker>
        ))}

        {route.length > 0 && (
          <Polyline 
            positions={route} 
            pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.7 }} 
          />
        )}
      </MapContainer>
    </div>
  );
}
