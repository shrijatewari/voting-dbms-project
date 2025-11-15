import { useState } from 'react';
import { aiService } from '../../services/api';

export default function AIDuplicateTest() {
  const [record1, setRecord1] = useState({
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
  });
  const [record2, setRecord2] = useState({
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
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const response = await aiService.predictDuplicate(record1, record2);
      setResult(response);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">🔍 Duplicate Detection Test</h2>
      
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Record 1</h3>
          <textarea
            value={JSON.stringify(record1, null, 2)}
            onChange={(e) => {
              try {
                setRecord1(JSON.parse(e.target.value));
              } catch {}
            }}
            className="w-full h-64 font-mono text-xs border rounded p-2"
          />
        </div>
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Record 2</h3>
          <textarea
            value={JSON.stringify(record2, null, 2)}
            onChange={(e) => {
              try {
                setRecord2(JSON.parse(e.target.value));
              } catch {}
            }}
            className="w-full h-64 font-mono text-xs border rounded p-2"
          />
        </div>
      </div>

      <button
        onClick={handleTest}
        disabled={loading}
        className="w-full px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 mb-6"
      >
        {loading ? 'Testing...' : '🔍 Test Duplicate Detection'}
      </button>

      {result && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-800 mb-4">Test Results</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Duplicate Probability:</span>
              <span className={`text-2xl font-bold ${
                result.duplicate_probability > 0.7 ? 'text-red-600' : 'text-green-600'
              }`}>
                {(result.duplicate_probability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Confidence:</span>
              <span className="text-lg">{(result.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Recommendation:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                result.recommendation === 'merge' ? 'bg-red-100 text-red-800' :
                result.recommendation === 'review' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {result.recommendation.toUpperCase()}
              </span>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Feature Scores:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(result.features || {}).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600">{key.replace('_', ' ')}:</span>
                    <span className="font-semibold">{(value * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            {result.algorithm_flags && result.algorithm_flags.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Algorithm Flags:</h4>
                <div className="flex flex-wrap gap-2">
                  {result.algorithm_flags.map((flag: string) => (
                    <span key={flag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

