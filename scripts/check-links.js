#!/usr/bin/env node

/**
 * Link Checker Script for SMCCCD Site Index
 * 
 * Usage:
 *   npm run check-links                    # Full scan
 *   npm run check-links --campus="CSM"     # Campus-specific scan
 *   npm run check-links --letter="A"       # Letter-specific scan
 *   npm run check-links --report          # Show dead links report
 */

const { PrismaClient } = require('@prisma/client');

// Create Prisma client with proper configuration
// Check for local SQLite database first
const fs = require('fs');
const path = require('path');

let databaseUrl = process.env.DATABASE_URL;

// If no DATABASE_URL, try to use the local dev.db
if (!databaseUrl) {
  const devDbPath = path.join(__dirname, '..', 'dev.db');
  const prismaDevDbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  
  if (fs.existsSync(devDbPath)) {
    databaseUrl = `file:${devDbPath}`;
  } else if (fs.existsSync(prismaDevDbPath)) {
    databaseUrl = `file:${prismaDevDbPath}`;
  }
}

if (!databaseUrl) {
  console.error('❌ No database found. Please ensure DATABASE_URL is set or dev.db exists.');
  process.exit(1);
}

const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

// Configuration
const BATCH_SIZE = 10;
const REQUEST_TIMEOUT = 10000;
const USER_AGENT = 'SMCCCD Site Index Checker/1.0 (Educational Use)';

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
  reset: '\x1b[0m'
};

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

async function checkSingleLink(id, url) {
  const startTime = Date.now();
  const result = {
    id,
    url,
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
    } else {
      result.status = 'error';
      result.error = error.message || 'Network error';
    }
  }

  return result;
}

async function checkLinksInBatches(links) {
  const results = [];
  
  for (let i = 0; i < links.length; i += BATCH_SIZE) {
    const batch = links.slice(i, i + BATCH_SIZE);
    
    console.log(`Checking links ${i + 1} to ${Math.min(i + BATCH_SIZE, links.length)} of ${links.length}`);
    
    const batchPromises = batch.map(link => checkSingleLink(link.id, link.url));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    // Show progress
    const progress = Math.round(((i + BATCH_SIZE) / links.length) * 100);
    process.stdout.write(`\rProgress: ${Math.min(progress, 100)}%`);
    
    if (i + BATCH_SIZE < links.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(''); // New line after progress
  return results;
}

async function showReport(results) {
  console.log('\n' + colorize('cyan', '📊 LINK CHECK REPORT'));
  console.log('=' * 50);
  
  const summary = {
    total: results.length,
    active: results.filter(r => r.status === 'active').length,
    dead: results.filter(r => r.status === 'dead').length,
    redirects: results.filter(r => r.status === 'redirect').length,
    timeouts: results.filter(r => r.status === 'timeout').length,
    errors: results.filter(r => r.status === 'error').length
  };
  
  console.log(`Total Links:    ${summary.total}`);
  console.log(`${colorize('green', '✅ Active:')}      ${summary.active} (${(summary.active/summary.total*100).toFixed(1)}%)`);
  console.log(`${colorize('red', '❌ Dead:')}        ${summary.dead} (${(summary.dead/summary.total*100).toFixed(1)}%)`);
  console.log(`${colorize('yellow', '🔀 Redirects:')}   ${summary.redirects} (${(summary.redirects/summary.total*100).toFixed(1)}%)`);
  console.log(`${colorize('yellow', '⏱️  Timeouts:')}    ${summary.timeouts} (${(summary.timeouts/summary.total*100).toFixed(1)}%)`);
  console.log(`${colorize('red', '⚠️  Errors:')}      ${summary.errors} (${(summary.errors/summary.total*100).toFixed(1)}%)`);
  
  // Show dead links
  const deadLinks = results.filter(r => r.status === 'dead' || r.status === 'timeout');
  if (deadLinks.length > 0) {
    console.log('\n' + colorize('red', '💀 DEAD LINKS:'));
    console.log('-' * 50);
    
    for (const link of deadLinks.slice(0, 20)) { // Show first 20
      console.log(`${colorize('red', '❌')} ${link.url}`);
      if (link.error) {
        console.log(`   ${colorize('yellow', link.error)}`);
      }
    }
    
    if (deadLinks.length > 20) {
      console.log(`... and ${deadLinks.length - 20} more`);
    }
  }
  
  // Show redirects
  const redirects = results.filter(r => r.status === 'redirect');
  if (redirects.length > 0 && redirects.length <= 10) {
    console.log('\n' + colorize('yellow', '🔀 REDIRECTS:'));
    console.log('-' * 50);
    
    for (const link of redirects) {
      console.log(`${colorize('yellow', '🔀')} ${link.url}`);
      console.log(`   → ${link.redirectUrl}`);
    }
  }
}

async function main() {
  console.log(colorize('blue', '🔍 SMCCCD Site Index Link Checker'));
  console.log('=' * 50);
  
  try {
    // Build query based on options
    const whereClause = {};
    if (options.campus) {
      whereClause.campus = options.campus;
    }
    if (options.letter) {
      whereClause.letter = options.letter;
    }
    
    // Get links from database
    const indexItems = await prisma.indexitem.findMany({
      where: whereClause,
      select: {
        id: true,
        url: true,
        title: true,
        campus: true,
        letter: true
      }
    });
    
    if (indexItems.length === 0) {
      console.log(colorize('yellow', 'No links found with the specified criteria.'));
      return;
    }
    
    console.log(`Found ${indexItems.length} links to check`);
    
    if (options.campus) {
      console.log(`Filtering by campus: ${options.campus}`);
    }
    if (options.letter) {
      console.log(`Filtering by letter: ${options.letter}`);
    }
    
    console.log('Starting link check...\n');
    
    // Check links
    const results = await checkLinksInBatches(
      indexItems.map(item => ({ id: item.id, url: item.url }))
    );
    
    // Show results
    await showReport(results);
    
    // Save detailed results to file
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `link-check-${timestamp}.json`;
    
    const detailedResults = results.map(result => {
      const item = indexItems.find(i => i.id === result.id);
      return {
        ...result,
        title: item?.title,
        campus: item?.campus,
        letter: item?.letter
      };
    });
    
    require('fs').writeFileSync(filename, JSON.stringify(detailedResults, null, 2));
    console.log(`\n${colorize('green', '📁 Detailed results saved to:')} ${filename}`);
    
  } catch (error) {
    console.error(colorize('red', '❌ Error:'), error);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

main().catch(console.error);