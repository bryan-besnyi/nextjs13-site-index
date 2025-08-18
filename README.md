# SMCCCD Site Index

A Next.js application for managing and searching the San Mateo County Community College District site index.

## Overview

The SMCCCD Site Index provides a centralized directory of campus resources across the district's four institutions:
- College of San Mateo
- Cañada College  
- Skyline College
- District Office

## Features

- **Public Search Interface**: Fast, accessible search across all campus resources
- **Admin Management**: Secure administrative interface for content management
- **Performance Monitoring**: Built-in analytics and performance tracking
- **OneLogin Integration**: SSO authentication for administrative access

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with OneLogin SAML
- **Styling**: Tailwind CSS
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