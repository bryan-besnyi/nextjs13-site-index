'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings, Save, RefreshCw, AlertCircle, CheckCircle, 
  Database, Shield, Clock, Server, Globe, Eye, EyeOff
} from 'lucide-react';

interface SystemSettings {
  maintenance: {
    enabled: boolean;
    message: string;
    scheduledStart?: string;
    scheduledEnd?: string;
  };
  security: {
    rateLimitEnabled: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
    blockSuspiciousUserAgents: boolean;
    requireHttps: boolean;
  };
  backup: {
    enabled: boolean;
    frequency: string;
    retentionDays: number;
    location: string;
  };
  api: {
    enableCaching: boolean;
    cacheTimeout: number;
    enableLogging: boolean;
    logLevel: string;
  };
  database: {
    connectionPoolSize: number;
    queryTimeout: number;
    enableSlowQueryLog: boolean;
    slowQueryThreshold: number;
  };
}

interface EnvironmentInfo {
  nodeVersion: string;
  nextjsVersion: string;
  databaseUrl: string;
  deploymentUrl: string;
  environment: string;
  lastRestart: string;
  uptime: string;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, envRes] = await Promise.all([
        fetch('/api/admin/system/settings', {
          credentials: 'include'
        }),
        fetch('/api/admin/system/environment', {
          credentials: 'include'
        })
      ]);

      if (!settingsRes.ok || !envRes.ok) {
        throw new Error('Failed to fetch system information');
      }

      const settingsData = await settingsRes.json();
      const envData = await envRes.json();

      setSettings(settingsData);
      setEnvInfo(envData);
      setError(null);
    } catch (err) {
      setError('Failed to load system settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/system/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setSuccessMessage('Settings saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section: keyof SystemSettings, key: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const maskSensitiveData = (data: string) => {
    if (!showSensitiveInfo && data && data.length > 10) {
      return data.substring(0, 10) + '...';
    }
    return data;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading system settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!settings || !envInfo) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure system behavior and view environment information</p>
        </div>
        <div className="flex items-center gap-2">
          {successMessage && (
            <div className="flex items-center text-green-600 mr-4">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">{successMessage}</span>
            </div>
          )}
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
          <Button onClick={fetchSettings} variant="outline" size="sm" aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Environment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2" />
            Environment Information
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
              className="ml-auto"
            >
              {showSensitiveInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showSensitiveInfo ? 'Hide' : 'Show'} Sensitive Data
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Environment</p>
                <p className="text-sm text-gray-600">{envInfo.environment}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Node.js Version</p>
                <p className="text-sm text-gray-600">{envInfo.nodeVersion}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Next.js Version</p>
                <p className="text-sm text-gray-600">{envInfo.nextjsVersion}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Database URL</p>
                <p className="text-sm text-gray-600 font-mono">{maskSensitiveData(envInfo.databaseUrl)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Deployment URL</p>
                <p className="text-sm text-gray-600">{envInfo.deploymentUrl}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Last Restart</p>
                <p className="text-sm text-gray-600">{new Date(envInfo.lastRestart).toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Uptime</p>
                <p className="text-sm text-gray-600">{envInfo.uptime}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Memory Usage</p>
                <p className="text-sm text-gray-600">
                  {formatBytes(envInfo.memoryUsage.used)} / {formatBytes(envInfo.memoryUsage.total)} 
                  ({envInfo.memoryUsage.percentage.toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Maintenance Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Maintenance Mode</label>
              <input
                type="checkbox"
                checked={settings.maintenance.enabled}
                onChange={(e) => updateSetting('maintenance', 'enabled', e.target.checked)}
                className="rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Maintenance Message</label>
              <textarea
                value={settings.maintenance.message}
                onChange={(e) => updateSetting('maintenance', 'message', e.target.value)}
                rows={3}
                className="w-full mt-1 p-2 border rounded-md text-sm"
                placeholder="Site is currently under maintenance..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Rate Limiting</label>
              <input
                type="checkbox"
                checked={settings.security.rateLimitEnabled}
                onChange={(e) => updateSetting('security', 'rateLimitEnabled', e.target.checked)}
                className="rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Rate Limit (requests per minute)</label>
              <input
                type="number"
                value={settings.security.rateLimitRequests}
                onChange={(e) => updateSetting('security', 'rateLimitRequests', parseInt(e.target.value))}
                className="w-full mt-1 p-2 border rounded-md text-sm"
                min="1"
                max="1000"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Block Suspicious User Agents</label>
              <input
                type="checkbox"
                checked={settings.security.blockSuspiciousUserAgents}
                onChange={(e) => updateSetting('security', 'blockSuspiciousUserAgents', e.target.checked)}
                className="rounded"
              />
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Backup Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Automated Backups</label>
              <input
                type="checkbox"
                checked={settings.backup.enabled}
                onChange={(e) => updateSetting('backup', 'enabled', e.target.checked)}
                className="rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Backup Frequency</label>
              <select
                value={settings.backup.frequency}
                onChange={(e) => updateSetting('backup', 'frequency', e.target.value)}
                className="w-full mt-1 p-2 border rounded-md text-sm"
              >
                <option value="15min">Every 15 minutes</option>
                <option value="30min">Every 30 minutes</option>
                <option value="1hour">Every hour</option>
                <option value="6hours">Every 6 hours</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Retention Period (days)</label>
              <input
                type="number"
                value={settings.backup.retentionDays}
                onChange={(e) => updateSetting('backup', 'retentionDays', parseInt(e.target.value))}
                className="w-full mt-1 p-2 border rounded-md text-sm"
                min="1"
                max="30"
              />
            </div>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              API Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Caching</label>
              <input
                type="checkbox"
                checked={settings.api.enableCaching}
                onChange={(e) => updateSetting('api', 'enableCaching', e.target.checked)}
                className="rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cache Timeout (seconds)</label>
              <input
                type="number"
                value={settings.api.cacheTimeout}
                onChange={(e) => updateSetting('api', 'cacheTimeout', parseInt(e.target.value))}
                className="w-full mt-1 p-2 border rounded-md text-sm"
                min="60"
                max="3600"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Request Logging</label>
              <input
                type="checkbox"
                checked={settings.api.enableLogging}
                onChange={(e) => updateSetting('api', 'enableLogging', e.target.checked)}
                className="rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Log Level</label>
              <select
                value={settings.api.logLevel}
                onChange={(e) => updateSetting('api', 'logLevel', e.target.value)}
                className="w-full mt-1 p-2 border rounded-md text-sm"
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Database Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Connection Pool Size</label>
              <input
                type="number"
                value={settings.database.connectionPoolSize}
                onChange={(e) => updateSetting('database', 'connectionPoolSize', parseInt(e.target.value))}
                className="w-full mt-1 p-2 border rounded-md text-sm"
                min="5"
                max="50"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Query Timeout (ms)</label>
              <input
                type="number"
                value={settings.database.queryTimeout}
                onChange={(e) => updateSetting('database', 'queryTimeout', parseInt(e.target.value))}
                className="w-full mt-1 p-2 border rounded-md text-sm"
                min="1000"
                max="30000"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.database.enableSlowQueryLog}
                onChange={(e) => updateSetting('database', 'enableSlowQueryLog', e.target.checked)}
                className="rounded"
              />
              <label className="text-sm font-medium">Enable Slow Query Log</label>
            </div>
            <div>
              <label className="text-sm font-medium">Slow Query Threshold (ms)</label>
              <input
                type="number"
                value={settings.database.slowQueryThreshold}
                onChange={(e) => updateSetting('database', 'slowQueryThreshold', parseInt(e.target.value))}
                className="w-full mt-1 p-2 border rounded-md text-sm"
                min="100"
                max="10000"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}