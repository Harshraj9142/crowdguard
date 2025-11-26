import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../store';
import { MOCK_INCIDENTS } from '../constants';

// Fix for default marker icon in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

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
  const { theme } = useStore();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [otherUsers, setOtherUsers] = useState<Record<string, { latitude: number; longitude: number }>>({});
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to backend
    const newSocket = io('http://localhost:3001');
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

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by your browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);

        if (socket) {
          socket.emit('updateLocation', { latitude, longitude });
        }
      },
      (err) => {
        console.error('Error getting location', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [socket]);

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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={theme === 'dark'
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          }
        />

        <LocationMarker position={position} />

        {/* Render other users */}
        {Object.entries(otherUsers).map(([id, loc]) => (
          <Marker key={id} position={[loc.latitude, loc.longitude]}>
            <Popup>User: {id.slice(0, 5)}</Popup>
          </Marker>
        ))}

        {/* Render Incidents */}
        {MOCK_INCIDENTS.map((incident) => (
          <Marker key={incident.id} position={[incident.latitude, incident.longitude]}>
            <Popup>
              <strong>{incident.type}</strong><br />
              {incident.description}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
