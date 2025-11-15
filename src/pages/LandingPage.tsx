import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-navy via-primary-royal to-primary-light">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-primary-navy font-bold text-xl">V</span>
            </div>
            <h1 className="text-white text-xl font-heading font-semibold">
              Digital Voter Portal
            </h1>
          </div>
          <div className="flex space-x-4">
            <Link to="/login" className="text-white hover:underline">Login</Link>
            <Link to="/register" className="bg-white text-primary-navy px-4 py-2 rounded-lg font-medium hover:bg-primary-light transition">
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full p-4 mb-6">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-5xl font-heading font-bold text-white mb-6">
            Tamper-Proof Digital Voter Verification Portal
          </h1>
          <p className="text-xl text-white/90 mb-12">
            A secure public platform for voter verification, duplicate detection & audit transparency
          </p>

          {/* Quick Action Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            <Link to="/register" className="card hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Register as Voter</h3>
                <p className="text-sm text-gray-600">Create your voter profile with biometric verification</p>
              </div>
            </Link>

            <Link to="/dashboard" className="card hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Check Voter Status</h3>
                <p className="text-sm text-gray-600">Verify your voter registration and status</p>
              </div>
            </Link>

            <Link to="/elections" className="card hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">View Elections</h3>
                <p className="text-sm text-gray-600">Browse upcoming and active elections</p>
              </div>
            </Link>

            <Link to="/grievance" className="card hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Report Issue</h3>
                <p className="text-sm text-gray-600">Submit a grievance or support ticket</p>
              </div>
            </Link>

            <Link to="/track-application" className="card hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Track Application</h3>
                <p className="text-sm text-gray-600">Check your registration status</p>
              </div>
            </Link>

            <Link to="/audit-logs" className="card hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Audit Logs</h3>
                <p className="text-sm text-gray-600">Transparent audit trail with hash-chain verification</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/10 backdrop-blur-sm border-t border-white/20 mt-20">
        <div className="container mx-auto px-6 py-8 text-center text-white/80">
          <p>&copy; 2024 Digital Voter Verification System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

