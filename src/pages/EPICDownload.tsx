import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { epicService, voterService } from '../services/api';
import OTPVerification from '../components/OTPVerification';

export default function EPICDownload() {
  const navigate = useNavigate();
  const [epicNumber, setEpicNumber] = useState('');
  const [voterId, setVoterId] = useState<number | null>(null);
  const [epicData, setEpicData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  useEffect(() => {
    // Try to get voter ID from localStorage or fetch first voter
    const fetchVoter = async () => {
      try {
        const response = await voterService.getAll(1, 1);
        if (response.data.voters?.length > 0) {
          const voter = response.data.voters[0];
          setVoterId(voter.voter_id);
          if (voter.epic_number) {
            setEpicNumber(voter.epic_number);
          }
        }
      } catch (e) {}
    };
    fetchVoter();
  }, []);

  const handleSearch = async () => {
    if (!epicNumber.trim()) {
      setError('Please enter EPIC number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await epicService.getDetails(epicNumber);
      setEpicData(response.data.data);
      setShowOTP(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'EPIC not found');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!otpVerified) {
      setShowOTP(true);
      return;
    }

    try {
      const response = await epicService.download(epicNumber);
      // In production, this would trigger PDF download
      // For now, show the data
      alert('EPIC download initiated! Check your downloads folder.');
      console.log('EPIC Data:', response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to download EPIC');
    }
  };

  return (
    <div className="min-h-screen bg-gray-light py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card mb-6">
          <h1 className="text-3xl font-heading font-bold text-gray-800 mb-2">Download e-EPIC Card</h1>
          <p className="text-gray-600 mb-6">Get your digital Electors Photo Identity Card</p>

          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={epicNumber}
              onChange={(e) => setEpicNumber(e.target.value.toUpperCase())}
              className="input-field flex-1"
              placeholder="Enter EPIC Number"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

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

