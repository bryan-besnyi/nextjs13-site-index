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
import { IndexItemFormData, CampusInfo, VALID_CAMPUSES } from '@/types';
import { CreateIndexItemSchema } from '@/types/forms';
import StatusMessage from '@/components/ui/status-message';

const campusInfo: CampusInfo[] = [
  { id: 'collegeOfSanMateo', value: 'College of San Mateo' },
  { id: 'canadaCollege', value: 'Cañada College' },
  { id: 'districtOffice', value: 'District Office' },
  { id: 'skylineCollege', value: 'Skyline College' }
];

const NewIndexItemForm: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const form = useForm<IndexItemFormData>({
    resolver: zodResolver(CreateIndexItemSchema),
    defaultValues: {
      title: '',
      url: '',
      letter: '',
      campus: ''
    }
  });

  const onSubmit: SubmitHandler<IndexItemFormData> = async (data, event) => {
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
      <div className="space-y-6">
        {/* Success Message */}
        {submitSuccess && (
          <StatusMessage
            type="success"
            message="Index item created successfully!"
            onDismiss={() => setSubmitSuccess(false)}
          />
        )}

        {/* Error Message */}
        {submitError && (
          <StatusMessage
            type="error"
            title="Failed to create index item"
            message={submitError}
            onDismiss={() => setSubmitError(null)}
          />
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {campusInfo.map((campus) => (
                  <div key={campus.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      id={campus.id}
                      type="radio"
                      value={campus.value}
                      checked={field.value === campus.value}
                      onChange={() => field.onChange(campus.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={campus.id}
                      className="ml-3 text-sm font-medium text-gray-900 cursor-pointer"
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
        
        <div className="flex gap-4 pt-4 border-t">
          {submitButtons}
        </div>
      </form>
      </div>
    </Form>
  );
};

export default NewIndexItemForm;
