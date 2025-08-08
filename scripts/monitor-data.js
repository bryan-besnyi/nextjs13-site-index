const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function monitorData() {
  try {
    const count = await prisma.indexitem.count()
    const expectedMinimum = 1500 // Alert if below this
    
    console.log(`📊 Current record count: ${count}`)
    
    if (count < expectedMinimum) {
      console.error(`🚨 ALERT: Record count (${count}) below expected minimum (${expectedMinimum})`)
      
      // In production, this could send alerts via:
      // - Slack webhook
      // - Email
      // - PagerDuty
      // - Discord webhook
      
      process.exit(1)
    }
    
    // Check for recent changes
    const recentDeletes = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "indexitem" 
      WHERE "updatedAt" > NOW() - INTERVAL '1 hour'
    `
    
    console.log(`✅ Data health check passed`)
    console.log(`📈 Records in last hour: ${recentDeletes[0]?.count || 0}`)
    
  } catch (error) {
    console.error('❌ Data monitoring failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

monitorData()