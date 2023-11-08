import Link from 'next/link'
import Image from 'next/image'

const Footer = () => {
  return (
    <>
      <footer className="grid grid-cols-3 px-8 py-10 text-white bg-slate-700">
        <div>
          <p className="z-10"></p>
          <Image
            className="opacity-10"
            src="/logo_white.png"
            alt=""
            width="300"
            height="300"
          />
        </div>
        <div></div>
        <div></div>
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
