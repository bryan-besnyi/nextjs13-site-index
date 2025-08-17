const { PrismaClient } = require('@prisma/client');

async function populateTestData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Populating test data...\n');
    
    // 1. Add some test index items if needed
    const itemCount = await prisma.indexitem.count();
    console.log(`Current index items: ${itemCount}`);
    
    if (itemCount < 10) {
      console.log('Adding test index items...');
      const testItems = [
        { title: 'Admissions Office', letter: 'A', url: 'https://skylinecollege.edu/admissions', campus: 'Skyline College' },
        { title: 'Bookstore', letter: 'B', url: 'https://skylinecollege.edu/bookstore', campus: 'Skyline College' },
        { title: 'Career Services', letter: 'C', url: 'https://collegeofsanmateo.edu/career', campus: 'College of San Mateo' },
        { title: 'Financial Aid', letter: 'F', url: 'https://canadacollege.edu/financialaid', campus: 'Cañada College' },
        { title: 'Library', letter: 'L', url: 'https://skylinecollege.edu/library', campus: 'Skyline College' },
      ];
      
      for (const item of testItems) {
        await prisma.indexitem.create({ data: item });
      }
      console.log('✅ Added test index items');
    }
    
    // 2. Create some activity logs
    console.log('\nCreating test activity logs...');
    const activities = [
      { action: 'VIEW_ITEMS', resource: 'indexItems', userEmail: 'test.user@smccd.edu', statusCode: 200, duration: 45 },
      { action: 'CREATE_ITEM', resource: 'indexItems', userEmail: 'admin@smccd.edu', statusCode: 201, duration: 120 },
      { action: 'UPDATE_ITEM', resource: 'indexItems', resourceId: '123', userEmail: 'admin@smccd.edu', statusCode: 200, duration: 85 },
      { action: 'VIEW_ACTIVITY_LOG', resource: 'activity', userEmail: 'admin@smccd.edu', statusCode: 200, duration: 32 },
      { action: 'ADMIN_PERFORMANCE_GET', resource: 'performance', userEmail: 'test.user@smccd.edu', statusCode: 200, duration: 156 },
    ];
    
    for (const activity of activities) {
      await prisma.activityLog.create({
        data: {
          ...activity,
          method: activity.action.includes('CREATE') ? 'POST' : activity.action.includes('UPDATE') ? 'PUT' : 'GET',
          path: `/api/${activity.resource}`,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 Test Browser',
          timestamp: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
        }
      });
    }
    console.log('✅ Created test activity logs');
    
    // 3. Show summary
    const activityCount = await prisma.activityLog.count();
    console.log(`\n📊 Test Data Summary:`);
    console.log(`- Index Items: ${await prisma.indexitem.count()}`);
    console.log(`- Activity Logs: ${activityCount}`);
    console.log('\n✅ Test data population complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  populateTestData();
}