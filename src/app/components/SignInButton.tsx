'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const OneLoginSignInButton = () => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex justify-center py-8">
      <Button
        variant="default"
        disabled={loading}
        onClick={() => {
          setLoading(true);
          signIn('onelogin', {
            callbackUrl:
              process.env.NODE_ENV === 'production'
                ? 'https://site-index.smccd.edu/admin'
                : 'http://localhost:3000/admin'
          });
        }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          'Continue with MySMCCD'
        )}
      </Button>
    </div>
  );
};

export default OneLoginSignInButton;
