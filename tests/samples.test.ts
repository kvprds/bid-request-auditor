/**
 * Sample expectations, transcribed from PLAN.md.
 *
 * Each entry is the exact multiset of findings PLAN.md predicts for that
 * sample, written as "SEVERITY check-id" so the assertion pins the
 * severity and the number of times a check fires, not just which checks
 * fire. samples/01 and samples/04 are listed in PLAN.md as clean.
 *
 * Run: node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { audit, CHECKS } from '../src/audit.ts';
import type { Severity } from '../src/types.ts';

const SAMPLES = join(import.meta.dirname, '..', 'samples');

/**
 * PLAN.md lists 26 finding ROWS across the five samples (9 + 9 + 8), drawn
 * from 21 distinct check IDs. Those are different numbers and the prose
 * used to conflate them: README, CLAUDE.md, NOTES.md and SKILL.md all
 * described the auditor as having "26 checks". It has 21, plus
 * invalid-json for a parse failure, so 22 distinct finding IDs.
 * `documented check count matches CHECKS` below now guards that.
 */
const EXPECTED: Record<string, string[]> = {
  // PLAN.md: "samples/01-banner-web.json - clean"
  '01-banner-web.json': [],

  // PLAN.md: "samples/02-app-inapp.json - 9 findings"
  '02-app-inapp.json': [
    'ERROR missing-required-field',          // source.schain.nodes[0].sid; §3.2.26
    'ERROR site-and-app-both',               // §3.2.13
    'ERROR gdpr-without-consent',            // §3.2.3, §3.2.20
    'WARNING schain-complete-single-node',   // §3.2.25
    'WARNING tracking-limited-but-ids-sent', // lmt: 1 with ifa + didmd5; §3.2.18
    'WARNING bidfloorcur-not-in-cur',        // EUR floor, cur ["USD"]; §3.2.1, §3.2.4
    'WARNING wseat-bseat-both',              // §3.2.1
    'INFO at-value-undefined',               // at: 3; §3.2.1, §3.2.12
    'INFO devicetype-vs-ua',                 // devicetype 2 with an iPhone UA
  ],

  // PLAN.md: "samples/03-video-ctv.json - 9 findings"
  '03-video-ctv.json': [
    'ERROR missing-required-field',      // imp[0].video.mimes; §3.2.7
    'ERROR video-rqddurs-exclusive',     // §3.2.7
    'WARNING duration-min-gt-max',       // minduration 30 > maxduration 15
    'WARNING wrong-json-type',           // video.podid: 1; §3.2.7 + Appendix B
    'WARNING geo-country-not-alpha3',    // "US"; §3.2.19
    'WARNING skip-params-without-skip',  // skip: 0 with skipmin/skipafter; §3.2.7, §7.4
    'INFO enum-not-in-adcom-list',       // video.battr: [99]
    'INFO enum-not-in-adcom-list',       // video.api: [50]
    'INFO unknown-field',                // video.plcmt; §2.6
  ],

  // PLAN.md: "samples/04-video-pod.json - clean"
  '04-video-pod.json': [],

  // PLAN.md: "samples/05-native-privacy.json - 8 findings"
  '05-native-privacy.json': [
    'ERROR missing-required-field',        // imp[0].native.request; §3.2.9
    'ERROR coppa-with-user-data',          // §3.2.3, §7.5
    'ERROR tracking-limited-but-ids-sent', // dnt: 1 with ifa + eids + precise geo; §3.2.18
    'WARNING keywords-kwarray-both',       // site; §3.2.13
    'WARNING wlang-wlangb-both',           // §3.2.1
    'WARNING schain-hp-not-1',             // nodes[0].hp: 0 with ver "1.0"; §3.2.26
    'INFO secure-vs-http-page',            // §3.2.4
    'INFO enum-not-in-adcom-list',         // user.eids[0].uids[0].atype: 9
  ],
};

function labels(file: string): string[] {
  const { findings } = audit(readFileSync(join(SAMPLES, file), 'utf8'));
  return findings.map((finding) => `${finding.severity} ${finding.id}`).sort();
}

for (const [file, expected] of Object.entries(EXPECTED)) {
  test(`${file}: findings match PLAN.md`, () => {
    assert.deepEqual(labels(file), [...expected].sort());
  });
}

