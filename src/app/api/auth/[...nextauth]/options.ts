import { AuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import OneLoginProvider from 'next-auth/providers/onelogin';

const authOptions: AuthOptions = {
  providers: [
    OneLoginProvider({
      clientId: process.env.ONELOGIN_CLIENT_ID,
      clientSecret: process.env.ONELOGIN_CLIENT_SECRET,
      issuer: 'https://smccd.onelogin.com',
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
  callbacks: {
    async jwt({ token, account, user, profile }) {
      // await console.log('JWT callback - entire profile:', profile)

      if (account && user) {
        token.accessToken = account.access_token;
        token.name = user.name;
        token.email = user.email;
        token.sub = user.id;
        // console.log('JWT callback - token.sub:', token.sub)
      }
      return token;
    },
    async session({ session, token }) {
      session.user.name = token.name;
      session.user.email = token.email;
      if (process.env.NODE_ENV === 'development') console.log('Session callback - session:', session);

      return session;
    }
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET
};

// Server actions are separate POST endpoints; the admin layout redirect does
// not run for them, so every write action must call this itself.
export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error('Unauthorized');
  return session;
}

export default authOptions;
