#!/usr/bin/env node

/**
 * PRODUCTION-SAFE Link Checker Script for SMCCCD Site Index
 * 
 * This script ONLY READS from the production database - no writes or modifications.
 * It uses HEAD requests to check links respectfully.
 * 
 * Usage:
 *   DATABASE_URL="your-prod-url" node scripts/check-links-prod.js
 *   DATABASE_URL="your-prod-url" node scripts/check-links-prod.js --campus="CSM"
 *   DATABASE_URL="your-prod-url" node scripts/check-links-prod.js --letter="A"
 */

const { PrismaClient } = require('@prisma/client');

// Validate production environment
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required for production checks');
  console.error('Usage: DATABASE_URL="your-prod-url" node scripts/check-links-prod.js');
  process.exit(1);
}

// Validate that this looks like a production URL
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl.includes('neon.tech') && !dbUrl.includes('postgres') && !dbUrl.includes('postgresql')) {
  console.error('❌ DATABASE_URL does not appear to be a PostgreSQL production URL');
  process.exit(1);
}

// Create READ-ONLY Prisma client
const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Configuration - more conservative for production
const BATCH_SIZE = 5; // Smaller batches for production
const REQUEST_TIMEOUT = 15000; // Longer timeout for production
const BATCH_DELAY = 3000; // 3 second delay between batches
const USER_AGENT = 'SMCCCD Site Index Health Check/1.0 (Educational Use - Link Verification)';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};
args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    options[key] = value || true;
  }
});

// Color output helpers
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

async function checkSingleLink(id, url, title) {
  const startTime = Date.now();
  const result = {
    id,
    url,
    title: title.substring(0, 50) + (title.length > 50 ? '...' : ''),
    status: 'error',
    lastChecked: new Date()
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      },
      redirect: 'manual'
    });

    clearTimeout(timeoutId);
    result.responseTime = Date.now() - startTime;
    result.statusCode = response.status;

    if (response.status >= 200 && response.status < 300) {
      result.status = 'active';
    } else if (response.status >= 300 && response.status < 400) {
      result.status = 'redirect';
      result.redirectUrl = response.headers.get('location');
    } else if (response.status === 404 || response.status === 410) {
      result.status = 'dead';
    } else if (response.status >= 500) {
      result.status = 'error';
      result.error = `Server error: ${response.status}`;
    } else {
      result.status = 'error';
      result.error = `Unexpected status: ${response.status}`;
    }

  } catch (error) {
    result.responseTime = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      result.status = 'timeout';
      result.error = 'Request timeout';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      result.status = 'dead';
      result.error = 'Host not found';
    } else if (error.message?.includes('certificate') || error.message?.includes('SSL')) {
      result.status = 'error';
      result.error = 'SSL/Certificate error';
    } else {
      result.status = 'error';
      result.error = error.message || 'Network error';
    }
  }

  return result;
}

