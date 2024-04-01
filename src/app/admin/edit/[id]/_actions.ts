import { updateIndexItem } from '@/lib/indexItems';

export async function action({ request, params }) {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405 });
  }

  const formData = await request.formData();
  const title = formData.get('title');
  const url = formData.get('url');
  const letter = formData.get('letter');
  const campus = formData.get('campus');
  const numericId = Number(params.id);

  try {
    const updatedItem = await updateIndexItem(
      numericId,
      title,
      url,
      letter,
      campus
    );
    return new Response(null, {
      status: 303,
      headers: {
        Location: '/admin/'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
