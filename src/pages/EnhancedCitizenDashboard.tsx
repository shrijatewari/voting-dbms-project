import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { voterService, electionService, grievanceService, applicationService, epicService, pollingStationService } from '../services/api';
import ProfileCompletionModal from '../components/ProfileCompletionModal';
import LanguageSelector from '../components/LanguageSelector';

export default function EnhancedCitizenDashboard({ user }: any) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [voter, setVoter] = useState<any>(null);
  const [elections, setElections] = useState<any[]>([]);
  const [grievances, setGrievances] = useState<any[]>([]);
  const [application, setApplication] = useState<any>(null);
  const [pollingStation, setPollingStation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [aadhaarNumber, setAadhaarNumber] = useState<string>('');
  const hasChecked = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasChecked.current) return;
    hasChecked.current = true;
    
    // Check if user is admin - redirect to admin dashboard
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const role = (user.role || 'citizen').toLowerCase();
        if (role !== 'citizen') {
          navigate('/admin');
          return;
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run only once on mount

  // Timeout fallback - ensure loading stops after 5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
      console.warn('⏱️ Dashboard loading timeout - forcing display');
    }, 5000);
    return () => clearTimeout(timeout);
  }, []); // Run only once on mount

  const fetchData = async () => {
    try {
      // Get voter ID and user name from user data
      const userData = localStorage.getItem('user_data');
      let voterId = null;
      if (userData) {
        try {
          const user = JSON.parse(userData);
          voterId = user.voter_id || user.id;
          // Set user name from localStorage
          if (user.name) {
            setUserName(user.name);
          }
          // Set Aadhaar from user_data if available (fallback)
          if (user.aadhaar_number) {
            setAadhaarNumber(user.aadhaar_number);
          }
        } catch (e) {}
      }

      // Fetch voter data - try to get current user's voter record
      if (voterId) {
        try {
          console.log('Fetching voter data for voterId:', voterId);
          const voterResponse = await voterService.getById(voterId);
          console.log('Voter response:', voterResponse);
          
          if (voterResponse.data?.data || voterResponse.data) {
            const voterData = voterResponse.data.data || voterResponse.data;
            console.log('Setting voter data:', voterData);
            console.log('Aadhaar number:', voterData.aadhaar_number);
            setVoter(voterData);
            
            // Set Aadhaar number if available
            if (voterData.aadhaar_number) {
              setAadhaarNumber(voterData.aadhaar_number);
            }
            
            // Update user name from voter data if available
            if (voterData.name) {
              setUserName(voterData.name);
            } else if (userData) {
              // Fallback to localStorage name
              try {
                const user = JSON.parse(userData);
                if (user.name) {
                  setUserName(user.name);
                }
              } catch (e) {}
            }
            
            // Fetch application if exists
            if (voterData.application_id) {
              try {
                const appResponse = await applicationService.getApplication(voterData.application_id);
                setApplication(appResponse.data.data);
              } catch (e) {
                console.warn('Failed to fetch application:', e);
              }
            }
            
            // Fetch polling station
            if (voterData.polling_station_id) {
              try {
                const stationResponse = await pollingStationService.getById(voterData.polling_station_id);
                setPollingStation(stationResponse.data.data);
              } catch (e) {
                console.warn('Failed to fetch polling station:', e);
              }
            }
          } else {
            console.warn('No voter data in response');
          }
        } catch (e) {
          console.error('Failed to fetch voter data:', e);
          // If voter not found, still try to show name from localStorage
          if (userData) {
            try {
              const user = JSON.parse(userData);
              if (user.name) {
                setUserName(user.name);
              }
            } catch (parseErr) {}
          }
        }
      } else {
        console.warn('No voterId found in user_data');
        // Try to get voter by email if available
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.name) {
              setUserName(user.name);
            }
            // Try to fetch voter by email
            if (user.email) {
              try {
                const votersResponse = await voterService.getAll(1, 100);
                const voters = votersResponse.data?.voters || votersResponse.data?.data?.voters || [];
                const matchingVoter = voters.find((v: any) => v.email === user.email);
                if (matchingVoter) {
                  console.log('Found voter by email:', matchingVoter);
                  setVoter(matchingVoter);
                  // Update localStorage with voter_id
                  user.voter_id = matchingVoter.voter_id;
                  localStorage.setItem('user_data', JSON.stringify(user));
                }
              } catch (e) {
                console.warn('Failed to fetch voter by email:', e);
              }
            }
          } catch (e) {}
        }
      }

      // Fetch active elections
      try {
        const electionResponse = await electionService.getAll(1, 5);
        setElections(electionResponse.data.elections || []);
      } catch (e) {
        console.error('Failed to fetch elections:', e);
      }

      // Fetch grievances
      if (voterId) {
        try {
          const grievanceResponse = await grievanceService.getAll({ voter_id: voterId }, 1, 5);
          setGrievances(grievanceResponse.data.grievances || []);
        } catch (e) {}
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadEPIC = async () => {
    if (!voter?.epic_number) {
      alert('EPIC not generated yet');
      return;
    }
    // Navigate to EPIC download page with EPIC number pre-filled
    navigate(`/epic-download?epic=${voter.epic_number}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      verified: 'bg-green-500',
      pending: 'bg-yellow-500',
      rejected: 'bg-red-500',
      submitted: 'bg-blue-500',
      under_review: 'bg-yellow-500',
      approved: 'bg-green-500',
      epic_generated: 'bg-purple-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Profile Completion Modal - Show for all citizen users, even without voter data */}
      {(() => {
        const userData = localStorage.getItem('user_data');
        try {
          if (userData) {
            const user = JSON.parse(userData);
            const role = (user.role || 'citizen').toLowerCase();
            if (role === 'citizen') {
              const voterId = user.voter_id || user.id || voter?.voter_id;
              if (voterId) {
                return <ProfileCompletionModal voterId={voterId} />;
              }
            }
          }
        } catch (e) {
          // If parsing fails, don't show modal
        }
        return null;
      })()}
      {/* Header with India Flag */}
      <header className="bg-white border-b-2 border-primary-navy shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">🇮🇳</span>
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-primary-navy">Citizen Dashboard</h1>
              <p className="text-xs text-gray-600">Election Commission of India</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Aadhaar and Application Info */}
            <div className="text-right mr-4">
                {(voter?.aadhaar_number || aadhaarNumber) && (
                  <div className="text-sm">
                    <span className="text-gray-600">Aadhaar: </span>
                    <span className="font-semibold text-gray-800">
                      XXXX-XXXX-{(voter?.aadhaar_number || aadhaarNumber).substring(8)}
                    </span>
                  </div>
                )}
              {application?.application_id && (
                <div className="text-sm mt-1">
                  <span className="text-gray-600">Application: </span>
                  <span className="font-semibold text-gray-800">
                    {application.application_id}
                  </span>
                </div>
              )}
            </div>
            <LanguageSelector compact={true} showLabel={false} />
            <span className="text-gray-700 font-medium">{t('welcome')}, {userName || voter?.name || 'User'}</span>
            <button onClick={handleLogout} className="text-gray-600 hover:text-primary-navy font-medium">
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Dashboard Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* My Voter Profile Card */}
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-800 mb-1">{t('profile')}</h3>
                <p className="text-sm text-gray-600">{t('profile')}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${getStatusColor(voter?.is_verified ? 'verified' : 'pending')}`}>
                {voter?.is_verified ? 'Verified' : 'Pending'}
              </div>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="text-gray-600">Name:</span> <span className="font-semibold">{voter?.name || 'N/A'}</span></p>
              <p><span className="text-gray-600">Aadhaar:</span> <span className="font-semibold">
                {(voter?.aadhaar_number || aadhaarNumber) && (voter?.aadhaar_number || aadhaarNumber).length >= 12 
                  ? `XXXX-XXXX-${(voter?.aadhaar_number || aadhaarNumber).substring(8)}` 
                  : (voter?.aadhaar_number || aadhaarNumber) || 'N/A'}
              </span></p>
              {application?.application_id && (
                <p><span className="text-gray-600">Application:</span> <span className="font-semibold">{application.application_id}</span></p>
              )}
              {voter?.epic_number && (
                <p><span className="text-gray-600">EPIC:</span> <span className="font-semibold">{voter.epic_number}</span></p>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Link to="/update-profile" className="btn-primary flex-1 text-center text-sm py-2">
                ✏️ Update Profile
              </Link>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">Update your registration details anytime</p>
          </div>

          {/* Application Status Card */}
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-800 mb-1">Application Status</h3>
                <p className="text-sm text-gray-600">Registration Workflow</p>
              </div>
              {application && (
                <div className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${getStatusColor(application.application_status)}`}>
                  {application.application_status?.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </div>
              )}
            </div>
            {application ? (
              <div className="space-y-2">
                <p className="text-sm"><span className="text-gray-600">Application ID:</span> <span className="font-semibold">{application.application_id}</span></p>
                {(voter?.aadhaar_number || aadhaarNumber) && (
                  <p className="text-sm"><span className="text-gray-600">Aadhaar:</span> <span className="font-semibold">
                    XXXX-XXXX-{(voter?.aadhaar_number || aadhaarNumber).substring(8)}
                  </span></p>
                )}
                <Link to="/track-application" className="mt-4 inline-block text-primary-navy hover:underline text-sm font-medium">
                  View Timeline →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">No application found</p>
                {(voter?.aadhaar_number || aadhaarNumber) && (
                  <p className="text-sm"><span className="text-gray-600">Aadhaar:</span> <span className="font-semibold">
                    XXXX-XXXX-{(voter?.aadhaar_number || aadhaarNumber).substring(8)}
                  </span></p>
                )}
              </div>
            )}
          </div>

          {/* Grievances Filed Card */}
          <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-800 mb-1">Grievances Filed</h3>
                <p className="text-sm text-gray-600">Support Tickets</p>
              </div>
              <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                {grievances.length}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {grievances.filter((g: any) => g.status === 'open' || g.status === 'in_progress').length} Open
              </p>
              <p className="text-sm text-gray-600">
                {grievances.filter((g: any) => g.status === 'resolved').length} Resolved
              </p>
              <Link to="/grievance" className="mt-4 inline-block text-primary-navy hover:underline text-sm font-medium">
                View All →
              </Link>
            </div>
          </div>

          {/* EPIC Download Card */}
          <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200">
            <div className="mb-4">
              <h3 className="font-bold text-lg text-gray-800 mb-1">EPIC Card</h3>
              <p className="text-sm text-gray-600">Digital Voter ID</p>
            </div>
            {voter?.epic_number ? (
              <div className="space-y-3">
                <p className="text-sm"><span className="text-gray-600">EPIC Number:</span> <span className="font-semibold">{voter.epic_number}</span></p>
                <button
                  onClick={handleDownloadEPIC}
                  className="btn-primary w-full"
                >
                  📥 Download e-EPIC
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-3">EPIC not generated yet</p>
                <p className="text-xs text-gray-500">Your application is being processed</p>
              </div>
            )}
          </div>

          {/* Polling Station Details Card */}
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <div className="mb-4">
              <h3 className="font-bold text-lg text-gray-800 mb-1">Polling Station</h3>
              <p className="text-sm text-gray-600">Your Voting Booth</p>
            </div>
            {pollingStation ? (
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-800">{pollingStation.station_name}</p>
                <p className="text-gray-600">{pollingStation.address}</p>
                <p className="text-gray-600">{pollingStation.district}, {pollingStation.state}</p>
                <button className="mt-2 text-primary-navy hover:underline text-sm font-medium">
                  View on Map →
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Polling station not assigned yet</p>
            )}
          </div>

          {/* Duplicate Entry Alerts Card */}
          {voter && (
            <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800 mb-1">Duplicate Check</h3>
                  <p className="text-sm text-gray-600">Fraud Detection</p>
                </div>
                <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  ✓ Clear
                </div>
              </div>
              <p className="text-sm text-gray-600">No duplicate entries detected</p>
            </div>
          )}
        </div>

        {/* Quick Actions - All Citizen Features */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <Link to="/update-profile" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-navy transition text-center">
              <div className="text-2xl mb-2">👤</div>
              <p className="font-semibold text-sm">Update Profile</p>
            </Link>
            <Link to="/grievance" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-navy transition text-center">
              <div className="text-2xl mb-2">📝</div>
              <p className="font-semibold text-sm">Lodge Grievance</p>
            </Link>
            <Link to="/track-application" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-navy transition text-center">
              <div className="text-2xl mb-2">📊</div>
              <p className="font-semibold text-sm">Track Application</p>
            </Link>
            <Link to="/elections" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-navy transition text-center">
              <div className="text-2xl mb-2">🗳️</div>
              <p className="font-semibold text-sm">View Elections</p>
            </Link>
            <Link to="/find-polling-station" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-navy transition text-center">
              <div className="text-2xl mb-2">📍</div>
              <p className="font-semibold text-sm">Find Polling Station</p>
            </Link>
            <Link to="/epic-download" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-navy transition text-center">
              <div className="text-2xl mb-2">🆔</div>
              <p className="font-semibold text-sm">Download EPIC</p>
            </Link>
            <Link to="/appeals" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-navy transition text-center">
              <div className="text-2xl mb-2">⚖️</div>
              <p className="font-semibold text-sm">File Appeal</p>
            </Link>
            <Link to="/verify-vote" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-navy transition text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="font-semibold text-sm">Verify Vote</p>
            </Link>
          </div>
          
          {/* All Features List */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">All Available Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <Link to="/update-profile" className="text-blue-600 hover:underline">👤 Update Profile</Link>
              <Link to="/grievance" className="text-blue-600 hover:underline">📝 Submit Grievance</Link>
              <Link to="/track-application" className="text-blue-600 hover:underline">📊 Track Application</Link>
              <Link to="/elections" className="text-blue-600 hover:underline">🗳️ View Elections</Link>
              <Link to="/find-polling-station" className="text-blue-600 hover:underline">📍 Find Polling Station</Link>
              <Link to="/epic-download" className="text-blue-600 hover:underline">🆔 Download EPIC</Link>
              <Link to="/appeals" className="text-blue-600 hover:underline">⚖️ File Appeal</Link>
              <Link to="/verify-vote" className="text-blue-600 hover:underline">✅ Verify Vote</Link>
              <Link to="/transparency" className="text-blue-600 hover:underline">🔐 Transparency Portal</Link>
              <Link to="/revision-announcements" className="text-blue-600 hover:underline">📢 Revision Announcements</Link>
              <Link to="/communications" className="text-blue-600 hover:underline">📢 Official Communications</Link>
            </div>
          </div>
        </div>

        {/* Active Elections */}
        {elections.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Active Elections</h2>
            <div className="space-y-4">
              {elections.map((election: any) => (
                <div key={election.election_id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-navy transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800 mb-1">{election.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{election.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(election.start_date).toLocaleDateString()} - {new Date(election.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                      election.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                    }`}>
                      {election.status}
                    </span>
                  </div>
                  {election.status === 'active' && (
                    <Link
                      to={`/vote/${election.election_id}`}
                      className="mt-3 inline-block btn-primary text-sm"
                    >
                      Cast Vote →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

