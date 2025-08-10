import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { kv } from '@vercel/kv';

// Helper to calculate date ranges
function getDateRange(range: string) {
  const now = new Date();
  const start = new Date();
  
  switch (range) {
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setDate(now.getDate() - 30);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setDate(now.getDate() - 30);
  }
  
  return { start, end: now };
}

// Get search overview metrics
async function getSearchOverview(range: string) {
  const totalSearches = Number(await kv.get(`search:total:${range}`)) || 15000;
  const uniqueSearchers = Number(await kv.get(`search:users:${range}`)) || 1200;
  const noResults = Number(await kv.get(`search:no_results:${range}`)) || 2250;
  
  return {
    totalSearches,
    uniqueSearchers,
    avgSearchesPerUser: uniqueSearchers > 0 ? totalSearches / uniqueSearchers : 0,
    noResultsRate: totalSearches > 0 ? noResults / totalSearches : 0
  };
}

// Get top search terms with click-through rates
async function getTopSearchTerms(range: string) {
  // In a real implementation, this would come from search analytics data
  // For now, return mock data that represents typical college search patterns
  const mockTerms = [
    { term: 'financial aid', count: 2500, clickThrough: 0.85 },
    { term: 'registration', count: 2000, clickThrough: 0.90 },
    { term: 'counseling', count: 1800, clickThrough: 0.75 },
    { term: 'library', count: 1500, clickThrough: 0.95 },
    { term: 'parking', count: 1200, clickThrough: 0.88 },
    { term: 'transcript', count: 1000, clickThrough: 0.92 },
    { term: 'bookstore', count: 950, clickThrough: 0.87 },
    { term: 'calendar', count: 800, clickThrough: 0.78 },
    { term: 'tutoring', count: 750, clickThrough: 0.82 },
    { term: 'career center', count: 600, clickThrough: 0.90 }
  ];

  // Adjust counts based on range
  const multiplier = range === 'week' ? 0.25 : range === 'year' ? 4 : 1;
  return mockTerms.map(term => ({
    ...term,
    count: Math.floor(term.count * multiplier)
  }));
}

// Get searches that returned no results
async function getNoResultsSearches(range: string) {
  // Mock data for searches that commonly fail
  const mockNoResults = [
    { term: 'meal plan', count: 150 },
    { term: 'dormitory', count: 120 },
    { term: 'sports teams', count: 100 },
    { term: 'student housing', count: 95 },
    { term: 'gym membership', count: 80 },
    { term: 'cafeteria menu', count: 75 },
    { term: 'clubs', count: 65 },
    { term: 'alumni services', count: 60 }
  ];

  // Adjust counts based on range
  const multiplier = range === 'week' ? 0.25 : range === 'year' ? 4 : 1;
  return mockNoResults.map(term => ({
    ...term,
    count: Math.floor(term.count * multiplier)
  })).filter(term => term.count > 0);
}

// Get search patterns and behavior data
async function getSearchPatterns(range: string) {
  return {
    avgSearchLength: 2.3,
    refinementRate: 0.35,
    exitRate: 0.20,
    filterUsage: {
      campus: 0.45,
      letter: 0.20
    }
  };
}

// Generate recommendations based on search data
async function getRecommendations(topTerms: any[], noResults: any[]) {
  const recommendations = [];

  // Identify missing content opportunities
  noResults.slice(0, 3).forEach(term => {
    if (term.count > 50) {
      recommendations.push({
        type: 'missing_content',
        suggestion: `Add content for "${term.term}" - searched ${term.count} times with no results`
      });
    }
  });

  // Identify low click-through opportunities
  topTerms.forEach(term => {
    if (term.clickThrough < 0.8 && term.count > 1000) {
      recommendations.push({
        type: 'low_clickthrough',
        suggestion: `Improve results for "${term.term}" - only ${(term.clickThrough * 100).toFixed(0)}% click-through rate`
      });
    }
  });

  // Add popular path recommendations
  if (topTerms.some(t => t.term === 'financial aid') && topTerms.some(t => t.term === 'forms')) {
    recommendations.push({
      type: 'popular_path',
      suggestion: 'Create direct link for "financial aid → forms" path'
    });
  }

  return recommendations.slice(0, 5); // Limit to top 5 recommendations
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || 'month';

    // Fetch all data
    const [overview, topSearchTerms, noResultsSearches, searchPatterns] = await Promise.all([
      getSearchOverview(range),
      getTopSearchTerms(range),
      getNoResultsSearches(range),
      getSearchPatterns(range)
    ]);

    // Generate recommendations
    const recommendations = await getRecommendations(topSearchTerms, noResultsSearches);

    return NextResponse.json({
      overview,
      topSearchTerms,
      noResultsSearches,
      searchPatterns,
      recommendations
    });
  } catch (error) {
    console.error('Search analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search insights' },
      { status: 500 }
    );
  }
}