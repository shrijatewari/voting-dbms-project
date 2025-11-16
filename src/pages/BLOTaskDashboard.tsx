import { useState, useEffect } from 'react';
import { bloTaskService } from '../services/api';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' }
];

export default function BLOTaskDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bloId, setBloId] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadTasks = async () => {
    if (!bloId) return;
    setLoading(true);
    setError('');
    try {
      const result = await bloTaskService.getBLOTasks(bloId, statusFilter !== 'all' ? statusFilter : undefined);
      const data = result.data?.data || result.data?.tasks || [];
      setTasks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
      setError(err.response?.data?.error || 'Unable to fetch BLO tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const submitTask = async (taskId: number, data: any) => {
    try {
      await bloTaskService.submitTask(taskId, data);
      await loadTasks();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit task');
    }
  };

  useEffect(() => {
    loadTasks();
  }, [bloId, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">BLO Task Management</h1>
              <p className="text-gray-500">Assign, track, and close field verification work</p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">BLO ID</label>
                <input
                  type="number"
                  value={bloId}
                  onChange={(e) => setBloId(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg w-28"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {STATUS_FILTERS.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider">Task ID</th>
                  <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider">Voter</th>
                  <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider">Task Type</th>
                  <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Loading tasks...
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No tasks found for this BLO.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.task_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">{task.task_id}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{task.voter_name || 'Unknown voter'}</div>
                        <div className="text-xs text-gray-500">ID: {task.voter_id}</div>
                        {task.voter_address && (
                          <div className="text-xs text-gray-500 mt-1">{task.voter_address}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 capitalize text-gray-800">
                        {task.task_type?.replace(/-/g, ' ') || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            task.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : task.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {task.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        {task.status !== 'completed' && (
                          <button
                            onClick={() =>
                              submitTask(task.task_id, {
                                status: 'completed',
                                notes: 'Task completed via admin console'
                              })
                            }
                            className="px-3 py-1 rounded bg-primary-navy text-white text-xs hover:bg-primary-royal"
                          >
                            Mark Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

