import { useEffect, useMemo, useState } from 'react';
import { epicService, voterService } from '../../services/api';

export default function EPICManagement() {
  const [voters, setVoters] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [actionMessage, setActionMessage] = useState('');

  const fetchVoters = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await voterService.getAll(page, 20);
      const payload = res.data || {};
      setVoters(payload.voters || []);
      setTotalPages(payload.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load voters');
      setVoters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoters();
  }, [page]);

  const filteredVoters = useMemo(() => {
    if (!searchTerm) return voters;
    const term = searchTerm.toLowerCase();
    return voters.filter(
      (v) =>
        v.name?.toLowerCase().includes(term) ||
        v.epic_number?.toLowerCase().includes(term) ||
        v.aadhaar_number?.includes(term)
    );
  }, [searchTerm, voters]);

  const loadPreview = async (epicNumber: string, voterId: number) => {
    setActionMessage('');
    try {
      if (epicNumber) {
        const res = await epicService.getDetails(epicNumber);
        setPreview(res.data?.data || res.data);
      } else {
        const res = await epicService.generateForVoter(voterId);
        setPreview(res.data?.data || res.data);
        await fetchVoters();
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.error || 'Unable to load EPIC data');
    }
  };

  const handleDownload = async (epicNumber: string) => {
    try {
      await epicService.download(epicNumber);
      setActionMessage('EPIC download triggered (check console / network tab for payload).');
    } catch (err: any) {
      setActionMessage(err.response?.data?.error || 'Failed to download EPIC');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">EPIC Management Console</h1>
            <p className="text-sm text-gray-500">
              Generate, preview, and download digital Elector Photo Identity Cards for voters.
            </p>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, EPIC, Aadhaar..."
            className="w-full md:w-80 rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-navy focus:ring-2 focus:ring-primary-navy/30"
          />
        </div>

        {actionMessage && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{actionMessage}</div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Voter</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Aadhaar</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">EPIC</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        Loading voters...
                      </td>
                    </tr>
                  ) : filteredVoters.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No voters match this search.
                      </td>
                    </tr>
                  ) : (
                    filteredVoters.map((voter) => (
                      <tr key={voter.voter_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{voter.name}</div>
                          <div className="text-xs text-gray-500">ID: {voter.voter_id}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {voter.aadhaar_number ? `XXXX-XXXX-${voter.aadhaar_number.slice(-4)}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          {voter.epic_number ? (
                            <span className="font-mono text-sm text-primary-navy">{voter.epic_number}</span>
                          ) : (
                            <span className="text-xs text-gray-500">Not generated</span>
                          )}
                        </td>
                        <td className="px-6 py-4 space-x-2">
                          <button
                            className="rounded-lg border border-primary-navy px-3 py-1 text-xs font-semibold text-primary-navy hover:bg-primary-navy hover:text-white"
                            onClick={() => loadPreview(voter.epic_number, voter.voter_id)}
                          >
                            {voter.epic_number ? 'Preview' : 'Generate'}
                          </button>
                          {voter.epic_number && (
                            <button
                              className="rounded-lg bg-primary-navy px-3 py-1 text-xs font-semibold text-white hover:bg-primary-royal"
                              onClick={() => handleDownload(voter.epic_number)}
                            >
                              Download
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

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">EPIC Preview</h2>
            {preview ? (
              <div className="space-y-4">
                <div className="rounded-xl border-4 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-inner">
                  <div className="flex gap-4">
                    <div className="w-28 h-36 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500">
                      Photo
                    </div>
                    <div className="flex-1 space-y-2 text-sm">
                      <div>
                        <p className="text-gray-500">EPIC Number</p>
                        <p className="font-mono text-lg text-primary-navy">{preview.epic_number}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Name</p>
                        <p className="font-semibold text-gray-900">{preview.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">Gender</p>
                          <p className="font-semibold text-gray-800">{preview.gender || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">DOB</p>
                          <p className="font-semibold text-gray-800">
                            {preview.dob ? new Date(preview.dob).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 uppercase mb-1">Address</p>
                    <p className="text-sm font-semibold text-gray-800">{preview.address}</p>
                  </div>
                  {preview.polling_station && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 uppercase mb-1">Polling Station</p>
                      <p className="text-sm font-semibold text-gray-800">{preview.polling_station}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDownload(preview.epic_number)}
                  className="w-full rounded-lg bg-primary-navy px-4 py-2 text-sm font-semibold text-white hover:bg-primary-royal"
                >
                  Download PDF
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Select a voter to preview their EPIC. If a voter doesn’t have an EPIC yet, click “Generate” to assign
                one instantly.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

