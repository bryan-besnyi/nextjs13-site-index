/**
 * Performance Monitoring and Alerting System
 * 
 * Provides real-time performance monitoring with configurable thresholds
 * and alert mechanisms for production environments.
 */

import { kv } from '@vercel/kv';
import { PerformanceMetrics, PerformanceAlert, AlertSeverity, AlertChannel } from '@/types';

// Configuration constants
const ALERT_CONFIG = {
  // Response time thresholds (ms)
  RESPONSE_TIME_WARNING: 100,
  RESPONSE_TIME_CRITICAL: 500,
  
  // Error rate thresholds (%)
  ERROR_RATE_WARNING: 5,
  ERROR_RATE_CRITICAL: 15,
  
  // Memory usage thresholds (MB)
  MEMORY_WARNING: 300,
  MEMORY_CRITICAL: 500,
  
  // Database response time thresholds (ms)
  DB_RESPONSE_WARNING: 50,
  DB_RESPONSE_CRITICAL: 200,
  
  // Cache hit rate thresholds (%)
  CACHE_HIT_WARNING: 70,
  CACHE_HIT_CRITICAL: 50,
  
  // Rate limiting
  ALERT_COOLDOWN: 300, // 5 minutes between duplicate alerts
  MAX_ALERTS_PER_HOUR: 10,
};

// Alert storage keys
const ALERT_KEYS = {
  RECENT_ALERTS: 'alerts:recent',
  ALERT_COOLDOWNS: 'alerts:cooldowns',
  ALERT_COUNTS: 'alerts:counts',
  PERFORMANCE_HISTORY: 'performance:history',
} as const;

export class PerformanceAlerting {
  
