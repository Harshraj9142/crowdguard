import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../store';
import { Loader2, Navigation, AlertTriangle } from 'lucide-react';

// Fix for default marker icon in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// REPLACE WITH YOUR TOMTOM API KEY
const TOMTOM_API_KEY = 'TadNELv6Zo5VRjQYZLh6IiwcsFXqdp5d';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to update map center when user location changes
const LocationMarker = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  );
};

const MapComponent: React.FC = () => {
  const { theme, incidents, fetchIncidents, receiveIncident, addIncident, updateIncident, setUserLocation } = useStore();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [otherUsers, setOtherUsers] = useState<Record<string, { latitude: number; longitude: number }>>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial incidents
    fetchIncidents();

    // Connect to backend
    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

    newSocket.on('locationUpdate', (data: { id: string; latitude: number; longitude: number }) => {
      setOtherUsers((prev) => ({
        ...prev,
        [data.id]: { latitude: data.latitude, longitude: data.longitude }
      }));
    });

    newSocket.on('userDisconnected', (id: string) => {
      setOtherUsers((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    });

    newSocket.on('newIncident', (incident) => {
      console.log('New incident received:', incident);
      receiveIncident(incident);
    });

    newSocket.on('incidentUpdated', (incident) => {
      console.log('Incident updated:', incident);
      updateIncident(incident);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleLocate = () => {
    setLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLoadingLocation(false);
      return;
    }

    const success = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      setPosition([latitude, longitude]);
      setUserLocation([latitude, longitude]);
      setLoadingLocation(false);
      if (socket) {
        socket.emit('updateLocation', { latitude, longitude });
      }
    };

    const error = (err: GeolocationPositionError) => {
      console.error('Error getting location', err);
      let msg = 'Unable to retrieve your location';
      if (err.code === 1) msg = 'Location permission denied. Please allow access.';
      if (err.code === 2) msg = 'Location unavailable. Check GPS/Network.';
      if (err.code === 3) msg = 'Location request timed out.';

      setLocationError(msg);
      setLoadingLocation(false);
    };

    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(success, error, options);
  };

  useEffect(() => {
    handleLocate();

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          setUserLocation([latitude, longitude]);
          if (socket) {
            socket.emit('updateLocation', { latitude, longitude });
          }
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [socket]);

  const handleReportTestIncident = () => {
    if (!position) return;
    const types = ['theft', 'assault', 'harassment', 'accident', 'suspicious'] as const;
    const randomType = types[Math.floor(Math.random() * types.length)];

    addIncident({
      id: Date.now().toString(),
      type: randomType,
      latitude: position[0] + (Math.random() - 0.5) * 0.01,
      longitude: position[1] + (Math.random() - 0.5) * 0.01,
      description: `Reported ${randomType} near you`,
      timestamp: new Date().toISOString(),
      verified: false,
      reporterId: 'me',
      upvotes: 0
    });
  };

  // Default center (NYC) if no location yet
  const center: [number, number] = position || [40.7128, -74.0060];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.tomtom.com">TomTom</a>'
          url={`https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`}
        />

        <LocationMarker position={position} />

        {/* Render other users */}
        {Object.entries(otherUsers).map(([id, loc]: [string, { latitude: number; longitude: number }]) => (
          <Marker key={id} position={[loc.latitude, loc.longitude]}>
            <Popup>User: {id.slice(0, 5)}</Popup>
          </Marker>
        ))}

        {/* Render Incidents */}
        {incidents.filter(inc => useStore.getState().filters[inc.type]).map((incident) => (
          <Marker key={incident.id} position={[incident.latitude, incident.longitude]}>
            <Popup>
              <strong>{incident.type}</strong><br />
              {incident.description}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Controls */}
      <div className="absolute bottom-24 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleReportTestIncident}
          className="bg-red-600 text-white shadow-lg rounded-full p-3 hover:bg-red-700 transition-colors"
          title="Report Test Incident"
        >
          <AlertTriangle size={24} />
        </button>

        <button
          onClick={handleLocate}
          className="bg-background border border-input shadow-lg rounded-full p-3 hover:bg-muted transition-colors"
          title="Locate Me"
        >
          {loadingLocation ? (
            <Loader2 className="animate-spin text-primary" size={24} />
          ) : (
            <Navigation className={position ? "text-primary" : "text-muted-foreground"} size={24} />
          )}
        </button>
      </div>

      {locationError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-destructive text-destructive-foreground px-4 py-2 rounded shadow-lg text-sm">
          {locationError}
        </div>
      )}
    </div>
  );
};

export default MapComponent;
