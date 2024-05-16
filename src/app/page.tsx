import { getIndexItems } from '@/lib/indexItems';
import OneLoginSignInButton from './components/SignInButton';
import { Suspense } from 'react';

const Card = ({ children }) => (
  <div className="p-4 border border-gray-300 rounded-md shadow-md bg-white/80 backdrop-blur-md">
    {children}
  </div>
);

const Button = ({ children, color = 'default' }) => {
  let bgColor, hoverBgColor, focusRingColor;

  if (color === 'csm') {
    bgColor = 'bg-blue-600';
    hoverBgColor = 'hover:bg-blue-700';
    focusRingColor = 'focus:ring-blue-600';
  } else if (color === 'can') {
    bgColor = 'bg-green-600';
    hoverBgColor = 'hover:bg-green-700';
    focusRingColor = 'focus:ring-green-600';
  } else if (color === 'sky') {
    bgColor = 'bg-red-600';
    hoverBgColor = 'hover:bg-red-700';
    focusRingColor = 'focus:ring-red-600';
  } else {
    bgColor = 'bg-indigo-600';
    hoverBgColor = 'hover:bg-indigo-700';
    focusRingColor = 'focus:ring-indigo-600';
  }

  return (
    <button
      className={`px-4 py-2 mt-4 text-white rounded ${bgColor} ${hoverBgColor} focus:outline-none ${focusRingColor} focus:ring-opacity-50`}
    >
      {children}
    </button>
  );
};

// homepage will display a sign-in card for employees only
export default async function Home() {
  const { indexItems } = await getIndexItems();

  return (
    <div
      className="flex items-center justify-center py-64 bg-center bg-no-repeat bg-cover"
      style={{ backgroundImage: "url('/signin-bg.webp')" }}
    >
      <Card>
        <h1 className="text-4xl font-bold text-center">Site Index Admin</h1>
        <div className="">
          <p className="mt-4 font-bold text-center text-red-800">
            This site is intended for staff only.
          </p>
          <Suspense fallback={<div>Loading...</div>}>
            <OneLoginSignInButton />
          </Suspense>
        </div>
        <div className="grid grid-cols-3 gap-2 text-white">
          <Button color="can">
            <a
              href="https://canadacollege.edu/"
              target="_blank"
              rel="noreferrer noopener"
            >
              Cañada College
            </a>
          </Button>
          <div className="">
            <Button color="csm">
              <a
                href="https://collegeofsanmateo.edu/"
                target="_blank"
                rel="noreferrer noopener"
              >
                College of San Mateo
              </a>
            </Button>
          </div>
          <div>
            <Button color="sky">
              <a
                href="https://skylinecollege.edu/"
                target="_blank"
                rel="noreferrer noopener"
              >
                Skyline College
              </a>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
