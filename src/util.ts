/**
 * Generic helpers shared by the rule files. Deliberately tiny and
 * total: every accessor returns undefined or an empty array rather than
 * throwing, because audit() must never throw on malformed input.
 */
import type { Category, Finding, Severity } from './types.ts';

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function asObject(v: unknown): Record<string, unknown> | undefined {
  return isObject(v) ? v : undefined;
}

export function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

/** JSON null is treated as absent, so "both present" checks stay honest. */
export function present(obj: Record<string, unknown> | undefined, key: string): boolean {
  return obj !== undefined && obj[key] !== undefined && obj[key] !== null;
}

export function str(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

export function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

/** Path segments joined for display: "imp[0]" + "video" -> "imp[0].video". */
export function join(base: string, field: string): string {
  return base === '' ? field : `${base}.${field}`;
}

export function make(
  id: string,
  category: Category,
  severity: Severity,
  path: string,
  spec: string,
  message: string,
): Finding {
  return { id, category, severity, path, spec, message };
}

/** The Imp array with indices, skipping entries that are not objects. */
export function imps(request: unknown): Array<{ imp: Record<string, unknown>; path: string }> {
  const out: Array<{ imp: Record<string, unknown>; path: string }> = [];
  asArray(asObject(request)?.imp).forEach((entry, i) => {
    const imp = asObject(entry);
    if (imp) out.push({ imp, path: `imp[${i}]` });
  });
  return out;
}

/**
 * The video and audio objects of an imp. Both objects declare the same
 * duration, pod and skip semantics, so the C checks treat them alike.
 */
export function streamMedia(
  imp: Record<string, unknown>,
  impPath: string,
): Array<{ media: Record<string, unknown>; path: string; section: string }> {
  const out: Array<{ media: Record<string, unknown>; path: string; section: string }> = [];
  const video = asObject(imp.video);
  // OpenRTB 2.6 §3.2.7
  if (video) out.push({ media: video, path: join(impPath, 'video'), section: '§3.2.7' });
  const audio = asObject(imp.audio);
  // OpenRTB 2.6 §3.2.8
  if (audio) out.push({ media: audio, path: join(impPath, 'audio'), section: '§3.2.8' });
  return out;
}
