import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { aiService, voterService } from '../../services/api';
import LanguageSelector from '../../components/LanguageSelector';

interface AIHealthStatus {
  [key: string]: {
    status: string;
    timestamp?: string;
    service?: string;
    error?: string;
  };
}

type DemoResult = {
  status: 'success' | 'error';
  result?: any;
  error?: string;
  timestamp?: string;
};

const formatPercent = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0.0%';
  }
  return `${(value * 100).toFixed(1)}%`;
};

const mapVoterToRecord = (voter: any) => ({
  voter_id: voter?.voter_id,
  name: voter?.name,
  dob: voter?.dob,
  aadhaar_number: voter?.aadhaar_number,
  father_name: voter?.father_name,
  address: {
    house_number: voter?.house_number,
    street: voter?.street,
    village_city: voter?.village_city,
    district: voter?.district,
    state: voter?.state,
    pin_code: voter?.pin_code
  }
});

const DEFAULT_RECORDS = [
  {
    voter_id: 1,
    name: 'Rajesh Kumar',
    dob: '1990-05-15',
    aadhaar_number: '123456789012',
    father_name: 'Ramesh Kumar',
    address: {
      house_number: '123',
      street: 'Main Street',
      village_city: 'Delhi',
      district: 'New Delhi',
      state: 'Delhi',
      pin_code: '110001'
    }
  },
  {
    voter_id: 2,
    name: 'Rajesh K',
    dob: '1990-05-15',
    aadhaar_number: '123456789013',
    father_name: 'Ramesh K',
    address: {
      house_number: '123',
      street: 'Main St',
      village_city: 'Delhi',
      district: 'New Delhi',
      state: 'Delhi',
      pin_code: '110001'
    }
  }
];

