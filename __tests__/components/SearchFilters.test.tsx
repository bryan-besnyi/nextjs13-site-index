import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import SearchFilters from '@/app/components/SearchFilters'

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

describe('SearchFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
  })

  it('renders search form with all campus options', () => {
    render(<SearchFilters />)

    expect(screen.getByLabelText('Search')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()

    // Check all campus radio buttons
    expect(screen.getByLabelText('College of San Mateo')).toBeInTheDocument()
    expect(screen.getByLabelText('Cañada College')).toBeInTheDocument()
    expect(screen.getByLabelText('District Office')).toBeInTheDocument()
    expect(screen.getByLabelText('Skyline College')).toBeInTheDocument()
  })

  it('submits search with query and campus parameters', async () => {
    const user = userEvent.setup()
    render(<SearchFilters />)

    const searchInput = screen.getByLabelText('Search')
    const campusRadio = screen.getByLabelText('College of San Mateo')
    const submitButton = screen.getByRole('button', { name: /search/i })

    await user.type(searchInput, 'physics')
    await user.click(campusRadio)
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin?q=physics&campus=College+of+San+Mateo')
    })
  })

  it('submits search with only query parameter', async () => {
    const user = userEvent.setup()
    render(<SearchFilters />)

    const searchInput = screen.getByLabelText('Search')
    const submitButton = screen.getByRole('button', { name: /search/i })

    await user.type(searchInput, 'mathematics')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin?q=mathematics')
    })
  })

  it('submits search with only campus parameter', async () => {
    const user = userEvent.setup()
    render(<SearchFilters />)

    const campusRadio = screen.getByLabelText('Skyline College')
    const submitButton = screen.getByRole('button', { name: /search/i })

    await user.click(campusRadio)
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin?campus=Skyline+College')
    })
  })

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<SearchFilters />)

    const campusRadio = screen.getByLabelText('Cañada College')
    const clearButton = screen.getByRole('button', { name: /clear filters/i })

    await user.click(campusRadio)
    expect(campusRadio).toBeChecked()

    await user.click(clearButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })

  it('handles empty search submission', async () => {
    const user = userEvent.setup()
    render(<SearchFilters />)

    const submitButton = screen.getByRole('button', { name: /search/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin?')
    })
  })

  it('initializes with existing search parameters', () => {
    const mockSearchParamsWithValues = new URLSearchParams('?q=existing&campus=District+Office')
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParamsWithValues)

    render(<SearchFilters />)

    const searchInput = screen.getByDisplayValue('existing')
    const campusRadio = screen.getByLabelText('District Office')

    expect(searchInput).toBeInTheDocument()
    expect(campusRadio).toBeChecked()
  })

  it('has submit button that can be clicked', async () => {
    const user = userEvent.setup()
    render(<SearchFilters />)

    const submitButton = screen.getByRole('button', { name: /search/i })
    
    // Should be able to click the submit button
    await user.click(submitButton)
    
    // Should trigger navigation
    expect(mockPush).toHaveBeenCalled()
  })

  it('allows only one campus to be selected', async () => {
    const user = userEvent.setup()
    render(<SearchFilters />)

    const csmRadio = screen.getByLabelText('College of San Mateo')
    const skylineRadio = screen.getByLabelText('Skyline College')

    await user.click(csmRadio)
    expect(csmRadio).toBeChecked()

    await user.click(skylineRadio)
    expect(skylineRadio).toBeChecked()
    expect(csmRadio).not.toBeChecked()
  })

  it('handles form submission with Enter key', async () => {
    const user = userEvent.setup()
    render(<SearchFilters />)

    const searchInput = screen.getByLabelText('Search')
    await user.type(searchInput, 'biology')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin?q=biology')
    })
  })

  it('encodes special characters in URLs correctly', async () => {
    const user = userEvent.setup()
    render(<SearchFilters />)

    const searchInput = screen.getByLabelText('Search')
    const submitButton = screen.getByRole('button', { name: /search/i })

    await user.type(searchInput, 'physics & chemistry')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin?q=physics+%26+chemistry')
    })
  })
})