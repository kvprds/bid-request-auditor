/**
 * Category E - enumerated values.
 *
 * PLAN.md checks: at-value-undefined, enum-not-in-adcom-list.
 *
 * Both are INFO. OpenRTB 2.6 §2.6 requires implementers to "tolerate
 * receiving new or unexpected fields and enumerated list values
 * gracefully", so an unrecognised enum value is never an error here.
 */
import type { Check, Finding } from '../types.ts';
import { asArray, join, make, num } from '../util.ts';
import { ADCOM_ENUM_FIELDS, FIELD_TYPES, spec, walk } from '../spec-data.ts';

/**
 * E/at-value-undefined - OpenRTB 2.6 §3.2.1 defines request-level at as
 * "1 = First Price, 2 = Second Price Plus" with "Exchange-specific
 * auction types ... using values 500 and greater". §3.2.12 additionally
 * defines 3 at deal level, so a request-level 3 is usually a deal value
 * in the wrong place.
 */
export const atValueUndefined: Check = (request) => {
  const out: Finding[] = [];
  for (const node of walk(request)) {
    if (node.kind !== 'BidRequest' && node.kind !== 'Deal') continue;
    const at = num(node.obj.at);
    if (at === undefined) continue;
    // OpenRTB 2.6 §3.2.12 adds 3 ("bidfloor is the agreed upon deal price").
    const defined = node.kind === 'Deal' ? [1, 2, 3] : [1, 2];
    if (defined.includes(at) || at >= 500) continue;
    const hint = node.kind === 'BidRequest' && at === 3
      ? ' Value 3 is defined only at deal level (§3.2.12), so this is likely a misplaced deal value.'
      : '';
    out.push(make('at-value-undefined', 'E', 'INFO',
      join(node.path, 'at'), spec(node.kind),
      `at is ${at}; ${node.kind} defines ${defined.join(', ')} and 500+.${hint}`));
  }
  return out;
};

/**
 * E/enum-not-in-adcom-list - a value outside the AdCOM 1.0 list that the
 * field's OpenRTB 2.6 entry points at. The field-to-list mapping lives in
 * spec-data.ts; each entry corresponds to a "Refer to List: X in AdCOM
 * 1.0" instruction in §3.2.x.
 */
export const enumNotInAdcomList: Check = (request) => {
  const out: Finding[] = [];
  for (const node of walk(request)) {
    for (const field of Object.keys(node.obj)) {
      const list = ADCOM_ENUM_FIELDS[`${node.kind}.${field}`];
      if (list === undefined) continue;
      const isArrayField = FIELD_TYPES[node.kind][field] === 'integer[]';
      const entries: Array<{ value: unknown; path: string }> = isArrayField
        ? asArray(node.obj[field]).map((value, i) => ({ value, path: `${join(node.path, field)}[${i}]` }))
        : [{ value: node.obj[field], path: join(node.path, field) }];
      for (const entry of entries) {
        const value = num(entry.value);
        if (value === undefined) continue;   // wrong type: reported by wrong-json-type
        if (list.values.includes(value)) continue;
        if (list.vendorFrom !== undefined && value >= list.vendorFrom) continue;
        const vendor = list.vendorFrom === undefined ? '' : `, ${list.vendorFrom}+`;
        out.push(make('enum-not-in-adcom-list', 'E', 'INFO',
          entry.path, `${spec(node.kind)}, AdCOM 1.0 List: ${list.name}`,
          `${value} is not in AdCOM 1.0 List: ${list.name} (${summarise(list.values)}${vendor}).`));
      }
    }
  }
  return out;
};

/** "1-23" for a contiguous run, otherwise "1, 2, 3". */
function summarise(values: number[]): string {
  const contiguous = values.every((v, i) => i === 0 || v === values[i - 1] + 1);
  return contiguous && values.length > 3
    ? `${values[0]}-${values[values.length - 1]}`
    : values.join(', ');
}

export const enumChecks: Check[] = [
  atValueUndefined,
  enumNotInAdcomList,
];
