import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminService } from '../services/api';
import LanguageSelector from '../components/LanguageSelector';
import NotificationBell from '../components/NotificationBell';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalVoters: 50,
    verifiedVoters: 35,
    flaggedDuplicates: 5,
    deceasedPending: 5,
    revisionBatches: 0,
    grievancesPending: 9,
    bloTasksPending: 9,
    epicGeneratedToday: 50,
    aiServices: 6,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Fetch stats
        try {
          const statsRes = await adminService.getStats();
          const statsData = statsRes.data?.data || statsRes.data || {};
          setStats({
            totalVoters: statsData.totalVoters || 0,
            verifiedVoters: statsData.verifiedVoters || 0,
            flaggedDuplicates: statsData.duplicates || 0,
            deceasedPending: statsData.deathRecords || 0,
            revisionBatches: statsData.revisionBatches || 0,
            grievancesPending: statsData.grievancesPending || 0,
            bloTasksPending: statsData.bloTasksPending || 0,
            epicGeneratedToday: statsData.epicGeneratedToday || 0,
            aiServices: 6, // Will be updated by AI status check
          });
        } catch (err) {
          console.warn('Stats fetch failed, using defaults:', err);
        }

        // Fetch AI services status
        try {
          const aiStatusRes = await adminService.getAIStatus();
          const aiStatus = aiStatusRes.data?.data || {};
          if (aiStatus && typeof aiStatus === 'object') {
            const activeServices = Object.values(aiStatus).filter((s: any) => s.status === 'ok').length;
            setStats(prev => ({ ...prev, aiServices: activeServices }));
          }
        } catch (err) {
          console.warn('AI status check failed:', err);
        }

        // Fetch chart data
        try {
          const chartsRes = await adminService.getGraphs();
          const chartsData = chartsRes.data?.data || chartsRes.data || {};
          const regs = (chartsData.registrations || []).map((r: any) => ({
            name: r.month || r.date || '',
            voters: Number(r.count || 0),
          }));
          setChartData(regs.length > 0 ? regs : generateMockChartData());
          
          // Format status distribution
          const statusDist = chartsData.verificationDistribution || [];
          if (Array.isArray(statusDist) && statusDist.length > 0) {
            setStatusDistribution(statusDist.map((s: any) => ({
              name: s.name || 'Unknown',
              value: Number(s.value || 0),
              color: s.color || COLORS[statusDist.indexOf(s) % COLORS.length]
            })));
          } else {
            setStatusDistribution(generateMockStatusData());
          }
        } catch (err) {
          console.warn('Charts fetch failed:', err);
          setChartData(generateMockChartData());
          setStatusDistribution(generateMockStatusData());
        }

        setLastUpdated(new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 5000);

    loadDashboard();
    return () => clearTimeout(timeout);
  }, []);

  const generateMockChartData = () => {
    return [
      { name: '60', voters: 45 },
      { name: 'NOV 16', voters: 52 },
      { name: 'NOV 17', voters: 48 },
      { name: 'NOV 18', voters: 55 },
      { name: 'NOV 19', voters: 50 },
      { name: 'NOV 20', voters: 58 },
    ];
  };

  const generateMockStatusData = () => {
    return [
      { name: 'Verified', value: 35, color: '#10B981' },
      { name: 'Pending', value: 10, color: '#F59E0B' },
      { name: 'Rejected', value: 5, color: '#EF4444' },
    ];
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard Overview', icon: '📊', path: '/admin' },
    { id: 'ai', name: 'AI Services', icon: '🤖', path: '/admin/ai-services' },
    { id: 'voters', name: 'Voter Management', icon: '👥', path: '/admin/voters' },
    { id: 'revision', name: 'Roll Revision', icon: '📋', path: '/admin/revision' },
    { id: 'duplicates', name: 'Duplicate Detection', icon: '🔍', path: '/admin/duplicates' },
    { id: 'death', name: 'Death Record Sync', icon: '💀', path: '/admin/death-records' },
    { id: 'blo', name: 'BLO Field Verification', icon: '📝', path: '/admin/blo-tasks' },
    { id: 'grievances', name: 'Grievance Management', icon: '📢', path: '/admin/grievances' },
    { id: 'address', name: 'Address Analytics', icon: '📍', path: '/admin/address-flags' },
    { id: 'documents', name: 'Document Verification', icon: '📄', path: '/admin/documents' },
    { id: 'biometric', name: 'Biometric Operations', icon: '🔐', path: '/admin/biometric' },
    { id: 'communications', name: 'Official Communications', icon: '📨', path: '/admin/communications' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar - Dark Blue */}
      <div className="w-64 bg-blue-900 text-white flex flex-col shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-blue-800">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-900 font-bold text-xl">ECI</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">Admin Portal</h1>
              <p className="text-xs text-blue-200">Election Commission</p>
            </div>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                item.id === 'dashboard'
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">System Overview</h1>
            <p className="text-sm text-gray-600">Monitor and manage all election operations</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-xs text-gray-500">{lastUpdated || new Date().toLocaleTimeString()}</p>
            </div>
            <LanguageSelector />
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dashboard Content - Scrollable */}
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
          {/* Metric Cards Grid - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Registered Voters */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">👥</div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-800">{stats.totalVoters}</p>
                  <p className="text-sm text-gray-600 mt-1">Total Registered Voters</p>
                </div>
              </div>
              <Link to="/admin/voters" className="text-sm text-blue-600 hover:underline">
                View Details →
              </Link>
            </div>

            {/* Verified Voters */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">✅</div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-800">{stats.verifiedVoters}</p>
                  <p className="text-sm text-gray-600 mt-1">Verified Voters</p>
                </div>
              </div>
              <Link to="/admin/voters?status=verified" className="text-sm text-blue-600 hover:underline">
                View Details →
              </Link>
            </div>

            {/* Flagged Duplicates */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">🔍</div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-800">{stats.flaggedDuplicates}</p>
                  <p className="text-sm text-gray-600 mt-1">Flagged Duplicates</p>
                </div>
              </div>
              <Link to="/admin/duplicates" className="text-sm text-blue-600 hover:underline">
                View Details →
              </Link>
            </div>

            {/* Deceased Pending Approval */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-700 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">💀</div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-800">{stats.deceasedPending}</p>
                  <p className="text-sm text-gray-600 mt-1">Deceased Pending Approval</p>
                </div>
              </div>
              <Link to="/admin/death-records" className="text-sm text-blue-600 hover:underline">
                View Details →
              </Link>
            </div>

            {/* Active Revision Batches */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">📋</div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-800">{stats.revisionBatches}</p>
                  <p className="text-sm text-gray-600 mt-1">Active Revision Batches</p>
                </div>
              </div>
              <Link to="/admin/revision" className="text-sm text-blue-600 hover:underline">
                View Details →
              </Link>
            </div>

            {/* Pending Grievances */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">📢</div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-800">{stats.grievancesPending}</p>
                  <p className="text-sm text-gray-600 mt-1">Pending Grievances</p>
                </div>
              </div>
              <Link to="/admin/grievances" className="text-sm text-blue-600 hover:underline">
                View Details →
              </Link>
            </div>

            {/* BLO Tasks Pending */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-400 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">📝</div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-800">{stats.bloTasksPending}</p>
                  <p className="text-sm text-gray-600 mt-1">BLO Tasks Pending</p>
                </div>
              </div>
              <Link to="/admin/blo-tasks" className="text-sm text-blue-600 hover:underline">
                View Details →
              </Link>
            </div>

            {/* EPIC Generated Today */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-400 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">🪪</div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-800">{stats.epicGeneratedToday}</p>
                  <p className="text-sm text-gray-600 mt-1">EPIC Generated Today</p>
                </div>
              </div>
              <Link to="/admin/epic" className="text-sm text-blue-600 hover:underline">
                View Details →
              </Link>
            </div>

            {/* AI Services - Special Card */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-md p-6 text-white hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">🤖</div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{stats.aiServices}</p>
                  <p className="text-sm text-white/80 mt-1">AI Services</p>
                </div>
              </div>
              <Link to="/admin/ai-services" className="text-sm text-white hover:underline font-medium">
                Manage AI Services →
              </Link>
            </div>
          </div>

          {/* Charts Section - 2 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Voter Registration Trend */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Voter Registration Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="voters" 
                    stroke="#0D47A1" 
                    strokeWidth={2}
                    dot={{ fill: '#0D47A1', r: 4 }}
                    name="Voters"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Voter Status Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Voter Status Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
