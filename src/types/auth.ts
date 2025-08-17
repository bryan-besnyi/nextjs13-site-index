/**
 * Authentication and session types
 */

import { User as NextAuthUser, Session as NextAuthSession } from 'next-auth';
import { JWT as NextAuthJWT } from 'next-auth/jwt';

// Extended user types
export interface User extends NextAuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  preferred_username?: string;
  roles?: string[];
  permissions?: string[];
  lastLogin?: Date;
  isActive?: boolean;
}

// Extended session types
export interface Session extends NextAuthSession {
  user: User;
  accessToken?: string;
  expires: string;
}

// Extended JWT types
export interface JWT extends NextAuthJWT {
  accessToken?: string;
  refreshToken?: string;
  name?: string | null;
  email?: string | null;
  sub?: string;
  iat?: number;
  exp?: number;
  roles?: string[];
  permissions?: string[];
}

// OneLogin profile data
export interface OneLoginProfile {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  preferred_username?: string;
  email_verified?: boolean;
  groups?: string[];
  roles?: string[];
  department?: string;
  organization?: string;
}

// Authentication provider configuration
export interface AuthProvider {
  id: string;
  name: string;
  type: 'oauth' | 'saml' | 'ldap';
  clientId: string;
  clientSecret: string;
  issuer?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  jwksUrl?: string;
  scope?: string;
  claims?: {
    sub?: string;
    name?: string;
    email?: string;
    groups?: string;
  };
}

// Authentication configuration
export interface AuthConfig {
  providers: AuthProvider[];
  session: {
    strategy: 'jwt' | 'database';
    maxAge: number;
    updateAge: number;
  };
  jwt: {
    secret?: string;
    maxAge: number;
  };
  pages: {
    signIn?: string;
    signOut?: string;
    error?: string;
  };
  callbacks: {
    signIn?: boolean;
    redirect?: boolean;
    session?: boolean;
    jwt?: boolean;
  };
  events?: {
    signIn?: boolean;
    signOut?: boolean;
    createUser?: boolean;
    updateUser?: boolean;
    linkAccount?: boolean;
    session?: boolean;
  };
  debug?: boolean;
}

// User roles and permissions
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'admin';
  scope?: 'own' | 'department' | 'organization' | 'global';
}

// User management types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  preferredUsername?: string;
  avatar?: string;
  department?: string;
  organization?: string;
  roles: Role[];
  permissions: Permission[];
  preferences: UserPreferences;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  pageSize: number;
  notifications: {
    email: boolean;
    browser: boolean;
    slack?: boolean;
  };
  dashboard: {
    layout: 'default' | 'compact' | 'detailed';
    widgets: string[];
  };
}

// Authentication error types
export interface AuthError {
  type: 'signin' | 'signout' | 'callback' | 'session' | 'csrf' | 'verification';
  message: string;
  code?: string;
  status?: number;
}

// Session management
export interface SessionData {
  user: User;
  accessToken?: string;
  refreshToken?: string;
  expiresAt: Date;
  issuedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  csrfToken?: string;
}

// Authentication events
export interface AuthEvent {
  type: 'signin' | 'signout' | 'session_created' | 'session_expired' | 'token_refresh';
  userId?: string;
  email?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

// CSRF protection
export interface CSRFToken {
  value: string;
  expiresAt: Date;
  sessionId?: string;
}

// Authentication middleware types
export interface AuthMiddlewareConfig {
  publicRoutes: string[];
  protectedRoutes: string[];
  adminRoutes: string[];
  apiRoutes: string[];
  redirects: {
    signin: string;
    signout: string;
    unauthorized: string;
    forbidden: string;
  };
  session: {
    validateOnRequest: boolean;
    updateLastSeen: boolean;
  };
}

// Login attempt tracking
export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
  error?: string;
  blocked?: boolean;
}

// Rate limiting for auth
export interface AuthRateLimit {
  ip: string;
  attempts: number;
  lastAttempt: Date;
  blockedUntil?: Date;
}

// OAuth state management
export interface OAuthState {
  state: string;
  codeVerifier?: string;
  redirectUrl?: string;
  expiresAt: Date;
}

// Account linking
export interface LinkedAccount {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  type: 'oauth' | 'saml' | 'ldap';
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
  idToken?: string;
  sessionState?: string;
  createdAt: Date;
  updatedAt: Date;
}