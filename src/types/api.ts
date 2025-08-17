/**
 * API request and response types
 */

import { NextRequest } from 'next/server';

// Generic API error interface
export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: any;
}

// Generic API response wrapper
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  code?: string;
}

// Health check types
export interface HealthStatus {
  status: 'pass' | 'warn' | 'fail';
  componentType: string;
  observedValue?: number;
  observedUnit?: string;
  time: string;
}

export interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  version: string;
  releaseId: string;
  description: string;
  checks: {
    [key: string]: HealthStatus[];
  };
  uptime: number;
  responseTime: number;
}

// System metrics types
export interface SystemMetrics {
  database: {
    status: 'healthy' | 'warning' | 'error';
    connections: number;
    responseTime: number;
    uptime: string;
  };
  cache: {
    status: 'healthy' | 'warning' | 'error';
    hitRate: number;
    memory: number;
    keys: number;
  };
  api: {
    status: 'healthy' | 'warning' | 'error';
    requests24h: number;
    avgResponseTime: number;
    errorRate: number;
  };
  system: {
    status: 'healthy' | 'warning' | 'error';
    memory: number;
    cpu: number;
    disk: number;
  };
}

// Search analytics types
export interface SearchEvent {
  term: string;
  timestamp: Date;
  resultCount: number;
  campus?: string;
  letter?: string;
  userId?: string;
}

export interface ClickEvent {
  searchTerm: string;
  clickedItemId: number;
  position: number;
  timestamp: Date;
}

export interface SearchAnalytics {
  overview: {
    totalSearches: number;
    uniqueSearchers: number;
    avgSearchesPerUser: number;
    noResultsRate: number;
  };
  topSearchTerms: Array<{
    term: string;
    count: number;
    clickThrough: number;
  }>;
  noResultsSearches: Array<{
    term: string;
    count: number;
  }>;
}

// Link checking types
export interface LinkCheckResult {
  id: number;
  url: string;
  status: 'active' | 'dead' | 'redirect' | 'timeout' | 'error';
  statusCode?: number;
  responseTime?: number;
  redirectUrl?: string;
  error?: string;
  lastChecked: Date;
}

export interface LinkCheckSummary {
  total: number;
  active: number;
  dead: number;
  redirects: number;
  timeouts: number;
  errors: number;
  lastScanDate?: Date;
}

export interface DeadLinkReport {
  id: number;
  title: string;
  url: string;
  campus: string;
  letter: string;
  status: string;
  error?: string;
  lastChecked?: Date;
}

// Cache types
export interface CacheInvalidationRequest {
  key?: string;
  keys?: string[];
  pattern?: string;
}

// Analytics query parameters
export interface AnalyticsQuery {
  range: 'week' | 'month' | 'year';
  startDate?: Date;
  endDate?: Date;
}

// Click tracking
export interface ClickTrackingData {
  itemId: number;
  url: string;
  referrer?: string;
  userAgent: string;
  timestamp?: Date;
}

// Backup types
export interface BackupQuery {
  filename: string;
}

// Link checking parameters
export interface LinkCheckParams {
  url: string;
  timeout?: number;
  followRedirects?: boolean;
}

// System settings
export interface SystemSettings {
  maxCacheSize?: number;
  rateLimitWindow?: number;
  rateLimitRequests?: number;
  enableMetrics?: boolean;
  enableCaching?: boolean;
}

// ID parameters for routes
export interface IdQueryParams {
  id: string;
}

export interface IdPathParams {
  id: number;
}