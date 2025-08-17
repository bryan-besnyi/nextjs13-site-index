-- Activity Log Table Creation Script
-- RUN ONLY IN DEVELOPMENT/TEST ENVIRONMENT

-- Check if we're in development
DO $$
BEGIN
    -- Only proceed if this is not production
    IF current_database() NOT LIKE '%prod%' AND current_database() NOT LIKE '%production%' THEN
        
        -- Create ActivityLog table if it doesn't exist
        CREATE TABLE IF NOT EXISTS "ActivityLog" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "userId" TEXT,
            "userEmail" TEXT,
            "action" TEXT NOT NULL,
            "resource" TEXT,
            "resourceId" TEXT,
            "details" JSONB,
            "ipAddress" TEXT,
            "userAgent" TEXT,
            "method" TEXT,
            "path" TEXT,
            "statusCode" INTEGER,
            "duration" INTEGER,
            "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS "ActivityLog_userId_idx" ON "ActivityLog"("userId");
        CREATE INDEX IF NOT EXISTS "ActivityLog_action_idx" ON "ActivityLog"("action");
        CREATE INDEX IF NOT EXISTS "ActivityLog_resource_idx" ON "ActivityLog"("resource");
        CREATE INDEX IF NOT EXISTS "ActivityLog_timestamp_idx" ON "ActivityLog"("timestamp");
        CREATE INDEX IF NOT EXISTS "ActivityLog_userEmail_idx" ON "ActivityLog"("userEmail");

        RAISE NOTICE 'ActivityLog table and indexes created successfully in development database';
    ELSE
        RAISE EXCEPTION 'This script should not be run in production! Database: %', current_database();
    END IF;
END $$;