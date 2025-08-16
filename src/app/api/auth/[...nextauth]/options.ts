import { AuthOptions } from 'next-auth';
import OneLoginProvider from 'next-auth/providers/onelogin';

const authOptions: AuthOptions = {
  providers: [
    OneLoginProvider({
      clientId: process.env.ONELOGIN_CLIENT_ID,
      clientSecret: process.env.ONELOGIN_CLIENT_SECRET,
      issuer: process.env.ONELOGIN_ISSUER || 'https://smccd.onelogin.com',
      profile(profile) {
        // console.log('Raw profile data from OneLogin:', profile)
        return {
          id: profile.sub,
          name: profile.name || `${profile.given_name} ${profile.family_name}`,
          email: profile.email,
          preferred_username: profile.preferred_username
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60, // 30 minutes
    updateAge: 5 * 60, // Update session every 5 minutes
  },
  callbacks: {
    async jwt({ token, account, user, profile }) {
      // await console.log('JWT callback - entire profile:', profile)

      if (account && user) {
        token.accessToken = account.access_token;
        token.name = user.name;
        token.email = user.email;
        token.sub = user.id;
        token.iat = Date.now() / 1000; // Issued at time
        token.exp = Date.now() / 1000 + (30 * 60); // Expires in 30 minutes
        // console.log('JWT callback - token.sub:', token.sub)
      }
      return token;
    },
    async session({ session, token }) {
      // Check if token has expired
      if (token.exp && Date.now() / 1000 > Number(token.exp)) {
        return null; // Force re-authentication
      }
      
      session.user.name = token.name;
      session.user.email = token.email;
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Session callback - session:', session);
      }

      return session;
    }
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET
};

export default authOptions;
