# Database Protection Strategy

## 1. Neon Database Settings

### Enable Point-in-Time Recovery (PITR)
- Go to Neon Console → Your Project → Settings
- Enable "Point-in-Time Recovery" 
- Set retention to maximum available (7-30 days depending on plan)

### Database Branching
- Create a `production-backup` branch weekly
- Never delete the main branch
- Use branches for testing destructive operations

## 2. Environment Protection

### Staging Environment
- Create separate staging database
- Test all migrations on staging first
- Never run untested code against production

### Access Control
- Limit who has production database access
- Use read-only connections where possible
- Implement 2FA for all database access

## 3. Code-Level Safeguards

### Safe Migrations
```bash
# Always backup before migrations
npm run backup
npx prisma migrate deploy
```

### Dangerous Operation Protection
- Add confirmation prompts for DELETE operations
- Implement soft deletes instead of hard deletes
- Add operation logging

## 4. Monitoring & Alerts

### Daily Health Checks
- Automated record count validation
- Schema integrity checks  
- Performance monitoring

### Alert Channels
- Slack: #alerts channel
- Email: admin@smccd.edu
- PagerDuty: Critical alerts

## 5. Recovery Procedures

### If Data Loss Detected:
1. **STOP ALL OPERATIONS** immediately
2. Contact Neon support for PITR recovery
3. Use latest GitHub backup as fallback
4. Document incident and root cause

### Recovery Sources (in order):
1. Neon Point-in-Time Recovery
2. GitHub Action artifacts (90 days)
3. Local backup files
4. Manual re-entry (worst case)