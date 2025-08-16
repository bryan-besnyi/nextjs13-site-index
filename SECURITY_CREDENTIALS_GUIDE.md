# Security Credentials Guide

## ⚠️ IMMEDIATE ACTIONS REQUIRED

Since credentials were exposed, you MUST rotate all of the following immediately:

### 1. Database (Vercel Postgres)
- Go to Vercel Dashboard → Storage → Your Database
- Click "Settings" → "Reset Password"
- Update DATABASE_URL in your production environment

### 2. NextAuth Secret
Generate a new secret:
```bash
openssl rand -base64 32
```
Update NEXTAUTH_SECRET in all environments

### 3. OneLogin OAuth App
- Log into OneLogin Admin
- Navigate to Applications → Your App
- Regenerate Client Secret
- Update ONELOGIN_CLIENT_SECRET

### 4. Upstash Redis (Vercel KV)
- Go to Upstash Console or Vercel Dashboard
- Navigate to your Redis instance
- Regenerate all tokens
- Update all KV_* environment variables

## Setting Environment Variables

### Local Development
1. Copy `.env.example` to `.env`
2. Fill in your actual values
3. Never commit `.env` to version control

### Production (Vercel)
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable for Production environment
3. Use different values than development

### Security Best Practices

1. **Use Strong Secrets**
   - Generate cryptographically secure random strings
   - Use different secrets for each environment
   - Rotate secrets regularly (every 90 days)

2. **Access Control**
   - Limit who can access production credentials
   - Use read-only tokens where possible
   - Enable MFA on all service accounts

3. **Monitoring**
   - Set up alerts for unauthorized access
   - Monitor for suspicious database queries
   - Review access logs regularly

4. **Environment Separation**
   - Never use production credentials in development
   - Use separate databases for dev/staging/prod
   - Implement least-privilege access

## Credential Rotation Schedule

| Service | Rotation Frequency | Last Rotated | Next Rotation |
|---------|-------------------|--------------|---------------|
| Database Password | 90 days | [DATE] | [DATE] |
| NextAuth Secret | 180 days | [DATE] | [DATE] |
| OAuth Secrets | 90 days | [DATE] | [DATE] |
| API Tokens | 90 days | [DATE] | [DATE] |

## Emergency Response

If credentials are compromised:
1. Immediately rotate affected credentials
2. Review access logs for unauthorized access
3. Notify security team
4. Update this document with incident details
5. Implement additional security measures as needed