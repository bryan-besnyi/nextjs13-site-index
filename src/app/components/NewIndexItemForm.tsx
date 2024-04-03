'use client';

import { useRouter } from 'next/navigation';
import { createIndexItemAction } from '../_actions';

const NewIndexItemForm: React.FC = () => {
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await action(data);
    router.push('/admin');
  };

  async function action(data: FormData) {
    const title = data.get('title');
    if (typeof title !== 'string' || !title) return;
    const url = data.get('url');
    if (typeof url !== 'string' || !url) return;
    const letter = data.get('letter');
    if (typeof letter !== 'string' || !letter) return;
    const campus = data.get('campus');
    if (typeof campus !== 'string' || !campus) return;

    await createIndexItemAction(title, url, letter, campus);
  }

  return (
    <form className="flex flex-col max-w-2xl gap-3" onSubmit={handleSubmit}>
      <label
        htmlFor="title"
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        Title
      </label>
      <input
        id="title"
        type="text"
        name="title"
        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
      />
      <label
        className="block mt-3 text-sm font-medium leading-6 text-gray-900"
        htmlFor="letter"
      >
        Letter
      </label>
      <input
        id="letter"
        type="text"
        name="letter"
        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
      />
      <label
        className="block mt-3 text-sm font-medium leading-6 text-gray-900"
        htmlFor="url"
      >
        URL
      </label>
      <input
        id="url"
        type="text"
        name="url"
        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
      />
      <label className="mt-3" htmlFor="campus">
        Campus
      </label>
      <select
        id="campus"
        name="campus"
        className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
        required={true}
      >
        <option value="CAN">Cañada College</option>
        <option value="CSM">College of San Mateo</option>
        <option value="DO">District Office</option>
        <option value="SKY">Skyline College</option>
      </select>
      <div className="flex flex-row gap-3 mt-5">
        <button
          type="submit"
          className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Add Index Item
        </button>
        {/* TODO: Make this button work *}
        {/* <button
          type="submit"
          className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          Add Index Item and Add Another
        </button> */}
      </div>
    </form>
  );
};

export default NewIndexItemForm;
