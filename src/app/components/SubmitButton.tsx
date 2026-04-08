'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';

export default function SubmitButton({ children, pendingText = 'Saving...' }: { children: React.ReactNode; pendingText?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
      type="submit"
      disabled={pending}
    >
      {pending ? (
        <span className="flex items-center">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {pendingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
