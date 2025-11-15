import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { voterService } from '../../services/api';

export default function VoterManagement() {
  const [voters, setVoters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'aadhaar' | 'epic' | 'mobile'>('name');
  const [selectedVoter, setSelectedVoter] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchVoters();
  }, [page]);

  const fetchVoters = async () => {
    try {
      const response = await voterService.getAll(page, 20);
      setVoters(response.data.voters || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch voters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    // Implement search logic
    setLoading(true);
    try {
      const response = await voterService.getAll(1, 20);
      let filtered = response.data.voters || [];
      
      if (searchTerm) {
        filtered = filtered.filter((v: any) => {
          switch (searchType) {
            case 'name':
              return v.name?.toLowerCase().includes(searchTerm.toLowerCase());
            case 'aadhaar':
              return v.aadhaar_number?.includes(searchTerm);
            case 'epic':
              return v.epic_number?.includes(searchTerm);
            case 'mobile':
              return v.mobile_number?.includes(searchTerm);
            default:
              return true;
          }
        });
      }
      
      setVoters(filtered);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const maskAadhaar = (aadhaar: string) => {
    if (!aadhaar) return 'N/A';
    return `XXXX-XXXX-${aadhaar.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Voter Management</h1>
          <p className="text-gray-600">Search, view, and manage voter records</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="aadhaar">Aadhaar</option>
              <option value="epic">EPIC Number</option>
              <option value="mobile">Mobile Number</option>
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search by ${searchType}...`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-primary-navy text-white rounded-lg hover:bg-primary-royal transition-colors font-medium"
            >
              Search
            </button>
            <button
              onClick={() => {
                setSearchTerm('');
                fetchVoters();
              }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Voters Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-navy text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Voter ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Aadhaar</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">EPIC</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Mobile</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Loading voters...
                    </td>
                  </tr>
                ) : voters.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No voters found
                    </td>
                  </tr>
                ) : (
                  voters.map((voter) => (
                    <tr key={voter.voter_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {voter.voter_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{voter.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {maskAadhaar(voter.aadhaar_number)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {voter.epic_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {voter.mobile_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            voter.is_verified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {voter.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Link
                            to={`/profile/${voter.voter_id}`}
                            className="text-primary-navy hover:text-primary-royal font-medium text-sm"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => setSelectedVoter(voter)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


