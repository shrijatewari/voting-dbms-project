import { useState, useEffect } from 'react';
import { ledgerService } from '../services/api';

export default function LedgerVerificationPage() {
  const [verification, setVerification] = useState<any>(null);
  const [ledgerChain, setLedgerChain] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verifyLedger = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await ledgerService.verifyLedgerIntegrity();
      setVerification(result.data);
      if (result.data.valid) {
        alert('✅ Ledger integrity verified! All blocks are valid.');
      } else {
        alert(`⚠️ Ledger integrity check found ${result.data.issues || 0} issues.`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to verify ledger');
    } finally {
      setLoading(false);
    }
  };

  const loadLedgerChain = async () => {
    try {
      const result = await ledgerService.getLedgerChain(1, 100);
      setLedgerChain(result.data.blocks || []);
    } catch (err: any) {
      console.error('Failed to load ledger chain:', err);
    }
  };

  useEffect(() => {
    verifyLedger();
    loadLedgerChain();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Vote Ledger Verification</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Verification Status */}
          {verification && (
            <div className={`border rounded-lg p-6 mb-6 ${
              verification.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Ledger Integrity Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`text-lg font-semibold ${verification.valid ? 'text-green-600' : 'text-red-600'}`}>
                    {verification.valid ? '✅ Valid' : '❌ Invalid'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Blocks</p>
                  <p className="text-lg font-semibold text-gray-900">{verification.total_blocks || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Issues Found</p>
                  <p className="text-lg font-semibold text-red-600">{verification.issues || 0}</p>
                </div>
              </div>
              {verification.issue_details && verification.issue_details.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Issue Details:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {verification.issue_details.map((issue: any, idx: number) => (
                      <li key={idx}>{issue.issue}: {issue.vote_id}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <button
            onClick={verifyLedger}
            disabled={loading}
            className="mb-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Ledger Integrity'}
          </button>

          {/* Ledger Chain */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ledger Chain</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Block ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vote ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Block Hash</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Previous Hash</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ledgerChain.map((block) => (
                    <tr key={block.ledger_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{block.ledger_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{block.vote_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 break-all">
                        {block.block_hash?.substring(0, 16)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 break-all">
                        {block.previous_hash?.substring(0, 16)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{block.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ledgerChain.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No ledger blocks found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

