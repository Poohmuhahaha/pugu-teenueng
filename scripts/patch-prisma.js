import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const pkgJsonPath = path.join(rootDir, 'apps/api/node_modules/custom-prisma-client/package.json');
if (fs.existsSync(pkgJsonPath)) {
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  pkgJson.type = 'commonjs';
  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2), 'utf8');
  console.log('✏️ Patched custom-prisma-client package.json with type: commonjs');
} else {
  console.warn('⚠️ custom-prisma-client package.json not found to patch');
}
