'use client';

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
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
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
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Validate data before submission
      if (!data.title.trim()) {
        throw new Error('Title is required');
      }
      
      if (!data.url.trim()) {
        throw new Error('URL is required');
      }
      
      // Basic URL validation
      try {
        new URL(data.url);
      } catch {
        throw new Error('Please enter a valid URL');
      }

      if (!data.letter.trim() || data.letter.length !== 1) {
        throw new Error('Letter must be a single character');
      }

      if (!data.campus.trim()) {
        throw new Error('Campus selection is required');
      }

      await createIndexItemAction(data.title, data.url, data.letter, data.campus);
      
      setSubmitSuccess(true);
      toast.success('Index item created successfully!');
      
      if (submitType === 'addAndContinue') {
        form.reset();
        setSubmitSuccess(false);
      } else {
        setTimeout(() => {
          router.push('/admin');
        }, 1500);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitButtons = (
    <>
      <Button 
        type="submit" 
        name="addAndFinish" 
        disabled={isSubmitting}
        className="relative"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            {submitSuccess ? (
              <CheckCircle className="mr-2 h-4 w-4" />
            ) : null}
            Add Index Item
          </>
        )}
      </Button>
      <Button 
        type="submit" 
        name="addAndContinue" 
        variant="outline"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          'Add Item and Add Another'
        )}
      </Button>
    </>
  );

  return (
    <Form {...form}>
      {/* Success Message */}
      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-sm text-green-700">Index item created successfully!</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="text-sm text-red-700 font-medium">Failed to create index item</p>
              <p className="text-sm text-red-600 mt-1">{submitError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

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
