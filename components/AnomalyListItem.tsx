
import React, { useState } from 'react';
import { IAnomaly, AnomalySeverity, AnomalyStatus } from '../types';
import { ShieldExclamationIcon, UsersIcon, SearchIcon, DocumentTextIcon } from './icons';

interface AnomalyListItemProps {
  anomaly: IAnomaly;
  onUpdate: (anomaly: IAnomaly) => void;
}

const AnomalyListItem: React.FC<AnomalyListItemProps> = ({ anomaly, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState(anomaly.resolutionNotes || '');

  const getSeverityClasses = (severity: AnomalySeverity) => {
    switch (severity) {
      case AnomalySeverity.Critical: return { border: 'border-danger', bg: 'bg-danger/5', text: 'text-danger', icon: 'text-danger' };
      case AnomalySeverity.High: return { border: 'border-warning', bg: 'bg-warning/5', text: 'text-warning', icon: 'text-warning' };
      case AnomalySeverity.Medium: return { border: 'border-accent', bg: 'bg-accent/5', text: 'text-accent', icon: 'text-accent' };
      default: return { border: 'border-secondary', bg: 'bg-secondary/5', text: 'text-secondary', icon: 'text-secondary' };
    }
  };
  
  const getStatusClasses = (status: AnomalyStatus) => {
    switch (status) {
        case AnomalyStatus.New: return 'bg-danger/10 text-danger';
        case AnomalyStatus.UnderReview: return 'bg-amber-400/10 text-amber-500';
        case AnomalyStatus.Resolved: return 'bg-success/10 text-success';
        case AnomalyStatus.FalsePositive: return 'bg-secondary/10 text-secondary';
        default: return 'bg-gray-100 text-gray-800';
    }
  }

  const severityClasses = getSeverityClasses(anomaly.severity);
  const statusClasses = getStatusClasses(anomaly.status);

  const handleResolve = (newStatus: AnomalyStatus) => {
    onUpdate({ ...anomaly, status: newStatus, resolutionNotes });
    setIsExpanded(false);
  }

  return (
    <div className={`border-l-4 p-4 rounded-lg shadow-sm transition-all duration-300 ${severityClasses.border} ${severityClasses.bg}`}>
      <div className="flex items-start space-x-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex-shrink-0 pt-1">
          <ShieldExclamationIcon className={`h-6 w-6 ${severityClasses.icon}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-primary">{anomaly.type}</h4>
            <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusClasses}`}>
                    {anomaly.status}
                </span>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${severityClasses.bg} ${severityClasses.text}`}>
                    {anomaly.severity}
                </span>
            </div>
          </div>
          <p className="text-sm text-secondary mt-1">{anomaly.description}</p>
          <p className="text-xs text-gray-400 mt-2">{anomaly.timestamp}</p>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200/80 animate-fade-in">
          <h5 className="text-sm font-semibold text-primary mb-2">Investigation Details</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
            <div><strong>Affected IDs:</strong> {anomaly.affectedVoterIds?.join(', ') || 'N/A'}</div>
            <div><strong>Detection Pattern:</strong> {anomaly.detectionPattern || 'N/A'}</div>
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <button className="flex items-center space-x-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition"><UsersIcon className="h-4 w-4"/><span>Compare Records</span></button>
            <button className="flex items-center space-x-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition"><SearchIcon className="h-4 w-4"/><span>View IP Activity</span></button>
          </div>
          
           {anomaly.status === AnomalyStatus.Resolved || anomaly.status === AnomalyStatus.FalsePositive ? (
             <div>
                <h5 className="text-sm font-semibold text-primary mb-2">Resolution Notes</h5>
                <p className="text-sm p-3 bg-gray-50 rounded-md border text-secondary">{anomaly.resolutionNotes}</p>
            </div>
           ) : (
            <div>
                <h5 className="text-sm font-semibold text-primary mb-2">Resolution Workflow</h5>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Add resolution notes..."
                  className="w-full p-2 border rounded-md text-sm focus:ring-accent focus:border-accent"
                  rows={3}
                />
                <div className="flex items-center space-x-2 mt-2">
                  <button onClick={() => handleResolve(AnomalyStatus.Resolved)} className="text-xs font-semibold bg-success text-white px-3 py-2 rounded-lg hover:bg-green-700 transition">Mark as Resolved</button>
                  <button onClick={() => handleResolve(AnomalyStatus.FalsePositive)} className="text-xs font-semibold bg-secondary text-white px-3 py-2 rounded-lg hover:bg-slate-600 transition">Mark as False Positive</button>
                </div>
            </div>
           )}
        </div>
      )}
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AnomalyListItem;
