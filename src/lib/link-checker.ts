import { prisma } from './prisma-singleton';
import { kv } from '@vercel/kv';

export interface LinkCheckResult {
  id: number;
  url: string;
  status: 'active' | 'dead' | 'redirect' | 'timeout' | 'error';
  statusCode?: number;
  responseTime?: number;
  redirectUrl?: string;
  error?: string;
  lastChecked: Date;
}

export interface LinkCheckSummary {
  total: number;
  active: number;
  dead: number;
  redirects: number;
  timeouts: number;
  errors: number;
  lastScanDate?: Date;
}

const LINK_CHECK_PREFIX = 'linkcheck:';
const BATCH_SIZE = 10; // Check 10 links at a time to avoid overwhelming servers
const REQUEST_TIMEOUT = 10000; // 10 second timeout
const USER_AGENT = 'SMCCCD Site Index Checker/1.0 (Educational Use)';

/**
 * Check if a single URL is accessible
 */
async function checkSingleLink(id: number, url: string): Promise<LinkCheckResult> {
  const startTime = Date.now();
  const result: LinkCheckResult = {
    id,
    url,
    status: 'error',
    lastChecked: new Date()
  };

  try {
    // Add timeout and proper headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      method: 'HEAD', // Use HEAD to avoid downloading content
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      },
      redirect: 'manual' // Handle redirects manually
    });

    clearTimeout(timeoutId);
    result.responseTime = Date.now() - startTime;
    result.statusCode = response.status;

    // Handle different status codes
    if (response.status >= 200 && response.status < 300) {
      result.status = 'active';
    } else if (response.status >= 300 && response.status < 400) {
      result.status = 'redirect';
      result.redirectUrl = response.headers.get('location') || undefined;
    } else if (response.status === 404 || response.status === 410) {
      result.status = 'dead';
    } else if (response.status >= 500) {
      result.status = 'error';
      result.error = `Server error: ${response.status}`;
    } else {
      result.status = 'error';
      result.error = `Unexpected status: ${response.status}`;
    }

  } catch (error: any) {
    result.responseTime = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      result.status = 'timeout';
      result.error = 'Request timeout';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      result.status = 'dead';
      result.error = 'Host not found';
    } else if (error.message?.includes('certificate') || error.message?.includes('SSL')) {
      result.status = 'error';
      result.error = 'SSL/Certificate error';
    } else {
      result.status = 'error';
      result.error = error.message || 'Network error';
    }
  }

  return result;
}

/**
 * Check multiple links with rate limiting
 */
async function checkLinksInBatches(links: Array<{id: number, url: string}>): Promise<LinkCheckResult[]> {
  const results: LinkCheckResult[] = [];
  
  // Process in batches to avoid overwhelming servers
  for (let i = 0; i < links.length; i += BATCH_SIZE) {
    const batch = links.slice(i, i + BATCH_SIZE);
    
    console.log(`Checking links ${i + 1} to ${Math.min(i + BATCH_SIZE, links.length)} of ${links.length}`);
    
    // Check batch in parallel
    const batchPromises = batch.map(link => checkSingleLink(link.id, link.url));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    // Wait between batches to be respectful to servers
    if (i + BATCH_SIZE < links.length) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
  }
  
  return results;
}

/**
 * Perform a full link check scan
 */
export async function performLinkCheck(): Promise<{
  results: LinkCheckResult[];
  summary: LinkCheckSummary;
}> {
  console.log('🔍 Starting link check scan...');
  
  try {
    // Get all links from database
    const indexItems = await prisma.indexitem.findMany({
      select: {
        id: true,
        url: true,
        title: true
      }
    });
    
    if (indexItems.length === 0) {
      return {
        results: [],
        summary: {
          total: 0, active: 0, dead: 0, redirects: 0, timeouts: 0, errors: 0
        }
      };
    }
    
    console.log(`📊 Checking ${indexItems.length} links...`);
    
    // Check all links
    const results = await checkLinksInBatches(
      indexItems.map(item => ({ id: item.id, url: item.url }))
    );
    
    // Calculate summary
    const summary: LinkCheckSummary = {
      total: results.length,
      active: results.filter(r => r.status === 'active').length,
      dead: results.filter(r => r.status === 'dead').length,
      redirects: results.filter(r => r.status === 'redirect').length,
      timeouts: results.filter(r => r.status === 'timeout').length,
      errors: results.filter(r => r.status === 'error').length,
      lastScanDate: new Date()
    };
    
    // Store results in cache
    const cacheKey = `${LINK_CHECK_PREFIX}results`;
    const summaryKey = `${LINK_CHECK_PREFIX}summary`;
    
    await Promise.all([
      kv.set(cacheKey, results, { ex: 24 * 60 * 60 }), // Cache for 24 hours
      kv.set(summaryKey, summary, { ex: 24 * 60 * 60 })
    ]);
    
    console.log('✅ Link check completed:', summary);
    
    return { results, summary };
    
  } catch (error) {
    console.error('❌ Link check failed:', error);
    throw error;
  }
}

/**
 * Get cached link check results
 */
export async function getCachedLinkCheckResults(): Promise<{
  results: LinkCheckResult[] | null;
  summary: LinkCheckSummary | null;
}> {
  try {
    const [results, summary] = await Promise.all([
      kv.get(`${LINK_CHECK_PREFIX}results`) as Promise<LinkCheckResult[] | null>,
      kv.get(`${LINK_CHECK_PREFIX}summary`) as Promise<LinkCheckSummary | null>
    ]);
    
    return { results, summary };
  } catch (error) {
    console.error('Error getting cached link results:', error);
    return { results: null, summary: null };
  }
}

/**
 * Check specific links by campus or letter
 */
export async function checkLinksByFilter(
  filter: { campus?: string; letter?: string }
): Promise<LinkCheckResult[]> {
  try {
    const whereClause: any = {};
    if (filter.campus) whereClause.campus = filter.campus;
    if (filter.letter) whereClause.letter = filter.letter;
    
    const indexItems = await prisma.indexitem.findMany({
      where: whereClause,
      select: { id: true, url: true }
    });
    
    console.log(`Checking ${indexItems.length} filtered links...`);
    
    return await checkLinksInBatches(
      indexItems.map(item => ({ id: item.id, url: item.url }))
    );
    
  } catch (error) {
    console.error('Error checking filtered links:', error);
    throw error;
  }
}

/**
 * Get dead links with additional context
 */
export async function getDeadLinksReport(): Promise<Array<{
  id: number;
  title: string;
  url: string;
  campus: string;
  letter: string;
  status: string;
  error?: string;
  lastChecked?: Date;
}>> {
  const { results } = await getCachedLinkCheckResults();
  
  if (!results) {
    return [];
  }
  
  // Get dead/error links
  const problemLinks = results.filter(r => 
    r.status === 'dead' || r.status === 'error' || r.status === 'timeout'
  );
  
  if (problemLinks.length === 0) {
    return [];
  }
  
  // Get additional context from database
  const linkIds = problemLinks.map(r => r.id);
  const indexItems = await prisma.indexitem.findMany({
    where: { id: { in: linkIds } },
    select: {
      id: true,
      title: true,
      url: true,
      campus: true,
      letter: true
    }
  });
  
  // Combine results with context
  return indexItems.map(item => {
    const result = problemLinks.find(r => r.id === item.id);
    return {
      ...item,
      status: result?.status || 'unknown',
      error: result?.error,
      lastChecked: result?.lastChecked
    };
  });
}