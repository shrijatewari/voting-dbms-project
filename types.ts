
export enum AnomalySeverity {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export enum AnomalyStatus {
    New = 'New',
    UnderReview = 'Under Review',
    Resolved = 'Resolved',
    FalsePositive = 'False Positive'
}

export enum AuditTransactionType {
  Registration = 'Registration',
  Vote = 'Vote',
  Verification = 'Verification',
  Login = 'Login',
  Update = 'Update'
}

export interface IAnomaly {
  id: string;
  type: string;
  severity: AnomalySeverity;
  description: string;
  timestamp: string;
  status: AnomalyStatus;
  affectedVoterIds?: string[];
  detectionPattern?: string;
  resolutionNotes?: string;
}

export interface IAuditLog {
  id: string;
  transactionType: AuditTransactionType;
  description: string;
  user: string;
  timestamp: string;
  ip: string;
}

export interface IChartData {
  month: string;
  registrations: number;
}
