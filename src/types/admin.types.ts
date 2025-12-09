// Admin Dashboard Type Definitions
// Focus: System Health, Security Monitoring, User Management

export interface SystemKPI {
  id: string;
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number; // e.g., 12.5 for +12.5%
    isPositive: boolean;
  };
  status: 'safe' | 'warning' | 'critical';
  subtitle?: string;
  progress?: number; // For Storage Usage (0-100)
}

export interface TrafficData {
  date: string; // "2024-12-01"
  requests: number;
  errors: number;
}

export interface UserDistribution {
  role: string; // "Admin", "HOD", "Staff", "Sale", "Customer"
  count: number;
  color: string;
  percentage?: number;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  actor: {
    name: string;
    avatar?: string;
  };
  role: 'Admin' | 'HOD' | 'Staff' | 'Sale' | 'Customer';
  action: string;
  ip: string;
  status: 'success' | 'failed';
}

// Chart Tooltip Types
export interface TrafficTooltipPayload {
  date: string;
  requests: number;
  errors: number;
}

export interface UserPiePayload {
  role: string;
  count: number;
  color: string;
  percentage: number;
}
