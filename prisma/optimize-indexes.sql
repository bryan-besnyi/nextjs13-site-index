-- Database optimization queries for SMCCCD Site Index
-- Add missing indexes to improve performance

-- Create composite indexes for frequently used query patterns
CREATE INDEX IF NOT EXISTS idx_indexitem_campus_created ON indexitem(campus, "createdAt");
CREATE INDEX IF NOT EXISTS idx_indexitem_letter_created ON indexitem(letter, "createdAt");
CREATE INDEX IF NOT EXISTS idx_indexitem_title_campus ON indexitem(title, campus);

-- Optimize text search queries
CREATE INDEX IF NOT EXISTS idx_indexitem_title_lower ON indexitem(lower(title));
CREATE INDEX IF NOT EXISTS idx_indexitem_url_lower ON indexitem(lower(url));

-- Index for date-based queries (recent items, activity tracking)
CREATE INDEX IF NOT EXISTS idx_indexitem_created_desc ON indexitem("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_indexitem_updated_desc ON indexitem("updatedAt" DESC);

-- Activity log optimizations
CREATE INDEX IF NOT EXISTS idx_activity_timestamp_desc ON "ActivityLog"("timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_activity_action_timestamp ON "ActivityLog"("action", "timestamp");
CREATE INDEX IF NOT EXISTS idx_activity_resource_timestamp ON "ActivityLog"("resource", "timestamp");

-- Performance monitoring: Add covering indexes for count queries
CREATE INDEX IF NOT EXISTS idx_indexitem_campus_count ON indexitem(campus) WHERE campus IS NOT NULL;

-- Analyze tables to update query planner statistics
ANALYZE indexitem;
ANALYZE "ActivityLog";

-- Clean up any unused indexes (PostgreSQL only)
-- Note: These would be manual checks in a real environment