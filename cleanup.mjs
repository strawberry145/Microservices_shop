import fs from 'fs';
import path from 'path';

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`Deleted ${dir}`);
  }
}

removeDir(path.join(process.cwd(), 'node_modules'));
removeDir(path.join(process.cwd(), 'artifacts', 'solehr', 'node_modules'));
removeDir(path.join(process.cwd(), 'artifacts', 'api-server', 'node_modules'));
removeDir(path.join(process.cwd(), 'lib', 'api-client-react', 'node_modules'));
