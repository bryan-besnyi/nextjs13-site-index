import { prisma } from '@/lib/prisma-singleton';
import { NextRequest } from 'next/server';

export interface ActivityLogEntry {
  userId?: string;
  userEmail?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
}

export class ActivityLogger {
  private static isEnabled(): boolean {
    // Skip during build process
    if (process.env.VERCEL_ENV === 'preview' && !process.env.DATABASE_URL) {
      return false;
    }
    
    // Skip during Next.js build
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return false;
    }
    
    // Only enable in development or if explicitly enabled
    return process.env.NODE_ENV === 'development' || process.env.ENABLE_ACTIVITY_LOGGING === 'true';
  }

  static async log(entry: ActivityLogEntry): Promise<void> {
    // Skip logging if not enabled
    if (!this.isEnabled()) {
      return;
    }

    try {
      await prisma.activityLog.create({
        data: {
          ...entry,
          details: entry.details ? JSON.parse(JSON.stringify(entry.details)) : undefined,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      // Silently fail if table doesn't exist or other DB errors
      if (process.env.NODE_ENV === 'development') {
        console.warn('Activity logging failed (this is normal if ActivityLog table does not exist):', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  static async logApiRequest({
    request,
    userEmail,
    userId,
    action,
    resource,
    resourceId,
    statusCode,
    duration,
    details,
  }: {
    request: NextRequest;
    userEmail?: string;
    userId?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    statusCode?: number;
    duration?: number;
    details?: any;
  }): Promise<void> {
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const method = request.method;
    const path = request.nextUrl.pathname;

    await this.log({
      userId,
      userEmail,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      method,
      path,
      statusCode,
      duration,
    });
  }

  static async getRecentActivity(limit: number = 100): Promise<any[]> {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      return await prisma.activityLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to fetch activity logs:', error instanceof Error ? error.message : 'Unknown error');
      }
      return [];
    }
  }

  static async getUserActivity(userEmail: string, limit: number = 50): Promise<any[]> {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      return await prisma.activityLog.findMany({
        where: { userEmail },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to fetch user activity:', error instanceof Error ? error.message : 'Unknown error');
      }
      return [];
    }
  }

  static async searchActivity({
    action,
    resource,
    userEmail,
    startDate,
    endDate,
    limit = 100,
  }: {
    action?: string;
    resource?: string;
    userEmail?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      const where: any = {};
      
      if (action) where.action = action;
      if (resource) where.resource = resource;
      if (userEmail) where.userEmail = userEmail;
      
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = startDate;
        if (endDate) where.timestamp.lte = endDate;
      }

      return await prisma.activityLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to search activity:', error instanceof Error ? error.message : 'Unknown error');
      }
      return [];
    }
  }

  static getActionName(method: string, path: string): string {
    if (path.includes('/api/indexItems')) {
      switch (method) {
        case 'GET': return 'VIEW_ITEMS';
        case 'POST': return 'CREATE_ITEM';
        case 'PUT': return 'UPDATE_ITEM';
        case 'DELETE': return 'DELETE_ITEM';
        default: return 'UNKNOWN_ACTION';
      }
    }
    
    if (path.includes('/api/admin/')) {
      const pathParts = path.split('/');
      const resource = pathParts[3]; // e.g., 'analytics', 'cache', 'system'
      return `ADMIN_${resource.toUpperCase()}_${method}`;
    }
    
    return `${method}_${path.replace(/\//g, '_').toUpperCase()}`;
  }
}