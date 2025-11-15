import { useState, useEffect } from 'react';
import { applicationService } from '../services/api';

export default function ApplicationTracking() {
  const [applicationId, setApplicationId] = useState('');
  const [application, setApplication] = useState<any>(null);
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!applicationId.trim()) {
      setError('Please enter an Application ID');
      return;
    }

    setLoading(true);
    setError('');
    setApplication(null);
    setTrackingHistory([]);

    try {
      const [appResponse, trackingResponse] = await Promise.all([
        applicationService.getApplication(applicationId),
        applicationService.getTrackingHistory(applicationId)
      ]);

      setApplication(appResponse.data.data);
      setTrackingHistory(trackingResponse.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Application not found');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      submitted: 'bg-gray-500',
      under_review: 'bg-yellow-500',
      field_verification: 'bg-blue-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
      epic_generated: 'bg-purple-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-light py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card mb-6">
          <h1 className="text-3xl font-heading font-bold text-gray-800 mb-2">Track Application</h1>
          <p className="text-gray-600 mb-6">Enter your Application ID to track the status</p>

          <div className="flex gap-4">
            <input
              type="text"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value.toUpperCase())}
              className="input-field flex-1"
              placeholder="Enter Application ID (e.g., APP2024ABC123)"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {application && (
          <>
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4">Application Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Application ID</p>
                  <p className="font-semibold">{application.application_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-white text-sm ${getStatusColor(application.application_status)}`}>
                    {getStatusLabel(application.application_status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold">{application.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Aadhaar</p>
                  <p className="font-semibold">XXXX-XXXX-{application.aadhaar_number?.substring(8)}</p>
                </div>
                {application.epic_number && (
                  <div>
                    <p className="text-sm text-gray-600">EPIC Number</p>
                    <p className="font-semibold">{application.epic_number}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Tracking History</h2>
              <div className="space-y-4">
                {trackingHistory.map((entry, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 rounded-full text-white text-sm ${getStatusColor(entry.status)}`}>
                        {getStatusLabel(entry.status)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(entry.status_changed_at).toLocaleString()}
                      </span>
                    </div>
                    {entry.remarks && (
                      <p className="text-gray-600 text-sm mt-2">{entry.remarks}</p>
                    )}
                    {entry.username && (
                      <p className="text-gray-500 text-xs mt-1">Changed by: {entry.username} ({entry.role})</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

