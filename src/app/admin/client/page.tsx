'use client'

import { useSession } from 'next-auth/react'

async function getData() {
  const res = await fetch('http://localhost:3000/people')
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data')
  }

  return res.json()
}

export default async function ClientPage() {
  const { data: session } = useSession({
    required: true,
  })

  const personData = await getData()

  return (
    <div className="mt-5 prose">
      <h1>Protected Page</h1>
      <p>
        This page is protected on the client side. You can only see this page if
        you are signed in.
      </p>
      <ul>
        {{personData.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}}
      </ul>
      <p>
        You are signed in as <strong>{session?.user?.email}</strong>.
      </p>
      <p>Session data:</p>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  )
}
