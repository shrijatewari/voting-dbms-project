import { useState, useEffect } from 'react';
import { revisionService } from '../services/api';

export default function RevisionAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const result = await revisionService.getActiveAnnouncements();
      setAnnouncements(result.data || []);
    } catch (err: any) {
      console.error('Failed to load announcements:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Voter Roll Revision Announcements</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements.map((announcement) => (
              <div key={announcement.announcement_id} className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{announcement.region_type}: {announcement.region_value}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Start:</strong> {announcement.start_date}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>End:</strong> {announcement.end_date}
                </p>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">Required Documents:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                    {announcement.docs_required?.map((doc: string, idx: number) => (
                      <li key={idx}>{doc}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {announcements.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No active revision announcements.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

