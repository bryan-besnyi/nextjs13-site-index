import prisma from '@/lib/prisma';

export default async function AdminEditPage({ params: { id } }) {
  const indexItem = await prisma.indexItem.findUnique({
    where: { id: Number(id) }
  });
  if (!indexItem) {
    return <h1 className="text-red-700">No Item Found</h1>;
  }

  async function updateIndexItemAction(formData) {
    'use server';

    const title = formData.get('title');
    const url = formData.get('url');
    const letter = formData.get('letter');
    const campus = formData.get('campus');

    await prisma.indexItem.update({
      where: { id: indexItem.id },
      data: {
        title,
        url,
        letter,
        campus
      }
    });

    // Redirect after successful update
    return new Response(null, {
      status: 303,
      headers: {
        Location: `/admin/`
      }
    });
  }

  return (
    <div className="p-5">
      <h1 className="mb-3 text-xl">
        Edit Index Item: {indexItem.title} - (ID: {id}){' '}
      </h1>
      <form
        method="post"
        action={updateIndexItemAction}
        className="flex flex-col w-64"
      >
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={indexItem.title}
        />
        <label className="mt-3" htmlFor="url">
          URL
        </label>
        <input id="url" name="url" type="text" defaultValue={indexItem.url} />
        <label className="mt-3" htmlFor="letter">
          Letter
        </label>
        <input
          id="letter"
          type="text"
          name="letter"
          defaultValue={indexItem.letter}
        />
        <label className="mt-3" htmlFor="campus">
          Campus
        </label>
        <input
          id="campus"
          name="campus"
          type="text"
          defaultValue={indexItem.campus}
        />
        <button
          className="px-3 py-2 mt-5 text-white bg-indigo-800 rounded-md shadow-md"
          type="submit"
        >
          Update Index Item
        </button>
      </form>
    </div>
  );
}
