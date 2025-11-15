import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { voterService } from '../services/api';

export default function VoterProfile() {
  const { id } = useParams();
  const [voter, setVoter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVoter();
    }
  }, [id]);

  const fetchVoter = async () => {
    try {
      const response = await voterService.getById(Number(id));
      setVoter(response.data.data);
    } catch (error) {
      console.error('Failed to fetch voter:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy"></div>
      </div>
    );
  }

  if (!voter) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Voter not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-light py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card mb-6">
          <h1 className="text-3xl font-heading font-bold text-gray-800 mb-6">Voter Profile</h1>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
              <p className="text-lg font-semibold">{voter.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
              <p className="text-lg">{new Date(voter.dob).toLocaleDateString()}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Aadhaar Number</label>
              <p className="text-lg font-mono">****{voter.aadhaar_number?.slice(-4)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Verification Status</label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                voter.is_verified 
                  ? 'bg-success/20 text-success' 
                  : 'bg-warning/20 text-warning'
              }`}>
                {voter.is_verified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Voter ID</label>
              <p className="text-lg font-mono">{voter.voter_id}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Registered On</label>
              <p className="text-lg">{new Date(voter.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

