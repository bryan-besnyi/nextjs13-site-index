const { PrismaClient } = require('@prisma/client');

async function verifyConnection() {
  const prisma = new PrismaClient();
  
  try {
    // Get the current database name and host
    const result = await prisma.$queryRaw`
      SELECT 
        current_database() as database,
        inet_server_addr() as host,
        version() as version
    `;
    
    console.log('=== DATABASE CONNECTION VERIFICATION ===');
    console.log('Connected to:', result[0]);
    console.log('');
    
    // Check if this looks like production
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.includes('ep-solitary-wind') || dbUrl.includes('production')) {
      console.error('⚠️  WARNING: This appears to be a PRODUCTION database!');
      console.error('⚠️  DO NOT PROCEED WITH MIGRATIONS!');
      process.exit(1);
    } else if (dbUrl.includes('ep-lucky-bar')) {
      console.log('✅ This is the TEST database (ep-lucky-bar)');
      console.log('✅ Safe to proceed with migrations');
    } else {
      console.log('🤔 Unknown database endpoint');
    }
    
    // Show table count
    const tables = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log(`\nCurrent table count: ${tables[0].count}`);
    
  } catch (error) {
    console.error('Failed to connect:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyConnection();