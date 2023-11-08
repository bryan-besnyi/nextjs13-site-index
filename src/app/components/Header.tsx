'use client'
import Link from 'next/link'

const Letters = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  '1',
]

const Header = () => {
  return (
    <header>
      <nav>
        <ul className="px-8 py-5 text-lg text-white bg-indigo-800">
          <li className="flex items-center justify-between">
            <Link href="/" className="text-2xl">
              SMCCCD Site Index
            </Link>
            <div>
              <Link
                className="mr-8 hover:underline hover:text-indigo-200"
                href="/"
              >
                Home
              </Link>
              {/* If a user session exists, show "logout", if it does not, show "login" */}
              <Link
                className="hover:underline hover:text-indigo-200"
                href="/api/auth/signin"
              >
                Login
              </Link>
            </div>
          </li>
        </ul>
        <ul className="flex justify-between px-12 py-2 bg-indigo-900">
          {Letters.map((letter) => (
            <li key={letter}>
              <Link className="text-white uppercase" href={`/letter/${letter}`}>
                {letter}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

export default Header
