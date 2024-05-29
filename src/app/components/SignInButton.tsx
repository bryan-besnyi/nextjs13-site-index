'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const OneLoginSignInButton = () => {
  return (
    <div className="flex justify-center py-8">
      <Button
        variant="default"
        onClick={() =>
          signIn('onelogin', {
            callbackUrl:
              process.env.NODE_ENV === 'production'
                ? 'https://site-index.smccd.edu/admin'
                : 'http://localhost:3000/admin'
          })
        }
      >
        Continue with MySMCCD
      </Button>
    </div>
  );
};

export default OneLoginSignInButton;
