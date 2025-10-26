#!/usr/bin/env node

/**
 * Verification script to check if the MCP server is properly set up
 * Run with: node verify.js
 */

import { existsSync } from 'fs';
import { resolve, join } from 'path';

console.log('🔍 Verifying MCP Capitol Trades Server Setup...\n');

let allGood = true;

// Check 1: Build directory exists
console.log('1️⃣  Checking build directory...');
if (existsSync('./build')) {
  console.log('   ✅ Build directory exists\n');
} else {
  console.log('   ❌ Build directory not found. Run: npm run build\n');
  allGood = false;
}

// Check 2: Build files exist
console.log('2️⃣  Checking compiled files...');
const requiredFiles = ['build/src/index.js', 'build/src/politician-trades-scraper.js', 'build/src/web-scraper.js'];
let filesOk = true;
for (const file of requiredFiles) {
  if (existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} not found`);
    filesOk = false;
    allGood = false;
  }
}
if (filesOk) console.log('   All required files present\n');
else console.log('   Some files missing. Run: npm run build\n');

// Check 3: Node version
console.log('3️⃣  Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion >= 18) {
  console.log(`   ✅ Node.js ${nodeVersion} (requires 18+)\n`);
} else {
  console.log(`   ❌ Node.js ${nodeVersion} is too old. Requires 18+\n`);
  allGood = false;
}

// Check 4: Dependencies
console.log('4️⃣  Checking dependencies...');
if (existsSync('./node_modules')) {
  const criticalDeps = [
    'node_modules/@modelcontextprotocol',
    'node_modules/axios',
    'node_modules/cheerio',
    'node_modules/playwright'
  ];
  let depsOk = true;
  for (const dep of criticalDeps) {
    if (existsSync(dep)) {
      console.log(`   ✅ ${dep.split('/').pop()}`);
    } else {
      console.log(`   ❌ ${dep.split('/').pop()} not found`);
      depsOk = false;
      allGood = false;
    }
  }
  if (depsOk) console.log('   All dependencies installed\n');
  else console.log('   Some dependencies missing. Run: npm install\n');
} else {
  console.log('   ❌ node_modules not found. Run: npm install\n');
  allGood = false;
}

// Check 5: TypeScript config
console.log('5️⃣  Checking configuration files...');
const configFiles = ['package.json', 'tsconfig.json'];
let configOk = true;
for (const file of configFiles) {
  if (existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} not found`);
    configOk = false;
    allGood = false;
  }
}
if (configOk) console.log('   All configuration files present\n');

// Final summary
console.log('═══════════════════════════════════════════');
if (allGood) {
  console.log('✅ All checks passed! Your MCP server is ready to use.');
  console.log('\n📝 Next steps:');
  console.log('   1. Configure in Claude Desktop or Cursor (see README.md)');
  console.log('   2. Restart Claude Desktop or Cursor');
  console.log('   3. Test with: "Get politician trades for Apple in the last 90 days"');
  console.log('\n📚 Documentation:');
  console.log('   - README.md - Complete setup, usage, and troubleshooting');
  console.log('   - ARCHITECTURE.md - System architecture');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  console.log('\n🔧 Common fixes:');
  console.log('   - Run: npm install');
  console.log('   - Run: npm run build');
  console.log('   - Update Node.js to version 18+');
}
console.log('═══════════════════════════════════════════\n');

process.exit(allGood ? 0 : 1);

