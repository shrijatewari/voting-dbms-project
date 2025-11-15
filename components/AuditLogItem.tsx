
import React from 'react';
import { IAuditLog, AuditTransactionType } from '../types';
import { DocumentTextIcon, UsersIcon, CheckCircleIcon, ShieldExclamationIcon, LoginIcon } from './icons';

interface AuditLogItemProps {
  log: IAuditLog;
}

const AuditLogItem: React.FC<AuditLogItemProps> = ({ log }) => {
  const getIcon = (type: AuditTransactionType) => {
    switch (type) {
      case AuditTransactionType.Registration:
        return <UsersIcon className="h-5 w-5 text-accent" />;
      case AuditTransactionType.Vote:
        return <CheckCircleIcon className="h-5 w-5 text-success" />;
      case AuditTransactionType.Verification:
        return <ShieldExclamationIcon className="h-5 w-5 text-primary" />;
      case AuditTransactionType.Login:
        return <LoginIcon className="h-5 w-5 text-warning" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-secondary" />;
    }
  };

  return (
    <div className="flex items-start space-x-4 py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-shrink-0 bg-light-bg p-3 rounded-full">
        {getIcon(log.transactionType)}
      </div>
      <div className="flex-1">
        <p className="text-sm text-primary font-medium">{log.description}</p>
        <p className="text-xs text-gray-500 mt-1">
          By: <span className="font-semibold">{log.user}</span> | IP: {log.ip}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-secondary">{log.transactionType}</p>
        <p className="text-xs text-gray-400 mt-1">{log.timestamp}</p>
      </div>
    </div>
  );
};

export default AuditLogItem;
