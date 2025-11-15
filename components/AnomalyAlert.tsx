
import React from 'react';
import { IAnomaly, AnomalySeverity } from '../types';
import { ShieldExclamationIcon } from './icons';

interface AnomalyAlertProps {
  anomaly: IAnomaly;
}

const AnomalyAlert: React.FC<AnomalyAlertProps> = ({ anomaly }) => {
  const getSeverityClasses = (severity: AnomalySeverity) => {
    switch (severity) {
      case AnomalySeverity.Critical:
        return { bg: 'bg-danger/10', text: 'text-danger', icon: 'text-danger' };
      case AnomalySeverity.High:
        return { bg: 'bg-warning/10', text: 'text-warning', icon: 'text-warning' };
      case AnomalySeverity.Medium:
        return { bg: 'bg-accent/10', text: 'text-accent', icon: 'text-accent' };
      default:
        return { bg: 'bg-secondary/10', text: 'text-secondary', icon: 'text-secondary' };
    }
  };

  const severityClasses = getSeverityClasses(anomaly.severity);

  return (
    <div className={`p-3 rounded-lg flex items-start space-x-3 ${severityClasses.bg}`}>
      <div className="flex-shrink-0 pt-0.5">
        <ShieldExclamationIcon className={`h-5 w-5 ${severityClasses.icon}`} />
      </div>
      <div>
        <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-primary">{anomaly.type}</h4>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${severityClasses.bg} ${severityClasses.text}`}>
                {anomaly.severity}
            </span>
        </div>
        <p className="text-xs text-secondary mt-1">{anomaly.description}</p>
        <p className="text-xs text-gray-400 mt-1.5">{anomaly.timestamp}</p>
      </div>
    </div>
  );
};

export default AnomalyAlert;
