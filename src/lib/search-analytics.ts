import { kv } from '@vercel/kv';

// Keys for storing search analytics
const SEARCH_PREFIX = 'search:';
const SEARCH_TERMS_KEY = `${SEARCH_PREFIX}terms`;
const SEARCH_TOTAL_KEY = `${SEARCH_PREFIX}total`;
const SEARCH_USERS_KEY = `${SEARCH_PREFIX}users`;
const SEARCH_NO_RESULTS_KEY = `${SEARCH_PREFIX}no_results`;
const SEARCH_CLICKS_KEY = `${SEARCH_PREFIX}clicks`;

interface SearchEvent {
  term: string;
  timestamp: Date;
  resultCount: number;
  campus?: string;
  letter?: string;
  userId?: string;
}

interface ClickEvent {
  searchTerm: string;
  clickedItemId: number;
  position: number;
  timestamp: Date;
}

/**
 * Track a search event
 */
export async function trackSearch(event: SearchEvent) {
  try {
    const dateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const hourKey = new Date().toISOString().split(':')[0]; // YYYY-MM-DDTHH
    
    // Increment total searches
    await kv.hincrby(`${SEARCH_TOTAL_KEY}:${dateKey}`, 'count', 1);
    await kv.hincrby(`${SEARCH_TOTAL_KEY}:hour:${hourKey}`, 'count', 1);
    
    // Track unique users (if userId provided)
    if (event.userId) {
      await kv.sadd(`${SEARCH_USERS_KEY}:${dateKey}`, event.userId);
    }
    
    // Track search term frequency
    const normalizedTerm = event.term.toLowerCase().trim();
    await kv.hincrby(`${SEARCH_TERMS_KEY}:${dateKey}`, normalizedTerm, 1);
    
    // Track no results
    if (event.resultCount === 0) {
      await kv.hincrby(`${SEARCH_NO_RESULTS_KEY}:${dateKey}`, normalizedTerm, 1);
    }
    
    // Track filters used
    if (event.campus) {
      await kv.hincrby(`${SEARCH_PREFIX}filter:campus:${dateKey}`, event.campus, 1);
    }
    if (event.letter) {
      await kv.hincrby(`${SEARCH_PREFIX}filter:letter:${dateKey}`, event.letter, 1);
    }
    
    // Set expiration (90 days for daily data)
    await kv.expire(`${SEARCH_TOTAL_KEY}:${dateKey}`, 90 * 24 * 60 * 60);
    await kv.expire(`${SEARCH_TERMS_KEY}:${dateKey}`, 90 * 24 * 60 * 60);
    await kv.expire(`${SEARCH_NO_RESULTS_KEY}:${dateKey}`, 90 * 24 * 60 * 60);
    
    // Hourly data expires after 7 days
    await kv.expire(`${SEARCH_TOTAL_KEY}:hour:${hourKey}`, 7 * 24 * 60 * 60);
    
  } catch (error) {
    console.error('Error tracking search:', error);
    // Don't throw - analytics shouldn't break the app
  }
}

/**
 * Track when a user clicks on a search result
 */
export async function trackSearchClick(event: ClickEvent) {
  try {
    const dateKey = new Date().toISOString().split('T')[0];
    const normalizedTerm = event.searchTerm.toLowerCase().trim();
    
    // Track clicks for the search term
    await kv.hincrby(`${SEARCH_CLICKS_KEY}:${dateKey}`, normalizedTerm, 1);
    
    // Track position data for CTR analysis
    await kv.hincrby(
      `${SEARCH_PREFIX}position:${dateKey}:${event.position}`, 
      'clicks', 
      1
    );
    
    // Set expiration
    await kv.expire(`${SEARCH_CLICKS_KEY}:${dateKey}`, 90 * 24 * 60 * 60);
    
  } catch (error) {
    console.error('Error tracking search click:', error);
  }
}

/**
 * Get aggregated search analytics for a date range
 */
export async function getSearchAnalytics(startDate: Date, endDate: Date) {
  try {
    const days = getDaysBetween(startDate, endDate);
    
    // Aggregate data across all days
    let totalSearches = 0;
    let uniqueUsers = new Set<string>();
    let noResultsCount = 0;
    const termCounts = new Map<string, number>();
    const noResultTerms = new Map<string, number>();
    const clickCounts = new Map<string, number>();
    
    for (const day of days) {
      const dateKey = day.toISOString().split('T')[0];
      
      // Get total searches
      const dayTotal = await kv.hget(`${SEARCH_TOTAL_KEY}:${dateKey}`, 'count');
      if (dayTotal) totalSearches += Number(dayTotal);
      
      // Get unique users
      const dayUsers = await kv.smembers(`${SEARCH_USERS_KEY}:${dateKey}`);
      if (dayUsers) dayUsers.forEach(user => uniqueUsers.add(String(user)));
      
      // Get search terms
      const dayTerms = await kv.hgetall(`${SEARCH_TERMS_KEY}:${dateKey}`);
      if (dayTerms) {
        Object.entries(dayTerms).forEach(([term, count]) => {
          termCounts.set(term, (termCounts.get(term) || 0) + Number(count));
        });
      }
      
      // Get no results terms
      const dayNoResults = await kv.hgetall(`${SEARCH_NO_RESULTS_KEY}:${dateKey}`);
      if (dayNoResults) {
        Object.entries(dayNoResults).forEach(([term, count]) => {
          const numCount = Number(count);
          noResultTerms.set(term, (noResultTerms.get(term) || 0) + numCount);
          noResultsCount += numCount;
        });
      }
      
      // Get click data
      const dayClicks = await kv.hgetall(`${SEARCH_CLICKS_KEY}:${dateKey}`);
      if (dayClicks) {
        Object.entries(dayClicks).forEach(([term, count]) => {
          clickCounts.set(term, (clickCounts.get(term) || 0) + Number(count));
        });
      }
    }
    
    // Calculate top search terms with CTR
    const topSearchTerms = Array.from(termCounts.entries())
      .map(([term, count]) => {
        const clicks = clickCounts.get(term) || 0;
        return {
          term,
          count,
          clickThrough: count > 0 ? clicks / count : 0
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    
    // Get top no-results searches
    const noResultsSearches = Array.from(noResultTerms.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      overview: {
        totalSearches,
        uniqueSearchers: uniqueUsers.size,
        avgSearchesPerUser: uniqueUsers.size > 0 ? totalSearches / uniqueUsers.size : 0,
        noResultsRate: totalSearches > 0 ? noResultsCount / totalSearches : 0
      },
      topSearchTerms,
      noResultsSearches
    };
    
  } catch (error) {
    console.error('Error getting search analytics:', error);
    throw error;
  }
}

/**
 * Helper to get array of dates between two dates
 */
function getDaysBetween(startDate: Date, endDate: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}