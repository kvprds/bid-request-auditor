/**
 * Guards the promise that web/ contains no second copy of the rules.
 *
 * web/auditor.js is generated from src/ by tools/build-web.mjs. These
 * tests assert two things about it: that it is byte-identical to a fresh
 * generation (so it cannot go stale after a change under src/), and that
 * it produces exactly the same findings as the TypeScript modules for
 * every sample (so the type-stripping transform cannot alter behaviour).
 *
 * Run: node --test tests/web-bundle.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { audit, CHECKS } from '../src/audit.ts';
import type { AuditResult } from '../src/types.ts';
import { generate, OUTPUT_PATH } from '../tools/build-web.mjs';

const ROOT = join(import.meta.dirname, '..');
const SAMPLES = join(ROOT, 'samples');
const sampleFiles = readdirSync(SAMPLES).filter((name) => name.endsWith('.json')).sort();

interface BrowserApi {
  audit: (input: unknown) => AuditResult;
  CHECKS: unknown[];
  SEVERITY_ORDER: string[];
  samples: Record<string, string>;
}

/**
 * Values built inside a vm context come from a different realm, so their
 * prototypes are not the ones assert's strict deep-equal expects. Compare
 * the JSON projections instead - the Finding shape is plain JSON anyway.
 */
function plain(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

/** Load the generated script the way a browser would: as a classic script. */
function loadBundle(): BrowserApi {
  const sandbox: Record<string, unknown> = {};
  createContext(sandbox);
  runInContext(readFileSync(OUTPUT_PATH, 'utf8'), sandbox);
  const api = sandbox.BidRequestAuditor as BrowserApi | undefined;
  assert.ok(api, 'web/auditor.js must assign globalThis.BidRequestAuditor');
  return api;
}

test('web/auditor.js is not stale: matches a fresh build from src/', () => {
  assert.equal(
    readFileSync(OUTPUT_PATH, 'utf8'),
    generate(),
    'web/auditor.js is out of date - run: node tools/build-web.mjs',
  );
});

test('the browser bundle exposes the same check count as src/', () => {
  const api = loadBundle();
  assert.equal(api.CHECKS.length, CHECKS.length);
  assert.deepEqual(plain(api.SEVERITY_ORDER), ['ERROR', 'WARNING', 'INFO']);
});

test('the browser bundle returns findings identical to src/ for every sample', () => {
  const api = loadBundle();
  for (const file of sampleFiles) {
    const text = readFileSync(join(SAMPLES, file), 'utf8');
    assert.deepEqual(plain(api.audit(text)), plain(audit(text)), file);
  }
});

test('embedded samples are verbatim copies of samples/*.json', () => {
  const api = loadBundle();
  assert.deepEqual(Object.keys(api.samples).sort(), sampleFiles);
  for (const file of sampleFiles) {
    assert.equal(api.samples[file], readFileSync(join(SAMPLES, file), 'utf8'), file);
  }
});

test('the browser bundle reports malformed JSON rather than throwing', () => {
  const api = loadBundle();
  const result = api.audit('{ "id": ');
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].id, 'invalid-json');
});

test('the browser bundle carries no Node-only imports', () => {
  const code = readFileSync(OUTPUT_PATH, 'utf8');
  for (const forbidden of ['node:fs', 'node:process', 'require(', 'import ']) {
    assert.ok(!code.includes(forbidden), `generated bundle must not contain "${forbidden}"`);
  }
});
