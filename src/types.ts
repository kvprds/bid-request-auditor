/**
 * Core types for the OpenRTB 2.6 bid request auditor.
 *
 * Severity policy (CLAUDE.md): ERROR is used only where a spec table
 * literally says "required", plus the privacy contradictions PLAN.md
 * agrees are errors. "Recommended" is at most WARNING. Unknown fields
 * and unknown enum values are INFO at most - OpenRTB 2.6 §2.6.
 */
export type Severity = 'ERROR' | 'WARNING' | 'INFO';

/** PLAN.md categories: S spec - E enum - C contradiction - P privacy. */
export type Category = 'S' | 'E' | 'C' | 'P';

export interface Finding {
  /** PLAN.md check ID, e.g. "missing-required-field". */
  id: string;
  category: Category;
  severity: Severity;
  /** Path to the offending value, e.g. "imp[0].video.mimes". */
  path: string;
  /** Spec section the rule came from, e.g. "OpenRTB 2.6 §3.2.7". */
  spec: string;
  message: string;
}

export interface AuditResult {
  findings: Finding[];
  counts: { ERROR: number; WARNING: number; INFO: number };
}

/** Every check is a pure function of the parsed request. */
export type Check = (request: unknown) => Finding[];
