# SMCCCD Site Index

A Next.js application for managing and searching the San Mateo County Community College District site index.

## ⚠️ PRODUCTION READINESS STATUS

**THIS APPLICATION IS NOT FULLY PRODUCTION-READY**. Please read the detailed feature status below before deployment.

## Overview

The SMCCCD Site Index provides a centralized directory of campus resources across the district's four institutions:
- College of San Mateo
- Cañada College  
- Skyline College
- District Office

## Feature Status

### ✅ FULLY WORKING FEATURES
- **Data Management**: Real database operations (Browse, Create, Edit, Delete items)
- **Search Functionality**: Real search across all campus resources  
- **Link Health Monitor**: Complete broken link checking with HTTP validation
- **Cache Management**: Real Vercel KV cache operations and monitoring
- **API Explorer**: Interactive API testing tool
- **System Settings**: Real environment configuration display
- **Performance Alerts**: Real alerting system for performance issues
- **Backup System**: Full Vercel Blob storage with 28-day retention
- **System Health**: Comprehensive health monitoring with fallback data

### ⚠️ LIMITED/CONDITIONAL FEATURES  
- **Activity Trail**: Only works when `ENABLE_ACTIVITY_LOGGING=true` is set
- **Performance Monitor**: Real metrics when available, shows zeros otherwise
- **Search Analytics**: Works with Redis KV when configured

### ❌ MOCK DATA FEATURES (NOT PRODUCTION READY)
- **Usage Analytics** (`/admin/analytics/usage/`): Shows completely fake data
  - Displays hardcoded numbers (125K calls, 450 users, etc.)
  - No real API tracking implementation
  - **MUST BE DISABLED OR CLEARLY MARKED AS DEMO**

## What Actually Works vs. What Doesn't

| Admin Page | Status | Data Source | Production Ready? |
|------------|--------|-------------|-------------------|
| `/admin/` | ✅ Working | Real DB + Cache | Yes |
| `/admin/data/` | ✅ Working | Real Database | Yes |
| `/admin/links/` | ✅ Working | Real Link Checking | Yes |
| `/admin/tools/cache/` | ✅ Working | Real Vercel KV | Yes |
| `/admin/tools/api/` | ✅ Working | Live API Testing | Yes |
| `/admin/system/backups/` | ✅ Working | Real Vercel Blob | Yes |
| `/admin/system/health/` | ✅ Working | Real + Fallback Data | Yes |
| `/admin/system/settings/` | ✅ Working | Real Environment | Yes |
| `/admin/analytics/usage/` | ❌ FAKE | Mock Data Only | **NO** |
| `/admin/system/activity/` | ⚠️ Limited | Needs Configuration | Conditional |
| `/admin/tools/performance/` | ⚠️ Limited | Real When Available | Conditional |

## CRITICAL ISSUES TO FIX BEFORE PRODUCTION

### 1. Usage Analytics Page (`/admin/analytics/usage/`)
- **Issue**: Displays completely fabricated data (125K API calls, 450 users, etc.)
- **Fix Required**: Either implement real metrics tracking or disable this page
- **Current Status**: Warning banner added, marked as "DEMO MODE"

### 2. Activity Logging
- **Issue**: Requires manual environment configuration
- **Fix Required**: Set `ENABLE_ACTIVITY_LOGGING=true` if you want activity tracking
- **Current Status**: Shows proper no-data state with instructions

### 3. Performance Metrics
- **Issue**: May show zeros when no real data is available
- **Fix Required**: Implement comprehensive metrics collection
- **Current Status**: Warning banner added to explain zero values

## Immediate Actions Required

1. **Review Usage Analytics**: Decide whether to implement real tracking or remove page
2. **Configure Activity Logging**: Set environment variable if activity tracking is desired  
3. **Test All Features**: Verify each admin page works as expected in your environment
4. **Update Documentation**: Remove any claims of "production-ready" status

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL/Neon with Prisma ORM (SQLite for development)
- **Authentication**: NextAuth.js with OneLogin SAML
- **Storage**: Vercel Blob for backups, Vercel KV for caching
- **Styling**: Tailwind CSS with shadcn/ui components
- **Deployment**: Vercel

## Quick Start

```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev

# Start development server
npm run dev
```

## Environment Variables

```bash
# Database
DATABASE_URL="file:./dev.db"

# Authentication  
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OneLogin SAML
ONELOGIN_ISSUER="your-issuer"
ONELOGIN_ENTRY_POINT="your-entry-point"
ONELOGIN_CERT="your-certificate"

# Vercel KV (for caching)
KV_URL="your-kv-url"
KV_REST_API_URL="your-kv-rest-url"
KV_REST_API_TOKEN="your-kv-token"
```

## API Endpoints

### Public APIs
- `GET /api/health` - Health check
- `GET /api/indexItems` - Search index items
- `GET /api/metrics` - Performance metrics

### Admin APIs  
- `GET /api/admin/cache` - Cache management
- `GET /api/admin/analytics/*` - Analytics data
- `GET /api/admin/system/*` - System information

## Deployment

The application is configured for deployment on Vercel:

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## Support

For technical support or questions:
- Email: [webmaster@smccd.edu](mailto:webmaster@smccd.edu)
- Support Portal: [support.smccd.edu](https://support.smccd.edu)

## License

Copyright © 2025 San Mateo County Community College District