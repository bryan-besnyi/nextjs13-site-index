// Optional: configure or set up a testing framework before each test
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock Next Auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated'
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock Vercel KV
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }
}))

// Mock environment variables
process.env = {
  ...process.env,
  NEXTAUTH_SECRET: 'test-secret',
  NEXTAUTH_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/testdb',
  NODE_ENV: 'test',
}

// Mock URL class for Node environment
if (typeof URL === 'undefined') {
  global.URL = class URL {
    constructor(input, base) {
      if (typeof input !== 'string') {
        throw new TypeError('Invalid URL');
      }
      
      // Handle absolute URLs
      if (input.startsWith('http://') || input.startsWith('https://')) {
        this.href = input;
        const url = new require('url').URL(input);
        this.origin = url.origin;
        this.pathname = url.pathname;
        this.search = url.search;
        this.protocol = url.protocol;
        this.host = url.host;
        this.hostname = url.hostname;
        this.port = url.port;
      } else {
        // Handle relative URLs with base
        if (base) {
          const baseUrl = new require('url').URL(base);
          const resolved = new require('url').URL(input, base);
          this.href = resolved.href;
          this.origin = resolved.origin;
          this.pathname = resolved.pathname;
          this.search = resolved.search;
          this.protocol = resolved.protocol;
          this.host = resolved.host;
          this.hostname = resolved.hostname;
          this.port = resolved.port;
        } else {
          this.href = input;
          this.origin = '';
          this.pathname = input;
          this.search = '';
          this.protocol = '';
          this.host = '';
          this.hostname = '';
          this.port = '';
        }
      }
    }
    
    static createObjectURL = jest.fn(() => 'mock-url');
    static revokeObjectURL = jest.fn();
  };
}

// Ensure URL.createObjectURL and revokeObjectURL are available
if (global.URL && !global.URL.createObjectURL) {
  global.URL.createObjectURL = jest.fn(() => 'mock-url');
  global.URL.revokeObjectURL = jest.fn();
}

// Mock HTMLElement methods (only in jsdom environment)
if (typeof HTMLElement !== 'undefined') {
  Object.defineProperty(HTMLElement.prototype, 'click', {
    value: jest.fn(),
    writable: true,
  });
}

// Add ResizeObserver mock for charts
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Suppress console logs during tests
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    // Uncomment to ignore specific log levels
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    // Keep error for debugging
    // error: jest.fn(),
  }
}