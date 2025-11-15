
import React, { useState, useCallback } from 'react';
import StatCard from './StatCard';
import RegistrationChart from './RegistrationChart';
import AnomalyAlert from './AnomalyAlert';
import AuditLogItem from './AuditLogItem';
import AISummaryModal from './AISummaryModal';
import { UsersIcon, ChartBarIcon, ShieldExclamationIcon, DocumentTextIcon, SparklesIcon } from './icons';
import { IAnomaly, IAuditLog, IChartData, AnomalySeverity, AuditTransactionType, AnomalyStatus } from '../types';
import { summarizeAnomalies } from '../services/geminiService';

const mockChartData: IChartData[] = [
  { month: 'Jan', registrations: 1200 },
  { month: 'Feb', registrations: 1800 },
  { month: 'Mar', registrations: 1500 },
  { month: 'Apr', registrations: 2200 },
  { month: 'May', registrations: 2500 },
  { month: 'Jun', registrations: 2100 },
  { month: 'Jul', registrations: 3100 },
  { month: 'Aug', registrations: 2900 },
];

const mockAnomalies: IAnomaly[] = [
  { id: '1', type: 'Mass Registration', severity: AnomalySeverity.Critical, description: '300+ registrations from a single IP address in 2 hours.', timestamp: '2 mins ago', status: AnomalyStatus.New },
  { id: '2', type: 'Suspicious Pattern', severity: AnomalySeverity.High, description: 'Unusual login activity detected for Admin account "j.doe".', timestamp: '15 mins ago', status: AnomalyStatus.New },
  { id: '3', type: 'Data Inconsistency', severity: AnomalySeverity.Medium, description: 'Biometric hash mismatch for voter ID #84321.', timestamp: '1 hour ago', status: AnomalyStatus.UnderReview },
];

const mockAuditLogs: IAuditLog[] = [
  { id: 'a1', transactionType: AuditTransactionType.Vote, description: 'Vote cast for election E-2024-STATE.', user: 'Officer B', ip: '192.168.1.10', timestamp: '30 secs ago' },
  { id: 'a2', transactionType: AuditTransactionType.Registration, description: 'New voter registered: A. Kumar.', user: 'Admin User', ip: '203.0.113.25', timestamp: '5 mins ago' },
  { id: 'a3', transactionType: AuditTransactionType.Login, description: 'User "Admin User" logged in successfully.', user: 'Admin User', ip: '203.0.113.25', timestamp: '25 mins ago' },
  { id: 'a4', transactionType: AuditTransactionType.Verification, description: 'Voter #58219 verified successfully.', user: 'Officer A', ip: '192.168.1.12', timestamp: '45 mins ago' },
];

const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateSummary = useCallback(async () => {
    setIsModalOpen(true);
    setIsLoading(true);
    const result = await summarizeAnomalies(mockAnomalies);
    setSummary(result);
    setIsLoading(false);
  }, []);

  return (
    <>
      <AISummaryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        summary={summary}
        isLoading={isLoading}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Voters" value="1.2M" icon={<UsersIcon className="h-8 w-8 text-primary" />} change="+5.2%" changeType="increase" color="#1e3a8a" />
        <StatCard title="Active Elections" value="3" icon={<ChartBarIcon className="h-8 w-8 text-success" />} color="#059669" />
        <StatCard title="Pending Anomalies" value="5" icon={<ShieldExclamationIcon className="h-8 w-8 text-warning" />} change="+2" changeType="increase" color="#f59e0b" />
        <StatCard title="Recent Audits" value="2,431" icon={<DocumentTextIcon className="h-8 w-8 text-secondary" />} color="#475569"/>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RegistrationChart data={mockChartData} />
        </div>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-primary">Recent Anomalies</h3>
              <button onClick={handleGenerateSummary} className="flex items-center space-x-2 text-sm font-medium text-primary bg-primary/10 px-3 py-2 rounded-lg hover:bg-primary/20 transition">
                <SparklesIcon className="h-4 w-4" />
                <span>AI Summary</span>
              </button>
            </div>
            <div className="space-y-4">
              {mockAnomalies.map(anomaly => (
                <AnomalyAlert key={anomaly.id} anomaly={anomaly} />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold text-primary mb-4">Latest Audit Logs</h3>
        <div>
          {mockAuditLogs.map(log => (
            <AuditLogItem key={log.id} log={log} />
          ))}
        </div>
         <div className="text-center mt-4">
            <a href="#" className="text-sm font-medium text-accent hover:underline">View All Logs</a>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
