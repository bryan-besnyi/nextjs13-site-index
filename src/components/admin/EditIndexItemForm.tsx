'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Save,
  X,
  Eye,
  Clock,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

const campusInfo = [
  { id: 'collegeOfSanMateo', value: 'College of San Mateo' },
  { id: 'canadaCollege', value: 'Cañada College' },
  { id: 'districtOffice', value: 'District Office' },
  { id: 'skylineCollege', value: 'Skyline College' }
];

const formSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  url: z.string().url({ message: 'URL must be valid' }),
  letter: z.string().length(1, { message: 'Letter must be a single character' }),
  campus: z.string().min(1, { message: 'Campus is required' })
});

interface FormValues {
  title: string;
  url: string;
  letter: string;
  campus: string;
}

interface IndexItem {
  id: number;
  title: string;
  url: string;
  letter: string;
  campus: string;
  createdAt: string;
  updatedAt: string;
}

interface EditIndexItemFormProps {
  item: IndexItem;
}

export default function EditIndexItemForm({ item }: EditIndexItemFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: item.title,
      url: item.url,
      letter: item.letter,
      campus: item.campus
    }
  });

  const currentValues = form.watch();
  const hasChanges = JSON.stringify(currentValues) !== JSON.stringify({
    title: item.title,
    url: item.url,
    letter: item.letter,
    campus: item.campus
  });

  const onSubmit = async (data: FormValues) => {
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

      // Call server action
      const { updateIndexItemAction } = await import('@/app/_actions');
      const result = await updateIndexItemAction(
        item.id,
        data.title,
        data.url,
        data.letter,
        data.campus
      );

      if (result.error) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Update failed');
      }

      setSubmitSuccess(true);
      toast.success('Index item updated successfully!');

      setTimeout(() => {
        router.push('/admin/data');
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    router.push('/admin/data');
  };

  const previewUrl = () => {
    if (currentValues.url) {
      window.open(currentValues.url, '_blank');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Index Item</h1>
          <p className="text-muted-foreground mt-2">
            Update the details for this index item
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-sm text-green-700">Index item updated successfully! Redirecting...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="text-sm text-red-700 font-medium">Failed to update index item</p>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>
                          Title <span className="text-red-500" aria-label="required">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter a descriptive title"
                            aria-required="true"
                            aria-invalid={!!fieldState.error}
                            aria-describedby={fieldState.error ? `title-error` : undefined}
                          />
                        </FormControl>
                        {fieldState.error && (
                          <FormMessage
                            id="title-error"
                            role="alert"
                            className="text-red-600"
                          >
                            {fieldState.error.message}
                          </FormMessage>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>
                          URL <span className="text-red-500" aria-label="required">*</span>
                        </FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="https://example.com" 
                              className="flex-1"
                              aria-required="true"
                              aria-invalid={!!fieldState.error}
                              aria-describedby={fieldState.error ? `url-error` : 'url-help'}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={previewUrl}
                            disabled={!currentValues.url}
                            aria-label="Preview URL in new window"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        <p id="url-help" className="text-xs text-gray-500">
                          Enter a complete URL starting with http:// or https://
                        </p>
                        {fieldState.error && (
                          <FormMessage
                            id="url-error"
                            role="alert"
                            className="text-red-600"
                          >
                            {fieldState.error.message}
                          </FormMessage>
                        )}
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
                          <Input 
                            {...field} 
                            placeholder="A" 
                            maxLength={1} 
                            className="w-20"
                            style={{ textTransform: 'uppercase' }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="campus"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>
                          Campus <span className="text-red-500" aria-label="required">*</span>
                        </FormLabel>
                        <fieldset className="space-y-4">
                          <legend className="sr-only">Select campus location</legend>
                          {campusInfo.map((campus) => (
                            <div key={campus.id} className="flex items-center">
                              <input
                                id={campus.id}
                                name="campus-selection"
                                type="radio"
                                value={campus.value}
                                checked={field.value === campus.value}
                                onChange={() => field.onChange(campus.value)}
                                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                                aria-describedby={fieldState.error ? 'campus-error' : undefined}
                              />
                              <label
                                htmlFor={campus.id}
                                className="ml-3 text-sm font-medium leading-6 text-gray-900"
                              >
                                {campus.value}
                              </label>
                            </div>
                          ))}
                        </fieldset>
                        {fieldState.error && (
                          <FormMessage
                            id="campus-error"
                            role="alert"
                            className="text-red-600"
                          >
                            {fieldState.error.message}
                          </FormMessage>
                        )}
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !hasChanges}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Update Item
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Item Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID</p>
                <p className="text-sm">{item.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(item.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 border rounded p-3">
                <h4 className="font-medium text-sm mb-2">How this will appear:</h4>
                <div className="text-sm">
                  <p><strong>Letter:</strong> {currentValues.letter || '?'}</p>
                  <p><strong>Title:</strong> {currentValues.title || 'Untitled'}</p>
                  <p><strong>Campus:</strong> {currentValues.campus || 'No campus selected'}</p>
                  <p><strong>URL:</strong> 
                    {currentValues.url ? (
                      <a 
                        href={currentValues.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline ml-1"
                      >
                        {currentValues.url}
                      </a>
                    ) : (
                      <span className="text-muted-foreground ml-1">No URL</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}