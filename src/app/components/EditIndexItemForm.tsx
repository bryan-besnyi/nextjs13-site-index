'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form';
import { useRouter } from 'next/router';

const campusInfo = [
  { id: 'collegeOfSanMateo', value: 'College of San Mateo' },
  { id: 'canadaCollege', value: 'Cañada College' },
  { id: 'districtOffice', value: 'District Office' },
  { id: 'skylineCollege', value: 'Skyline College' }
];

interface FormValues {
  title: string;
  url: string;
  letter: string;
  campus: string;
}

interface Props {
  defaultValues: FormValues;
}

const EditIndexItemForm: React.FC<Props> = ({ defaultValues }) => {
  const router = useRouter();
  const formSchema = z.object({
    title: z.string().min(1, { message: 'Title is required' }),
    url: z.string().url({ message: 'URL must be valid' }),
    letter: z
      .string()
      .length(1, { message: 'Letter must be a single character' }),
    campus: z.string().min(1, { message: 'Campus is required' })
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    // Assuming an API route is used to handle the update
    const response = await fetch(`/api/updateIndexItem/${router.query.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      router.push('/admin');
    } else {
      // Handle errors here
      console.error('Failed to update index item');
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col max-w-2xl gap-3 p-5"
    >
      <label htmlFor="title">Title</label>
      <input {...form.register('title')} type="text" className="input" />

      <label htmlFor="url">URL</label>
      <input {...form.register('url')} type="text" className="input" />

      <label htmlFor="letter">Letter</label>
      <input
        {...form.register('letter')}
        type="text"
        maxLength={1}
        className="input"
      />

      <fieldset>
        <legend>Campus</legend>
        {campusInfo.map((campus) => (
          <div key={campus.id}>
            <input
              {...form.register('campus')}
              type="radio"
              value={campus.value}
              id={campus.id}
            />
            <label htmlFor={campus.id}>{campus.value}</label>
          </div>
        ))}
      </fieldset>

      <FormMessage />

      <Button type="submit">Update Index Item</Button>
    </form>
  );
};

export default EditIndexItemForm;
