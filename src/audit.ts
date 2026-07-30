/**
 * The auditor entry point: runs every check, concatenates the findings and
 * sorts them by severity.
 *
 * audit() is pure - no file I/O, no network, no clock, no LLM calls - and
 * never throws. The only place an exception is possible is JSON.parse, and
 * a parse failure is reported as a Finding rather than raised. The checks
 * themselves are total: every accessor in util.ts returns undefined or an
 * empty array instead of throwing, and walk() only follows the fixed set
 * of subordinate objects in spec-data.ts, so its depth is bounded by the
 * spec's object graph rather than by the input.
 */
import type { AuditResult, Check, Finding, Severity } from './types.ts';
import { isObject, make } from './util.ts';
import { specChecks } from './rules/spec.ts';
import { enumChecks } from './rules/enums.ts';
import { contradictionChecks } from './rules/contradictions.ts';
import { privacyChecks } from './rules/privacy.ts';

/** Every check, in category order: S, E, C, P. */
export const CHECKS: Check[] = [
  ...specChecks,
  ...enumChecks,
  ...contradictionChecks,
  ...privacyChecks,
];

export const SEVERITY_ORDER: Severity[] = ['ERROR', 'WARNING', 'INFO'];

const RANK: Record<Severity, number> = { ERROR: 0, WARNING: 1, INFO: 2 };

/**
 * Audit a bid request. Accepts either raw JSON text or an already-parsed
 * value; anything that is not a JSON object yields a single invalid-json
 * Finding, because §2.3 carries the request as a JSON payload and §3.2.1
 * describes it as a top-level object.
 */
export function audit(input: unknown): AuditResult {
  let request: unknown = input;

  if (typeof input === 'string') {
    try {
      request = JSON.parse(input);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return collect([make('invalid-json', 'S', 'ERROR', '(document)',
        'OpenRTB 2.6 §2.3', `Request body is not valid JSON: ${detail}`)]);
    }
  }

  if (!isObject(request)) {
    const shape = request === null ? 'null'
      : Array.isArray(request) ? 'an array' : `a ${typeof request}`;
    return collect([make('invalid-json', 'S', 'ERROR', '(document)',
      'OpenRTB 2.6 §2.3, §3.2.1', `Request is ${shape}, not a JSON object.`)]);
  }

  const findings: Finding[] = [];
  for (const check of CHECKS) findings.push(...check(request));
  return collect(findings);
}

/** Stable sort by severity: ERROR, then WARNING, then INFO. */
function collect(findings: Finding[]): AuditResult {
  const sorted = findings
    .map((finding, i) => ({ finding, i }))
    .sort((a, b) => (RANK[a.finding.severity] - RANK[b.finding.severity]) || (a.i - b.i))
    .map((entry) => entry.finding);

  const counts = { ERROR: 0, WARNING: 0, INFO: 0 };
  for (const finding of sorted) counts[finding.severity] += 1;
  return { findings: sorted, counts };
}