  /**
   * Analyze performance metrics and trigger alerts if thresholds are exceeded
   */
  static async analyzeAndAlert(metrics: PerformanceMetrics): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];
    const timestamp = new Date().toISOString();

    try {
      // 1. Response Time Analysis
      if (metrics.responseTime > ALERT_CONFIG.RESPONSE_TIME_CRITICAL) {
        alerts.push(await this.createAlert({
          id: `response-time-critical-${Date.now()}`,
          type: 'response_time',
          severity: 'critical',
          message: `Critical response time detected: ${metrics.responseTime}ms`,
          details: {
            current: metrics.responseTime,
            threshold: ALERT_CONFIG.RESPONSE_TIME_CRITICAL,
            endpoint: metrics.endpoint || 'unknown'
          },
          timestamp,
          endpoint: metrics.endpoint
        }));
      } else if (metrics.responseTime > ALERT_CONFIG.RESPONSE_TIME_WARNING) {
        alerts.push(await this.createAlert({
          id: `response-time-warning-${Date.now()}`,
          type: 'response_time',
          severity: 'warning',
          message: `Slow response time detected: ${metrics.responseTime}ms`,
          details: {
            current: metrics.responseTime,
            threshold: ALERT_CONFIG.RESPONSE_TIME_WARNING,
            endpoint: metrics.endpoint || 'unknown'
          },
          timestamp,
          endpoint: metrics.endpoint
        }));
      }

      // 2. Error Rate Analysis (if we have error tracking)
      if (metrics.errorRate !== undefined) {
        if (metrics.errorRate > ALERT_CONFIG.ERROR_RATE_CRITICAL) {
          alerts.push(await this.createAlert({
            id: `error-rate-critical-${Date.now()}`,
            type: 'error_rate',
            severity: 'critical',
            message: `Critical error rate detected: ${metrics.errorRate}%`,
            details: {
              current: metrics.errorRate,
              threshold: ALERT_CONFIG.ERROR_RATE_CRITICAL,
              endpoint: metrics.endpoint || 'unknown'
            },
            timestamp,
            endpoint: metrics.endpoint
          }));
        } else if (metrics.errorRate > ALERT_CONFIG.ERROR_RATE_WARNING) {
          alerts.push(await this.createAlert({
            id: `error-rate-warning-${Date.now()}`,
            type: 'error_rate',
            severity: 'warning',
            message: `High error rate detected: ${metrics.errorRate}%`,
            details: {
              current: metrics.errorRate,
              threshold: ALERT_CONFIG.ERROR_RATE_WARNING,
              endpoint: metrics.endpoint || 'unknown'
            },
            timestamp,
            endpoint: metrics.endpoint
          }));
        }
      }

      // 3. Memory Usage Analysis (if available)
      if (metrics.memoryUsage !== undefined) {
        if (metrics.memoryUsage > ALERT_CONFIG.MEMORY_CRITICAL) {
          alerts.push(await this.createAlert({
            id: `memory-critical-${Date.now()}`,
            type: 'memory_usage',
            severity: 'critical',
            message: `Critical memory usage: ${metrics.memoryUsage}MB`,
            details: {
              current: metrics.memoryUsage,
              threshold: ALERT_CONFIG.MEMORY_CRITICAL,
              unit: 'MB'
            },
            timestamp
          }));
        } else if (metrics.memoryUsage > ALERT_CONFIG.MEMORY_WARNING) {
          alerts.push(await this.createAlert({
            id: `memory-warning-${Date.now()}`,
            type: 'memory_usage',
            severity: 'warning',
            message: `High memory usage: ${metrics.memoryUsage}MB`,
            details: {
              current: metrics.memoryUsage,
              threshold: ALERT_CONFIG.MEMORY_WARNING,
              unit: 'MB'
            },
            timestamp
          }));
        }
      }

      // 4. Database Performance Analysis
      if (metrics.dbResponseTime !== undefined) {
        if (metrics.dbResponseTime > ALERT_CONFIG.DB_RESPONSE_CRITICAL) {
          alerts.push(await this.createAlert({
            id: `db-response-critical-${Date.now()}`,
            type: 'database_performance',
            severity: 'critical',
            message: `Critical database response time: ${metrics.dbResponseTime}ms`,
            details: {
              current: metrics.dbResponseTime,
              threshold: ALERT_CONFIG.DB_RESPONSE_CRITICAL,
              unit: 'ms'
            },
            timestamp
          }));
        } else if (metrics.dbResponseTime > ALERT_CONFIG.DB_RESPONSE_WARNING) {
          alerts.push(await this.createAlert({
            id: `db-response-warning-${Date.now()}`,
            type: 'database_performance',
            severity: 'warning',
            message: `Slow database response time: ${metrics.dbResponseTime}ms`,
            details: {
              current: metrics.dbResponseTime,
              threshold: ALERT_CONFIG.DB_RESPONSE_WARNING,
              unit: 'ms'
            },
            timestamp
          }));
        }
      }

      // 5. Cache Performance Analysis
      if (metrics.cacheHitRate !== undefined) {
        if (metrics.cacheHitRate < ALERT_CONFIG.CACHE_HIT_CRITICAL) {
          alerts.push(await this.createAlert({
            id: `cache-hit-critical-${Date.now()}`,
            type: 'cache_performance',
            severity: 'critical',
            message: `Critical cache hit rate: ${metrics.cacheHitRate}%`,
            details: {
              current: metrics.cacheHitRate,
              threshold: ALERT_CONFIG.CACHE_HIT_CRITICAL,
              unit: '%'
            },
            timestamp
          }));
        } else if (metrics.cacheHitRate < ALERT_CONFIG.CACHE_HIT_WARNING) {
          alerts.push(await this.createAlert({
            id: `cache-hit-warning-${Date.now()}`,
            type: 'cache_performance',
            severity: 'warning',
            message: `Low cache hit rate: ${metrics.cacheHitRate}%`,
            details: {
              current: metrics.cacheHitRate,
              threshold: ALERT_CONFIG.CACHE_HIT_WARNING,
              unit: '%'
            },
            timestamp
          }));
        }
      }

      // Store alerts and return
      if (alerts.length > 0) {
        await this.storeAlerts(alerts);
        await this.sendAlerts(alerts);
      }

      return alerts;

    } catch (error) {
      console.error('Performance alerting error:', error);
      return [];
    }
  }

  /**
   * Create an alert with rate limiting and deduplication
   */
  private static async createAlert(alertData: Omit<PerformanceAlert, 'acknowledged' | 'resolvedAt'>): Promise<PerformanceAlert> {
    const alert: PerformanceAlert = {
      ...alertData,
      acknowledged: false,
      resolvedAt: undefined
    };

    // Check if we should suppress this alert due to rate limiting
    const shouldSuppress = await this.checkRateLimit(alert);
    if (shouldSuppress) {
      console.log(`Alert suppressed due to rate limiting: ${alert.id}`);
      return alert;
    }

    return alert;
  }

  /**
   * Check if an alert should be rate limited
   */
  private static async checkRateLimit(alert: PerformanceAlert): Promise<boolean> {
    try {
      const alertKey = `${alert.type}-${alert.severity}`;
      const cooldownKey = `${ALERT_KEYS.ALERT_COOLDOWNS}:${alertKey}`;
      const countKey = `${ALERT_KEYS.ALERT_COUNTS}:${alertKey}:${new Date().getHours()}`;

      // Check cooldown period
      const lastAlert = await kv.get(cooldownKey);
      if (lastAlert) {
        console.log(`Alert in cooldown period: ${alertKey}`);
        return true;
      }

      // Check hourly limit
      const hourlyCount = await kv.get(countKey) || 0;
      if (Number(hourlyCount) >= ALERT_CONFIG.MAX_ALERTS_PER_HOUR) {
        console.log(`Alert hourly limit exceeded: ${alertKey}`);
        return true;
      }

      // Set cooldown and increment count
      await kv.setex(cooldownKey, ALERT_CONFIG.ALERT_COOLDOWN, Date.now());
      await kv.incr(countKey);
      await kv.expire(countKey, 3600); // 1 hour TTL

      return false;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return false; // Don't suppress on error
    }
  }

  /**
   * Store alerts in the database for historical tracking
   */
  private static async storeAlerts(alerts: PerformanceAlert[]): Promise<void> {
    try {
      const recentAlerts = await kv.get(ALERT_KEYS.RECENT_ALERTS) || [];
      const updatedAlerts = [...alerts, ...Array.isArray(recentAlerts) ? recentAlerts : []].slice(0, 100);
      
      await kv.set(ALERT_KEYS.RECENT_ALERTS, updatedAlerts);
      console.log(`Stored ${alerts.length} performance alerts`);
    } catch (error) {
      console.error('Failed to store alerts:', error);
    }
  }

  /**
   * Send alerts through configured channels
   */
  private static async sendAlerts(alerts: PerformanceAlert[]): Promise<void> {
    for (const alert of alerts) {
      try {
        // Console logging (always enabled)
        console.warn(`PERFORMANCE ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`, {
          type: alert.type,
          details: alert.details,
          endpoint: alert.endpoint,
          timestamp: alert.timestamp
        });

        // In production, you could add additional channels:
        // - Email notifications
        // - Slack/Discord webhooks
        // - PagerDuty integration
        // - SMS alerts for critical issues
        
        if (alert.severity === 'critical') {
          // Critical alerts could trigger additional actions
          await this.handleCriticalAlert(alert);
        }

      } catch (error) {
        console.error(`Failed to send alert ${alert.id}:`, error);
      }
    }
  }

  /**
   * Handle critical alerts with additional actions
   */
  private static async handleCriticalAlert(alert: PerformanceAlert): Promise<void> {
    try {
      // Log critical alert for immediate attention
      console.error(`CRITICAL PERFORMANCE ALERT: ${alert.message}`, {
        alert,
        timestamp: new Date().toISOString(),
        requiresImmediateAttention: true
      });

      // In production, this could:
      // - Send immediate notifications to on-call engineers
      // - Trigger automated scaling actions
      // - Create incident management tickets
      // - Enable enhanced monitoring/debugging modes

    } catch (error) {
      console.error('Failed to handle critical alert:', error);
    }
  }

  /**
   * Get recent alerts for dashboard display
   */
  static async getRecentAlerts(limit: number = 20): Promise<PerformanceAlert[]> {
    try {
      const alerts = await kv.get(ALERT_KEYS.RECENT_ALERTS) || [];
      return Array.isArray(alerts) ? alerts.slice(0, limit) : [];
    } catch (error) {
      console.error('Failed to get recent alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(alertId: string): Promise<boolean> {
    try {
      const alerts = await kv.get(ALERT_KEYS.RECENT_ALERTS) || [];
      if (!Array.isArray(alerts)) return false;

      const updatedAlerts = alerts.map((alert: PerformanceAlert) => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true, acknowledgedAt: new Date().toISOString() }
          : alert
      );

      await kv.set(ALERT_KEYS.RECENT_ALERTS, updatedAlerts);
      return true;
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      return false;
    }
  }

  /**
   * Resolve an alert
   */
  static async resolveAlert(alertId: string): Promise<boolean> {
    try {
      const alerts = await kv.get(ALERT_KEYS.RECENT_ALERTS) || [];
      if (!Array.isArray(alerts)) return false;

      const updatedAlerts = alerts.map((alert: PerformanceAlert) => 
        alert.id === alertId 
          ? { ...alert, resolvedAt: new Date().toISOString() }
          : alert
      );

      await kv.set(ALERT_KEYS.RECENT_ALERTS, updatedAlerts);
      return true;
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      return false;
    }
  }

  /**
   * Get alert statistics for dashboard
   */
  static async getAlertStats(): Promise<{
    total: number;
    critical: number;
    warning: number;
    info: number;
    acknowledged: number;
    resolved: number;
  }> {
    try {
      const alerts = await this.getRecentAlerts(100);
      
      return {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length,
        acknowledged: alerts.filter(a => a.acknowledged).length,
        resolved: alerts.filter(a => a.resolvedAt).length,
      };
    } catch (error) {
      console.error('Failed to get alert stats:', error);
      return { total: 0, critical: 0, warning: 0, info: 0, acknowledged: 0, resolved: 0 };
    }
  }

  /**
   * Clear old alerts (cleanup job)
   */
  static async cleanupOldAlerts(olderThanHours: number = 24): Promise<number> {
    try {
      const alerts = await kv.get(ALERT_KEYS.RECENT_ALERTS) || [];
      if (!Array.isArray(alerts)) return 0;

      const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
      const recentAlerts = alerts.filter((alert: PerformanceAlert) => 
        new Date(alert.timestamp) > cutoffTime
      );

      const removedCount = alerts.length - recentAlerts.length;
      
      if (removedCount > 0) {
        await kv.set(ALERT_KEYS.RECENT_ALERTS, recentAlerts);
        console.log(`Cleaned up ${removedCount} old alerts`);
      }

      return removedCount;
    } catch (error) {
      console.error('Failed to cleanup old alerts:', error);
      return 0;
    }
  }
}

// Export configuration for external use
export const PERFORMANCE_ALERT_CONFIG = ALERT_CONFIG;

export default PerformanceAlerting;