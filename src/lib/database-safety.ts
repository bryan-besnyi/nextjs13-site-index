// Database safety checks to prevent production database access during development

const PRODUCTION_INDICATORS = [
  'vercel-storage.com',
  'neon.tech',
  'planetscale.com',
  'railway.app',
  'supabase.co',
  'amazonaws.com',
  'googleusercontent.com'
];

const SAFE_DEVELOPMENT_INDICATORS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'smcccd_dev',
  'test_db',
  'development',
  'ep-soft-mouse-a4oll0jd-pooler'  // Safe Neon branch for development
];

// CRITICAL: NEVER CONNECT TO PRODUCTION DATABASE
const BANNED_PRODUCTION_HOSTS = [
  'ep-solitary-wind-a4qtn2d3'  // PRODUCTION DATABASE - NEVER USE IN DEVELOPMENT
];

export interface DatabaseInfo {
  url: string;
  host: string;
  database: string;
  isSafe: boolean;
  environment: 'local' | 'production' | 'unknown';
  warnings: string[];
}

export function analyzeDatabaseUrl(url: string): DatabaseInfo {
  const warnings: string[] = [];
  let isSafe = false;
  let environment: 'local' | 'production' | 'unknown' = 'unknown';

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname;
    const database = parsedUrl.pathname.slice(1); // Remove leading slash

    // CRITICAL: Check for banned production databases
    const isBannedProduction = BANNED_PRODUCTION_HOSTS.some(bannedHost => 
      host.includes(bannedHost) || url.includes(bannedHost)
    );

    if (isBannedProduction) {
      return {
        url: url.replace(/:[^:@]*@/, ':***@'),
        host,
        database,
        isSafe: false,
        environment: 'production',
        warnings: [
          '🚨 CRITICAL: PRODUCTION DATABASE DETECTED',
          '❌ THIS DATABASE IS PERMANENTLY BANNED',
          `Host: ${host}`,
          '🛑 DEVELOPMENT ACCESS BLOCKED FOR SAFETY'
        ]
      };
    }

    // Check for production indicators
    const hasProductionIndicator = PRODUCTION_INDICATORS.some(indicator => 
      host.includes(indicator) || url.includes(indicator)
    );

    // Check for safe development indicators
    const hasSafeIndicator = SAFE_DEVELOPMENT_INDICATORS.some(indicator => 
      host.includes(indicator) || database.includes(indicator) || url.includes(indicator)
    );

    if (hasSafeIndicator) {
      environment = 'local';
      isSafe = true;
      warnings.push('✅ Safe development database detected');
      warnings.push(`Host: ${host}`);
    } else if (hasProductionIndicator) {
      environment = 'production';
      warnings.push('⚠️ PRODUCTION DATABASE DETECTED');
      warnings.push(`Host: ${host}`);
      
      if (process.env.NODE_ENV === 'development') {
        warnings.push('❌ DANGEROUS: Using production database in development mode');
        isSafe = false;
      } else {
        isSafe = true; // OK to use production in production
      }
    } else {
      warnings.push('⚠️ Unknown database environment');
      warnings.push(`Host: ${host}`);
      isSafe = false;
    }

    return {
      url: url.replace(/:[^:@]*@/, ':***@'), // Hide password in logs
      host,
      database,
      isSafe,
      environment,
      warnings
    };

  } catch (error) {
    return {
      url: 'invalid',
      host: 'unknown',
      database: 'unknown',
      isSafe: false,
      environment: 'unknown',
      warnings: [`❌ Invalid DATABASE_URL: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

export function validateDatabaseSafety(): DatabaseInfo {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return {
      url: 'not_set',
      host: 'unknown',
      database: 'unknown',
      isSafe: false,
      environment: 'unknown',
      warnings: ['❌ DATABASE_URL not set']
    };
  }

  const analysis = analyzeDatabaseUrl(databaseUrl);
  
  // Log warnings to console
  if (analysis.warnings.length > 0) {
    console.log('\n🔒 DATABASE SAFETY CHECK:');
    analysis.warnings.forEach(warning => console.log(warning));
    console.log('');
  }

  // Throw error if unsafe in development (but allow during build)
  const isLocalDevelopment = process.env.NODE_ENV === 'development' && !process.env.VERCEL;
  const isTestEnvironment = process.env.ENVIRONMENT_TYPE === 'test';
  
  if (!analysis.isSafe && (isLocalDevelopment || isTestEnvironment)) {
    const error = new Error(
      `UNSAFE DATABASE CONNECTION BLOCKED\n\n` +
      `Analysis: ${analysis.warnings.join('\n')}\n\n` +
      `Expected: Local database (localhost, smcccd_dev, etc.)\n` +
      `Got: ${analysis.host}\n\n` +
      `To fix: Use .env.development with local DATABASE_URL`
    );
    throw error;
  }

  return analysis;
}