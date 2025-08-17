/**
 * Admin dashboard and component types
 */

import { IndexItem } from './index';

// Bulk operations
export interface BulkOperation {
  id: string;
  type: 'update' | 'delete' | 'move';
  status: 'pending' | 'running' | 'completed' | 'failed';
  itemCount: number;
  processedCount: number;
  errors: string[];
  startTime?: string;
  endTime?: string;
}

export interface BulkEditData {
  campus: string;
  letter: string;
  titlePrefix: string;
  titleSuffix: string;
  urlReplace: {
    from: string;
    to: string;
  };
}

export interface BulkOperationRequest {
  operation: 'delete' | 'update';
  items: number[];
  updateData?: Partial<IndexItem>;
}

// Data table types
export interface DataTableEnhancedProps {
  initialData: IndexItem[];
}

export interface AdminDashboardProps {
  initialData: IndexItem[];
}

// Metrics card types
export interface MetricCardData {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down';
  };
  status?: 'healthy' | 'warning' | 'error';
}

// System health types
export interface SystemHealthData {
  database: {
    status: string;
    avgResponseTime: number;
    connectionCount: number;
  };
  cache: {
    status: string;
    hitRate: number;
    keyCount: number;
  };
  memory: {
    usage: number;
    limit: number;
    percentage: number;
  };
  api: {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
  };
  uptime: number;
}

// Import/Export types
export interface ImportData {
  items: Partial<IndexItem>[];
  validateOnly?: boolean;
  updateExisting?: boolean;
}

export interface ExportOptions {
  format: 'csv' | 'json';
  filters?: {
    campus?: string;
    letter?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  includeMetadata?: boolean;
}

export interface ImportResult {
  success: boolean;
  processed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  duplicates: number;
  created: number;
  updated: number;
}

// Quick actions
export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: () => void | Promise<void>;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline';
}

// Command palette types
export interface Command {
  id: string;
  label: string;
  description?: string;
  keywords: string[];
  category: 'navigation' | 'actions' | 'data' | 'system';
  action: () => void;
  icon?: string;
  shortcut?: string;
}

// Error boundary types
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

// Admin layout types
export interface AdminLayoutConfig {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  breadcrumbs: Array<{
    label: string;
    href?: string;
  }>;
}

// Navigation types
export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavItem[];
  disabled?: boolean;
  external?: boolean;
}

export interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  navigation: NavItem[];
}

// Settings types
export interface AdminSettings {
  appearance: {
    theme: 'light' | 'dark' | 'system';
    sidebarCollapsed: boolean;
    density: 'comfortable' | 'compact';
  };
  notifications: {
    email: boolean;
    browser: boolean;
    slack?: boolean;
  };
  performance: {
    enableMetrics: boolean;
    enableCaching: boolean;
    cacheSize: number;
  };
  security: {
    sessionTimeout: number;
    requireReauth: boolean;
    ipWhitelist?: string[];
  };
}