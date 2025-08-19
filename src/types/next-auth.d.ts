import { UserRole, College } from '@prisma/client';
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
      college?: College | null;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: UserRole;
    college?: College | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
    college?: College | null;
  }
}