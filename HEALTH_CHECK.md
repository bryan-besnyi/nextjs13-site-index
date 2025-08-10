# Health Check API Documentation

## Endpoint

```
GET /api/health
HEAD /api/health
```

## Overview

The health check endpoint provides comprehensive monitoring of the SMCCCD Site Index service status, following RFC draft-inadarei-api-health-check-06 standards.

## Response Format

### Content Type
```
application/health+json
```

### HTTP Status Codes

- **200 OK**: Service is healthy (`status: "pass"`) or has warnings (`status: "warn"`)
- **503 Service Unavailable**: Service is unhealthy (`status: "fail"`)

### Response Headers

```
Content-Type: application/health+json
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
X-Health-Check-Time: 2024-01-01T12:00:00.000Z
X-Response-Time: 145ms
```

## Response Schema

```json
{
  "status": "pass|warn|fail",
  "version": "1.0.0",
  "releaseId": "abc123def",
  "serviceId": "smcccd-site-index",
  "description": "SMCCCD Site Index API Service",
  "output": "Health check completed in 145ms",
  "notes": ["Optional warning messages"],
  "checks": {
    "database": [{
      "componentId": "postgresql-db",
      "componentType": "datastore",
      "status": "pass",
      "observedValue": 1524,
      "observedUnit": "records",
      "time": "2024-01-01T12:00:00.000Z",
      "output": "Database responsive in 42ms with 1524 records",
      "affectedEndpoints": ["/api/indexItems", "/admin", "/letter/*", "/search/*"]
    }],
    "cache": [{
      "componentId": "vercel-kv",
      "componentType": "component", 
      "status": "pass",
      "observedValue": 23,
      "observedUnit": "ms",
      "time": "2024-01-01T12:00:00.000Z",
      "output": "Cache responsive in 23ms",
      "affectedEndpoints": ["/api/indexItems"]
    }],
    "api": [{
      "componentId": "indexitems-api",
      "componentType": "component",
      "status": "pass",
      "observedValue": 200,
      "observedUnit": "http_status", 
      "time": "2024-01-01T12:00:00.000Z",
      "output": "API endpoint responsive in 67ms with status 200",
      "affectedEndpoints": ["/api/indexItems"]
    }],
    "system": [{
      "componentId": "nodejs-runtime",
      "componentType": "system",
      "status": "pass",
      "observedValue": 128,
      "observedUnit": "MB",
      "time": "2024-01-01T12:00:00.000Z", 
      "output": "Memory usage: 128MB",
      "affectedEndpoints": ["*"]
    }]
  },
  "links": {
    "about": "/api/indexItems",
    "documentation": "https://github.com/smcccd/site-index"
  }
}
```

## Health Checks Performed

### 1. Database Health
- **Component**: PostgreSQL database via Prisma
- **Tests**: Connection, query execution, record count validation
- **Thresholds**: 
  - `pass`: Database accessible with >1000 records
  - `warn`: Database accessible with <1000 records  
  - `fail`: Database connection failed
- **Affected endpoints**: `/api/indexItems`, `/admin`, `/letter/*`, `/search/*`

### 2. Cache Health
- **Component**: Vercel KV (Redis)
- **Tests**: Read/write operations with test key
- **Thresholds**:
  - `pass`: Cache read/write successful
  - `warn`: Cache unavailable (degraded performance)
  - `fail`: N/A (cache is not critical)
- **Affected endpoints**: `/api/indexItems`

### 3. API Endpoint Health
- **Component**: Main IndexItems API
- **Tests**: Internal API call with lightweight query
- **Thresholds**:
  - `pass`: API returns HTTP 2xx status
  - `fail`: API returns non-2xx status or fails
- **Affected endpoints**: `/api/indexItems`

### 4. System Resources
- **Component**: Node.js runtime
- **Tests**: Memory usage monitoring
- **Thresholds**:
  - `pass`: Memory usage <500MB
  - `warn`: Memory usage >500MB
- **Affected endpoints**: All (`*`)

## Status Meanings

- **`pass`**: All systems healthy, service fully operational
- **`warn`**: Service operational but with performance degradation or minor issues
- **`fail`**: Service unavailable or critically impaired

## Usage Examples

### Basic Health Check
```bash
curl https://your-domain.com/api/health
```

### Load Balancer Health Check (HEAD)
```bash
curl -I https://your-domain.com/api/health
```

### Monitoring Integration
```javascript
// Example monitoring script
const response = await fetch('/api/health');
const health = await response.json();

if (health.status === 'fail') {
  alert('Service is down!');
} else if (health.status === 'warn') {
  console.warn('Service degraded:', health.notes);
}
```

## Integration with Monitoring Tools

The health endpoint is compatible with:

- **Load balancers**: Use HEAD requests for efficient health checks
- **Kubernetes**: Configure readiness/liveness probes
- **Prometheus**: Parse JSON response for metrics collection
- **Uptime monitors**: Check both HTTP status and JSON status field
- **APM tools**: Use response time headers for performance tracking

## Security Considerations

- Health endpoint is **publicly accessible** (no authentication required)
- Contains **minimal sensitive information** (only operational metrics)
- **Caching disabled** to ensure real-time status reporting
- No user data exposed in health responses