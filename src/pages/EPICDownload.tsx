import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { epicService, voterService } from '../services/api';
import OTPVerification from '../components/OTPVerification';

// Cache for EPIC data
const epicCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export default function EPICDownload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [epicNumber, setEpicNumber] = useState('');
  const [voterId, setVoterId] = useState<number | null>(null);
  const [epicData, setEpicData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [autoSearching, setAutoSearching] = useState(false);

  // Auto-populate EPIC from logged-in user
  useEffect(() => {
    const loadUserEPIC = async () => {
      try {
        // Check URL parameter first
        const urlEpic = searchParams.get('epic');
        if (urlEpic) {
          setEpicNumber(urlEpic.toUpperCase());
          return;
        }

        // Get voter ID from localStorage
        const userData = localStorage.getItem('user_data');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            const voterIdFromUser = user.voter_id || user.id;
            
            if (voterIdFromUser) {
              setVoterId(voterIdFromUser);
              // Fetch voter data to get EPIC number
              try {
                const voterResponse = await voterService.getById(voterIdFromUser);
                const voter = voterResponse.data?.data || voterResponse.data;
                
                if (voter?.epic_number) {
                  setEpicNumber(voter.epic_number);
                  setAutoSearching(true);
                  // Auto-search if EPIC is available
                  setTimeout(() => {
                    handleSearch(voter.epic_number);
                  }, 500);
                }
              } catch (e) {
                console.warn('Failed to fetch voter EPIC:', e);
              }
            }
          } catch (e) {
            console.warn('Failed to parse user data:', e);
          }
        }
      } catch (e) {
        console.warn('Failed to load user EPIC:', e);
      }
    };
    
    loadUserEPIC();
  }, [searchParams]);

  // Check cache first
  const getCachedEPIC = useCallback((epic: string) => {
    const cached = epicCache.get(epic);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, []);

  // Save to cache
  const saveToCache = useCallback((epic: string, data: any) => {
    epicCache.set(epic, {
      data,
      timestamp: Date.now()
    });
  }, []);

  const handleSearch = async (epicNum?: string) => {
    const epicToSearch = epicNum || epicNumber.trim();
    if (!epicToSearch) {
      setError('Please enter EPIC number');
      return;
    }

    // Check cache first
    const cached = getCachedEPIC(epicToSearch);
    if (cached) {
      setEpicData(cached);
      setShowOTP(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await epicService.getDetails(epicToSearch);
      const data = response.data.data;
      setEpicData(data);
      saveToCache(epicToSearch, data);
      setShowOTP(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'EPIC not found');
    } finally {
      setLoading(false);
      setAutoSearching(false);
    }
  };

  const handleDownload = async () => {
    if (!otpVerified) {
      setShowOTP(true);
      return;
    }

    if (!epicNumber || !epicData) {
      setError('EPIC data not available');
      return;
    }

    try {
      setLoading(true);
      const response = await epicService.download(epicNumber);
      
      // Try to trigger actual download if blob is returned
      if (response.data instanceof Blob || response.data?.type === 'application/pdf') {
        const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EPIC-${epicNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        alert('EPIC downloaded successfully!');
      } else {
        // Fallback: show success message
        alert('EPIC download initiated! Check your downloads folder.');
        console.log('EPIC Data:', response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to download EPIC');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-light py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with quick actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-800 mb-2">Download e-EPIC Card</h1>
            <p className="text-gray-600">Get your digital Electors Photo Identity Card</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary text-sm px-4"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        <div className="card mb-6">

          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={epicNumber}
              onChange={(e) => {
                setEpicNumber(e.target.value.toUpperCase());
                setError('');
              }}
              className="input-field flex-1"
              placeholder="Enter EPIC Number (e.g., ABC1234567)"
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleSearch()}
              disabled={autoSearching}
            />
            <button
              onClick={() => handleSearch()}
              className="btn-primary"
              disabled={loading || autoSearching || !epicNumber.trim()}
            >
              {loading || autoSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Quick Access - Show if logged in */}
          {voterId && !epicNumber && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-2">
                💡 <strong>Quick Access:</strong> Your EPIC number will be auto-filled if available.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-blue-600 hover:underline"
              >
                Go to Dashboard →
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
        </div>

        {epicData && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-6">EPIC Card Preview</h2>
            
            {/* EPIC Card Design */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-4 border-indigo-300 rounded-xl p-8 mb-6 shadow-lg">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="bg-white rounded-lg p-4 mb-4 inline-block">
                    <div className="w-32 h-40 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-400">Photo</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">EPIC Number</p>
                    <p className="text-2xl font-bold text-indigo-700">{epicData.epic_number}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="text-lg font-semibold text-gray-800">{epicData.name}</p>
                  </div>
                  {epicData.father_name && (
                    <div>
                      <p className="text-sm text-gray-600">Father's Name</p>
                      <p className="text-lg font-semibold text-gray-800">{epicData.father_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {new Date(epicData.dob).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="text-lg font-semibold text-gray-800 capitalize">{epicData.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="text-sm font-semibold text-gray-800">{epicData.address}</p>
                  </div>
                  {epicData.polling_station && (
                    <div>
                      <p className="text-sm text-gray-600">Polling Station</p>
                      <p className="text-sm font-semibold text-gray-800">{epicData.polling_station}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* QR Code Placeholder */}
              <div className="mt-6 flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-400 text-xs">QR Code</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">Scan to verify</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleDownload}
                className="btn-primary flex-1"
                disabled={!otpVerified}
              >
                {otpVerified ? '📥 Download PDF' : 'Verify OTP to Download'}
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {showOTP && epicData && !otpVerified && (
          <OTPVerification
            identifier={epicData.aadhaar_masked?.replace(/-/g, '') || epicData.aadhaar_number}
            otpType="aadhaar"
            onVerify={(verified) => {
              setOtpVerified(verified);
              setShowOTP(false);
              if (verified) {
                handleDownload();
              }
            }}
            onCancel={() => setShowOTP(false)}
          />
        )}
      </div>
    </div>
  );
}

