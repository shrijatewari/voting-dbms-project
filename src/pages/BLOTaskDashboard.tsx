import { useState, useEffect } from 'react';
import { bloTaskService } from '../services/api';

export default function BLOTaskDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bloId, setBloId] = useState(1);

  const loadTasks = async () => {
    try {
      const result = await bloTaskService.getBLOTasks(bloId);
      setTasks(result.data.tasks || []);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
    }
  };

  const submitTask = async (taskId: number, data: any) => {
    try {
      await bloTaskService.submitTask(taskId, data);
      alert('Task submitted successfully!');
      loadTasks();
    } catch (err: any) {
      alert('Failed to submit task: ' + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => {
    loadTasks();
  }, [bloId]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">BLO Task Management</h1>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">BLO ID</label>
            <input
              type="number"
              value={bloId}
              onChange={(e) => setBloId(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.task_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.task_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-gray-900">ID: {task.voter_id}</p>
                        <p className="text-xs text-gray-500">{task.voter?.name || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.task_type || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.due_date || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.status !== 'completed' && (
                        <button
                          onClick={() => submitTask(task.task_id, { status: 'completed', notes: 'Task completed' })}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tasks found for this BLO.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

