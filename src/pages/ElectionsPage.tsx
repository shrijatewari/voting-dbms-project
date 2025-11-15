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
      const response = await electionService.getAll(1, 100);
      setElections(response.data.elections || []);
    } catch (error) {
      console.error('Failed to fetch elections:', error);
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
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((election) => (
              <div key={election.election_id} className="card">
                <h3 className="text-xl font-semibold mb-2">{election.title}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {new Date(election.start_date).toLocaleDateString()} - {new Date(election.end_date).toLocaleDateString()}
                </p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                  election.status === 'active' ? 'bg-success/20 text-success' :
                  election.status === 'completed' ? 'bg-gray-border text-gray-600' :
                  'bg-warning/20 text-warning'
                }`}>
                  {election.status.toUpperCase()}
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

