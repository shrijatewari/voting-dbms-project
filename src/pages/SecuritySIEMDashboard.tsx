import { useState, useEffect } from 'react';
import { siemService } from '../services/api';

export default function SecuritySIEMDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [suspiciousLogins, setSuspiciousLogins] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [days, setDays] = useState(7);

  const loadStats = async () => {
    setLoading(true);
    try {
      const result = await siemService.getSecurityStats(days);
      setStats(result.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load security stats');
    } finally {
      setLoading(false);
    }
  };

  const loadSuspiciousLogins = async () => {
    try {
      const result = await siemService.detectSuspiciousLogins();
      setSuspiciousLogins(result.data);
    } catch (err: any) {
      console.error('Failed to load suspicious logins:', err);
    }
  };

  useEffect(() => {
    loadStats();
    loadSuspiciousLogins();
  }, [days]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Security & SIEM Dashboard</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Date Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Period (days)</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              min="1"
              max="30"
            />
          </div>

          {/* Stats Summary */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-blue-600">{stats.summary?.total_events || 0}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Unique IPs</p>
                <p className="text-2xl font-bold text-red-600">{stats.summary?.unique_ips || 0}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Affected Users</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.summary?.affected_users || 0}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Avg Risk Score</p>
                <p className="text-2xl font-bold text-purple-600">{stats.summary?.avg_risk_score?.toFixed(1) || 0}</p>
              </div>
            </div>
          )}

          {/* Events by Type */}
          {stats && stats.by_type && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Events by Type</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Risk</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.by_type.map((event: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.event_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.avg_risk?.toFixed(1) || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Suspicious Logins */}
          {suspiciousLogins && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Suspicious Activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Failed Login Attacks</p>
                  <p className="text-2xl font-bold text-red-600">{suspiciousLogins.failed_login_attacks || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unusual Location Logins</p>
                  <p className="text-2xl font-bold text-orange-600">{suspiciousLogins.unusual_location_logins || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

