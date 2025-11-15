import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { voterService, electionService } from '../services/api';

export default function CitizenDashboard({ user }: any) {
  const navigate = useNavigate();
  const [voter, setVoter] = useState<any>(null);
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch voter data (in real app, use user's voter ID)
      const voterResponse = await voterService.getAll(1, 1);
      if (voterResponse.data.voters?.length > 0) {
        setVoter(voterResponse.data.voters[0]);
      }

      // Fetch active elections
      const electionResponse = await electionService.getAll(1, 5);
      setElections(electionResponse.data.elections || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-border">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-heading font-bold text-primary-navy">
            Voter Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user?.name || 'User'}</span>
            <button onClick={handleLogout} className="text-gray-600 hover:text-gray-800">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-navy"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Voter Status Card */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">My Voter Status</h2>
              {voter ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{voter.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Aadhaar</p>
                    <p className="font-mono text-sm">****{voter.aadhaar_number?.slice(-4)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      voter.is_verified 
                        ? 'bg-success/20 text-success' 
                        : 'bg-warning/20 text-warning'
                    }`}>
                      {voter.is_verified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                  <Link
                    to={`/profile/${voter.voter_id}`}
                    className="block mt-4 text-primary-royal hover:underline text-sm"
                  >
                    View Full Profile →
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">No voter profile found</p>
                  <Link to="/register" className="btn-primary text-sm">
                    Register Now
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link to="/register" className="block btn-secondary text-center text-sm">
                  Update Profile
                </Link>
                <Link to="/elections" className="block btn-primary text-center text-sm">
                  View Elections
                </Link>
                <Link to="/audit-logs" className="block btn-secondary text-center text-sm">
                  View Audit Logs
                </Link>
              </div>
            </div>

            {/* Active Elections */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Active Elections</h2>
              {elections.length > 0 ? (
                <div className="space-y-3">
                  {elections.slice(0, 3).map((election) => (
                    <div key={election.election_id} className="border border-gray-border rounded-lg p-3">
                      <p className="font-medium text-sm">{election.title}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(election.start_date).toLocaleDateString()} - {new Date(election.end_date).toLocaleDateString()}
                      </p>
                      {election.status === 'active' && (
                        <Link
                          to={`/vote/${election.election_id}`}
                          className="block mt-2 btn-primary text-center text-xs"
                        >
                          Cast Vote
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No active elections</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

