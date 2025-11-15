import { useState } from 'react';
import { pollingStationService } from '../services/api';
import PollingStationMap from '../components/PollingStationMap';

export default function PollingStationFinder() {
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [pollingStation, setPollingStation] = useState<any>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(true); // Show map by default
  const [mapFilters, setMapFilters] = useState<{ district?: string; state?: string }>({});

  // Popular states and districts for quick selection
  const popularStates = [
    'Uttar Pradesh', 'Maharashtra', 'Bihar', 'West Bengal', 'Madhya Pradesh',
    'Tamil Nadu', 'Rajasthan', 'Karnataka', 'Gujarat', 'Odisha',
    'Kerala', 'Jharkhand', 'Assam', 'Punjab', 'Chhattisgarh',
    'Haryana', 'Delhi', 'Jammu and Kashmir', 'Uttarakhand', 'Himachal Pradesh',
    'Tripura', 'Meghalaya', 'Manipur', 'Nagaland', 'Goa',
    'Arunachal Pradesh', 'Mizoram', 'Sikkim', 'Telangana', 'Andhra Pradesh'
  ];

  const handleSearch = async () => {
    if (!district || !state) {
      setError('Please enter district and state');
      return;
    }

    setLoading(true);
    setError('');
    setPollingStation(null);
    setAlternatives([]);

    try {
      const response = await pollingStationService.findNearest(district, state, pinCode);
      
      if (response.data.success && response.data.data) {
        setPollingStation(response.data.data);
        setMapFilters({ district, state });
        if (response.data.alternatives && response.data.alternatives.length > 0) {
          setAlternatives(response.data.alternatives);
        }
      } else {
        setError('No polling station found. Please check your district and state names.');
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError(err.response?.data?.error || 'No polling station found for this location.');
      } else {
        setError(err.response?.data?.error || 'Error finding polling station. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-light py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-800 mb-2">Find Polling Station</h1>
              <p className="text-gray-600">Locate your nearest polling booth by entering your location details</p>
            </div>
            <button
              onClick={() => setShowMap(!showMap)}
              className="bg-primary-navy text-white px-6 py-2 rounded-lg hover:bg-primary-royal transition font-medium shadow-md"
            >
              {showMap ? '📋 Hide Map' : '🗺️ View All Stations on Map'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select State</option>
                {popularStates.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District *
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="input-field"
                placeholder="Enter your district name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN Code (Optional)
              </label>
              <input
                type="text"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input-field"
                placeholder="6-digit PIN code"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleSearch}
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                  Searching...
                </span>
              ) : (
                '🔍 Find Polling Station'
              )}
            </button>
          </div>
        </div>

        {/* Interactive Map Section */}
        {showMap && (
          <div className="card mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🗺️ Interactive Map - All Polling Stations</h2>
            <p className="text-gray-600 mb-4">Click on any pin to see station details. Zoom in/out to explore.</p>
            <PollingStationMap
              selectedStation={pollingStation}
              onStationSelect={(station) => {
                setPollingStation(station);
                setShowMap(false);
              }}
              filters={mapFilters}
            />
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>💡 Tip:</strong> Click on any green pin to view station details. Selected stations appear in red.
                Use the zoom controls or scroll to explore different areas of India.
              </p>
            </div>
          </div>
        )}

        {pollingStation && (
          <>
            <div className="card mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📍 Your Polling Station</h2>
              
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-6 shadow-lg">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{pollingStation.station_name}</h3>
                  <p className="text-gray-700 mb-4">{pollingStation.address}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">District</p>
                    <p className="font-semibold text-gray-800">{pollingStation.district}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">State</p>
                    <p className="font-semibold text-gray-800">{pollingStation.state}</p>
                  </div>
                  {pollingStation.pin_code && (
                    <div>
                      <p className="text-sm text-gray-600">PIN Code</p>
                      <p className="font-semibold text-gray-800">{pollingStation.pin_code}</p>
                    </div>
                  )}
                  {pollingStation.capacity && (
                    <div>
                      <p className="text-sm text-gray-600">Capacity</p>
                      <p className="font-semibold text-gray-800">{pollingStation.capacity} voters</p>
                    </div>
                  )}
                  {pollingStation.station_code && (
                    <div>
                      <p className="text-sm text-gray-600">Station Code</p>
                      <p className="font-semibold text-gray-800">{pollingStation.station_code}</p>
                    </div>
                  )}
                </div>

                {pollingStation.latitude && pollingStation.longitude && (
                  <button
                    onClick={() => openGoogleMaps(pollingStation.latitude, pollingStation.longitude)}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-md"
                  >
                    🗺️ View on Google Maps
                  </button>
                )}
              </div>
            </div>

            {alternatives.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Other Nearby Stations</h2>
                <div className="space-y-4">
                  {alternatives.map((alt: any) => (
                    <div key={alt.station_id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-navy transition">
                      <h3 className="font-semibold text-gray-800 mb-2">{alt.station_name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{alt.address}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">{alt.district}, {alt.state}</p>
                        {alt.latitude && alt.longitude && (
                          <button
                            onClick={() => openGoogleMaps(alt.latitude, alt.longitude)}
                            className="text-primary-navy hover:underline text-sm"
                          >
                            View Map →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Help Section */}
        <div className="card mt-6 bg-blue-50 border-2 border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-2">💡 Tips for Finding Your Station</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Enter the exact district name as it appears on official documents</li>
            <li>PIN code helps find the most accurate station</li>
            <li>If no results, try variations of the district name</li>
            <li>Contact your local election office if you still can't find your station</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

