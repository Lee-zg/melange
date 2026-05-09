import { readFileSync } from 'node:fs';

const summary = JSON.parse(
  readFileSync(new URL('../coverage/coverage-summary.json', import.meta.url), 'utf8')
);

const thresholds = {
  statements: 60,
  branches: 70,
  functions: 50,
  lines: 60,
};

const totals = summary.total;

if (!totals) {
  throw new Error('coverage-summary.json does not contain a total section');
}

const failures = Object.entries(thresholds)
  .map(([metric, threshold]) => {
    const pct = totals[metric]?.pct;
    if (typeof pct !== 'number') {
      return `${metric}: missing coverage percentage`;
    }
    return pct < threshold ? `${metric}: ${pct}% < ${threshold}%` : null;
  })
  .filter(Boolean);

if (failures.length > 0) {
  throw new Error(`Coverage threshold failed:\n${failures.join('\n')}`);
}

console.log(
  `Coverage check passed: statements=${totals.statements.pct}%, branches=${totals.branches.pct}%, functions=${totals.functions.pct}%, lines=${totals.lines.pct}%`
);