for (const file of ['01-banner-web.json', '04-video-pod.json']) {
  test(`${file}: no ERROR or WARNING findings`, () => {
    const { counts } = audit(readFileSync(join(SAMPLES, file), 'utf8'));
    assert.equal(counts.ERROR, 0);
    assert.equal(counts.WARNING, 0);
  });
}

test('findings are sorted ERROR, WARNING, INFO', () => {
  const rank: Record<Severity, number> = { ERROR: 0, WARNING: 1, INFO: 2 };
  for (const file of Object.keys(EXPECTED)) {
    const { findings } = audit(readFileSync(join(SAMPLES, file), 'utf8'));
    const ranks = findings.map((finding) => rank[finding.severity]);
    assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), file);
  }
});

test('every finding cites a spec section and a PLAN.md check id', () => {
  for (const file of Object.keys(EXPECTED)) {
    const { findings } = audit(readFileSync(join(SAMPLES, file), 'utf8'));
    for (const finding of findings) {
      assert.match(finding.spec, /§\d/, `${file}: ${finding.id} must cite a spec section`);
      assert.match(finding.id, /^[a-z0-9-]+$/, `${file}: ${finding.id}`);
      assert.match(finding.category, /^[SECP]$/, `${file}: ${finding.id}`);
      assert.ok(finding.message.length > 0, `${file}: ${finding.id} needs a message`);
      assert.ok(finding.path.length > 0, `${file}: ${finding.id} needs a path`);
    }
  }
});

test('PLAN.md check inventory: 21 checks plus invalid-json', () => {
  const ids = new Set<string>();
  for (const expected of Object.values(EXPECTED)) {
    for (const label of expected) ids.add(label.split(' ')[1]);
  }
  assert.equal(ids.size, 21);
  assert.equal(CHECKS.length, 21);
});

test('a JSON parse failure is itself a finding, not a throw', () => {
  const { findings, counts } = audit('{ "id": "x", ');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].id, 'invalid-json');
  assert.equal(counts.ERROR, 1);
});

test('non-object payloads are reported, not thrown', () => {
  for (const input of ['42', 'null', '[]', '"a string"']) {
    const { findings } = audit(input);
    assert.equal(findings[0].id, 'invalid-json', input);
  }
});

test('audit never throws on hostile input', () => {
  const inputs: unknown[] = [
    undefined, null, 0, '', [], {},
    { imp: 'not an array' },
    { imp: [null, 1, 'x', {}] },
    { imp: [{ video: { mimes: 1, rqddurs: 'x', minduration: null } }] },
    { site: {}, app: {}, regs: null, user: [], device: 7, source: { schain: { nodes: {} } } },
    { user: { eids: [{ uids: [{ atype: 'nine' }] }] } },
    { device: { geo: { country: 42, lat: 'x' } } },
    { cur: [1, 2], imp: [{ bidfloorcur: 'EUR' }] },
  ];
  for (const input of inputs) {
    assert.doesNotThrow(() => audit(input), JSON.stringify(input) ?? String(input));
  }
});

test('audit does not mutate its input', () => {
  const text = readFileSync(join(SAMPLES, '03-video-ctv.json'), 'utf8');
  const request: unknown = JSON.parse(text);
  audit(request);
  assert.deepEqual(request, JSON.parse(text));
});

/**
 * The check count is quoted in four documents, and it drifted once
 * already — 26 (the sample finding-row total) was copied in as the number
 * of checks. `CHECKS` is the only authority; this fails if any of them
 * disagrees with it, or with each other.
 */
test('documented check count matches CHECKS', () => {
  assert.equal(CHECKS.length, 21, 'CHECKS changed - update the docs listed below to match');

  const repo = join(import.meta.dirname, '..');
  const documents = [
    'README.md',
    'CLAUDE.md',
    'NOTES.md',
    join('.claude', 'skills', 'bid-request-audit', 'SKILL.md'),
  ];

  for (const document of documents) {
    const text = readFileSync(join(repo, document), 'utf8');
    const quoted = [...text.matchAll(/(\d+)\s+(?:distinct\s+)?checks\b/g)].map((m) => Number(m[1]));
    assert.ok(quoted.length > 0, `${document} no longer states a check count`);
    for (const count of quoted) {
      assert.equal(count, CHECKS.length, `${document} says ${count} checks; CHECKS.length is ${CHECKS.length}`);
    }
  }
});
