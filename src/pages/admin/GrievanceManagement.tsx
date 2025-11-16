import { useEffect, useMemo, useState } from 'react';
import { grievanceService } from '../../services/api';

const STATUS_TABS = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Reopened', value: 'reopened' },
  { label: 'Resolved', value: 'resolved' }
];

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-700'
};

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  reopened: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800'
};

export default function GrievanceManagement() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [activeStatus, setActiveStatus] = useState('open');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedGrievance, setSelectedGrievance] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const fetchGrievances = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await grievanceService.getAll({ status: activeStatus }, page, 10);
      const payload = response.data || {};
      setGrievances(payload.grievances || payload.data?.grievances || []);
      setTotalPages(payload.pagination?.totalPages || payload.data?.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load grievances');
      setGrievances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, [activeStatus, page]);

  const filteredGrievances = useMemo(() => {
    if (!searchTerm) return grievances;
    const term = searchTerm.toLowerCase();
    return grievances.filter(
      (g) =>
        g.ticket_number?.toLowerCase().includes(term) ||
        g.subject?.toLowerCase().includes(term) ||
        g.aadhaar_number?.toLowerCase().includes(term)
    );
  }, [grievances, searchTerm]);

  const updateGrievanceStatus = async (grievanceId: number, status: string) => {
    setUpdating(true);
    setUpdateError('');
    try {
      await grievanceService.update(grievanceId, { status });
      await fetchGrievances();
      setSelectedGrievance(null);
    } catch (err: any) {
      setUpdateError(err.response?.data?.error || 'Failed to update grievance');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Grievance Desk</h1>
            <p className="text-gray-500 text-sm">Monitor, triage and resolve citizen complaints in real-time.</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by ticket, Aadhaar, subject..."
              className="w-full md:w-72 rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-navy focus:ring-2 focus:ring-primary-navy/30"
            />
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setActiveStatus(tab.value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeStatus === tab.value
                  ? 'bg-primary-navy text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="bg-white shadow rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">
                    Subject & Description
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Citizen</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Loading grievances...
                    </td>
                  </tr>
                ) : filteredGrievances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No grievances match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredGrievances.map((grievance) => (
                    <tr key={grievance.grievance_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{grievance.ticket_number}</div>
                        <div className="text-xs text-gray-500">
                          Filed {grievance.created_at ? new Date(grievance.created_at).toLocaleString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{grievance.subject}</div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{grievance.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">Voter ID: {grievance.voter_id || 'N/A'}</div>
                        <div className="text-xs text-gray-500">Aadhaar: {grievance.aadhaar_number || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            PRIORITY_BADGE[grievance.priority] || PRIORITY_BADGE['medium']
                          }`}
                        >
                          {grievance.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            STATUS_BADGE[grievance.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {grievance.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-y-2">
                        <button
                          onClick={() => setSelectedGrievance(grievance)}
                          className="block w-full rounded-lg border border-primary-navy px-3 py-1 text-xs font-semibold text-primary-navy hover:bg-primary-navy hover:text-white"
                        >
                          View Details
                        </button>
                        {grievance.status !== 'resolved' && (
                          <button
                            onClick={() => updateGrievanceStatus(grievance.grievance_id, 'resolved')}
                            className="block w-full rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 text-sm text-gray-600">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="space-x-3">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <p className="text-xs uppercase text-gray-500">Ticket</p>
                <h3 className="text-xl font-semibold text-gray-900">{selectedGrievance.ticket_number}</h3>
              </div>
              <button onClick={() => setSelectedGrievance(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-6 py-4 space-y-4">
              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Subject</h4>
                <p className="text-gray-900">{selectedGrievance.subject}</p>
              </section>
              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">{selectedGrievance.description}</p>
              </section>
              <section className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Voter ID</p>
                  <p className="font-semibold text-gray-800">{selectedGrievance.voter_id || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Aadhaar</p>
                  <p className="font-semibold text-gray-800">{selectedGrievance.aadhaar_number || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Priority</p>
                  <p className="font-semibold text-gray-800">{selectedGrievance.priority}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-semibold text-gray-800">{selectedGrievance.status}</p>
                </div>
              </section>
              {selectedGrievance.resolution && (
                <section>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Resolution Notes</h4>
                  <p className="text-xs text-gray-600 whitespace-pre-line">{selectedGrievance.resolution}</p>
                </section>
              )}
              {updateError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {updateError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setSelectedGrievance(null)}
                disabled={updating}
              >
                Close
              </button>
              {selectedGrievance.status !== 'resolved' && (
                <button
                  className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  onClick={() => updateGrievanceStatus(selectedGrievance.grievance_id, 'resolved')}
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Resolve Ticket'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

