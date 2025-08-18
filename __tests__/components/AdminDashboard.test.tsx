/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '@/app/components/AdminDashboard';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock chart components that may not render in JSDOM
jest.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with empty data', () => {
    render(<AdminDashboard initialData={[]} />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays data table with provided items', async () => {
    const mockData = [
      { id: 1, title: 'Test Item 1', letter: 'A', campus: 'College of San Mateo', url: 'https://example.com' },
      { id: 2, title: 'Test Item 2', letter: 'B', campus: 'Skyline College', url: 'https://example2.com' }
    ];

    render(<AdminDashboard initialData={mockData} />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
  });

  it('displays campus distribution', async () => {
    const mockData = [
      { id: 1, title: 'Item 1', letter: 'A', campus: 'College of San Mateo', url: 'https://example.com' },
      { id: 2, title: 'Item 2', letter: 'B', campus: 'College of San Mateo', url: 'https://example2.com' },
      { id: 3, title: 'Item 3', letter: 'C', campus: 'Skyline College', url: 'https://example3.com' }
    ];

    render(<AdminDashboard initialData={mockData} />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByText('College of San Mateo').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Skyline College').length).toBeGreaterThan(0);
  });

  it('handles different campus types', async () => {
    const mockData = [
      { id: 1, title: 'Item 1', letter: 'A', campus: 'Cañada College', url: 'https://example.com' },
      { id: 2, title: 'Item 2', letter: 'B', campus: 'District Office', url: 'https://example2.com' }
    ];

    render(<AdminDashboard initialData={mockData} />);
    
    expect(screen.getAllByText('Cañada College').length).toBeGreaterThan(0);
    expect(screen.getAllByText('District Office').length).toBeGreaterThan(0);
  });

  it('displays letter distribution', async () => {
    const mockData = [
      { id: 1, title: 'Apple', letter: 'A', campus: 'College of San Mateo', url: 'https://example.com' },
      { id: 2, title: 'Banana', letter: 'B', campus: 'Skyline College', url: 'https://example2.com' },
      { id: 3, title: 'Cherry', letter: 'C', campus: 'Cañada College', url: 'https://example3.com' }
    ];

    render(<AdminDashboard initialData={mockData} />);
    
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('handles table sorting functionality', async () => {
    const mockData = [
      { id: 3, title: 'Zebra', letter: 'Z', campus: 'College of San Mateo', url: 'https://example.com' },
      { id: 1, title: 'Apple', letter: 'A', campus: 'Skyline College', url: 'https://example2.com' },
      { id: 2, title: 'Banana', letter: 'B', campus: 'Cañada College', url: 'https://example3.com' }
    ];

    render(<AdminDashboard initialData={mockData} />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Zebra')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  it('handles empty search results gracefully', () => {
    render(<AdminDashboard initialData={[]} />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays search filters component', () => {
    render(<AdminDashboard initialData={[]} />);
    
    // Check that search filters are rendered
    expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
  });
});