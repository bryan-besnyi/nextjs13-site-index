import Link from 'next/link'
import Image from 'next/image'

const Footer = () => {
  return (
    <>
      <footer className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8 py-10 text-white bg-slate-700">
        <div className="relative">
          <Image
            className="opacity-10"
            src="/logo_white.png"
            alt="SMCCD Logo"
            width="300"
            height="300"
          />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <Link 
                href="https://smccd.edu" 
                className="text-gray-300 hover:text-white hover:underline transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                SMCCD Main Site
              </Link>
            </li>
            <li>
              <Link 
                href="https://smccd.edu/accessibility" 
                className="text-gray-300 hover:text-white hover:underline transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Accessibility information and resources"
              >
                Accessibility
              </Link>
            </li>
            <li>
              <Link 
                href="https://smccd.edu/privacy-policy" 
                className="text-gray-300 hover:text-white hover:underline transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contact</h3>
          <div className="text-gray-300 space-y-2">
            <p>San Mateo County Community College District</p>
            <p>3401 CSM Drive</p>
            <p>San Mateo, CA 94402</p>
            <p>
              <a 
                href="mailto:webmaster@smccd.edu" 
                className="hover:text-white hover:underline transition-colors"
              >
                webmaster@smccd.edu
              </a>
            </p>
            <p>
              <a 
                href="https://support.smccd.edu" 
                className="hover:text-white hover:underline transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Support Portal
              </a>
            </p>
          </div>
        </div>
      </footer>
      <div className="py-3 text-center bg-slate-900">
        <p className="text-gray-200">
          <Link className="hover:underline" href="/admin" role="presentation">
            &copy;
          </Link>{' '}
          {new Date().getFullYear()} San Mateo County Community College District
        </p>
      </div>
    </>
  )
}

export default Footer
