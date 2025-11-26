import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useStore } from '../store';
import { MOCK_INCIDENTS } from '../constants';
import { MapPin, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

// NOTE: Ideally, this comes from an env variable.
// Using a placeholder; if it fails, we fall back to simulated map.
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''; 

const MapComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { theme } = useStore();
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!TOKEN) {
      setMapError(true);
      return;
    }

    try {
      mapboxgl.accessToken = TOKEN;
      if (map.current || !mapContainer.current) return;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
        center: [-74.0060, 40.7128], // NYC
        zoom: 12,
        attributionControl: false
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('error', () => {
         setMapError(true);
      });

      // Add markers
      MOCK_INCIDENTS.forEach((incident) => {
        const el = document.createElement('div');
        el.className = 'w-6 h-6 bg-safety rounded-full border-2 border-white cursor-pointer shadow-lg animate-pulse';
        el.addEventListener('click', () => {
            window.alert(`Incident: ${incident.type}\n${incident.description}`);
        });

        new mapboxgl.Marker(el)
          .setLngLat([incident.longitude, incident.latitude])
          .addTo(map.current!);
      });

    } catch (e) {
      console.error("Map load error", e);
      setMapError(true);
    }

    return () => {
      // Cleanup handled by mapbox usually, but good practice
    };
  }, [theme]);

  // Update style dynamically
  useEffect(() => {
    if (!map.current) return;
    map.current.setStyle(theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11');
  }, [theme]);

  if (mapError || !TOKEN) {
    return <SimulatedMap />;
  }

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden shadow-inner">
       <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

// Fallback for when no token is provided
const SimulatedMap = () => {
  const { theme } = useStore();
  
  return (
    <div className={`w-full h-full relative overflow-hidden ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'}`}>
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-10" 
           style={{ 
             backgroundImage: `radial-gradient(${theme === 'dark' ? '#ffffff' : '#000000'} 1px, transparent 1px)`, 
             backgroundSize: '20px 20px' 
           }} 
      />
      
      {/* Mock Map Shapes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" stroke={theme === 'dark' ? '#334155' : '#cbd5e1'}>
         <path d="M0 100 Q 250 50 500 150 T 1000 100" fill="none" strokeWidth="2" />
         <path d="M100 0 Q 150 250 50 500" fill="none" strokeWidth="2" />
         <path d="M600 0 L 650 600" fill="none" strokeWidth="2" />
      </svg>

      {/* Markers */}
      {MOCK_INCIDENTS.map((inc) => (
        <motion.div
            key={inc.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.2 }}
            className="absolute cursor-pointer group"
            style={{ 
                // Simple random positioning for the simulation based on coords
                left: `${(Math.abs(inc.longitude) % 0.1) * 1000}%`, 
                top: `${(Math.abs(inc.latitude) % 0.1) * 1000}%` 
            }}
        >
            <div className="relative">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-safety-500 opacity-75"></span>
                <div className={`relative inline-flex rounded-full p-2 ${inc.type === 'theft' ? 'bg-alert-500' : 'bg-safety-500'} text-white shadow-lg`}>
                    <MapPin size={16} />
                </div>
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-32 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg z-10 text-center border">
                <p className="font-bold capitalize">{inc.type}</p>
                <p className="opacity-75">{inc.description}</p>
            </div>
        </motion.div>
      ))}

      <div className="absolute top-4 right-4 bg-background/80 backdrop-blur p-2 rounded text-xs text-muted-foreground border">
        <AlertTriangle className="inline w-3 h-3 mr-1" />
        Simulated Map View (No Token)
      </div>
    </div>
  );
}

export default MapComponent;
