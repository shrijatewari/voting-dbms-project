import { useState, useEffect } from 'react';
import { transparencyService } from '../services/api';

export default function TransparencyPortal() {
  const [merkleRoot, setMerkleRoot] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const loadMerkleRoot = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await transparencyService.getMerkleRoot(date);
      if (result.data?.success && result.data?.data) {
        setMerkleRoot(result.data.data);
        setError('');
      } else if (result.data) {
        setMerkleRoot(result.data);
        setError('');
      } else {
        setError(result.data?.message || 'Merkle root not found for this date');
        setMerkleRoot(null);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load merkle root';
      setError(errorMsg);
      setMerkleRoot(null);
      console.error('Load merkle root error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const result = await transparencyService.exportData();
      // Create download link
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transparency-export-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to export data: ' + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => {
    loadMerkleRoot();
  }, [date]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Transparency Portal</h1>
          <p className="text-gray-600 mb-6">View cryptographic proofs and audit trail integrity</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Date Selection */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={loadMerkleRoot}
              className="ml-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Load Merkle Root
            </button>
          </div>

          {/* Merkle Root Display */}
          {merkleRoot && merkleRoot.merkle_root ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Merkle Root for {date}</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Root Hash</p>
                  <p className="text-sm font-mono text-gray-900 break-all">{merkleRoot.merkle_root}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-lg font-semibold text-gray-900">{merkleRoot.total_records || 0}</p>
                </div>
                {merkleRoot.signature && (
                  <div>
                    <p className="text-sm text-gray-600">Signature</p>
                    <p className="text-xs font-mono text-gray-700 break-all">{merkleRoot.signature.substring(0, 32)}...</p>
                  </div>
                )}
                {merkleRoot.published_at && (
                  <div>
                    <p className="text-sm text-gray-600">Published At</p>
                    <p className="text-sm text-gray-900">{new Date(merkleRoot.published_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          ) : error && error.includes('not found') ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <p className="text-yellow-800">
                {error}. {merkleRoot?.message || 'Try generating a Merkle root for this date or select a different date.'}
              </p>
            </div>
          ) : null}

          {/* Export Section */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Export</h2>
            <p className="text-gray-600 mb-4">Download sanitized public data for verification</p>
            <button
              onClick={exportData}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

