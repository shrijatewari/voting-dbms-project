import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { electionService } from '../services/api';

export default function ElectionsPage() {
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await electionService.getAll(1, 100);
      console.log('Elections response:', response);
      
      // Handle different response formats
      const electionsData = response.data?.elections || response.data?.data?.elections || response.elections || [];
      console.log(`Fetched ${electionsData.length} elections`);
      setElections(Array.isArray(electionsData) ? electionsData : []);
    } catch (error: any) {
      console.error('Failed to fetch elections:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setElections([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-light py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-heading font-bold text-gray-800 mb-8">Elections</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-navy"></div>
          </div>
        ) : elections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No elections found.</p>
            <p className="text-sm text-gray-500">Run: npm --prefix backend run seed:elections</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((election) => (
              <div key={election.election_id} className="card">
                <h3 className="text-xl font-semibold mb-2">{election.title}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Start:</strong> {new Date(election.start_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>End:</strong> {new Date(election.end_date).toLocaleDateString()}
                </p>
                {election.total_votes !== undefined && (
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Total Votes:</strong> {election.total_votes || 0}
                  </p>
                )}
                {election.total_candidates !== undefined && (
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Candidates:</strong> {election.total_candidates || 0}
                  </p>
                )}
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                  election.status === 'active' ? 'bg-green-100 text-green-800' :
                  election.status === 'completed' ? 'bg-gray-200 text-gray-700' :
                  election.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {election.status ? election.status.toUpperCase() : 'UNKNOWN'}
                </span>
                <div className="flex space-x-2">
                  <Link
                    to={`/vote/${election.election_id}`}
                    className="btn-primary text-sm flex-1 text-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

