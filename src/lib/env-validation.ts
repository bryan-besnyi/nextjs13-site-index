/**
 * Environment variable validation
 * Ensures all required environment variables are present at runtime
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'ONELOGIN_CLIENT_ID',
  'ONELOGIN_CLIENT_SECRET',
  'ONELOGIN_ISSUER',
] as const;

const optionalEnvVars = [
  'KV_REST_API_READ_ONLY_TOKEN',
  'KV_REST_API_TOKEN',
  'KV_REST_API_URL',
  'KV_URL',
  'NODE_ENV',
] as const;

type RequiredEnvVars = typeof requiredEnvVars[number];
type OptionalEnvVars = typeof optionalEnvVars[number];

export type EnvVars = RequiredEnvVars | OptionalEnvVars;

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

/**
 * Validates that all required environment variables are present
 * Call this early in your application startup
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new EnvironmentError(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  // Validate specific formats
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres')) {
    throw new EnvironmentError('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.match(/^https?:\/\//)) {
    throw new EnvironmentError('NEXTAUTH_URL must be a valid URL');
  }

  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    throw new EnvironmentError('NEXTAUTH_SECRET must be at least 32 characters long');
  }
}

/**
 * Type-safe environment variable getter
 */
export function getEnvVar(key: RequiredEnvVars): string;
export function getEnvVar(key: OptionalEnvVars): string | undefined;
export function getEnvVar(key: EnvVars): string | undefined {
  return process.env[key];
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if Redis/KV is configured
 */
export function isRedisConfigured(): boolean {
  return !!(
    process.env.KV_REST_API_TOKEN &&
    process.env.KV_REST_API_URL &&
    process.env.KV_URL
  );
}

// Validate on module load in development
if (process.env.NODE_ENV !== 'production') {
  try {
    validateEnv();
  } catch (error) {
    console.error('Environment validation failed:', error);
    // Don't throw in development to allow for gradual setup
  }
}