import { UserRole, College } from '@prisma/client';

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  FACULTY: 1,
  STAFF: 2, 
  COLLEGE_ADMIN: 3,
  SUPER_ADMIN: 4
} as const;

// Define what each role can do
export const PERMISSIONS = {
  // Data Management
  VIEW_ALL_DATA: ['SUPER_ADMIN'],
  VIEW_COLLEGE_DATA: ['SUPER_ADMIN', 'COLLEGE_ADMIN'],
  CREATE_ITEMS: ['SUPER_ADMIN', 'COLLEGE_ADMIN'],
  EDIT_ITEMS: ['SUPER_ADMIN', 'COLLEGE_ADMIN'],
  DELETE_ITEMS: ['SUPER_ADMIN', 'COLLEGE_ADMIN'],
  BULK_OPERATIONS: ['SUPER_ADMIN', 'COLLEGE_ADMIN'],
  
  // System Administration
  MANAGE_USERS: ['SUPER_ADMIN'],
  VIEW_SYSTEM_HEALTH: ['SUPER_ADMIN', 'COLLEGE_ADMIN'],
  MANAGE_BACKUPS: ['SUPER_ADMIN'],
  SYSTEM_SETTINGS: ['SUPER_ADMIN'],
  
  // Analytics & Monitoring
  VIEW_ANALYTICS: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'STAFF'],
  VIEW_ACTIVITY_LOGS: ['SUPER_ADMIN'],
  PERFORMANCE_MONITORING: ['SUPER_ADMIN', 'COLLEGE_ADMIN'],
  
  // Tools & Utilities
  LINK_CHECKER: ['SUPER_ADMIN', 'COLLEGE_ADMIN'],
  CACHE_MANAGEMENT: ['SUPER_ADMIN'],
  API_EXPLORER: ['SUPER_ADMIN', 'COLLEGE_ADMIN'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Check if user has specific permission
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return PERMISSIONS[permission].includes(userRole as any);
}

// Check if user has at least the required role level
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Check if user can access college-specific data
export function canAccessCollegeData(userRole: UserRole, userCollege: College | null, targetCollege: College): boolean {
  // Super admins can access all college data
  if (userRole === UserRole.SUPER_ADMIN) return true;
  
  // College admins can only access their own college data
  if (userRole === UserRole.COLLEGE_ADMIN) {
    return userCollege === targetCollege;
  }
  
  return false;
}

// Get user's accessible colleges
export function getAccessibleColleges(userRole: UserRole, userCollege: College | null): College[] {
  if (userRole === UserRole.SUPER_ADMIN) {
    return [College.SKYLINE, College.CSM, College.CANADA, College.DISTRICT_OFFICE];
  }
  
  if (userRole === UserRole.COLLEGE_ADMIN && userCollege) {
    return [userCollege];
  }
  
  return [];
}

// Determine role based on email domain and patterns
export function determineRoleFromEmail(email: string): { role: UserRole; college: College | null } {
  const emailLower = email.toLowerCase();
  
  // Web Services team patterns (Super Admin)
  const webServicesPatterns = [
    'webservices@smccd.edu',
    'webmaster@smccd.edu',
    // Add other web services team emails as needed
  ];
  
  if (webServicesPatterns.some(pattern => emailLower.includes(pattern.toLowerCase()))) {
    return { role: UserRole.SUPER_ADMIN, college: null };
  }
  
  // College-specific patterns (College Admin)
  if (emailLower.includes('skyline') || emailLower.includes('sklinecollege')) {
    return { role: UserRole.COLLEGE_ADMIN, college: College.SKYLINE };
  }
  
  if (emailLower.includes('csm') || emailLower.includes('collegeofsanmateo')) {
    return { role: UserRole.COLLEGE_ADMIN, college: College.CSM };
  }
  
  if (emailLower.includes('canada') || emailLower.includes('canadacollege')) {
    return { role: UserRole.COLLEGE_ADMIN, college: College.CANADA };
  }
  
  if (emailLower.includes('district')) {
    return { role: UserRole.COLLEGE_ADMIN, college: College.DISTRICT_OFFICE };
  }
  
  // Default to STAFF role for other @smccd.edu emails
  return { role: UserRole.STAFF, college: null };
}

// Route-based access control
export const ROUTE_PERMISSIONS = {
  '/admin/system/settings': ['SUPER_ADMIN'],
  '/admin/system/backups': ['SUPER_ADMIN'],
  '/admin/system/activity': ['SUPER_ADMIN'],
  '/admin/tools/cache': ['SUPER_ADMIN'],
  '/admin/users': ['SUPER_ADMIN'],
  
  // College admins and above
  '/admin/data': ['SUPER_ADMIN', 'COLLEGE_ADMIN'],
  '/admin/links': ['SUPER_ADMIN', 'COLLEGE_ADMIN'],
  '/admin/tools/performance': ['SUPER_ADMIN', 'COLLEGE_ADMIN'],
  '/admin/tools/api': ['SUPER_ADMIN', 'COLLEGE_ADMIN'],
  
  // All authenticated users
  '/admin/analytics': ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'STAFF'],
  '/admin/system/health': ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'STAFF'],
} as const;

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Find the most specific matching route
  const matchingRoutes = Object.keys(ROUTE_PERMISSIONS).filter(r => route.startsWith(r));
  
  if (matchingRoutes.length === 0) {
    // Default: require at least STAFF role for admin routes
    return route.startsWith('/admin') ? hasRoleLevel(userRole, UserRole.STAFF) : true;
  }
  
  // Use the longest matching route (most specific)
  const mostSpecificRoute = matchingRoutes.reduce((a, b) => a.length > b.length ? a : b);
  const allowedRoles = ROUTE_PERMISSIONS[mostSpecificRoute as keyof typeof ROUTE_PERMISSIONS];
  
  return allowedRoles.includes(userRole as any);
}