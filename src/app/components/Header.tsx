'use client';
import Link from 'next/link';

const Header = () => {
  return (
    <header>
      <nav>
        <ul className="px-8 py-5 text-lg text-white bg-indigo-800">
          <li className="flex items-center justify-between">
            <Link href="/" className="text-2xl">
              SMCCCD Site Index
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
