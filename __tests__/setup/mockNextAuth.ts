/**
 * Shared mock setup for NextAuth and Next.js server functions
 */

import type { Session } from 'next-auth';

// Mock next-auth at the module level
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() => Promise.resolve({ 
    user: { 
      email: 'test@smccd.edu',
      id: 'test-user-id'
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  })),
}));

// Mock Next.js headers function to prevent scope errors
jest.mock('next/headers', () => ({
  headers: jest.fn(() => {
    const mockEntries = [
      ['user-agent', 'test-agent'],
      ['x-forwarded-for', '127.0.0.1'],
      ['content-type', 'application/json']
    ];
    
    return {
      get: jest.fn((name: string) => {
        const entry = mockEntries.find(([key]) => key.toLowerCase() === name.toLowerCase());
        return entry ? entry[1] : null;
      }),
      getAll: jest.fn(() => []),
      has: jest.fn((name: string) => {
        return mockEntries.some(([key]) => key.toLowerCase() === name.toLowerCase());
      }),
      entries: jest.fn(() => mockEntries[Symbol.iterator]()),
      keys: jest.fn(() => mockEntries.map(([key]) => key)[Symbol.iterator]()),
      values: jest.fn(() => mockEntries.map(([, value]) => value)[Symbol.iterator]()),
      [Symbol.iterator]: jest.fn(() => mockEntries[Symbol.iterator]())
    };
  }),
  cookies: jest.fn(() => ({
    get: jest.fn(),
    getAll: jest.fn(() => []),
    has: jest.fn(() => false),
    delete: jest.fn(),
    set: jest.fn()
  }))
}));

// Export helper functions
export const mockGetServerSession = require('next-auth/next').getServerSession as jest.MockedFunction<any>;

export const setAuthenticatedSession = (userEmail: string = 'test@smccd.edu') => {
  mockGetServerSession.mockResolvedValue({
    user: { email: userEmail, id: 'test-user-id' },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });
};

export const setUnauthenticatedSession = () => {
  mockGetServerSession.mockResolvedValue(null);
};

export const resetAuthMocks = () => {
  mockGetServerSession.mockClear();
  setAuthenticatedSession();
};