async function checkLinksInBatches(links) {
  const results = [];
  
  console.log(colorize('yellow', `\n⚠️  Production Mode: Using conservative settings`));
  console.log(`   - Batch size: ${BATCH_SIZE} links`);
  console.log(`   - Timeout: ${REQUEST_TIMEOUT/1000}s per link`);
  console.log(`   - Delay: ${BATCH_DELAY/1000}s between batches`);
  console.log('');
  
  for (let i = 0; i < links.length; i += BATCH_SIZE) {
    const batch = links.slice(i, i + BATCH_SIZE);
    
    console.log(`Checking links ${i + 1} to ${Math.min(i + BATCH_SIZE, links.length)} of ${links.length}`);
    
    const batchPromises = batch.map(link => 
      checkSingleLink(link.id, link.url, link.title)
    );
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    // Show real-time results
    batchResults.forEach(result => {
      const statusIcon = {
        active: colorize('green', '✅'),
        dead: colorize('red', '❌'),
        redirect: colorize('yellow', '🔀'),
        timeout: colorize('yellow', '⏱️'),
        error: colorize('red', '⚠️')
      }[result.status];
      
      const responseTime = result.responseTime ? `(${result.responseTime}ms)` : '';
      console.log(`  ${statusIcon} ${result.title} ${colorize('blue', responseTime)}`);
      
      if (result.error) {
        console.log(`     ${colorize('red', result.error)}`);
      }
      if (result.redirectUrl) {
        console.log(`     → ${colorize('cyan', result.redirectUrl.substring(0, 80))}`);
      }
    });
    
    // Progress indicator
    const progress = Math.round(((i + BATCH_SIZE) / links.length) * 100);
    console.log(colorize('cyan', `Progress: ${Math.min(progress, 100)}%\n`));
    
    // Respectful delay between batches (except for last batch)
    if (i + BATCH_SIZE < links.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }
  
  return results;
}

async function showReport(results) {
  console.log('\n' + colorize('bold', colorize('cyan', '📊 PRODUCTION LINK CHECK REPORT')));
  console.log(colorize('cyan', '='.repeat(60)));
  
  const summary = {
    total: results.length,
    active: results.filter(r => r.status === 'active').length,
    dead: results.filter(r => r.status === 'dead').length,
    redirects: results.filter(r => r.status === 'redirect').length,
    timeouts: results.filter(r => r.status === 'timeout').length,
    errors: results.filter(r => r.status === 'error').length
  };
  
  // Calculate average response time
  const responseTimes = results.filter(r => r.responseTime).map(r => r.responseTime);
  const avgResponseTime = responseTimes.length > 0 ? 
    Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;
  
  console.log(`${colorize('bold', 'Total Links:')}    ${summary.total}`);
  console.log(`${colorize('green', '✅ Active:')}      ${summary.active} (${(summary.active/summary.total*100).toFixed(1)}%)`);
  console.log(`${colorize('red', '❌ Dead:')}        ${summary.dead} (${(summary.dead/summary.total*100).toFixed(1)}%)`);
  console.log(`${colorize('yellow', '🔀 Redirects:')}   ${summary.redirects} (${(summary.redirects/summary.total*100).toFixed(1)}%)`);
  console.log(`${colorize('yellow', '⏱️  Timeouts:')}    ${summary.timeouts} (${(summary.timeouts/summary.total*100).toFixed(1)}%)`);
  console.log(`${colorize('red', '⚠️  Errors:')}      ${summary.errors} (${(summary.errors/summary.total*100).toFixed(1)}%)`);
  console.log(`${colorize('blue', '⚡ Avg Response:')} ${avgResponseTime}ms`);
  
  // Health score
  const healthScore = Math.round((summary.active / summary.total) * 100);
  console.log(`${colorize('bold', '🎯 Health Score:')} ${healthScore}%`);
  
  // Show critical issues first
  const criticalIssues = results.filter(r => r.status === 'dead' || r.status === 'timeout');
  if (criticalIssues.length > 0) {
    console.log('\n' + colorize('red', '🚨 CRITICAL ISSUES (Dead/Timeout):'));
    console.log(colorize('red', '-'.repeat(50)));
    
    for (const link of criticalIssues.slice(0, 15)) {
      console.log(`${colorize('red', '❌')} ${link.title}`);
      console.log(`   ${colorize('cyan', link.url)}`);
      if (link.error) {
        console.log(`   ${colorize('yellow', link.error)}`);
      }
      console.log('');
    }
    
    if (criticalIssues.length > 15) {
      console.log(`... and ${criticalIssues.length - 15} more critical issues`);
    }
  }
  
  // Show some redirects that might need attention
  const redirects = results.filter(r => r.status === 'redirect');
  if (redirects.length > 0) {
    console.log('\n' + colorize('yellow', '🔀 SAMPLE REDIRECTS (first 5):'));
    console.log(colorize('yellow', '-'.repeat(50)));
    
    for (const link of redirects.slice(0, 5)) {
      console.log(`${colorize('yellow', '🔀')} ${link.title}`);
      console.log(`   ${colorize('cyan', link.url)}`);
      console.log(`   → ${colorize('green', link.redirectUrl)}`);
      console.log('');
    }
    
    if (redirects.length > 5) {
      console.log(`... and ${redirects.length - 5} more redirects to review`);
    }
  }
}

async function main() {
  console.log(colorize('bold', colorize('blue', '🔍 SMCCCD PRODUCTION Link Health Check')));
  console.log(colorize('blue', '='.repeat(60)));
  
  try {
    // Log database connection info (safely)
    const url = new URL(process.env.DATABASE_URL);
    console.log(`${colorize('cyan', '🗄️  Database:')} ${url.hostname}`);
    console.log(`${colorize('cyan', '📅 Timestamp:')} ${new Date().toLocaleString()}`);
    
    // Build query based on options
    const whereClause = {};
    if (options.campus) {
      whereClause.campus = options.campus;
    }
    if (options.letter) {
      whereClause.letter = options.letter;
    }
    
    // Get links from PRODUCTION database (READ ONLY)
    console.log('\n' + colorize('yellow', '📖 Reading from production database...'));
    const indexItems = await prisma.indexitem.findMany({
      where: whereClause,
      select: {
        id: true,
        url: true,
        title: true,
        campus: true,
        letter: true
      },
      orderBy: [
        { campus: 'asc' },
        { letter: 'asc' },
        { title: 'asc' }
      ]
    });
    
    if (indexItems.length === 0) {
      console.log(colorize('yellow', 'No links found with the specified criteria.'));
      return;
    }
    
    console.log(`${colorize('green', '✅ Found')} ${indexItems.length} links in production database`);
    
    if (options.campus) {
      console.log(`Filtering by campus: ${colorize('cyan', options.campus)}`);
    }
    if (options.letter) {
      console.log(`Filtering by letter: ${colorize('cyan', options.letter)}`);
    }
    
    // Confirm before proceeding
    console.log('\n' + colorize('yellow', '⚠️  About to check production links. This will:'));
    console.log('   - Make HTTP HEAD requests to external websites');
    console.log('   - Use respectful rate limiting (5 links per batch)');
    console.log('   - NOT modify any data in your database');
    console.log('   - Generate a detailed health report');
    
    // Auto-proceed after 3 seconds (or manual continue)
    console.log('\n' + colorize('cyan', 'Starting in 3 seconds... (Press Ctrl+C to cancel)'));
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log(colorize('green', '\n🚀 Starting production link health check...\n'));
    
    // Check links
    const results = await checkLinksInBatches(
      indexItems.map(item => ({ id: item.id, url: item.url, title: item.title }))
    );
    
    // Show results
    await showReport(results);
    
    // Save detailed results to file
    const timestamp = new Date().toISOString().split('T')[0];
    const campusFilter = options.campus ? `-${options.campus.replace(/ /g, '-')}` : '';
    const letterFilter = options.letter ? `-${options.letter}` : '';
    const filename = `production-link-check${campusFilter}${letterFilter}-${timestamp}.json`;
    
    const detailedResults = results.map(result => {
      const item = indexItems.find(i => i.id === result.id);
      return {
        ...result,
        campus: item?.campus,
        letter: item?.letter
      };
    });
    
    require('fs').writeFileSync(filename, JSON.stringify(detailedResults, null, 2));
    console.log(`\n${colorize('green', '📁 Detailed results saved to:')} ${colorize('cyan', filename)}`);
    console.log(`\n${colorize('blue', '💡 Tip:')} Import this JSON file into Excel or Google Sheets for further analysis`);
    
  } catch (error) {
    if (error.message.includes('connect') || error.message.includes('timeout')) {
      console.error(colorize('red', '❌ Database connection failed:'), error.message);
      console.error(colorize('yellow', '💡 Check your DATABASE_URL and network connection'));
    } else {
      console.error(colorize('red', '❌ Error:'), error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n' + colorize('yellow', '⚠️  Shutting down gracefully...'));
  await prisma.$disconnect();
  process.exit(0);
});

main().catch(console.error);