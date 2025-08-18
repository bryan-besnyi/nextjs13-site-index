/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import NewIndexItemForm from '@/app/components/NewIndexItemForm';
import { createIndexItemAction } from '@/app/_actions';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/app/_actions', () => ({
  createIndexItemAction: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockPush = jest.fn();
const mockCreateAction = createIndexItemAction as jest.MockedFunction<typeof createIndexItemAction>;

describe('NewIndexItemForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders all form fields', () => {
    render(<NewIndexItemForm />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/letter/i)).toBeInTheDocument();
    
    // Check campus radio buttons (the campus field is a fieldset with radio buttons)
    expect(screen.getByLabelText('College of San Mateo')).toBeInTheDocument();
    expect(screen.getByLabelText('Cañada College')).toBeInTheDocument();
    expect(screen.getByLabelText('District Office')).toBeInTheDocument();
    expect(screen.getByLabelText('Skyline College')).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /add index item/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add item and add another/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<NewIndexItemForm />);
    
    const submitButton = screen.getByRole('button', { name: /add index item/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('URL must be valid')).toBeInTheDocument();
      expect(screen.getByText('Letter must be a single character')).toBeInTheDocument();
      expect(screen.getByText('Campus is required')).toBeInTheDocument();
    });
  });

  it('validates URL format', async () => {
    const user = userEvent.setup();
    render(<NewIndexItemForm />);
    
    const urlInput = screen.getByLabelText(/url/i);
    await user.type(urlInput, 'invalid-url');
    
    const submitButton = screen.getByRole('button', { name: /add index item/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('URL must be valid')).toBeInTheDocument();
    });
  });

  it('validates letter field length', async () => {
    const user = userEvent.setup();
    render(<NewIndexItemForm />);
    
    const letterInput = screen.getByLabelText(/letter/i);
    await user.type(letterInput, 'AB');
    
    const submitButton = screen.getByRole('button', { name: /add index item/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Letter must be a single character')).toBeInTheDocument();
    });
  });

  it('successfully submits valid form', async () => {
    const user = userEvent.setup();
    mockCreateAction.mockResolvedValueOnce(undefined);
    
    render(<NewIndexItemForm />);
    
    // Fill out form
    await user.type(screen.getByLabelText(/title/i), 'Test Resource');
    await user.type(screen.getByLabelText(/url/i), 'https://test.edu');
    await user.type(screen.getByLabelText(/letter/i), 'T');
    await user.click(screen.getByLabelText('College of San Mateo'));
    
    const submitButton = screen.getByRole('button', { name: /add index item/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateAction).toHaveBeenCalledWith(
        'Test Resource',
        'https://test.edu',
        'T',
        'College of San Mateo'
      );
    });
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Index item created successfully!');
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('handles submission errors', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Database error';
    mockCreateAction.mockRejectedValueOnce(new Error(errorMessage));
    
    render(<NewIndexItemForm />);
    
    // Fill out form
    await user.type(screen.getByLabelText(/title/i), 'Test Resource');
    await user.type(screen.getByLabelText(/url/i), 'https://test.edu');
    await user.type(screen.getByLabelText(/letter/i), 'T');
    await user.click(screen.getByLabelText('College of San Mateo'));
    
    const submitButton = screen.getByRole('button', { name: /add index item/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to create index item')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('resets form when "Add and Continue" is used', async () => {
    const user = userEvent.setup();
    mockCreateAction.mockResolvedValueOnce(undefined);
    
    render(<NewIndexItemForm />);
    
    // Fill out form
    const titleInput = screen.getByLabelText(/title/i);
    const urlInput = screen.getByLabelText(/url/i);
    const letterInput = screen.getByLabelText(/letter/i);
    
    await user.type(titleInput, 'Test Resource');
    await user.type(urlInput, 'https://test.edu');
    await user.type(letterInput, 'T');
    await user.click(screen.getByLabelText('College of San Mateo'));
    
    const addAndContinueButton = screen.getByRole('button', { name: /add item and add another/i });
    await user.click(addAndContinueButton);
    
    await waitFor(() => {
      expect(mockCreateAction).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(titleInput).toHaveValue('');
      expect(urlInput).toHaveValue('');
      expect(letterInput).toHaveValue('');
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    mockCreateAction.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<NewIndexItemForm />);
    
    // Fill out form
    await user.type(screen.getByLabelText(/title/i), 'Test Resource');
    await user.type(screen.getByLabelText(/url/i), 'https://test.edu');
    await user.type(screen.getByLabelText(/letter/i), 'T');
    await user.click(screen.getByLabelText('College of San Mateo'));
    
    const submitButton = screen.getByRole('button', { name: /add index item/i });
    await user.click(submitButton);
    
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.queryByText('Creating...')).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('allows dismissing error messages', async () => {
    const user = userEvent.setup();
    mockCreateAction.mockRejectedValueOnce(new Error('Test error'));
    
    render(<NewIndexItemForm />);
    
    // Fill out form and submit to trigger error
    await user.type(screen.getByLabelText(/title/i), 'Test Resource');
    await user.type(screen.getByLabelText(/url/i), 'https://test.edu');
    await user.type(screen.getByLabelText(/letter/i), 'T');
    await user.click(screen.getByLabelText('College of San Mateo'));
    
    const submitButton = screen.getByRole('button', { name: /add index item/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to create index item')).toBeInTheDocument();
    });
    
    const dismissButton = screen.getByText('Dismiss');
    await user.click(dismissButton);
    
    expect(screen.queryByText('Failed to create index item')).not.toBeInTheDocument();
  });
});