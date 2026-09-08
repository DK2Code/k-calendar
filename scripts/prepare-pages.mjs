import { access, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputDirectory = path.resolve('dist/client');
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, '.nojekyll'), '');

if (!repositoryName) {
  process.exit(0);
}

const repositoryDirectory = path.join(outputDirectory, repositoryName);
const nestedAssets = path.join(repositoryDirectory, '_next');
const deployedAssets = path.join(outputDirectory, '_next');

// Vinext writes assetPrefix files into a matching nested directory. GitHub Pages
// already mounts the artifact at /<repository>, so that extra directory would make
// every stylesheet and script URL resolve one level above the actual file.
if (await exists(nestedAssets)) {
  if (await exists(deployedAssets)) {
    await rm(deployedAssets, { recursive: true, force: true });
  }

  await rename(nestedAssets, deployedAssets);

  if ((await readdir(repositoryDirectory)).length === 0) {
    await rm(repositoryDirectory, { recursive: true });
  }
}

const html = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
const publicPrefix = `/${repositoryName}/`;
const assetUrls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((url) => url.startsWith(publicPrefix) && !url.startsWith('http'));

const missingAssets = [];

for (const assetUrl of assetUrls) {
  const relativePath = assetUrl.slice(publicPrefix.length).split(/[?#]/, 1)[0];
  const assetPath = path.join(outputDirectory, ...relativePath.split('/'));

  if (!(await exists(assetPath))) {
    missingAssets.push(assetUrl);
  }
}

if (missingAssets.length > 0) {
  throw new Error(`Missing GitHub Pages assets:\n${missingAssets.join('\n')}`);
}

console.log(`Prepared GitHub Pages artifact for ${publicPrefix}`);
