import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const rootEsm = await import('../dist/index.js');
const pluginsEsm = await import('../dist/plugins/index.js');
const fpEsm = await import('../dist/fp/index.js');
const utilsEsm = await import('../dist/utils/index.js');
const coreEsm = await import('../dist/core/index.js');

const rootCjs = require('../dist/index.cjs');
const pluginsCjs = require('../dist/plugins/index.cjs');

const checks = [
  ['root ESM VERSION', rootEsm.VERSION],
  ['root CJS VERSION', rootCjs.VERSION],
  ['plugins ESM speak', pluginsEsm.speak],
  ['plugins CJS getFingerprint', pluginsCjs.getFingerprint],
  ['fp ESM pipe', fpEsm.pipe],
  ['utils ESM debounce', utilsEsm.debounce],
  ['core ESM Container', coreEsm.Container],
];

for (const [name, value] of checks) {
  if (value === undefined) {
    throw new Error(`Missing export: ${name}`);
  }
}

console.log('Export smoke test passed');
