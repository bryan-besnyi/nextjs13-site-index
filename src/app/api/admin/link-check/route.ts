import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { 
  performLinkCheck, 
  getCachedLinkCheckResults, 
  checkLinksByFilter,
  getDeadLinksReport 
} from '@/lib/link-checker';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'status';
    const campus = searchParams.get('campus');
    const letter = searchParams.get('letter');

    switch (action) {
      case 'status':
        // Get cached results and summary
        const { results, summary } = await getCachedLinkCheckResults();
        return NextResponse.json({
          hasCachedData: !!results,
          summary,
          lastScan: summary?.lastScanDate
        });

      case 'results':
        // Get full cached results
        const cachedData = await getCachedLinkCheckResults();
        return NextResponse.json(cachedData);

      case 'dead-links':
        // Get detailed report of dead links
        const deadLinks = await getDeadLinksReport();
        return NextResponse.json({ deadLinks });

      case 'filter':
        // Check specific subset of links
        if (!campus && !letter) {
          return NextResponse.json(
            { error: 'Campus or letter filter required' },
            { status: 400 }
          );
        }
        
        const filteredResults = await checkLinksByFilter({ campus, letter });
        return NextResponse.json({ results: filteredResults });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: status, results, dead-links, filter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Link check API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, campus, letter } = body;

    switch (action) {
      case 'full-scan':
        // Perform full link check (this can take a while)
        console.log(`Full link scan initiated by: ${session.user.email}`);
        
        // Run in background for large datasets
        const scanPromise = performLinkCheck();
        
        // Return immediately with scan started message
        // For production, you'd want to use a job queue
        return NextResponse.json({
          message: 'Link check scan started',
          status: 'scanning',
          estimatedTime: '5-10 minutes for full scan'
        });

      case 'quick-scan':
        // Perform targeted scan
        if (!campus && !letter) {
          return NextResponse.json(
            { error: 'Campus or letter required for quick scan' },
            { status: 400 }
          );
        }
        
        const results = await checkLinksByFilter({ campus, letter });
        const summary = {
          total: results.length,
          active: results.filter(r => r.status === 'active').length,
          dead: results.filter(r => r.status === 'dead').length,
          redirects: results.filter(r => r.status === 'redirect').length,
          timeouts: results.filter(r => r.status === 'timeout').length,
          errors: results.filter(r => r.status === 'error').length
        };
        
        return NextResponse.json({ results, summary });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: full-scan, quick-scan' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Link check POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}