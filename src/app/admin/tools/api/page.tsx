'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Copy, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Code,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ApiResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
  responseTime: number;
}

const commonEndpoints = [
  { name: 'Get All Items', method: 'GET', url: '/api/indexItems' },
  { name: 'Filter by Campus', method: 'GET', url: '/api/indexItems?campus=College+of+San+Mateo' },
  { name: 'Search Items', method: 'GET', url: '/api/indexItems?search=physics' },
  { name: 'Health Check', method: 'GET', url: '/api/health' },
  { name: 'Performance Metrics', method: 'GET', url: '/api/metrics?type=analytics' },
];

export default function ApiExplorerPage() {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('/api/indexItems');
  const [headers, setHeaders] = useState('{\n  "User-Agent": "API-Explorer/1.0"\n}');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const executeRequest = async () => {
    setLoading(true);
    const startTime = performance.now();

    try {
      // Validate URL
      if (!url.trim()) {
        toast.error('Please enter a URL');
        setLoading(false);
        return;
      }

      if (!url.startsWith('/api/')) {
        toast.error('URL must start with /api/');
        setLoading(false);
        return;
      }

      // Parse and validate headers
      let parsedHeaders = {};
      try {
        if (headers.trim()) {
          parsedHeaders = JSON.parse(headers);
          
          // Validate headers object
          if (typeof parsedHeaders !== 'object' || Array.isArray(parsedHeaders)) {
            throw new Error('Headers must be a valid JSON object');
          }
        }
      } catch (e) {
        toast.error(`Invalid JSON in headers: ${e instanceof Error ? e.message : 'Unknown error'}`);
        setLoading(false);
        return;
      }

      // Validate body for non-GET requests
      if (method !== 'GET' && body.trim()) {
        try {
          JSON.parse(body);
        } catch (e) {
          toast.error(`Invalid JSON in request body: ${e instanceof Error ? e.message : 'Unknown error'}`);
          setLoading(false);
          return;
        }
      }

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Request': 'true',
          ...parsedHeaders,
        },
      };

      if (method !== 'GET' && body.trim()) {
        options.body = body;
      }

      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      options.signal = controller.signal;

      const res = await fetch(url, options);
      clearTimeout(timeoutId);
      
      const responseTime = Math.round(performance.now() - startTime);
      
      // Try to parse response as JSON, fallback to text
      let data;
      const contentType = res.headers.get('content-type');
      
      try {
        if (contentType?.includes('application/json')) {
          data = await res.json();
        } else {
          const textData = await res.text();
          data = textData || `No response body (${res.status} ${res.statusText})`;
        }
      } catch (parseError) {
        data = { 
          error: 'Failed to parse response',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        };
      }

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      setResponse({
        status: res.status,
        data,
        headers: responseHeaders,
        responseTime,
      });

      // Show appropriate toast messages
      if (res.ok) {
        toast.success(`Request completed successfully in ${responseTime}ms`);
      } else if (res.status >= 400 && res.status < 500) {
        toast.error(`Client error (${res.status}): ${res.statusText}`);
      } else if (res.status >= 500) {
        toast.error(`Server error (${res.status}): ${res.statusText}`);
      } else {
        toast.error(`Request failed with status ${res.status}`);
      }

    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime);
      
      let errorMessage = 'Request failed';
      let errorData: any = { error: 'Unknown error occurred' };

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out (30s limit)';
          errorData = { error: 'Request timeout', details: 'The request took too long to complete' };
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error - check your connection';
          errorData = { error: 'Network error', details: error.message };
        } else {
          errorMessage = `Request error: ${error.message}`;
          errorData = { error: error.message };
        }
      }

      setResponse({
        status: 0,
        data: errorData,
        headers: {},
        responseTime,
      });

      toast.error(errorMessage);
      console.error('API Explorer request error:', error);
    }

    setLoading(false);
  };

  const loadPreset = (preset: typeof commonEndpoints[0]) => {
    setMethod(preset.method);
    setUrl(preset.url);
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      toast.success('Response copied to clipboard');
    }
  };

  const copyAsCurl = () => {
    let curlCommand = `curl -X ${method} "${window.location.origin}${url}"`;
    
    try {
      const parsedHeaders = JSON.parse(headers);
      Object.entries(parsedHeaders).forEach(([key, value]) => {
        curlCommand += ` -H "${key}: ${value}"`;
      });
    } catch (e) {
      // Ignore invalid headers
    }

    if (method !== 'GET' && body) {
      curlCommand += ` -d '${body}'`;
    }

    navigator.clipboard.writeText(curlCommand);
    toast.success('cURL command copied to clipboard');
  };

  const getStatusColor = (status: number) => {
    if (status === 0) return 'text-gray-500';
    if (status < 300) return 'text-green-600';
    if (status < 400) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: number) => {
    if (status === 0) return <AlertCircle className="h-4 w-4" />;
    if (status < 300) return <CheckCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Explorer</h1>
        <p className="text-muted-foreground mt-2">
          Test and explore API endpoints directly from the admin dashboard
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Request Builder */}
        <Card>
          <CardHeader>
            <CardTitle>Request Builder</CardTitle>
            <div className="flex flex-wrap gap-2">
              {commonEndpoints.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Method and URL */}
            <div className="flex gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/api/endpoint"
                className="flex-1"
              />
              <Button onClick={executeRequest} disabled={loading}>
                {loading ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {loading ? 'Sending...' : 'Send'}
              </Button>
            </div>

            {/* Headers */}
            <div>
              <Label htmlFor="headers">Headers (JSON)</Label>
              <textarea
                id="headers"
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className="mt-1 w-full min-h-20 px-3 py-2 border border-input rounded-md text-sm font-mono"
                placeholder='{"Content-Type": "application/json"}'
              />
            </div>

            {/* Request Body */}
            {method !== 'GET' && (
              <div>
                <Label htmlFor="body">Request Body</Label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="mt-1 w-full min-h-32 px-3 py-2 border border-input rounded-md text-sm font-mono"
                  placeholder='{"key": "value"}'
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyAsCurl}>
                <Code className="mr-2 h-4 w-4" />
                Copy as cURL
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Response Viewer */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Response</CardTitle>
              {response && (
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 ${getStatusColor(response.status)}`}>
                    {getStatusIcon(response.status)}
                    <span className="font-mono text-sm">
                      {response.status > 0 ? response.status : 'Error'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {response.responseTime}ms
                  </div>
                  <Button variant="outline" size="sm" onClick={copyResponse}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {response ? (
              <div className="space-y-4">
                {/* Response Headers */}
                <div>
                  <Label className="text-sm font-semibold">Headers</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md text-xs font-mono max-h-32 overflow-y-auto">
                    {Object.entries(response.headers).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-blue-600">{key}:</span> {value}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Response Body */}
                <div>
                  <Label className="text-sm font-semibold">Body</Label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-md text-sm font-mono max-h-96 overflow-auto">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Send a request to see the response</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}