import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

export default function EnhancedLandingPage() {
  const { t } = useTranslation();
  const [showVoterStatus, setShowVoterStatus] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [voterStatus, setVoterStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckVoterStatus = async () => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      alert('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    setLoading(true);
    try {
      // In production, this would call a voter lookup API
      // For now, we'll show a mock response
      setVoterStatus({
        name: 'Sample Voter',
        aadhaar_masked: `XXXX-XXXX-${aadhaarNumber.substring(8)}`,
        status: 'Verified',
        epic_number: 'XX123456',
        polling_station: 'Booth 001'
      });
    } catch (error) {
      alert('Error checking voter status');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-navy via-primary-royal to-primary-light">
      {/* Header with India Flag Emblem */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">🇮🇳</span>
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-primary-navy">
                Digital Voter Portal
              </h1>
              <p className="text-xs text-gray-600">Election Commission of India</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSelector compact={true} showLabel={false} />
            <Link to="/login" className="text-primary-navy hover:underline font-medium">{t('login')}</Link>
            <Link to="/register" className="bg-primary-navy text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-royal transition shadow-md">
              {t('register')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="mb-8">
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full p-6 mb-6 shadow-xl">
              <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-5xl font-heading font-bold text-white mb-6 drop-shadow-lg">
            {t('tamper_proof_verification')}
          </h1>
          <p className="text-xl text-white/95 mb-12 font-light">
            {t('secure_platform')}
          </p>
        </div>

        {/* Quick Service Tiles - DigiLocker Style */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Check Voter Status */}
          <div className="card hover:shadow-2xl transition-all duration-300 bg-white">
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-3">{t('check_voter_status')}</h3>
              <p className="text-sm text-gray-600 mb-4">{t('enter_aadhaar')}</p>
              
              {!showVoterStatus ? (
                <button
                  onClick={() => setShowVoterStatus(true)}
                  className="btn-primary w-full"
                >
                  {t('check_now')}
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder={t('enter_aadhaar')}
                    className="input-field"
                    maxLength={12}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCheckVoterStatus}
                      className="btn-primary flex-1"
                      disabled={loading}
                    >
                      {loading ? t('loading') : t('verify_otp')}
                    </button>
                    <button
                      onClick={() => {
                        setShowVoterStatus(false);
                        setVoterStatus(null);
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                  {voterStatus && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-left">
                      <p className="text-sm font-semibold text-green-800 mb-2">✓ {t('voter_verified')}</p>
                      <p className="text-xs text-gray-600">{t('name')}: {voterStatus.name}</p>
                      <p className="text-xs text-gray-600">{t('aadhaar')}: {voterStatus.aadhaar_masked}</p>
                      <p className="text-xs text-gray-600">{t('epic_number')}: {voterStatus.epic_number}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Find Polling Station */}
          <Link to="/find-polling-station" className="card hover:shadow-2xl transition-all duration-300 bg-white">
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-3">{t('find_polling_station')}</h3>
              <p className="text-sm text-gray-600 mb-4">{t('find_polling_station')}</p>
              <button className="btn-primary w-full">{t('find_polling_station')}</button>
            </div>
          </Link>

          {/* Submit Grievance */}
          <Link to="/grievance" className="card hover:shadow-2xl transition-all duration-300 bg-white">
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-3">{t('grievance')}</h3>
              <p className="text-sm text-gray-600 mb-4">{t('grievance')}</p>
              <button className="btn-primary w-full">{t('grievance')}</button>
            </div>
          </Link>

          {/* Track Application */}
          <Link to="/track-application" className="card hover:shadow-2xl transition-all duration-300 bg-white">
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-3">Track Application</h3>
              <p className="text-sm text-gray-600 mb-4">Check your registration status</p>
              <button className="btn-primary w-full">Track Now</button>
            </div>
          </Link>

          {/* Download Voter ID */}
          <div className="card hover:shadow-2xl transition-all duration-300 bg-white">
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-3">Download Voter ID</h3>
              <p className="text-sm text-gray-600 mb-4">Get your digital e-EPIC card</p>
              <Link to="/dashboard">
                <button className="btn-primary w-full">Download EPIC</button>
              </Link>
            </div>
          </div>

          {/* View Elections */}
          <Link to="/elections" className="card hover:shadow-2xl transition-all duration-300 bg-white">
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-3">View Elections</h3>
              <p className="text-sm text-gray-600 mb-4">Browse upcoming and active elections</p>
              <button className="btn-primary w-full">View Elections</button>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/10 backdrop-blur-sm border-t border-white/20 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="grid md:grid-cols-3 gap-8 text-white/80">
            <div>
              <h4 className="font-semibold text-white mb-4">About</h4>
              <p className="text-sm">Secure, transparent, and tamper-proof voter verification system powered by blockchain technology.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register" className="hover:text-white">Register as Voter</Link></li>
                <li><Link to="/grievance" className="hover:text-white">Submit Grievance</Link></li>
                <li><Link to="/track-application" className="hover:text-white">Track Application</Link></li>
                <li><Link to="/audit-logs" className="hover:text-white">Audit Logs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <p className="text-sm">Election Commission of India</p>
              <p className="text-sm">Email: support@eci.gov.in</p>
              <p className="text-sm">Helpline: 1800-XXX-XXXX</p>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/60">
            <p>&copy; 2024 Digital Voter Verification System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

