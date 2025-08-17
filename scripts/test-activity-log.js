const { PrismaClient } = require('@prisma/client');

async function testActivityLog() {
  const prisma = new PrismaClient();
  
  try {
    // Create a test activity log entry
    const testEntry = await prisma.activityLog.create({
      data: {
        action: 'TEST_ACTIVITY',
        resource: 'test',
        userEmail: 'test@example.com',
        details: { test: true },
        method: 'GET',
        path: '/test',
        statusCode: 200,
        duration: 100
      }
    });
    
    console.log('✅ ActivityLog table is working!');
    console.log('Created test entry:', testEntry);
    
    // Count entries
    const count = await prisma.activityLog.count();
    console.log(`Total entries in ActivityLog: ${count}`);
    
    // Clean up test entry
    await prisma.activityLog.delete({ where: { id: testEntry.id } });
    console.log('✅ Test entry cleaned up');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testActivityLog();