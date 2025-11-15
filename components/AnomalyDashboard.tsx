
import React, { useState } from 'react';
import { IAnomaly, AnomalySeverity, AnomalyStatus } from '../types';
import AnomalyListItem from './AnomalyListItem';
import AIModelStats from './AIModelStats';

const initialAnomalies: IAnomaly[] = [
    { id: '1', type: 'Mass Registration', severity: AnomalySeverity.Critical, description: '312 registrations from IP 192.168.1.100 in 2 hours.', timestamp: '2 mins ago', status: AnomalyStatus.New, affectedVoterIds: ['V001', 'V002'], detectionPattern: 'IP Velocity' },
    { id: '2', type: 'Suspicious Pattern', severity: AnomalySeverity.High, description: 'Unusual login activity for Admin "j.doe" after hours.', timestamp: '15 mins ago', status: AnomalyStatus.New, affectedVoterIds: ['A005'], detectionPattern: 'Time-based Anomaly' },
    { id: '3', type: 'Data Inconsistency', severity: AnomalySeverity.Medium, description: 'Biometric hash mismatch for voter ID #84321.', timestamp: '1 hour ago', status: AnomalyStatus.UnderReview, affectedVoterIds: ['V84321'], detectionPattern: 'Biometric Mismatch' },
    { id: '4', type: 'Unusual Activity', severity: AnomalySeverity.Low, description: 'Multiple failed verification attempts for Voter ID #99876.', timestamp: '3 hours ago', status: AnomalyStatus.UnderReview, affectedVoterIds: ['V99876'], detectionPattern: 'Failed Attempts' },
    { id: '5', type: 'Mass Registration', severity: AnomalySeverity.Critical, description: '150 registrations with sequential Aadhaar IDs.', timestamp: '1 day ago', status: AnomalyStatus.Resolved, affectedVoterIds: [], detectionPattern: 'Sequential ID', resolutionNotes: 'Confirmed as a batch import from a new district. Marked as resolved.' },
    { id: '6', type: 'Data Inconsistency', severity: AnomalySeverity.High, description: 'Voter status changed to "Deceased" and back to "Active" within 5 minutes.', timestamp: '2 days ago', status: AnomalyStatus.FalsePositive, affectedVoterIds: ['V75342'], detectionPattern: 'Rapid Status Change', resolutionNotes: 'Clerical error during data entry. Confirmed false positive.' },
];

const AnomalyDashboard: React.FC = () => {
  const [anomalies, setAnomalies] = useState<IAnomaly[]>(initialAnomalies);
  const [activeTab, setActiveTab] = useState<AnomalyStatus | 'All'>('All');

  const handleUpdateAnomaly = (updatedAnomaly: IAnomaly) => {
    setAnomalies(anomalies.map(a => a.id === updatedAnomaly.id ? updatedAnomaly : a));
  };
  
  const filteredAnomalies = activeTab === 'All' 
    ? anomalies 
    : anomalies.filter(a => a.status === activeTab);

  const TABS: (AnomalyStatus | 'All')[] = ['All', AnomalyStatus.New, AnomalyStatus.UnderReview, AnomalyStatus.Resolved, AnomalyStatus.FalsePositive];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
            <h3 className="text-xl font-semibold text-primary">Anomaly Feed</h3>
            <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
                {TABS.map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        <div className="space-y-4">
          {filteredAnomalies.length > 0 ? (
            filteredAnomalies.map(anomaly => (
              <AnomalyListItem key={anomaly.id} anomaly={anomaly} onUpdate={handleUpdateAnomaly} />
            ))
          ) : (
            <div className="text-center py-12 text-secondary">
                <p className="font-semibold">No anomalies found for this category.</p>
                <p className="text-sm mt-1">The system is looking clean!</p>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-6">
        <AIModelStats />
      </div>
    </div>
  );
};

export default AnomalyDashboard;
