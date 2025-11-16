import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './i18n/config'; // Initialize i18n
import LandingPage from './pages/LandingPage';
import EnhancedLandingPage from './pages/EnhancedLandingPage';
import CitizenDashboard from './pages/CitizenDashboard';
import EnhancedCitizenDashboard from './pages/EnhancedCitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import VoterRegistration from './pages/VoterRegistration';
import VoterProfile from './pages/VoterProfile';
import AuditLogsPage from './pages/AuditLogsPage';
import ElectionsPage from './pages/ElectionsPage';
import VoteCastingPage from './pages/VoteCastingPage';
import LoginPage from './pages/LoginPage';
import GrievancePortal from './pages/GrievancePortal';
import ApplicationTracking from './pages/ApplicationTracking';
import EPICDownload from './pages/EPICDownload';
import PollingStationFinder from './pages/PollingStationFinder';
import UpdateProfile from './pages/UpdateProfile';
import DuplicateDetectionDashboard from './pages/DuplicateDetectionDashboard';
import DeathRecordSyncDashboard from './pages/DeathRecordSyncDashboard';
import BLOTaskDashboard from './pages/BLOTaskDashboard';
import TransparencyPortal from './pages/TransparencyPortal';
import AppealsManagement from './pages/AppealsManagement';
import RevisionAnnouncements from './pages/RevisionAnnouncements';
import CommunicationsPortal from './pages/CommunicationsPortal';
import DataImportDashboard from './pages/DataImportDashboard';
import SecuritySIEMDashboard from './pages/SecuritySIEMDashboard';
import LedgerVerificationPage from './pages/LedgerVerificationPage';
import EndToEndVerificationPage from './pages/EndToEndVerificationPage';
import VoterManagement from './pages/admin/VoterManagement';
import RollRevision from './pages/admin/RollRevision';
import AIServicesDashboard from './pages/admin/AIServicesDashboard';
import GrievanceManagement from './pages/admin/GrievanceManagement';
import EPICManagement from './pages/admin/EPICManagement';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    if (token && userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      // Consider any non-citizen role as admin access
      setIsAdmin(parsed.role && parsed.role.toLowerCase() !== 'citizen');
    }
  }, []);

  const ProtectedRoute = ({ children, adminOnly = false }: { children: JSX.Element; adminOnly?: boolean }) => {
    if (!user) {
      return <Navigate to="/login" />;
    }
    if (adminOnly && !isAdmin) {
      return <Navigate to="/dashboard" />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<EnhancedLandingPage />} />
        <Route path="/old-landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage setUser={setUser} setIsAdmin={setIsAdmin} />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <EnhancedCitizenDashboard user={user} />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Module Routes */}
        <Route
          path="/admin/voters"
          element={
            <ProtectedRoute adminOnly>
              <VoterManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/revision"
          element={
            <ProtectedRoute adminOnly>
              <RollRevision />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ai-services"
          element={
            <ProtectedRoute adminOnly>
              <AIServicesDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/grievances"
          element={
            <ProtectedRoute adminOnly>
              <GrievanceManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/epic"
          element={
            <ProtectedRoute adminOnly>
              <EPICManagement />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/register"
          element={
            <ErrorBoundary>
              <VoterRegistration />
            </ErrorBoundary>
          }
        />
        
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <VoterProfile />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/audit-logs"
          element={<AuditLogsPage />}
        />
        
        <Route
          path="/elections"
          element={<ElectionsPage />}
        />
        
        <Route
          path="/vote/:electionId"
          element={
            <ProtectedRoute>
              <VoteCastingPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/grievance"
          element={<GrievancePortal />}
        />
        
        <Route
          path="/track-application"
          element={<ApplicationTracking />}
        />
        
        <Route
          path="/epic-download"
          element={
            <ProtectedRoute>
              <EPICDownload />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/find-polling-station"
          element={<PollingStationFinder />}
        />
        
        <Route
          path="/update-profile"
          element={
            <ProtectedRoute>
              <UpdateProfile />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Features */}
        <Route
          path="/admin/duplicates"
          element={
            <ProtectedRoute adminOnly>
              <DuplicateDetectionDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/death-records"
          element={
            <ProtectedRoute adminOnly>
              <DeathRecordSyncDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/blo-tasks"
          element={
            <ProtectedRoute adminOnly>
              <BLOTaskDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/transparency"
          element={
            <ProtectedRoute adminOnly>
              <TransparencyPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/data-import"
          element={
            <ProtectedRoute adminOnly>
              <DataImportDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security"
          element={
            <ProtectedRoute adminOnly>
              <SecuritySIEMDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ledger"
          element={
            <ProtectedRoute adminOnly>
              <LedgerVerificationPage />
            </ProtectedRoute>
          }
        />
        
        {/* Public Features */}
        <Route
          path="/transparency"
          element={<TransparencyPortal />}
        />
        <Route
          path="/revision-announcements"
          element={<RevisionAnnouncements />}
        />
        <Route
          path="/communications"
          element={<CommunicationsPortal />}
        />
        
        {/* Citizen Features */}
        <Route
          path="/appeals"
          element={
            <ProtectedRoute>
              <AppealsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verify-vote"
          element={
            <ProtectedRoute>
              <EndToEndVerificationPage />
            </ProtectedRoute>
          }
        />
        
        {/* Catch-all route for 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-gray-600 mb-6">Page not found</p>
                <a href="/" className="text-blue-600 hover:underline">Go back to home</a>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

