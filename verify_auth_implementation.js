#!/usr/bin/env node

/**
 * Authentication Implementation Verification Script
 * Tests that all authentication files are in place and configured correctly
 */

const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend');

const requiredFiles = [
  'src/middleware.ts',
  'src/lib/authContext.tsx',
  'src/components/ProtectedRoute.tsx',
];

const modifiedFiles = [
  'src/app/layout.tsx',
  'src/app/login/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/recruiter/dashboard/page.tsx',
  'src/app/register/page.tsx',
];

const checksums = {
  authContext: ['onAuthStateChange', 'useAuth', 'AuthProvider', 'fetchUserRole'],
  middleware: ['createServerClient', '/recruiter', '/candidate', '/dashboard'],
  protectedRoute: ['ProtectedRoute', 'requiredRole', 'useAuth'],
  layout: ['AuthProvider', 'suppressHydrationWarning'],
  login: ['profiles.role', 'userRole', 'recruiter/dashboard', 'candidate/dashboard'],
  register: ['profiles', 'role', 'onConflict'],
};

function fileExists(filePath) {
  return fs.existsSync(path.join(frontendDir, filePath));
}

function checkFileContent(filePath, keywords) {
  try {
    const content = fs.readFileSync(path.join(frontendDir, filePath), 'utf8');
    const missing = keywords.filter(kw => !content.includes(kw));
    return {
      exists: true,
      missing: missing.length > 0 ? missing : null,
    };
  } catch (e) {
    return { exists: false, error: e.message };
  }
}

console.log('🔐 Authentication Implementation Verification\n');
console.log('='.repeat(60));

console.log('\n✅ REQUIRED NEW FILES:');
requiredFiles.forEach(file => {
  const exists = fileExists(file);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file}`);
});

console.log('\n📝 MODIFIED FILES:');
modifiedFiles.forEach(file => {
  const exists = fileExists(file);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file}`);
});

console.log('\n🔍 CONTENT VERIFICATION:');

const fileChecks = [
  { path: 'src/lib/authContext.tsx', name: 'AuthContext', keywords: checksums.authContext },
  { path: 'src/middleware.ts', name: 'Middleware', keywords: checksums.middleware },
  { path: 'src/components/ProtectedRoute.tsx', name: 'ProtectedRoute', keywords: checksums.protectedRoute },
  { path: 'src/app/layout.tsx', name: 'Root Layout', keywords: checksums.layout },
  { path: 'src/app/login/page.tsx', name: 'Login Page', keywords: checksums.login },
  { path: 'src/app/register/page.tsx', name: 'Register Page', keywords: checksums.register },
];

let allPassed = true;

fileChecks.forEach(({ path: filePath, name, keywords }) => {
  const check = checkFileContent(filePath, keywords);
  
  if (!check.exists) {
    console.log(`\n❌ ${name} (${filePath})`);
    console.log(`   Error: File not found - ${check.error}`);
    allPassed = false;
  } else if (check.missing) {
    console.log(`\n⚠️  ${name} (${filePath})`);
    console.log(`   Missing keywords: ${check.missing.join(', ')}`);
    allPassed = false;
  } else {
    console.log(`\n✅ ${name} (${filePath})`);
    console.log(`   All required keywords found`);
  }
});

console.log('\n' + '='.repeat(60));

if (allPassed && requiredFiles.every(f => fileExists(f)) && modifiedFiles.every(f => fileExists(f))) {
  console.log('\n🎉 ALL CHECKS PASSED - Ready for testing!\n');
  console.log('Next steps:');
  console.log('1. npm install          # Ensure dependencies are installed');
  console.log('2. npm run dev          # Start development server');
  console.log('3. Test login flow      # Navigate to http://localhost:3000/login');
  console.log('4. Test role-based routing  # Try accessing /recruiter/dashboard as candidate');
  process.exit(0);
} else {
  console.log('\n❌ VERIFICATION FAILED - Please check the errors above\n');
  process.exit(1);
}
