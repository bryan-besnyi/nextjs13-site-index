import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import * as CachedIndexItems from '@/lib/indexItems-cached';
import { PerformanceCollector } from '@/lib/performance-collector';
import { trackSearch } from '@/lib/search-analytics';

// Rate limiting
const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(30, '60 s') // 30 requests per minute
});

export async function GET(req: NextRequest) {
  const startTime = performance.now();
  
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    const { success, remaining } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // Parse parameters
    const params = req.nextUrl.searchParams;
    const campus = params.get('campus');
    const letter = params.get('letter');
    const search = params.get('search');
    
    let result;
    let cacheHit = false;
    
    // Route to appropriate cached function
    if (search) {
      result = await CachedIndexItems.searchItems(search, campus || undefined);
      cacheHit = result.cacheHit || false;
    } else if (letter) {
      result = await CachedIndexItems.getItemsByLetter(letter);
      cacheHit = result.cacheHit || false;
    } else if (campus) {
      result = await CachedIndexItems.getItemsByCampus(campus);
      cacheHit = result.cacheHit || false;
    } else {
      result = await CachedIndexItems.getAllIndexItems();
      cacheHit = result.cacheHit || false;
    }
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to fetch index items' },
        { status: 500 }
      );
    }
    
    // Extract the items based on the result structure
    const items = (result as any).indexItems || (result as any).items || (result as any).results || [];
    
    // Track search analytics (non-blocking)
    if (search || letter || campus) {
      trackSearch({
        term: search || `${campus || ''}:${letter || ''}`.trim(),
        timestamp: new Date(),
        resultCount: items.length,
        campus: campus || undefined,
        letter: letter || undefined,
        userId: ip // Using IP as a simple user identifier
      }).catch(err => console.warn('Search tracking failed:', err));
    }
    
    // Collect performance metrics
    await PerformanceCollector.collectMetrics(req, NextResponse.json(items), startTime);
    
    return NextResponse.json(items, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': cacheHit ? 'public, max-age=3600' : 'public, max-age=300',
        'X-Cache': cacheHit ? 'HIT' : 'MISS',
        'X-Response-Time': `${Math.round(performance.now() - startTime)}ms`,
        'X-RateLimit-Remaining': remaining.toString()
      }
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, url, letter, campus } = body;
    
    // Validation
    if (!title || !url || !letter || !campus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const result = await CachedIndexItems.createIndexItem(title, url, letter, campus);
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to create item' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result.newIndexItem, { status: 201 });
    
  } catch (error) {
    console.error('Create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const startTime = performance.now();
  
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    const body = await req.json();
    const { id, title, url, letter, campus } = body;
    
    // Validation - id is required, others are optional for PATCH
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    // At least one field must be updated
    if (!title && !url && !letter && !campus) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }
    
    // Build update data object with only provided fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (url !== undefined) updateData.url = url;
    if (letter !== undefined) updateData.letter = letter;
    if (campus !== undefined) updateData.campus = campus;
    
    const result = await CachedIndexItems.updateIndexItemPartial(
      parseInt(id),
      updateData
    );
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to update item' },
        { status: 500 }
      );
    }
    
    // Collect performance metrics
    await PerformanceCollector.collectMetrics(
      req,
      NextResponse.json(result.updatedItem),
      startTime
    );
    
    return NextResponse.json(result.updatedItem);
    
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Support PUT as an alias for PATCH
export async function PUT(req: NextRequest) {
  return PATCH(req);
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter required' },
        { status: 400 }
      );
    }
    
    const result = await CachedIndexItems.deleteIndexItem(parseInt(id));
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to delete item' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'Item deleted successfully' });
    
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}