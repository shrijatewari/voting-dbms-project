import { useState, useEffect } from 'react';
import { communicationService, rumorService } from '../services/api';

export default function CommunicationsPortal() {
  const [communications, setCommunications] = useState<any[]>([]);
  const [rumors, setRumors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [type, setType] = useState('notice');
  const [newRumor, setNewRumor] = useState({ url: '', description: '' });

  const loadCommunications = async () => {
    try {
      const result = await communicationService.getCommunicationsByType(type, 1, 50);
      setCommunications(result.data.communications || []);
    } catch (err: any) {
      console.error('Failed to load communications:', err);
    }
  };

  const flagRumor = async () => {
    if (!newRumor.url || !newRumor.description) {
      alert('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await rumorService.flagRumor(newRumor);
      alert('Rumor flagged successfully!');
      setNewRumor({ url: '', description: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to flag rumor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunications();
  }, [type]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Communications & Notices Portal</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Type Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Communication Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="notice">Official Notices</option>
              <option value="manifesto">Candidate Manifestos</option>
              <option value="clarification">Clarifications</option>
            </select>
          </div>

          {/* Communications */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Official Communications</h2>
            <div className="space-y-4">
              {communications.map((comm) => (
                <div key={comm.communication_id} className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{comm.title}</h3>
                  <p className="text-gray-600 mb-2">{comm.body}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-500">Published: {comm.published_at}</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      comm.signature_valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {comm.signature_valid ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {communications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No communications found.
              </div>
            )}
          </div>

          {/* Rumor Flagging */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Flag Misinformation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={newRumor.url}
                  onChange={(e) => setNewRumor({ ...newRumor, url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://example.com/article"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newRumor.description}
                  onChange={(e) => setNewRumor({ ...newRumor, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Describe why this is misinformation..."
                />
              </div>
              <button
                onClick={flagRumor}
                disabled={loading}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {loading ? 'Flagging...' : 'Flag Misinformation'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

