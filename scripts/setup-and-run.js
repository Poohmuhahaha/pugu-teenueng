import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawn } from 'node:child_process';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');

console.log('🚀 Initializing LifeOS environment...');

// 1. Copy .env if not exists
if (!fs.existsSync(envPath)) {
  console.log('📁 Creating .env file from .env.example...');
  fs.copyFileSync(envExamplePath, envPath);
}

// 2. Generate secure secrets in .env if empty or containing placeholders
let envContent = fs.readFileSync(envPath, 'utf-8');
let modified = false;

if (envContent.includes('JWT_SECRET=') && (envContent.includes('set in .env') || envContent.match(/JWT_SECRET=\s*$/m) || envContent.includes('JWT_SECRET=placeholder'))) {
  const secret = crypto.randomBytes(32).toString('hex');
  envContent = envContent.replace(/JWT_SECRET=.*/, `JWT_SECRET=${secret}`);
  modified = true;
}
if (envContent.includes('CSRF_SECRET=') && (envContent.includes('set in .env') || envContent.match(/CSRF_SECRET=\s*$/m) || envContent.includes('CSRF_SECRET=placeholder'))) {
  const secret = crypto.randomBytes(32).toString('hex');
  envContent = envContent.replace(/CSRF_SECRET=.*/, `CSRF_SECRET=${secret}`);
  modified = true;
}

if (modified) {
  console.log('🔒 Generated secure JWT and CSRF secrets in .env');
  fs.writeFileSync(envPath, envContent, 'utf-8');
}

// 3. Run database migrations and seed
try {
  console.log('💾 Applying database migrations...');
  execSync('deno run -A npm:prisma migrate dev --name init --schema=apps/api/prisma/schema.prisma', { stdio: 'inherit', cwd: rootDir });
  console.log('✏️ Patching Prisma Client...');
  execSync('deno run -A scripts/patch-prisma.js', { stdio: 'inherit', cwd: rootDir });
  console.log('🌱 Seeding database...');
  execSync('deno task --filter @lifeos/api db:seed', { stdio: 'inherit', cwd: rootDir });
} catch (err) {
  console.warn('⚠️ Database migration/seed skipped or failed. Ensure your local PostgreSQL is running.');
}

// 4. Start development servers concurrently
console.log('🔥 Starting LifeOS development services...');
const apps = [
  '@lifeos/admin',
  '@lifeos/api',
  '@lifeos/docs',
  '@lifeos/landing',
  '@lifeos/web'
];

const children = [];

apps.forEach(appName => {
  const p = spawn('deno', ['task', '--filter', appName, 'dev'], { stdio: 'inherit', shell: true, cwd: rootDir });
  children.push(p);
  
  p.on('error', (err) => {
    console.error(`Error spawning ${appName}:`, err);
  });
});

// Forward exit code and terminate other processes when any process exits
children.forEach(p => {
  p.on('close', (code) => {
    children.forEach(c => {
      if (c !== p && !c.killed) {
        c.kill();
      }
    });
    process.exit(code);
  });
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  children.forEach(c => {
    if (!c.killed) {
      c.kill();
    }
  });
  process.exit(0);
});

