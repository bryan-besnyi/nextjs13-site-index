/**
 * Performance monitoring and metrics types
 */

import { NextRequest } from 'next/server';

// Core performance metrics
export interface PerformanceMetrics {
  timestamp: string;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  cacheHit: boolean;
  dbQueryTime?: number;
  cacheQueryTime?: number;
  userAgent?: string;
  ip?: string;
  resultCount?: number;
  memoryUsage?: number;
  errorRate?: number;
  cacheHitRate?: number;
  dbResponseTime?: number;
}

// Performance collector metrics
export interface PerformanceMetric {
  timestamp: Date;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  cacheHit: boolean;
  userAgent?: string;
  ipAddress?: string;
  dbQueryTime?: number;
  cacheQueryTime?: number;
  memoryUsage?: number;
  errorMessage?: string;
}

// Performance monitor options
export interface PerformanceMonitorOptions {
  cacheHit?: boolean;
  dbQueryTime?: number;
  cacheQueryTime?: number;
  resultCount?: number;
  memoryUsage?: number;
  errorRate?: number;
  cacheHitRate?: number;
  dbResponseTime?: number;
}

// Database operation timing
export interface DbOperationResult<T> {
  result: T;
  queryTime: number;
}

// Cache operation timing
export interface CacheOperationResult<T> {
  result: T;
  cacheTime: number;
  hit: boolean;
}

// Performance analytics
export interface PerformanceAnalytics {
  totalRequests: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  cacheHitRate: number;
  averageDbQueryTime: number | null;
  slowQueries: number;
  errorRate: number;
  topEndpoints: Array<{
    endpoint: string;
    requests: number;
    averageTime: number;
  }>;
  timeRange: string;
}

// Real-time API metrics
export interface ApiMetrics {
  totalRequests: number;
  avgResponseTime: number;
  medianResponseTime: number;
  p90ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  slowestEndpoints: Array<{
    endpoint: string;
    avgTime: number;
  }>;
  fastestEndpoints: Array<{
    endpoint: string;
    avgTime: number;
  }>;
  cacheHitRate: number;
}

// System performance snapshot
export interface SystemPerformance {
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

// Performance dashboard data
export interface PerformanceDashboardData {
  metrics: PerformanceMetrics[];
  analytics: PerformanceAnalytics;
  realTimeMetrics: ApiMetrics;
  systemHealth: SystemPerformance;
  alerts: PerformanceAlert[];
}

// Performance alerts - Modern alerting system
export interface PerformanceAlert {
  id: string;
  type: 'response_time' | 'error_rate' | 'memory_usage' | 'database_performance' | 'cache_performance';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details?: {
    current: number;
    threshold: number;
    unit?: string;
    endpoint?: string;
  };
  timestamp: string;
  endpoint?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

// Alert severity and channel types
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertChannel = 'console' | 'email' | 'slack' | 'webhook';

// Legacy alert interface (for backward compatibility)
export interface LegacyPerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  metric: string;
  threshold: number;
  actualValue: number;
  resolved: boolean;
}

// Performance thresholds
export interface PerformanceThresholds {
  responseTime: {
    warning: number;
    error: number;
    critical: number;
  };
  errorRate: {
    warning: number;
    error: number;
    critical: number;
  };
  cacheHitRate: {
    warning: number;
    error: number;
  };
  dbQueryTime: {
    warning: number;
    error: number;
    critical: number;
  };
  memoryUsage: {
    warning: number;
    error: number;
    critical: number;
  };
}

// Performance monitoring configuration
export interface PerformanceConfig {
  enabled: boolean;
  bufferSize: number;
  flushInterval: number;
  thresholds: PerformanceThresholds;
  alerting: {
    enabled: boolean;
    channels: ('console' | 'email' | 'slack' | 'webhook')[];
    webhookUrl?: string;
    emailRecipients?: string[];
  };
  retention: {
    metrics: number; // days
    alerts: number; // days
  };
}

// Endpoint performance stats
export interface EndpointStats {
  endpoint: string;
  method: string;
  count: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorCount: number;
  errorRate: number;
  cacheHitRate: number;
  lastAccessed: Date;
}

// Performance report
export interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
    duration: string;
  };
  summary: {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    uptime: number;
  };
  endpoints: EndpointStats[];
  alerts: PerformanceAlert[];
  trends: {
    responseTime: Array<{ timestamp: Date; value: number }>;
    errorRate: Array<{ timestamp: Date; value: number }>;
    throughput: Array<{ timestamp: Date; value: number }>;
  };
  recommendations: string[];
}

// Time series data point
export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

// Performance chart data
export interface PerformanceChartData {
  responseTime: TimeSeriesPoint[];
  throughput: TimeSeriesPoint[];
  errorRate: TimeSeriesPoint[];
  cacheHitRate: TimeSeriesPoint[];
}

// Real-time performance monitor
export interface RealTimeMonitor {
  currentRequests: number;
  avgResponseTime: number;
  recentErrors: Array<{
    timestamp: Date;
    endpoint: string;
    error: string;
  }>;
  topSlowEndpoints: Array<{
    endpoint: string;
    responseTime: number;
  }>;
  cacheStats: {
    hitRate: number;
    missRate: number;
    operations: number;
  };
}

// Performance optimization suggestions
export interface OptimizationSuggestion {
  id: string;
  type: 'caching' | 'database' | 'api' | 'frontend';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  implementation: string;
  metrics: {
    before: number;
    expectedAfter: number;
    improvement: number;
  };
}