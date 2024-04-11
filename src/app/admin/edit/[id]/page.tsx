import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function AdminEditPage({ params: { id } }) {
  const indexItem = await prisma.indexitem.findUnique({
    where: { id: Number(id) }
  });
  if (!indexItem) {
    return <h1 className="text-red-700">No Item Found</h1>;
  }

  async function updateIndexItemAction(formData: FormData): Promise<Response> {
    'use server';

    const title = formData.get('title') as string;
    const url = formData.get('url') as string;
    const letter = formData.get('letter') as string;
    const campus = formData.get('campus') as string;

    await prisma.indexitem.update({
      where: { id: indexItem?.id },
      data: {
        title,
        url,
        letter,
        campus
      }
    });

    redirect('/admin');
  }

  return (
    <div>
      <h1 className="p-5 text-3xl font-bold bg-slate-200">
        Edit Index Item: {indexItem.title} - (ID: {id}){' '}
      </h1>
      <form
        method="post"
        action={updateIndexItemAction}
        className="flex flex-col max-w-2xl gap-3 p-5"
      >
        <label
          htmlFor="title"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          defaultValue={indexItem.title}
        />
        <label
          className="block text-sm font-medium leading-6 text-gray-900"
          htmlFor="url"
        >
          URL
        </label>
        <input
          id="url"
          name="url"
          type="text"
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          defaultValue={indexItem.url}
        />
        <label
          className="block text-sm font-medium leading-6 text-gray-900"
          htmlFor="letter"
        >
          Letter
        </label>
        <input
          id="letter"
          type="text"
          name="letter"
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          defaultValue={indexItem.letter}
        />
        <label
          className="block text-sm font-medium leading-6 text-gray-900"
          htmlFor="campus"
        >
          Campus
        </label>
        <input
          id="campus"
          name="campus"
          type="text"
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          defaultValue={indexItem.campus}
        />
        <div className="mt-5">
          <button
            className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            type="submit"
          >
            Update Index Item
          </button>
        </div>
      </form>
    </div>
  );
}
