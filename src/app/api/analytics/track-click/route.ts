import { NextRequest, NextResponse } from 'next/server';
import { trackSearchClick } from '@/lib/search-analytics';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { searchTerm, clickedItemId, position } = body;
    
    // Validate required fields
    if (!searchTerm || !clickedItemId || position === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: searchTerm, clickedItemId, position' },
        { status: 400 }
      );
    }
    
    // Track the click (non-blocking)
    await trackSearchClick({
      searchTerm,
      clickedItemId: Number(clickedItemId),
      position: Number(position),
      timestamp: new Date()
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Click tracking error:', error);
    // Don't fail the request - analytics shouldn't break the app
    return NextResponse.json({ success: true });
  }
}