'use client';

import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

const OneLoginSignInButton = () => {
  const searchParams = useSearchParams();

  return (
    <div className="flex justify-center py-8">
      <button
        className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        onClick={() =>
          signIn('onelogin', { callbackUrl: 'http://localhost:3000/admin' })
        }
      >
        Continue with MySMCCD
      </button>
    </div>
  );
};

export default OneLoginSignInButton;
