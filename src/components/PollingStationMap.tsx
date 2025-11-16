import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { pollingStationService } from '../services/api';

// Fix for default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PollingStation {
  station_id: number;
  station_name: string;
  address: string;
  district: string;
  state: string;
  pin_code?: string;
  latitude: number;
  longitude: number;
  capacity?: number;
  station_code?: string;
}

interface PollingStationMapProps {
  selectedStation?: PollingStation | null;
  onStationSelect?: (station: PollingStation) => void;
  filters?: {
    district?: string;
    state?: string;
  };
}

// Component to handle map view updates
function MapViewUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function PollingStationMap({ selectedStation, onStationSelect, filters }: PollingStationMapProps) {
  const [stations, setStations] = useState<PollingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // Center of India
  const [mapZoom, setMapZoom] = useState(5);

  useEffect(() => {
    fetchStations();
  }, [filters]);

  useEffect(() => {
    if (selectedStation && selectedStation.latitude && selectedStation.longitude) {
      setMapCenter([parseFloat(selectedStation.latitude.toString()), parseFloat(selectedStation.longitude.toString())]);
      setMapZoom(13);
    }
  }, [selectedStation]);

  const fetchStations = async () => {
    try {
      const response = await pollingStationService.getAll(filters || {}, 1, 2000);
      // API returns: { success: true, stations: [...], pagination: {...} }
      const allStations = response.data?.stations || [];
      
      // Filter stations with valid coordinates
      const validStations = allStations.filter((s: any) => 
        s.latitude && s.longitude && 
        !isNaN(parseFloat(s.latitude.toString())) && 
        !isNaN(parseFloat(s.longitude.toString()))
      );
      
      setStations(validStations);
      
      // If we have stations, center map on first one or average
      if (validStations.length > 0) {
        const avgLat = validStations.reduce((sum: number, s: any) => sum + parseFloat(s.latitude.toString()), 0) / validStations.length;
        const avgLng = validStations.reduce((sum: number, s: any) => sum + parseFloat(s.longitude.toString()), 0) / validStations.length;
        setMapCenter([avgLat, avgLng]);
        setMapZoom(validStations.length === 1 ? 13 : validStations.length < 5 ? 8 : 6);
      }
    } catch (error) {
      console.error('Failed to fetch polling stations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Custom marker icon
  const createCustomIcon = (isSelected: boolean) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${isSelected ? '#ef4444' : '#10b981'};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 18px;
          text-align: center;
          line-height: 26px;
        ">📍</div>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border-2 border-gray-300 shadow-lg relative">
      {/* Map Legend */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3 border border-gray-200">
        <h4 className="font-semibold text-sm text-gray-800 mb-2">Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
            <span className="text-gray-600">Polling Station</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
            <span className="text-gray-600">Selected Station</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">Total: {stations.length} stations</p>
        </div>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <MapViewUpdater center={mapCenter} zoom={mapZoom} />
        
        {/* OpenStreetMap tiles - works well for India */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Render all polling stations as markers */}
        {stations.map((station) => {
          const lat = parseFloat(station.latitude.toString());
          const lng = parseFloat(station.longitude.toString());
          const isSelected = selectedStation?.station_id === station.station_id;

          return (
            <Marker
              key={station.station_id}
              position={[lat, lng]}
              icon={createCustomIcon(isSelected)}
              eventHandlers={{
                click: () => {
                  if (onStationSelect) {
                    onStationSelect(station);
                  }
                  setMapCenter([lat, lng]);
                  setMapZoom(15);
                },
              }}
            >
              <Popup>
                <div className="p-3 min-w-[250px]">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{station.station_name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{station.address}</p>
                  <div className="space-y-1 text-xs text-gray-600 mb-3">
                    <p><span className="font-semibold">District:</span> {station.district}</p>
                    <p><span className="font-semibold">State:</span> {station.state}</p>
                    {station.pin_code && (
                      <p><span className="font-semibold">PIN:</span> {station.pin_code}</p>
                    )}
                    {station.capacity && (
                      <p><span className="font-semibold">Capacity:</span> {station.capacity} voters</p>
                    )}
                    {station.station_code && (
                      <p><span className="font-semibold">Code:</span> {station.station_code}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const url = `https://www.google.com/maps?q=${lat},${lng}`;
                        window.open(url, '_blank');
                      }}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition font-medium"
                    >
                      🗺️ Google Maps
                    </button>
                    {onStationSelect && (
                      <button
                        onClick={() => {
                          onStationSelect(station);
                        }}
                        className="flex-1 bg-primary-navy text-white px-3 py-2 rounded text-sm hover:bg-primary-royal transition font-medium"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

