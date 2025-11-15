import { useState } from 'react';
import { grievanceService } from '../services/api';

export default function GrievancePortal() {
  const [formData, setFormData] = useState({
    voter_id: '',
    aadhaar_number: '',
    issue_type: 'wrong_details',
    subject: '',
    description: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await grievanceService.create(formData);
      setTicketNumber(response.data.data.ticket_number);
      setSuccess(`Grievance submitted successfully! Ticket Number: ${response.data.data.ticket_number}`);
      setFormData({
        voter_id: '',
        aadhaar_number: '',
        issue_type: 'wrong_details',
        subject: '',
        description: '',
        priority: 'medium'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit grievance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-light py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <h1 className="text-3xl font-heading font-bold text-gray-800 mb-2">Grievance Portal</h1>
          <p className="text-gray-600 mb-8">Report issues with your voter registration or election-related concerns</p>

          {error && (
            <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-success/10 border border-success text-success px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voter ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.voter_id}
                  onChange={(e) => setFormData({ ...formData, voter_id: e.target.value })}
                  className="input-field"
                  placeholder="Enter your Voter ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhaar Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.aadhaar_number}
                  onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
                  className="input-field"
                  placeholder="12-digit Aadhaar"
                  maxLength={12}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type *
              </label>
              <select
                value={formData.issue_type}
                onChange={(e) => setFormData({ ...formData, issue_type: e.target.value })}
                className="input-field"
                required
              >
                <option value="wrong_details">Wrong Voter Details</option>
                <option value="duplicate_entry">Duplicate Entry</option>
                <option value="missing_name">Missing Name in Voter List</option>
                <option value="deceased_not_removed">Deceased Voter Not Removed</option>
                <option value="wrong_polling_station">Wrong Polling Station</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="input-field"
                placeholder="Brief description of the issue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows={6}
                placeholder="Provide detailed information about your grievance..."
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Grievance'}
            </button>
          </form>

          {ticketNumber && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Save your ticket number for tracking:</p>
              <p className="text-xl font-bold text-blue-600">{ticketNumber}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

