import { AuthOptions } from 'next-auth';
import OneLoginProvider from 'next-auth/providers/onelogin';
import CredentialsProvider from 'next-auth/providers/credentials';

// Simple bypass mode for development
const bypassAuth = process.env.BYPASS_AUTH === 'true';

const authOptions: AuthOptions = {
  providers: [
    // Development bypass provider
    ...(bypassAuth ? [
      CredentialsProvider({
        name: 'Development',
        credentials: {
          email: { label: "Email", type: "email", placeholder: "test@smccd.edu" }
        },
        async authorize(credentials) {
          if (credentials?.email) {
            return {
              id: '1',
              name: 'Test User',
              email: credentials.email,
            };
          }
          return null;
        }
      })
    ] : []),
    // Production OneLogin provider
    OneLoginProvider({
      clientId: process.env.ONELOGIN_CLIENT_ID!,
      clientSecret: process.env.ONELOGIN_CLIENT_SECRET!,
      issuer: process.env.ONELOGIN_ISSUER || 'https://smccd.onelogin.com',
    })
  ],
  
  callbacks: {
    async signIn({ user }) {
      // In bypass mode, allow any @smccd.edu email
      if (bypassAuth) {
        return user.email?.endsWith('@smccd.edu') || user.email === 'test@example.com' || true;
      }
      
      // Production: only SMCCCD domain
      return user.email?.endsWith('@smccd.edu') || false;
    },
    
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    }
  },
  
  pages: {
    signIn: '/auth/signin'
  },
  
  session: {
    strategy: 'jwt'
  }
};

export default authOptions;