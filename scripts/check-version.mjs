import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const source = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');
const docsConfig = readFileSync(new URL('../docs/.vitepress/config.ts', import.meta.url), 'utf8');
const match = source.match(/export const VERSION = '([^']+)'/);
const docsMatch = docsConfig.match(/text:\s*'(\d+\.\d+\.\d+)'/);
const docsUsesPackageVersion = /text:\s*`v\$\{pkg\.version\}`/.test(docsConfig);

if (!match) {
  throw new Error('VERSION export was not found in src/index.ts');
}

const runtimeVersion = match[1];
const packageVersion = packageJson.version;

if (runtimeVersion !== packageVersion) {
  throw new Error(
    `Version mismatch: package.json=${packageVersion}, src/index.ts VERSION=${runtimeVersion}`
  );
}

if (!docsMatch && !docsUsesPackageVersion) {
  throw new Error('Documentation navigation version was not found in docs/.vitepress/config.ts');
}

const docsVersion = docsUsesPackageVersion ? packageVersion : docsMatch?.[1];

if (docsVersion !== packageVersion) {
  throw new Error(
    `Version mismatch: package.json=${packageVersion}, docs nav version=${docsVersion}`
  );
}

const refType = process.env.GITHUB_REF_TYPE;
const refName = process.env.GITHUB_REF_NAME;
const ref = process.env.GITHUB_REF;
const tag = refType === 'tag' ? refName : ref?.startsWith('refs/tags/') ? ref.slice(10) : undefined;

if (tag && tag !== `v${packageVersion}`) {
  throw new Error(`Version mismatch: package.json=${packageVersion}, git tag=${tag}`);
}

console.log(`Version check passed: ${packageVersion}`);
