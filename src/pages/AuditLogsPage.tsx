import { useState, useEffect } from 'react';
import { auditLogService } from '../services/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    entity_type: '',
    action_type: '',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await auditLogService.getAll(filters, filters.page, filters.limit);
      setLogs(response.data.audit_logs || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-light py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-800 mb-2">
            Audit Logs
          </h1>
          <p className="text-gray-600">Transparent audit trail with hash-chain verification</p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entity Type
              </label>
              <select
                className="input-field"
                value={filters.entity_type}
                onChange={(e) => setFilters({ ...filters, entity_type: e.target.value, page: 1 })}
              >
                <option value="">All</option>
                <option value="voter">Voter</option>
                <option value="election">Election</option>
                <option value="candidate">Candidate</option>
                <option value="vote">Vote</option>
                <option value="audit_log">Audit Log</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <select
                className="input-field"
                value={filters.action_type}
                onChange={(e) => setFilters({ ...filters, action_type: e.target.value, page: 1 })}
              >
                <option value="">All</option>
                <option value="CREATE">Create</option>
                <option value="READ">Read</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ entity_type: '', action_type: '', page: 1, limit: 20 })}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="card overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-navy"></div>
              <p className="mt-4 text-gray-600">Loading audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              No audit logs found
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-border">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Timestamp</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Entity</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Entity ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.log_id} className="border-b border-gray-border hover:bg-gray-light">
                      <td className="py-3 px-4 text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.action_type === 'CREATE' ? 'bg-success/20 text-success' :
                          log.action_type === 'UPDATE' ? 'bg-warning/20 text-warning' :
                          log.action_type === 'DELETE' ? 'bg-danger/20 text-danger' :
                          'bg-primary-light text-primary-navy'
                        }`}>
                          {log.action_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm capitalize">{log.entity_type}</td>
                      <td className="py-3 px-4 text-sm">{log.entity_id || '-'}</td>
                      <td className="py-3 px-4 text-xs font-mono text-gray-600">
                        {log.current_hash?.substring(0, 16)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-border">
                  <p className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                      disabled={filters.page === 1}
                      className="btn-secondary text-sm px-4 py-2 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                      disabled={filters.page >= pagination.totalPages}
                      className="btn-secondary text-sm px-4 py-2 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Hash Chain Verification */}
        <div className="card mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Hash Chain Integrity</h3>
              <p className="text-sm text-gray-600">Verify the tamper-proof audit trail</p>
            </div>
            <button
              onClick={async () => {
                try {
                  const response = await auditLogService.verifyChain();
                  alert(response.data.hash_chain_valid 
                    ? '✅ Hash chain is valid - No tampering detected'
                    : '❌ Hash chain verification failed');
                } catch (error) {
                  alert('Failed to verify hash chain');
                }
              }}
              className="btn-primary"
            >
              Verify Chain
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

