// Optional: configure or set up a testing framework before each test
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

import '@testing-library/jest-dom'

// Polyfill TextEncoder/TextDecoder for Node environment
if (!global.TextEncoder) {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

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

// Mock next-auth server functions
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({ user: { email: 'test@smccd.edu' } })),
}))

// Mock Next.js server functions  
jest.mock('next/server', () => {
  class MockNextRequest {
    constructor(url, options = {}) {
      this.url = url || 'http://localhost:3000/api/test';
      this.method = options.method || 'GET';
      this.headers = new Map(Object.entries(options.headers || {}));
      this.nextUrl = new URL(this.url);
      Object.assign(this, options);
    }
    
    get(name) {
      return this.headers.get(name);
    }
  }
  
  class MockNextResponse {
    constructor(body, options = {}) {
      this.body = body;
      this.status = options.status || 200;
      this.headers = new Map(Object.entries(options.headers || {}));
    }
    
    async json() {
      return this.body;
    }
    
    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }
    
    static json(data, options = {}) {
      const response = new MockNextResponse(data, options);
      response.headers.set('content-type', 'application/json');
      return response;
    }
    
    static next() {
      return new MockNextResponse(null, { status: 200 });
    }
  }
  
  return {
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse
  };
})

// Mock Next.js cache functions
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
  unstable_cache: jest.fn((fn) => fn),
}))

// Mock Vercel KV
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }
}))

// Mock Prisma
jest.mock('@/lib/prisma-singleton', () => ({
  prisma: {
    indexitem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  }
}))

// Mock validation schemas
jest.mock('@/lib/validation-schemas', () => ({
  CreateIndexItemSchema: {
    parse: jest.fn(),
    parseAsync: jest.fn(),
    safeParse: jest.fn(() => ({ success: true, data: {} })),
    safeParseAsync: jest.fn(() => Promise.resolve({ success: true, data: {} })),
  },
  UpdateIndexItemSchema: {
    parse: jest.fn(),
    parseAsync: jest.fn(),
    safeParse: jest.fn(() => ({ success: true, data: {} })),
    safeParseAsync: jest.fn(() => Promise.resolve({ success: true, data: {} })),
  },
  IndexItemQuerySchema: {
    parse: jest.fn(),
    parseAsync: jest.fn(),
    safeParse: jest.fn(() => ({ success: true, data: {} })),
    safeParseAsync: jest.fn(() => Promise.resolve({ success: true, data: {} })),
  }
}))

// Mock @hookform/resolvers/zod
jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => async (values, context, options) => {
    // Always return successful validation for tests
    return {
      values,
      errors: {},
    };
  }),
}))

// Mock Zod
jest.mock('zod', () => {
  const mockSchema = {
    parse: jest.fn((data) => data),
    parseAsync: jest.fn((data) => Promise.resolve(data)),
    safeParse: jest.fn((data) => ({ success: true, data })),
    safeParseAsync: jest.fn((data) => Promise.resolve({ success: true, data })),
    _def: { typeName: 'ZodObject' },
  };

  return {
    z: {
      object: jest.fn(() => mockSchema),
      string: jest.fn(() => ({
        min: jest.fn().mockReturnThis(),
        max: jest.fn().mockReturnThis(),
        trim: jest.fn().mockReturnThis(),
        refine: jest.fn().mockReturnThis(),
        regex: jest.fn().mockReturnThis(),
        length: jest.fn().mockReturnThis(),
        url: jest.fn().mockReturnThis(),
        _def: { typeName: 'ZodString' },
      })),
      enum: jest.fn(() => ({
        parse: jest.fn((data) => data),
        safeParse: jest.fn((data) => ({ success: true, data })),
        _def: { typeName: 'ZodEnum' },
      })),
    },
    ZodSchema: class MockZodSchema {
      constructor() {
        this.parse = jest.fn((data) => data);
        this.parseAsync = jest.fn((data) => Promise.resolve(data));
        this.safeParse = jest.fn((data) => ({ success: true, data }));
        this.safeParseAsync = jest.fn((data) => Promise.resolve({ success: true, data }));
        this._def = { typeName: 'ZodSchema' };
      }
    }
  };
})

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