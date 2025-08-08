import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface SearchParams {
  keyword?: string;
}

export default async function AZIndexPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const keyword = resolvedSearchParams.keyword?.toUpperCase();

  // If no keyword or keyword is not a single letter, show error
  if (!keyword || keyword.length !== 1) {
    return (
      <div className="container mx-auto">
        <h1 className="mt-16 text-xl text-center text-red-700">
          Invalid search parameter. Please provide a single letter.
        </h1>
      </div>
    );
  }

  const indexItems = await prisma.indexitem.findMany({
    where: { letter: keyword },
    orderBy: { title: 'asc' }
  });

  if (indexItems.length === 0) {
    return (
      <div className="container mx-auto">
        <h1 className="mt-16 text-xl text-center text-red-700">
          No Items Found for {keyword}
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="bg-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
            A-Z Index: Letter {keyword}
          </h1>
          <p className="text-gray-600 text-center mb-8">
            {indexItems.length} resource{indexItems.length !== 1 ? 's' : ''} found starting with &quot;{keyword}&quot;
          </p>
        </div>
      </div>
      
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {indexItems.map((indexItem) => (
                <article
                  key={indexItem.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg focus-within:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-xl font-semibold flex-1">
                      {indexItem.title}
                    </h2>
                    <a
                      href={indexItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View Doorcard: ${indexItem.title} (opens in new tab)`}
                      title={`View Doorcard: ${indexItem.title}`}
                      className="inline-flex items-center px-3 py-1 ml-3 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-full hover:bg-indigo-200 focus:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex-shrink-0"
                    >
                      <span className="sr-only">View Doorcard: {indexItem.title}</span>
                      <span aria-hidden="true">View Doorcard</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4 ml-1"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </a>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p id={`campus-${indexItem.id}`}>
                      <span className="font-medium">Campus:</span> {indexItem.campus}
                    </p>
                    <p>
                      <span className="font-medium">Category:</span> {indexItem.letter.toUpperCase()}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const keyword = resolvedSearchParams.keyword?.toUpperCase();

  return {
    title: keyword ? `A-Z Index: ${keyword} | SMCCCD` : 'A-Z Index | SMCCCD',
    description: keyword
      ? `Browse index items starting with ${keyword} at San Mateo County Community College District`
      : 'Browse the A-Z index at San Mateo County Community College District'
  };
}
