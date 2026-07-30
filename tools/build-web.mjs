/**
 * Generates web/auditor.js from src/ so the static page can run the real
 * rules. No rule is ever copied by hand: this script type-strips the
 * TypeScript sources with Node's own stripper - the same one that runs
 * tests/samples.test.ts - so the browser and the tests execute identical
 * logic.
 *
 *   node tools/build-web.mjs
 *
 * Output is a classic script (not an ES module) that assigns
 * globalThis.BidRequestAuditor. That is deliberate: classic scripts load
 * from file://, so web/index.html works by opening it, with no server.
 *
 * Zero dependencies - node:fs, node:path and node:module only.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const ROOT = join(import.meta.dirname, '..');

/** Where the generated browser script lives. */
export const OUTPUT_PATH = join(ROOT, 'web', 'auditor.js');

/**
 * Dependency order. cli.ts is excluded: it is the Node entry point and
 * imports node:fs / node:process, neither of which exists in a browser.
 */
const MODULES = [
  'src/types.ts',
  'src/util.ts',
  'src/spec-data.ts',
  'src/rules/spec.ts',
  'src/rules/enums.ts',
  'src/rules/contradictions.ts',
  'src/rules/privacy.ts',
  'src/audit.ts',
];

/** Names the page needs on globalThis.BidRequestAuditor. */
const EXPOSED = ['audit', 'CHECKS', 'SEVERITY_ORDER'];

const IMPORT_STATEMENT = /^import\b[\s\S]*?from\s*'[^']*';?[ \t]*$/gm;
const EXPORT_KEYWORD = /^export\s+(?=(?:const|let|var|function|async|class)\b)/gm;
const TOP_LEVEL_DECL = /^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm;

/** Type-strip, then drop the module wiring so the files can concatenate. */
function toScript(relative) {
  const source = readFileSync(join(ROOT, relative), 'utf8');
  // mode 'strip' blanks type syntax in place, so line numbers survive.
  const stripped = stripTypeScriptTypes(source, { mode: 'strip' });
  return stripped
    .replace(IMPORT_STATEMENT, '')
    .replace(EXPORT_KEYWORD, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Concatenation puts every module in one scope, so two modules declaring
 * the same top-level name would silently shadow each other. Fail loudly
 * instead of shipping a subtly broken bundle.
 */
function assertNoCollisions(parts) {
  const owner = new Map();
  for (const { relative, code } of parts) {
    for (const [, name] of code.matchAll(TOP_LEVEL_DECL)) {
      const previous = owner.get(name);
      if (previous !== undefined) {
        throw new Error(
          `top-level name "${name}" is declared in both ${previous} and ${relative}; `
          + 'rename one so the concatenated bundle stays correct',
        );
      }
      owner.set(name, relative);
    }
  }
  for (const name of EXPOSED) {
    if (!owner.has(name)) throw new Error(`expected src/ to declare "${name}" but it does not`);
  }
}

/** The five sample requests, embedded so the buttons work without fetch(). */
function embedSamples() {
  const dir = join(ROOT, 'samples');
  const entries = readdirSync(dir).filter((name) => name.endsWith('.json')).sort();
  const pairs = entries.map((name) => {
    const text = readFileSync(join(dir, name), 'utf8');
    return `    ${JSON.stringify(name)}: ${JSON.stringify(text)},`;
  });
  return `  const samples = {\n${pairs.join('\n')}\n  };`;
}

function indent(code) {
  return code.split('\n').map((line) => (line === '' ? '' : `  ${line}`)).join('\n');
}

/**
 * Build the browser script. Exported so tests/web-bundle.test.ts can
 * assert that web/auditor.js on disk still matches src/.
 */
export function generate() {
  const parts = MODULES.map((relative) => ({ relative, code: toScript(relative) }));
  assertNoCollisions(parts);

  const body = parts
    .map(({ relative, code }) => `  // ---- ${relative} ${'-'.repeat(Math.max(0, 66 - relative.length))}\n${indent(code)}`)
    .join('\n\n');

  return `/**
 * GENERATED FILE - DO NOT EDIT.
 *
 * Built from src/*.ts by tools/build-web.mjs using Node's built-in
 * TypeScript type stripper. The rules live in src/rules/ and exist only
 * there; this file is a mechanical transcription of them for the browser.
 *
 * Regenerate after any change under src/:
 *   node tools/build-web.mjs
 *
 * Sources: ${MODULES.join(', ')}
 * Samples: embedded from samples/*.json so the page needs no fetch().
 */
(function () {
  'use strict';

${body}

${embedSamples()}

  globalThis.BidRequestAuditor = { ${EXPOSED.join(', ')}, samples };
}());
`;
}

// Write only when run as a script, so importing this module has no side effects.
if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const output = generate();
  const sampleCount = readdirSync(join(ROOT, 'samples')).filter((name) => name.endsWith('.json')).length;
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, output, 'utf8');
  process.stdout.write(
    `web/auditor.js  ${Buffer.byteLength(output, 'utf8')} bytes  `
    + `${MODULES.length} modules, ${sampleCount} samples embedded\n`,
  );
}
