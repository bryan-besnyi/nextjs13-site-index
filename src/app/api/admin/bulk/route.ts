import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma-singleton';
import { kv } from '@vercel/kv';
import { BulkOperationSchema, validateWith } from '@/lib/validation-schemas';
import { CSRFProtection } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // CSRF Protection
    const isValidCSRF = await CSRFProtection.validateToken(request);
    if (!isValidCSRF) {
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = validateWith(BulkOperationSchema)(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { operation, items, updateData } = validation.data;

    // Execute bulk operation
    let result;
    const startTime = Date.now();

    switch (operation) {
      case 'delete':
        result = await executeBulkDelete(items);
        break;
      case 'update':
        if (!updateData) {
          return NextResponse.json(
            { error: 'Update data required for update operation' },
            { status: 400 }
          );
        }
        result = await executeBulkUpdate(items, updateData);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid operation type' },
          { status: 400 }
        );
    }

    // Invalidate cache after bulk operations
    await invalidateRelevantCache(operation, items);

    const duration = Date.now() - startTime;

    // Log the operation
    const count = 'count' in result ? result.count : 0;
    console.log(`Bulk ${operation} completed: ${count} items in ${duration}ms by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      operation,
      count,
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json(
      { 
        error: 'Bulk operation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

async function executeBulkDelete(itemIds: number[]) {
  try {
    // Get the items that will be deleted for logging (before deletion)
    const itemsToDelete = await prisma.indexitem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, title: true, campus: true }
    });

    // Delete the items
    const deleteResult = await prisma.indexitem.deleteMany({
      where: { id: { in: itemIds } }
    });

    return {
      count: deleteResult.count,
      deletedItems: itemsToDelete
    };
  } catch (error) {
    console.error('Bulk delete failed:', error);
    throw error;
  }
}

async function executeBulkUpdate(itemIds: number[], updateData: any) {
  // Prepare update object, excluding undefined values
  const updateObject: any = {};
  
  if (updateData.title !== undefined) updateObject.title = updateData.title;
  if (updateData.letter !== undefined) updateObject.letter = updateData.letter;
  if (updateData.url !== undefined) updateObject.url = updateData.url;
  if (updateData.campus !== undefined) updateObject.campus = updateData.campus;

  // Add updatedAt timestamp
  updateObject.updatedAt = new Date();

  const result = await prisma.indexitem.updateMany({
    where: { id: { in: itemIds } },
    data: updateObject
  });

  return { count: result.count };
}

async function invalidateRelevantCache(operation: string, itemIds: number[]) {
  try {
    // Get unique campuses and letters affected for targeted cache invalidation
    const affectedItems = await prisma.indexitem.findMany({
      where: { id: { in: itemIds } },
      select: { campus: true, letter: true }
    });

    const uniqueCampuses = Array.from(new Set(affectedItems.map(item => item.campus)));
    const uniqueLetters = Array.from(new Set(affectedItems.map(item => item.letter)));

    // Invalidate cache keys for affected campuses and letters
    const cacheKeys = [
      'indexItems:all',
      ...uniqueCampuses.map(campus => `indexItems:${campus}::`),
      ...uniqueLetters.map(letter => `indexItems::${letter}:`),
      ...uniqueCampuses.flatMap(campus => 
        uniqueLetters.map(letter => `indexItems:${campus}:${letter}:`)
      )
    ];

    // Delete cache keys
    if (cacheKeys.length > 0) {
      await kv.del(...cacheKeys);
    }

    console.log(`Invalidated ${cacheKeys.length} cache keys after bulk ${operation}`);
  } catch (error) {
    console.warn('Cache invalidation failed:', error);
    // Don't fail the main operation if cache invalidation fails
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST for bulk operations.' },
    { status: 405 }
  );
}