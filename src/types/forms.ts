/**
 * Form validation and input types
 */

import { z } from 'zod';

// Define constants locally to avoid circular dependency
const VALID_CAMPUSES = [
  'College of San Mateo',
  'Skyline College', 
  'Cañada College',
  'District Office'
] as const;

const VALID_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Form field types
export interface FormFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
  error?: string;
}

// Index item form types
export interface IndexItemFormData {
  title: string;
  url: string;
  letter: string;
  campus: string;
}

export interface NewIndexItemFormProps {
  onSubmit?: (data: IndexItemFormData) => void | Promise<void>;
  initialData?: Partial<IndexItemFormData>;
  isSubmitting?: boolean;
}

export interface EditIndexItemFormProps {
  itemId: number;
  initialData: IndexItemFormData;
  onSubmit?: (data: IndexItemFormData) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

// Form validation schemas (exported from validation-schemas.ts)
export const CreateIndexItemSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim()
    .refine(val => val.length > 0, 'Title cannot be empty after trimming'),
  
  letter: z.string()
    .length(1, 'Letter must be exactly one character')
    .regex(/^[A-Z]$/, 'Letter must be a single uppercase letter A-Z')
    .refine(val => VALID_LETTERS.includes(val), 'Invalid letter provided'),
  
  url: z.string()
    .min(1, 'URL is required')
    .max(2048, 'URL must be 2048 characters or less')
    .refine(val => {
      try {
        const urlObj = new URL(val);
        return ['http:', 'https:'].includes(urlObj.protocol);
      } catch {
        return false;
      }
    }, 'Invalid URL format'),
  
  campus: z.enum(VALID_CAMPUSES, {
    errorMap: () => ({ message: `Campus must be one of: ${VALID_CAMPUSES.join(', ')}` })
  })
});

export const UpdateIndexItemSchema = CreateIndexItemSchema.partial().refine(
  data => Object.keys(data).length > 0,
  'At least one field must be provided for update'
);

// Form submission states
export interface FormSubmissionState {
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
}

// Search form types
export interface SearchFormData {
  query: string;
  campus?: string;
  letter?: string;
  filters?: {
    includeInactive?: boolean;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}

export interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFormData) => void;
  initialFilters?: Partial<SearchFormData>;
  isLoading?: boolean;
}

// Bulk edit form types
export interface BulkEditFormData {
  selectedItems: Set<number>;
  operations: {
    updateCampus?: string;
    updateLetter?: string;
    addTitlePrefix?: string;
    addTitleSuffix?: string;
    replaceInUrl?: {
      find: string;
      replace: string;
    };
    replaceInTitle?: {
      find: string;
      replace: string;
    };
  };
  confirmDangerous: boolean;
}

// Import form types
export interface ImportFormData {
  file: File;
  format: 'csv' | 'json';
  options: {
    skipDuplicates: boolean;
    updateExisting: boolean;
    validateOnly: boolean;
    delimiter?: string; // for CSV
    encoding?: string;
  };
}

// Settings form types
export interface SettingsFormData {
  system: {
    siteName: string;
    description: string;
    adminEmail: string;
    maintenanceMode: boolean;
  };
  performance: {
    enableCaching: boolean;
    cacheTimeout: number;
    enableMetrics: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
  };
  search: {
    enableFuzzySearch: boolean;
    maxResults: number;
    highlightMatches: boolean;
    enableAnalytics: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupInterval: 'daily' | 'weekly' | 'monthly';
    retentionDays: number;
    includeMetrics: boolean;
  };
}

// Form validation result types
export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Form field error types
export interface FieldError {
  type: string;
  message: string;
}

export interface FormErrors {
  [fieldName: string]: FieldError | undefined;
}

// Campus selection types
export interface CampusOption {
  id: string;
  value: string;
  label: string;
  description?: string;
}

// Letter selection types
export interface LetterOption {
  value: string;
  label: string;
  count?: number; // Number of items with this letter
}

// Form context types
export interface FormContextValue {
  errors: FormErrors;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  setFieldValue: (field: string, value: any) => void;
  setFieldError: (field: string, error: FieldError | undefined) => void;
  validateField: (field: string) => Promise<void>;
  validateForm: () => Promise<boolean>;
}

// Auto-save types
export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // milliseconds
  fields: string[]; // which fields to auto-save
  storageKey: string;
}

export interface AutoSaveState {
  lastSaved?: Date;
  isDirty: boolean;
  isSaving: boolean;
  savedData?: any;
}