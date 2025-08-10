# Neon Database Protection Strategy

## Overview
This document outlines comprehensive protection measures to prevent accidental deletion or corruption of your Neon production database.

## 1. Environment Separation

### Database Environments
- **main** - Production database (PROTECTED)
- **preview** - Staging database for testing
- **dev** - Development database for local work

### Implementation
```bash
# Production
DATABASE_URL="postgresql://user:pass@main-db.neon.tech/db"

# Staging  
PREVIEW_DATABASE_URL="postgresql://user:pass@preview-db.neon.tech/db"

# Development
DEV_DATABASE_URL="postgresql://user:pass@dev-db.neon.tech/db"
```

## 2. Access Control

### Remove Dangerous Permissions
1. Log into Neon Console
2. Go to Settings > Roles
3. Remove `DROP DATABASE` and `ALTER DATABASE` permissions from default user
4. Create separate admin role with elevated permissions:

```sql
-- Create admin role (only when needed)
CREATE ROLE db_admin WITH LOGIN PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE main TO db_admin;

-- Application role (restricted)
CREATE ROLE app_user WITH LOGIN PASSWORD 'app-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
```

## 3. Automated Backup System

### Daily Backups
```bash
#!/bin/bash
# scripts/daily-backup.sh

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="backups/$DATE"

mkdir -p $BACKUP_DIR

# Export schema
pg_dump $DATABASE_URL --schema-only > "$BACKUP_DIR/schema-$DATE.sql"

# Export data
pg_dump $DATABASE_URL --data-only --inserts > "$BACKUP_DIR/data-$DATE.sql"

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR s3://your-backup-bucket/neon-backups/ --recursive
```

### Pre-deployment Backup
```bash
#!/bin/bash
# scripts/pre-deploy-backup.sh

echo "Creating pre-deployment backup..."
npm run backup

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully"
    npm run deploy
else
    echo "❌ Backup failed - deployment aborted"
    exit 1
fi
```

## 4. Database Connection Validation

### Environment Validation
```typescript
// lib/db-validation.ts
export function validateDatabaseEnvironment() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error('DATABASE_URL not configured');
  }
  
  // Prevent production DB in development
  if (process.env.NODE_ENV === 'development' && dbUrl.includes('main-')) {
    throw new Error('🚨 DANGER: Production database detected in development environment');
  }
  
  // Require explicit production flag
  if (dbUrl.includes('main-') && process.env.NODE_ENV === 'production' && !process.env.PRODUCTION_CONFIRMED) {
    throw new Error('Production database access requires PRODUCTION_CONFIRMED=true');
  }
  
  console.log(`✅ Database environment validated: ${process.env.NODE_ENV}`);
}
```

## 5. Neon Branch Protection

### Branch-based Workflow
```bash
# Create development branch
neon branches create --name "feature-xyz" --parent main

# Get branch connection string  
neon connection-string --branch "feature-xyz"

# Work on branch, then merge when ready
neon branches delete --name "feature-xyz" # Only after merge
```

### Safe Schema Migration
```bash
#!/bin/bash
# scripts/safe-migrate.sh

# Create backup branch
neon branches create --name "backup-$(date +%s)" --parent main

# Create migration branch
neon branches create --name "migration-$(date +%s)" --parent main

# Test migration on branch first
echo "Testing migration on branch..."
DATABASE_URL="$MIGRATION_BRANCH_URL" npm run migrate

# If successful, apply to main
if [ $? -eq 0 ]; then
    DATABASE_URL="$MAIN_DATABASE_URL" npm run migrate
    echo "✅ Migration applied to production"
else
    echo "❌ Migration failed on branch - production protected"
fi
```

## 6. Monitoring & Alerts

### Database Health Monitoring
```typescript
// lib/db-monitor.ts
export async function monitorDatabaseHealth() {
  const checks = {
    size: await getDatabaseSize(),
    connections: await getActiveConnections(),
    replication: await checkReplicationLag(),
    backup: await verifyLastBackup()
  };
  
  // Send alerts if issues detected
  if (checks.size > ALERT_THRESHOLDS.MAX_SIZE) {
    await sendAlert('Database size exceeded threshold');
  }
  
  return checks;
}
```

### Automated Alerts
```bash
# Add to cron: 0 */6 * * * (every 6 hours)
#!/bin/bash
# scripts/db-health-check.sh

HEALTH_RESPONSE=$(curl -s http://your-app.com/api/health)
STATUS=$(echo $HEALTH_RESPONSE | jq -r '.status')

if [ "$STATUS" != "pass" ]; then
    # Send email/Slack alert
    echo "🚨 Database health check failed: $STATUS"
fi
```

## 7. Recovery Procedures

### Point-in-Time Recovery
```bash
# Restore from Neon branch
neon branches create --name "recovery-$(date +%s)" --parent main --timestamp "2024-01-01T12:00:00Z"
```

### Full Recovery from Backup
```bash
#!/bin/bash
# scripts/restore-backup.sh

BACKUP_DATE=$1
if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 YYYY-MM-DD"
    exit 1
fi

# Create new database for recovery
createdb recovery_db

# Restore schema
psql recovery_db < "backups/$BACKUP_DATE/schema-$BACKUP_DATE.sql"

# Restore data
psql recovery_db < "backups/$BACKUP_DATE/data-$BACKUP_DATE.sql"

echo "✅ Database restored to recovery_db"
```

## 8. Implementation Checklist

- [ ] Set up separate database environments
- [ ] Configure restricted database roles
- [ ] Implement daily backup automation
- [ ] Add database environment validation
- [ ] Create branch-based workflow
- [ ] Set up monitoring and alerts
- [ ] Document recovery procedures
- [ ] Train team on safe practices
- [ ] Test recovery procedures regularly

## 9. Emergency Contacts

- Database Admin: [Your email]
- Neon Support: support@neon.tech
- Backup Storage: [Cloud provider support]

## 10. Regular Maintenance

- Weekly backup verification
- Monthly recovery drill
- Quarterly permission audit
- Annual disaster recovery test

---

**⚠️ CRITICAL REMINDER**: Never run destructive operations directly on production. Always use branches and backups.