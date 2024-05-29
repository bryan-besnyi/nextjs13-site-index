'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createIndexItemAction } from '../_actions';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const campusInfo = [
  { id: 'collegeOfSanMateo', value: 'College of San Mateo' },
  { id: 'canadaCollege', value: 'Cañada College' },
  { id: 'districtOffice', value: 'District Office' },
  { id: 'skylineCollege', value: 'Skyline College' }
];

const formSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  url: z.string().url({ message: 'URL must be valid' }),
  letter: z
    .string()
    .length(1, { message: 'Letter must be a single character' }),
  campus: z.string().min(1, { message: 'Campus is required' })
});

interface FormValues {
  title: string;
  url: string;
  letter: string;
  campus: string;
}

const NewIndexItemForm: React.FC = () => {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      url: '',
      letter: '',
      campus: ''
    }
  });

  const onSubmit: SubmitHandler<FormValues> = async (data, event) => {
    const submitType = (event?.nativeEvent as any).submitter.name;
    await createIndexItemAction(data.title, data.url, data.letter, data.campus);
    if (submitType === 'addAndContinue') {
      form.reset();
    } else {
      router.push('/admin');
    }
  };

  const submitButtons = (
    <>
      <Button type="submit" name="addAndFinish">
        Add Index Item
      </Button>
      <Button type="submit" name="addAndContinue">
        Add Index Item and Add Another
      </Button>
    </>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://example.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="letter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Letter</FormLabel>
              <FormControl>
                <Input {...field} placeholder="A" maxLength={1} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="campus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campus</FormLabel>
              <div className="space-y-4">
                {campusInfo.map((campus) => (
                  <div key={campus.id} className="flex items-center">
                    <input
                      id={campus.id}
                      type="radio"
                      value={campus.value}
                      checked={field.value === campus.value}
                      onChange={() => field.onChange(campus.value)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                    />
                    <label
                      htmlFor={campus.id}
                      className="ml-3 text-sm font-medium leading-6 text-gray-900"
                    >
                      {campus.value}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-x-4">{submitButtons}</div>
      </form>
    </Form>
  );
};

export default NewIndexItemForm;
