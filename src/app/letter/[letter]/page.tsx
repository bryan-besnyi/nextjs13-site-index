import { prisma } from '@/lib/prisma';

export default async function Page({ params }: { params: Promise<{ letter: string }> }) {
  const { letter } = await params;
  if (letter.length !== 1) {
    return <h1 className="text-center text-red-700 text-8xl">Invalid Entry</h1>;
  }
  const indexItems = await prisma.indexitem.findMany({
    where: { letter: letter }
  });
  if (indexItems.length === 0) {
    return (
      <h1 className="mt-12 text-xl text-center text-red-700">No Items Found</h1>
    );
  }
  return (
    <div className="container mx-auto">
      <h1 className="mt-16 text-xl text-center">
        Results for: {letter.toUpperCase()}
      </h1>
      <ul>
        {indexItems.map((indexItem) => (
          <li key={indexItem.id} className="flex flex-col w-64 gap-2">
            <p>
              <a className="text-indigo-600" href={indexItem.url}>
                {indexItem.title}
              </a>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
