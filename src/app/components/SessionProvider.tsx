'use client';

import { SessionProvider } from 'next-auth/react';

type SessionProviderProps = {
  children: React.ReactNode;
};

/**
 * Provides session context to its children components.
 *
 * @component
 * @param {SessionProviderProps} props - The props for the SessionProvider component.
 * @param {React.ReactNode} props.children - The children components to be wrapped by the SessionProvider.
 * @returns {JSX.Element} The rendered SessionProvider component.
 */
const Provider = ({ children }: SessionProviderProps) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export default SessionProvider;
