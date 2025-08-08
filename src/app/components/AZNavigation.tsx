import Link from 'next/link';

const AZNavigation = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <section id="browse-section" className="bg-gradient-to-b from-slate-50 to-white py-16 border-b border-slate-200" aria-labelledby="az-nav-heading">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h2 id="az-nav-heading" className="font-bold text-slate-900 mb-6">
            Browse by Letter
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Explore our comprehensive directory of resources and services. 
            Select any letter to discover what&apos;s available across all SMCCCD campuses.
          </p>
        </div>
        
        <nav aria-label="Alphabetical navigation" role="navigation" className="mb-8">
          <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-13 lg:grid-cols-13 xl:grid-cols-26 gap-3 max-w-7xl mx-auto">
            {letters.map((letter, index) => (
              <Link
                key={letter}
                href={`/search/azindex?keyword=${letter}`}
                className="group relative inline-flex items-center justify-center w-14 h-14 text-xl font-bold text-slate-700 bg-white border-2 border-slate-200 rounded-2xl hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 focus:bg-indigo-50 focus:border-indigo-500 focus:text-indigo-700 focus:outline-none focus:ring-3 focus:ring-indigo-500/20 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:-translate-y-1"
                aria-label={`Browse resources starting with ${letter}`}
                style={{
                  animationDelay: `${index * 30}ms`
                }}
                data-animate="fadeInUp"
              >
                <span className="relative z-10">{letter}</span>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            ))}
          </div>
        </nav>

        {/* Quick stats or popular categories */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8 max-w-4xl mx-auto shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="group">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Academic Resources</h3>
              <p className="text-slate-600 text-sm">Libraries, research tools, and academic support services</p>
            </div>
            <div className="group">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Student Services</h3>
              <p className="text-slate-600 text-sm">Enrollment, financial aid, counseling, and student support</p>
            </div>
            <div className="group">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Campus Resources</h3>
              <p className="text-slate-600 text-sm">Facilities, technology, dining, and campus information</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AZNavigation;
