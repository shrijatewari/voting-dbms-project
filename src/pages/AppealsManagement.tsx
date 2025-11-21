import { useState, useEffect } from 'react';
import { appealService } from '../services/api';

export default function AppealsManagement() {
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newAppeal, setNewAppeal] = useState({ voter_id: '', reason: '', description: '' });

  const createAppeal = async () => {
    if (!newAppeal.voter_id || !newAppeal.reason) {
      alert('Please fill all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Backend expects appeal_type (already in correct format from dropdown)
      await appealService.createAppeal({
        voter_id: parseInt(newAppeal.voter_id),
        appeal_type: newAppeal.reason, // This is the appeal type from dropdown
        reason: newAppeal.description || 'No description provided' // Description goes to reason field
      });
      alert('Appeal created successfully!');
      setNewAppeal({ voter_id: '', reason: '', description: '' });
      loadAppeals();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create appeal';
      setError(errorMsg);
      console.error('Appeal creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAppeals = async () => {
    try {
      // This would need an endpoint to get all appeals
      // For now, we'll show a message
    } catch (err: any) {
      console.error('Failed to load appeals:', err);
    }
  };

  useEffect(() => {
    loadAppeals();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Appeals Management</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Create Appeal */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Appeal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voter ID</label>
                <input
                  type="number"
                  value={newAppeal.voter_id}
                  onChange={(e) => setNewAppeal({ ...newAppeal, voter_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select
                  value={newAppeal.reason}
                  onChange={(e) => setNewAppeal({ ...newAppeal, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select reason</option>
                  <option value="removal">Wrong Deletion/Removal</option>
                  <option value="duplicate-flag">Duplicate Flag</option>
                  <option value="verification-rejection">Verification Rejection</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newAppeal.description}
                  onChange={(e) => setNewAppeal({ ...newAppeal, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                />
              </div>
              <button
                onClick={createAppeal}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Appeal'}
              </button>
            </div>
          </div>

          {/* Appeals List */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">My Appeals</h2>
            <div className="text-center py-8 text-gray-500">
              Appeals list will be displayed here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

