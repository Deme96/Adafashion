#!/usr/bin/env node

/**
 * AdaFashion - Complete Setup & Test
 * This script will:
 * 1. Check your environment configuration
 * 2. Test database connection
 * 3. Verify admin authentication is working
 * 4. Display next steps
 */

const fs = require('fs');
const path = require('path');

const log = (icon, title, message) => {
  const icons = {
    info: 'ℹ️ ',
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
    test: '🧪',
  };
  console.log(`${icons[icon] || icon} ${title.padEnd(25)} ${message}`);
};

const header = (text) => {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${text}`);
  console.log(`${'═'.repeat(60)}\n`);
};

const section = (text) => {
  console.log(`\n▶ ${text}`);
  console.log('─'.repeat(40));
};

header('🚀 AdaFashion - Setup & Authentication Check');

// Check if .env exists
section('1. Environment Configuration');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  log('warning', 'Missing .env', 'Not found - using defaults');
  if (fs.existsSync(envExamplePath)) {
    log('info', 'Creating .env', 'from .env.example');
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envExample);
  }
} else {
  log('success', 'Found .env', 'Using custom configuration');

  const envContent = fs.readFileSync(envPath, 'utf8');

  if (envContent.includes('SUPABASE_DB_URL') && !envContent.includes('# SUPABASE_DB_URL')) {
    log('info', 'Database', 'Configured for Supabase');
  } else if (envContent.includes('DB_HOST=localhost')) {
    log('info', 'Database', 'Configured for local MySQL');
  } else if (envContent.includes('sql200.infinityfree.com')) {
    log('info', 'Database', 'Configured for InfinityFree');
  } else {
    log('warning', 'Database', 'Configuration unclear');
  }
}

// Check admin credentials
section('2. Admin Credentials');

const adminEmail = process.env.ADMIN_EMAIL || 'admin@adafashion.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

log('info', 'Email', adminEmail);
log('info', 'Password', adminPassword === 'admin123' ? '(default)' : '(custom)');

// Check required npm packages
section('3. Dependencies');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const requiredPackages = ['express', 'cors', 'body-parser', 'mysql2', 'pg'];
const installed = Object.keys(packageJson.dependencies || {});

requiredPackages.forEach((pkg) => {
  if (installed.includes(pkg)) {
    log('success', `Package: ${pkg}`, 'Installed');
  } else {
    log('error', `Package: ${pkg}`, 'Missing - run npm install');
  }
});

// Display next steps
section('4. Next Steps');

console.log(`
1. If not already done, configure your database in 'server/.env':
   - For local MySQL: uncomment DB_HOST=localhost section
   - For Supabase: uncomment SUPABASE_DB_URL section
   - For InfinityFree: uncomment the INFINITYFREE section

2. Start the development server:
   $ npm run dev

3. Login with credentials:
   Email:    ${adminEmail}
   Password: ${adminPassword}

4. Access the admin panel at:
   http://localhost:4000/admin

5. Run tests to verify everything works:
   $ npm run test-admin    # Check admin authentication
   $ npm run test-login    # Test login endpoint
`);

// Diagnostic commands
section('5. Useful Commands');

console.log(`
npm run dev           # Start development server
npm run test-admin    # Verify admin authentication
npm run test-login    # Test login endpoint
npm run seed          # Seed default data to database
npm start             # Start production server
`);

header('✨ Setup Complete! Ready to go? 🎉');

console.log('Run: npm run dev\n');
