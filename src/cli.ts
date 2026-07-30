/**
 * Node entry point: audit a bid request file and print the findings
 * grouped by severity.
 *
 *   node src/cli.ts samples/02-app-inapp.json
 *
 * This is the only file in src/ that touches the host environment. The
 * auditor itself (audit.ts, rules/, spec-data.ts, util.ts, types.ts) has
 * zero dependencies and no I/O, so the same modules run unchanged in a
 * browser; cli.ts is simply not imported there.
 *
 * Exit status: 1 when any ERROR was found, 2 on a usage or read failure,
 * 0 otherwise.
 */
import { readFileSync } from 'node:fs';
import { argv, exit, stderr, stdout } from 'node:process';
import type { Finding } from './types.ts';
import { SEVERITY_ORDER, audit } from './audit.ts';

function main(): number {
  const path = argv[2];
  if (path === undefined || path === '-h' || path === '--help') {
    stderr.write('usage: node src/cli.ts <bid-request.json>\n');
    return path === undefined ? 2 : 0;
  }

  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch (error) {
    stderr.write(`cannot read ${path}: ${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }

  const { findings, counts } = audit(text);
  stdout.write(`${path}\n`);

  if (findings.length === 0) {
    stdout.write('No findings.\n');
    return 0;
  }

  const summary = SEVERITY_ORDER
    .filter((severity) => counts[severity] > 0)
    .map((severity) => `${counts[severity]} ${severity}`)
    .join(', ');
  stdout.write(`${findings.length} finding${findings.length === 1 ? '' : 's'}: ${summary}\n`);

  for (const severity of SEVERITY_ORDER) {
    const group = findings.filter((finding) => finding.severity === severity);
    if (group.length === 0) continue;
    stdout.write(`\n${severity} (${group.length})\n`);
    for (const finding of group) stdout.write(format(finding));
  }

  return counts.ERROR > 0 ? 1 : 0;
}

function format(finding: Finding): string {
  return [
    `  [${finding.category}] ${finding.id}  ${finding.path}\n`,
    `      ${finding.message}\n`,
    `      ${finding.spec}\n`,
  ].join('');
}

exit(main());
