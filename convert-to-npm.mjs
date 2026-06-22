import fs from 'fs';
import path from 'path';

const rootPath = process.cwd();
const workspaceYamlPath = path.join(rootPath, 'pnpm-workspace.yaml');
const workspaceYamlContent = fs.readFileSync(workspaceYamlPath, 'utf8');

// Simple parser for catalog: block in this specific yaml
const catalog = {};
let inCatalog = false;
for (const line of workspaceYamlContent.split('\n')) {
  if (line.startsWith('catalog:')) {
    inCatalog = true;
    continue;
  }
  if (inCatalog) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    if (!line.startsWith('  ') || !line.includes(':')) {
      inCatalog = false; // block ended
      continue;
    }
    const parts = line.split(':');
    const key = parts[0].trim().replace(/^['"]|['"]$/g, '');
    const val = parts.slice(1).join(':').trim();
    catalog[key] = val;
  }
}

function resolveCatalog(obj) {
  if (!obj) return obj;
  const newObj = { ...obj };
  for (const [key, val] of Object.entries(newObj)) {
    if (val === 'catalog:') {
      if (!catalog[key]) throw new Error(`Missing catalog entry for ${key}`);
      newObj[key] = catalog[key];
    } else if (val === 'workspace:*') {
      // Map known workspace packages to their relative paths
      const paths = {
        '@workspace/api-client-react': '../../lib/api-client-react',
        '@workspace/api-zod': '../../lib/api-zod',
        '@workspace/db': '../../lib/db'
      };
      if (paths[key]) {
        newObj[key] = `file:${paths[key]}`;
      } else {
        newObj[key] = '*';
      }
    }
  }
  return newObj;
}

function processPackageJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const pkg = JSON.parse(content);
  let changed = false;

  if (pkg.dependencies) {
    const newDeps = resolveCatalog(pkg.dependencies);
    if (JSON.stringify(pkg.dependencies) !== JSON.stringify(newDeps)) {
      pkg.dependencies = newDeps;
      changed = true;
    }
  }

  if (pkg.devDependencies) {
    const newDevDeps = resolveCatalog(pkg.devDependencies);
    if (JSON.stringify(pkg.devDependencies) !== JSON.stringify(newDevDeps)) {
      pkg.devDependencies = newDevDeps;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2));
    console.log(`Updated ${filePath}`);
  }
}

function findPackageJsons(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findPackageJsons(fullPath);
      }
    } else if (file === 'package.json') {
      processPackageJson(fullPath);
    }
  }
}

// update all package.jsons
findPackageJsons(rootPath);

// update root package.json for npm workspaces
const rootPkgPath = path.join(rootPath, 'package.json');
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
rootPkg.workspaces = ["artifacts/*", "lib/*", "lib/integrations/*", "scripts"];
delete rootPkg.scripts.preinstall; // remove pnpm enforcement
fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2));
console.log('Updated root package.json for npm workspaces');
