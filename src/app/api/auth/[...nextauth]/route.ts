import NextAuth from 'next-auth';
import OneLoginProvider from 'next-auth/providers/onelogin';

const authOptions = {
  providers: [
    OneLoginProvider({
      clientId: process.env.ONELOGIN_CLIENT_ID,
      clientSecret: process.env.ONELOGIN_CLIENT_SECRET,
      issuer: 'https://smccd.onelogin.com'
    })
  ],
  pages: {
    signIn: '/',
    signOut: '/'
  },
  debug: false,
  secret: process.env.SECRET as string
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
