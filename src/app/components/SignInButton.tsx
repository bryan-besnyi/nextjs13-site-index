"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

const OneLoginSignInButton = () => {
  const searchParams = useSearchParams();
  // const callbackUrl = searchParams.get("http://localhost:3000/admin");

  return (
    <div className="flex justify-center mt-32">
      <button
        className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        onClick={() => signIn("onelogin")}
      >
        Continue with MySMCCD
      </button>
    </div>
  );
};

export default OneLoginSignInButton;
