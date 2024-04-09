import { Suspense } from 'react';
import OneLoginSignInButton from '../../components/SignInButton';

export default function SignInPage() {
  return (
    <div className="h-80">
      <Suspense>
        <OneLoginSignInButton />
      </Suspense>
    </div>
  );
}
