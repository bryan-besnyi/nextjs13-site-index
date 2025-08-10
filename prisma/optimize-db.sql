-- Database optimization queries for better API performance
-- Run these after backing up your database

-- 1. Add composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_indexitem_campus_title 
    ON "indexitem" ("campus", "title");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_indexitem_campus_letter 
    ON "indexitem" ("campus", "letter");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_indexitem_letter_title 
    ON "indexitem" ("letter", "title");

-- 2. Add text search indexes for better search performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_indexitem_title_gin 
    ON "indexitem" USING gin(to_tsvector('english', "title"));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_indexitem_url_gin 
    ON "indexitem" USING gin(to_tsvector('english', "url"));

-- 3. Add partial indexes for common filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_indexitem_active 
    ON "indexitem" ("id") WHERE "title" IS NOT NULL AND "url" IS NOT NULL;

-- 4. Analyze tables to update statistics
ANALYZE "indexitem";

-- 5. Check index usage (run after some queries)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY idx_scan DESC;

-- 6. Check table stats
-- SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup
-- FROM pg_stat_user_tables 
-- WHERE schemaname = 'public';

-- 7. Monitor slow queries (if you have pg_stat_statements enabled)
-- SELECT query, calls, total_time, mean_time, rows
-- FROM pg_stat_statements
-- WHERE query LIKE '%indexitem%'
-- ORDER BY mean_time DESC
-- LIMIT 10;