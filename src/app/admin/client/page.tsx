'use client'

import { useSession } from 'next-auth/react'

const ClientPage = () => {
  const { data: session } = useSession({
    required: true,
  })
  return (
    <div className="mt-5 prose">
      <h1>Protected Page</h1>
      <p>
        This page is protected on the client side. You can only see this page if
        you are signed in.
      </p>
      <p>
        You are signed in as <strong>{session?.user?.email}</strong>.
      </p>
      <p>Session data:</p>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  )
}

export default ClientPage