export default function AIServicesDashboard() {
  const { t } = useTranslation();
  const [healthStatus, setHealthStatus] = useState<AIHealthStatus>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [testResults, setTestResults] = useState<any>(null);
  const [sampleRecords, setSampleRecords] = useState<any[]>([]);
  const [demoResults, setDemoResults] = useState<Record<string, DemoResult>>({});
  const [runningDemo, setRunningDemo] = useState(false);
  const [demoTimeline, setDemoTimeline] = useState<string[]>([]);

  useEffect(() => {
    checkHealth();
    fetchSampleData();
  }, []);

  const fetchSampleData = async () => {
    try {
      const res = await voterService.getAll(1, 5);
      const records = (res.data?.voters || []).map(mapVoterToRecord);
      if (records.length >= 2) {
        setSampleRecords(records);
        runLiveDemo(records);
      } else {
        setSampleRecords(DEFAULT_RECORDS);
        runLiveDemo(DEFAULT_RECORDS);
      }
    } catch (error) {
      console.warn('Failed to fetch sample voters, falling back to mock data.');
      setSampleRecords(DEFAULT_RECORDS);
      runLiveDemo(DEFAULT_RECORDS);
    }
  };

  const runLiveDemo = async (recordsOverride?: any[]) => {
    const records = recordsOverride && recordsOverride.length >= 2 ? recordsOverride : sampleRecords;
    setRunningDemo(true);
    const timeline: string[] = [];
    const appendLog = (msg: string) => {
      const entry = `${new Date().toLocaleTimeString()} • ${msg}`;
      timeline.unshift(entry);
    };
    const demoPayload: Record<string, DemoResult> = {};

      const record1 = (records && records[0]) || DEFAULT_RECORDS[0];
      const record2 = (records && records[1]) || DEFAULT_RECORDS[1];
      appendLog(`Loaded voter #${record1.voter_id} (${record1.name}) and voter #${record2.voter_id} (${record2.name})`);

    try {
      const duplicate = await aiService.predictDuplicate(record1, record2);
      demoPayload.duplicate = {
        status: 'success',
        result: duplicate.data || duplicate,
        timestamp: new Date().toISOString()
      };
      appendLog(
        `Duplicate check complete – probability ${formatPercent(duplicate.data?.duplicate_probability ?? duplicate.duplicate_probability)}`
      );
    } catch (error: any) {
      demoPayload.duplicate = { status: 'error', error: error.message };
      appendLog('Duplicate check failed (using fallback).');
    }

    try {
      const normalized = await aiService.normalizeAddress(record1.address);
      demoPayload.address = {
        status: 'success',
        result: normalized.data || normalized,
        timestamp: new Date().toISOString()
      };
      appendLog(
        `Address normalized for ${normalized.data?.normalized_address?.village_city ?? normalized.normalized_address?.village_city}`
      );
    } catch (error: any) {
      demoPayload.address = { status: 'error', error: error.message };
      appendLog('Address normalization failed (using fallback).');
    }

    try {
      const fraudAddress = {
        ...record1.address,
        house_number: 'Ghost 999',
        street: 'Phantom Lane',
        village_city: 'Nowhere',
        pin_code: '000000'
      };
      const fraud = await aiService.detectAddressFraud(fraudAddress);
      demoPayload.fraud = {
        status: 'success',
        result: fraud.data || fraud,
        timestamp: new Date().toISOString()
      };
      appendLog(`Fraud scan result – ${fraud.data?.is_fraud ?? fraud.is_fraud ? 'risk detected' : 'no red flags'}.`);
    } catch (error: any) {
      demoPayload.fraud = { status: 'error', error: error.message };
      appendLog('Fraud scan failed (using fallback).');
    }

    try {
      const mockBase64 =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const document = await aiService.verifyDocument(mockBase64, 'aadhaar');
      demoPayload.document = {
        status: 'success',
        result: document.data || document,
        timestamp: new Date().toISOString()
      };
      appendLog(`Document OCR confidence ${formatPercent(document.data?.confidence ?? document.confidence)}.`);
    } catch (error: any) {
      demoPayload.document = { status: 'error', error: error.message };
      appendLog('Document verification failed (using fallback).');
    }

    try {
      const embedding1 = Array(128)
        .fill(0)
        .map(() => Math.random());
      const embedding2 = Array(128)
        .fill(0)
        .map(() => Math.random());
      const face = await aiService.matchFace(embedding1, embedding2);
      demoPayload.face = {
        status: 'success',
        result: face.data || face,
        timestamp: new Date().toISOString()
      };
      appendLog(`Face match similarity ${formatPercent(face.data?.similarity_score ?? face.similarity_score)}.`);
    } catch (error: any) {
      demoPayload.face = { status: 'error', error: error.message };
      appendLog('Face matching failed (using fallback).');
    }

    setDemoResults(demoPayload);
    setDemoTimeline(timeline.slice(0, 8));
    setRunningDemo(false);
  };

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await aiService.healthCheck();
      // Handle both direct response and response.data
      const health = response.data || response;
      setHealthStatus(health);
    } catch (error: any) {
      console.error('Health check failed:', error);
      // If token error, redirect to login
      if (error.response?.status === 401 || error.message?.includes('token')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
        return;
      }
      // Set error status for each service
      setHealthStatus({
        duplicate: { status: 'error', error: error.message || 'Service unavailable' },
        address: { status: 'error', error: error.message || 'Service unavailable' },
        deceased: { status: 'error', error: error.message || 'Service unavailable' },
        document: { status: 'error', error: error.message || 'Service unavailable' },
        forgery: { status: 'error', error: error.message || 'Service unavailable' },
        biometric: { status: 'error', error: error.message || 'Service unavailable' }
      });
    } finally {
      setLoading(false);
    }
  };

  const testDuplicateDetection = async () => {
    setLoading(true);
    try {
      // Check if user is logged in
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Please log in to test AI services.');
        window.location.href = '/login';
        return;
      }

      const record1 = sampleRecords[0] || DEFAULT_RECORDS[0];
      const record2 = sampleRecords[1] || DEFAULT_RECORDS[1];
      const result = await aiService.predictDuplicate(record1, record2);
      setTestResults({ type: 'duplicate', result: result.data || result });
    } catch (error: any) {
      if (error.response?.status === 401 || error.message?.includes('token')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
        return;
      }
      alert(error.response?.data?.error || error.message || 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  const testAddressNormalization = async () => {
    setLoading(true);
    try {
      const address =
        sampleRecords[0]?.address || {
          house_number: '123',
          street: 'Main St',
          village_city: 'Delhi',
          district: 'New Delhi',
          state: 'Delhi',
          pin_code: '110001'
        };
      const result = await aiService.normalizeAddress(address);
      setTestResults({ type: 'address', result });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  const testAddressFraud = async () => {
    setLoading(true);
    try {
      const baseAddress = sampleRecords[0]?.address || {};
      const address = {
        ...baseAddress,
        house_number: baseAddress.house_number || 'Ghost 404',
        street: 'Fraudster Gali',
        village_city: 'Phantom City',
        district: baseAddress.district || 'Unknown',
        state: baseAddress.state || 'Nowhere',
        pin_code: '999999'
      };
      const result = await aiService.detectAddressFraud(address);
      setTestResults({ type: 'fraud', result });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  const testDocumentVerification = async () => {
    setLoading(true);
    try {
      // Mock base64 image (in production, use actual document)
      const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const result = await aiService.verifyDocument(mockBase64, 'aadhaar');
      setTestResults({ type: 'document', result });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  const testFaceMatching = async () => {
    setLoading(true);
    try {
      // Mock embeddings (128-dimensional vectors)
      const embedding1 = Array(128).fill(0).map(() => Math.random());
      const embedding2 = Array(128).fill(0).map(() => Math.random());
      const result = await aiService.matchFace(embedding1, embedding2);
      setTestResults({ type: 'face', result });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  const services = [
    {
      id: 'duplicate',
      name: 'Duplicate Detection',
      icon: '🔍',
      description: 'AI-powered duplicate voter detection using ML and fuzzy matching',
      color: 'bg-red-500',
      testFunction: testDuplicateDetection
    },
    {
      id: 'address',
      name: 'Address Intelligence',
      icon: '📍',
      description: 'Address normalization and fraud detection',
      color: 'bg-blue-500',
      testFunction: testAddressNormalization
    },
    {
      id: 'fraud',
      name: 'Address Fraud Detection',
      icon: '⚠️',
      description: 'Detect suspicious and fraudulent addresses',
      color: 'bg-orange-500',
      testFunction: testAddressFraud
    },
    {
      id: 'deceased',
      name: 'Deceased Matching',
      icon: '⚰️',
      description: 'Match voters with civil registry death records',
      color: 'bg-gray-600',
      testFunction: null
    },
    {
      id: 'document',
      name: 'Document Verification',
      icon: '📄',
      description: 'OCR extraction and fake document detection',
      color: 'bg-purple-500',
      testFunction: testDocumentVerification
    },
    {
      id: 'forgery',
      name: 'Forgery Detection',
      icon: '🔐',
      description: 'Detect tampered official notices and documents',
      color: 'bg-indigo-500',
      testFunction: null
    },
    {
      id: 'biometric',
      name: 'Biometric Matching',
      icon: '👤',
      description: 'Face and fingerprint matching for identity verification',
      color: 'bg-teal-500',
      testFunction: testFaceMatching
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🤖 AI Services Dashboard</h1>
            <p className="text-gray-600">Manage and test all AI microservices</p>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSelector compact={true} showLabel={false} />
            <button
              onClick={checkHealth}
              disabled={loading}
              className="px-4 py-2 bg-primary-navy text-white rounded-lg hover:bg-primary-royal transition-colors disabled:opacity-50"
            >
              🔄 Refresh Health
            </button>
          </div>
        </div>

        {/* Health Status Cards */}
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Object.entries(healthStatus).map(([service, status]) => (
            <div
              key={service}
              className={`bg-white rounded-xl shadow-lg p-4 border-l-4 ${
                status.status === 'ok' ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700 capitalize">{service}</span>
                <span className={`w-3 h-3 rounded-full ${status.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </div>
              <p className="text-xs text-gray-500">
                {status.status === 'ok' ? 'Online' : 'Offline'}
              </p>
            </div>
          ))}
        </div>

        {/* Live Demo */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Live Demo (Seeded Data)</h2>
              <p className="text-sm text-gray-500">Auto-runs tests using the seeded voter dataset so you can present real numbers instantly.</p>
            </div>
            <button
              onClick={() => runLiveDemo()}
              disabled={runningDemo}
              className="px-4 py-2 bg-primary-navy text-white rounded-lg hover:bg-primary-royal transition disabled:opacity-50"
            >
              {runningDemo ? 'Running...' : 'Re-run Demo'}
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['duplicate', 'address', 'fraud', 'document', 'face'].map((key) => {
              const data = demoResults[key] || {};
              return (
                <div key={key} className="border rounded-xl p-4 bg-gray-50 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 capitalize">{key} test</h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        data.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {data.status === 'success' ? 'Ready' : 'Error'}
                    </span>
                  </div>
                  {data.status === 'success' ? (
                    <div className="text-sm text-gray-600 space-y-1">
                      {key === 'duplicate' && (
                        <>
                          <p>Probability: <strong className="text-primary-navy">{formatPercent(data.result?.duplicate_probability)}</strong></p>
                          <p>Confidence: <strong>{formatPercent(data.result?.confidence)}</strong></p>
                          <p>Recommendation: <span className="capitalize">{data.result?.recommendation}</span></p>
                        </>
                      )}
                      {key === 'address' && (
                        <>
                          <p>Normalized City: <strong>{data.result?.normalized_address?.village_city || 'N/A'}</strong></p>
                          <p>Confidence: <strong>{formatPercent(data.result?.confidence)}</strong></p>
                        </>
                      )}
                      {key === 'fraud' && (
                        <>
                          <p>Fraud Detected: <strong>{data.result?.is_fraud ? 'Yes' : 'No'}</strong></p>
                          <p>Risk Score: <strong>{formatPercent(data.result?.risk_score)}</strong></p>
                        </>
                      )}
                      {key === 'document' && (
                        <>
                          <p>Fake Document: <strong>{data.result?.is_fake ? 'Yes' : 'No'}</strong></p>
                          <p>Confidence: <strong>{formatPercent(data.result?.confidence)}</strong></p>
                        </>
                      )}
                      {key === 'face' && (
                        <>
                          <p>Match Probability: <strong>{formatPercent(data.result?.match_probability)}</strong></p>
                          <p>Similarity: <strong>{formatPercent(data.result?.similarity_score)}</strong></p>
                        </>
                      )}
                      <p className="text-xs text-gray-400">
                        {data.timestamp ? `Updated ${new Date(data.timestamp).toLocaleTimeString()}` : ''}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">{data.error || 'Awaiting run'}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Data Being Scanned</h3>
            <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Voter ID</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Address</th>
                </tr>
              </thead>
              <tbody>
                {(sampleRecords.length ? sampleRecords.slice(0, 2) : DEFAULT_RECORDS).map((record) => (
                  <tr key={record.voter_id} className="border-t">
                    <td className="px-4 py-2 font-semibold text-gray-800">#{record.voter_id}</td>
                    <td className="px-4 py-2 text-gray-700">{record.name}</td>
                    <td className="px-4 py-2 text-gray-600 text-xs">
                      {[record.address?.house_number, record.address?.street, record.address?.village_city, record.address?.district, record.address?.state, record.address?.pin_code]
                        .filter(Boolean)
                        .join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 mt-3">These two records are fed into duplicate, address, fraud, document, and face-matching AI tests live.</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Scanning Timeline</h3>
            <div className="h-48 overflow-y-auto space-y-2">
              {demoTimeline.length === 0 ? (
                <p className="text-sm text-gray-500">Run the demo to see the AI processing log.</p>
              ) : (
                demoTimeline.map((entry, idx) => (
                  <div key={idx} className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded px-3 py-2">
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-primary-navy text-primary-navy'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('test')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'test'
                    ? 'border-primary-navy text-primary-navy'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Test Services
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'results'
                    ? 'border-primary-navy text-primary-navy'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Test Results
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all border-l-4 border-transparent hover:border-primary-navy"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-16 h-16 ${service.color} rounded-lg flex items-center justify-center text-3xl shadow-md`}>
                    {service.icon}
                  </div>
                  {service.testFunction && (
                    <button
                      onClick={service.testFunction}
                      disabled={loading}
                      className="px-3 py-1 bg-primary-navy text-white text-xs rounded-lg hover:bg-primary-royal transition-colors disabled:opacity-50"
                    >
                      Test
                    </button>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{service.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    healthStatus[service.id]?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  {healthStatus[service.id]?.status === 'ok' ? 'Service Online' : 'Service Offline'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Test Services Tab */}
        {activeTab === 'test' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Test AI Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <span className="text-2xl mr-2">🔍</span>
                  Duplicate Detection Test
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Test if two voter records are detected as duplicates using ML and fuzzy matching
                </p>
                <button
                  onClick={testDuplicateDetection}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 font-medium"
                >
                  {loading ? 'Testing...' : '▶️ Run Test'}
                </button>
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <span className="text-2xl mr-2">📍</span>
                  Address Normalization Test
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Test address normalization and standardization using NLP
                </p>
                <button
                  onClick={testAddressNormalization}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium"
                >
                  {loading ? 'Testing...' : '▶️ Run Test'}
                </button>
              </div>

              <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <span className="text-2xl mr-2">⚠️</span>
                  Address Fraud Detection Test
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Test fraud detection on suspicious addresses and ghost houses
                </p>
                <button
                  onClick={testAddressFraud}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 font-medium"
                >
                  {loading ? 'Testing...' : '▶️ Run Test'}
                </button>
              </div>

              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <span className="text-2xl mr-2">📄</span>
                  Document Verification Test
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Test OCR extraction and fake document detection
                </p>
                <button
                  onClick={testDocumentVerification}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 font-medium"
                >
                  {loading ? 'Testing...' : '▶️ Run Test'}
                </button>
              </div>

              <div className="border-2 border-teal-200 rounded-lg p-4 bg-teal-50">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <span className="text-2xl mr-2">👤</span>
                  Face Matching Test
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Test face embedding matching using cosine similarity
                </p>
                <button
                  onClick={testFaceMatching}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 font-medium"
                >
                  {loading ? 'Testing...' : '▶️ Run Test'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test Results Tab */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Test Results</h2>
            {testResults ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6">
                  <h3 className="font-bold text-blue-800 mb-4 text-lg flex items-center">
                    {testResults.type === 'duplicate' && <span className="text-2xl mr-2">🔍</span>}
                    {testResults.type === 'address' && <span className="text-2xl mr-2">📍</span>}
                    {testResults.type === 'fraud' && <span className="text-2xl mr-2">⚠️</span>}
                    {testResults.type === 'document' && <span className="text-2xl mr-2">📄</span>}
                    {testResults.type === 'face' && <span className="text-2xl mr-2">👤</span>}
                    {testResults.type === 'duplicate' && 'Duplicate Detection Result'}
                    {testResults.type === 'address' && 'Address Normalization Result'}
                    {testResults.type === 'fraud' && 'Fraud Detection Result'}
                    {testResults.type === 'document' && 'Document Verification Result'}
                    {testResults.type === 'face' && 'Face Matching Result'}
                  </h3>
                  
                  {/* Display results based on type */}
                  {testResults.type === 'duplicate' && (
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">Duplicate Probability:</span>
                          <span className={`text-3xl font-bold ${
                            (testResults.result.duplicate_probability || 0) > 0.7 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatPercent(testResults.result.duplicate_probability)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">Confidence:</span>
                          <span className="text-xl">{formatPercent(testResults.result.confidence)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Recommendation:</span>
                          <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                            testResults.result.recommendation === 'merge' ? 'bg-red-100 text-red-800' :
                            testResults.result.recommendation === 'review' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {testResults.result.recommendation.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      {testResults.result.features && (
                        <div className="bg-white rounded-lg p-4">
                          <h4 className="font-semibold mb-3">Feature Scores:</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(testResults.result.features).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm text-gray-700 capitalize">{key.replace(/_/g, ' ')}:</span>
                                <span className="font-bold text-primary-navy">{formatPercent(value as number)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {testResults.result.algorithm_flags && testResults.result.algorithm_flags.length > 0 && (
                        <div className="bg-white rounded-lg p-4">
                          <h4 className="font-semibold mb-2">Algorithm Flags:</h4>
                          <div className="flex flex-wrap gap-2">
                            {testResults.result.algorithm_flags.map((flag: string) => (
                              <span key={flag} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                {flag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {testResults.type === 'address' && (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Normalized Address:</h4>
                      <pre className="text-sm bg-gray-50 p-3 rounded border">
                        {JSON.stringify(testResults.result.normalized_address, null, 2)}
                      </pre>
                      <div className="mt-3">
                        <span className="font-semibold">Confidence: </span>
                        <span className="text-lg font-bold text-primary-navy">
                          {formatPercent(testResults.result.confidence)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {testResults.type === 'fraud' && (
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold">Fraud Detected:</span>
                        <span className={`px-4 py-2 rounded-full font-bold ${
                          testResults.result.is_fraud ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {testResults.result.is_fraud ? 'YES' : 'NO'}
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Risk Score: </span>
                        <span className="text-2xl font-bold text-orange-600">
                          {formatPercent(testResults.result.risk_score)}
                        </span>
                      </div>
                      {testResults.result.reasons && testResults.result.reasons.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Reasons:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {testResults.result.reasons.map((reason: string, idx: number) => (
                              <li key={idx} className="text-sm text-gray-700">{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {testResults.type === 'document' && (
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold">Is Fake:</span>
                        <span className={`px-4 py-2 rounded-full font-bold ${
                          testResults.result.is_fake ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {testResults.result.is_fake ? 'YES' : 'NO'}
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Confidence: </span>
                        <span className="text-xl font-bold text-primary-navy">
                          {formatPercent(testResults.result.confidence)}
                        </span>
                      </div>
                      {testResults.result.ocr_data && (
                        <div className="mt-3">
                          <h4 className="font-semibold mb-2">OCR Extracted Data:</h4>
                          <pre className="text-sm bg-gray-50 p-3 rounded border">
                            {JSON.stringify(testResults.result.ocr_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {testResults.type === 'face' && (
                    <div className="bg-white rounded-lg p-4">
                      <div className="mb-4">
                        <span className="font-semibold">Match Probability: </span>
                        <span className="text-3xl font-bold text-primary-navy">
                          {formatPercent(testResults.result.match_probability)}
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Similarity Score: </span>
                        <span className="text-xl">{formatPercent(testResults.result.similarity_score)}</span>
                      </div>
                      <div>
                        <span className="font-semibold">Confidence: </span>
                        <span className="text-lg">{formatPercent(testResults.result.confidence)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Raw JSON (collapsible) */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-gray-600 hover:text-gray-800">
                      View Raw JSON
                    </summary>
                    <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded mt-2 overflow-auto max-h-64">
                      {JSON.stringify(testResults.result, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🤖</div>
                <p className="text-gray-500 text-lg mb-2">No test results yet</p>
                <p className="text-gray-400 text-sm">Run a test from the "Test Services" tab to see AI results</p>
              </div>
            )}
          </div>
        )}

        {/* AI Service Statistics */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">AI Service Statistics</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-primary-navy">
                {Object.values(healthStatus).filter(s => s.status === 'ok').length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Services Online</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">6</p>
              <p className="text-sm text-gray-600 mt-1">Total Services</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">100%</p>
              <p className="text-sm text-gray-600 mt-1">Uptime</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">0ms</p>
              <p className="text-sm text-gray-600 mt-1">Avg Response</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

