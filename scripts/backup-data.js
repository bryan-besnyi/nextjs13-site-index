const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function backupData() {
  try {
    console.log('🔄 Starting daily backup...')
    
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const backupDir = path.join(process.cwd(), 'backups')
    
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    // Get all data
    const data = {
      indexItems: await prisma.indexitem.findMany({ orderBy: { id: 'asc' } }),
      backupDate: new Date().toISOString(),
      totalRecords: 0
    }
    
    data.totalRecords = data.indexItems.length
    
    // Save backup
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`)
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2))
    
    // Also create CSV for extra safety
    const csvFile = path.join(backupDir, `backup-${timestamp}.csv`)
    const csvContent = [
      'id,title,letter,url,campus,createdAt,updatedAt',
      ...data.indexItems.map(item => 
        `${item.id},"${item.title.replace(/"/g, '""')}",${item.letter},"${item.url}",${item.campus},${item.createdAt},${item.updatedAt}`
      )
    ].join('\n')
    fs.writeFileSync(csvFile, csvContent)
    
    console.log(`✅ Backup completed: ${data.totalRecords} records`)
    console.log(`📄 JSON: ${backupFile}`)
    console.log(`📊 CSV: ${csvFile}`)
    
    // Clean up old backups (keep last 30 days)
    const files = fs.readdirSync(backupDir)
    const oldBackups = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        date: new Date(file.replace('backup-', '').replace('.json', ''))
      }))
      .filter(file => (Date.now() - file.date.getTime()) > 30 * 24 * 60 * 60 * 1000)
    
    oldBackups.forEach(backup => {
      fs.unlinkSync(path.join(backupDir, backup.name))
      fs.unlinkSync(path.join(backupDir, backup.name.replace('.json', '.csv')))
      console.log(`🗑️  Cleaned up old backup: ${backup.name}`)
    })
    
  } catch (error) {
    console.error('❌ Backup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

backupData()