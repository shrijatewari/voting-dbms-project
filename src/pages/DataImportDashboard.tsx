import { useState, useEffect } from 'react';
import { dataImportService } from '../services/api';

export default function DataImportDashboard() {
  const [imports, setImports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState({ name: '', dob: '', aadhaar_number: '' });

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const csvData = reader.result as string;
        const result = await dataImportService.createImport({
          filename: selectedFile.name,
          mapping,
          csv_data: csvData,
          preview: true
        });
        alert('Import created! Preview available.');
        loadImports();
      };
      reader.readAsText(selectedFile);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create import');
    } finally {
      setLoading(false);
    }
  };

  const runDedupe = async (importId: number) => {
    try {
      await dataImportService.runDedupeOnImport(importId, { threshold: 0.85 });
      alert('Deduplication completed!');
      loadImports();
    } catch (err: any) {
      alert('Failed to run deduplication: ' + (err.response?.data?.error || err.message));
    }
  };

  const commitImport = async (importId: number) => {
    if (!confirm('Are you sure you want to commit this import? This cannot be undone.')) {
      return;
    }
    try {
      await dataImportService.commitImport(importId, { skip_duplicates: true });
      alert('Import committed successfully!');
      loadImports();
    } catch (err: any) {
      alert('Failed to commit import: ' + (err.response?.data?.error || err.message));
    }
  };

  const loadImports = async () => {
    try {
      const result = await dataImportService.getAllImports(1, 100);
      setImports(result.data.imports || []);
    } catch (err: any) {
      console.error('Failed to load imports:', err);
    }
  };

  useEffect(() => {
    loadImports();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Data Import Dashboard</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Upload Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload CSV File</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name Column</label>
                  <input
                    type="text"
                    value={mapping.name}
                    onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DOB Column</label>
                  <input
                    type="text"
                    value={mapping.dob}
                    onChange={(e) => setMapping({ ...mapping, dob: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Date of Birth"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Column</label>
                  <input
                    type="text"
                    value={mapping.aadhaar_number}
                    onChange={(e) => setMapping({ ...mapping, aadhaar_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Aadhaar Number"
                  />
                </div>
              </div>
              <button
                onClick={handleFileUpload}
                disabled={loading || !selectedFile}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Upload & Preview'}
              </button>
            </div>
          </div>

          {/* Imports List */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Import History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Import ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Records</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duplicates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {imports.map((importRecord) => (
                    <tr key={importRecord.import_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{importRecord.import_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{importRecord.filename}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{importRecord.total_records || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{importRecord.duplicate_records || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          importRecord.status === 'completed' ? 'bg-green-100 text-green-800' :
                          importRecord.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {importRecord.status || 'preview'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {importRecord.status === 'preview' && (
                            <>
                              <button
                                onClick={() => runDedupe(importRecord.import_id)}
                                className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                              >
                                Run Dedupe
                              </button>
                              <button
                                onClick={() => commitImport(importRecord.import_id)}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                Commit
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {imports.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No imports found. Upload a CSV file to get started.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

