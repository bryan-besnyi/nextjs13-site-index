import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { kv } from '@vercel/kv';
import { getSearchAnalytics } from '@/lib/search-analytics';

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

// Get search overview metrics - now uses real data
async function getSearchOverview(startDate: Date, endDate: Date) {
  try {
    const analytics = await getSearchAnalytics(startDate, endDate);
    return analytics.overview;
  } catch (error) {
    console.error('Error getting search overview:', error);
    // Return fallback data if real data fails
    return {
      totalSearches: 0,
      uniqueSearchers: 0,
      avgSearchesPerUser: 0,
      noResultsRate: 0
    };
  }
}

// Get top search terms with click-through rates - now uses real data
async function getTopSearchTerms(startDate: Date, endDate: Date) {
  try {
    const analytics = await getSearchAnalytics(startDate, endDate);
    
    // If we have real data, return it
    if (analytics.topSearchTerms && analytics.topSearchTerms.length > 0) {
      return analytics.topSearchTerms.slice(0, 10);
    }
    
    // Return empty array if no data yet
    return [];
  } catch (error) {
    console.error('Error getting top search terms:', error);
    return [];
  }
}

// Get searches that returned no results - now uses real data
async function getNoResultsSearches(startDate: Date, endDate: Date) {
  try {
    const analytics = await getSearchAnalytics(startDate, endDate);
    
    // Return real no-results data
    if (analytics.noResultsSearches && analytics.noResultsSearches.length > 0) {
      return analytics.noResultsSearches;
    }
    
    return [];
  } catch (error) {
    console.error('Error getting no-results searches:', error);
    return [];
  }
}

// Get search patterns and behavior data
async function getSearchPatterns(startDate: Date, endDate: Date) {
  try {
    // Calculate real filter usage from Redis
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    let campusFilterCount: number = 0;
    let letterFilterCount: number = 0;
    let totalSearches: number = 0;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      // Get filter usage counts
      const campusFilters = await kv.hgetall(`search:filter:campus:${dateKey}`);
      const letterFilters = await kv.hgetall(`search:filter:letter:${dateKey}`);
      const dayTotal = await kv.hget(`search:total:${dateKey}`, 'count');
      
      if (campusFilters) {
        const additionalCampusCount = Object.values(campusFilters).reduce((sum: number, val: unknown) => {
          return sum + Number(val || 0);
        }, 0) as number;
        campusFilterCount += additionalCampusCount;
      }
      if (letterFilters) {
        const additionalLetterCount = Object.values(letterFilters).reduce((sum: number, val: unknown) => {
          return sum + Number(val || 0);
        }, 0) as number;
        letterFilterCount += additionalLetterCount;
      }
      if (dayTotal) {
        totalSearches += Number(dayTotal);
      }
    }
    
    return {
      avgSearchLength: 2.3, // This would need actual term analysis
      refinementRate: 0.35, // This would need session tracking
      exitRate: 0.20, // This would need session tracking
      filterUsage: {
        campus: totalSearches > 0 ? campusFilterCount / totalSearches : 0,
        letter: totalSearches > 0 ? letterFilterCount / totalSearches : 0
      }
    };
  } catch (error) {
    console.error('Error getting search patterns:', error);
    return {
      avgSearchLength: 0,
      refinementRate: 0,
      exitRate: 0,
      filterUsage: { campus: 0, letter: 0 }
    };
  }
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
    
    // Calculate date range
    const { start, end } = getDateRange(range);

    // Fetch all data with real date ranges
    const [overview, topSearchTerms, noResultsSearches, searchPatterns] = await Promise.all([
      getSearchOverview(start, end),
      getTopSearchTerms(start, end),
      getNoResultsSearches(start, end),
      getSearchPatterns(start, end)
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