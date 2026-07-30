/**
 * Category S - spec conformance.
 *
 * PLAN.md checks: missing-required-field, site-and-app-both,
 * video-rqddurs-exclusive, wseat-bseat-both, wrong-json-type,
 * geo-country-not-alpha3, keywords-kwarray-both, wlang-wlangb-both,
 * schain-hp-not-1, unknown-field.
 */
import type { Check, Finding } from '../types.ts';
import { asArray, asObject, isObject, join, make, num, present, str } from '../util.ts';
import type { JsonType, ObjectKind } from '../spec-data.ts';
import {
  FIELDS, FIELD_TYPES, REQUIRED_FIELDS, spec, walk,
} from '../spec-data.ts';

/**
 * S/missing-required-field - a field the spec table literally marks
 * "required" is absent. Per CLAUDE.md this is the only shape of missing
 * field that may be an ERROR.
 * OpenRTB 2.6 §3.2.1, §3.2.4, §3.2.5, §3.2.7, §3.2.8, §3.2.9, §3.2.12,
 * §3.2.25, §3.2.26, §3.2.30
 */
export const missingRequiredField: Check = (request) => {
  const out: Finding[] = [];
  for (const node of walk(request)) {
    for (const field of REQUIRED_FIELDS[node.kind] ?? []) {
      if (!present(node.obj, field)) {
        out.push(make('missing-required-field', 'S', 'ERROR',
          join(node.path, field), spec(node.kind),
          `${node.kind}.${field} is declared "required" but is absent.`));
        continue;
      }
      // OpenRTB 2.6 §3.2.1: "At least 1 Imp object is required."
      if (node.kind === 'BidRequest' && field === 'imp'
        && Array.isArray(node.obj.imp) && node.obj.imp.length === 0) {
        out.push(make('missing-required-field', 'S', 'ERROR',
          join(node.path, field), spec('BidRequest'),
          'imp is present but empty; at least 1 Imp object is required.'));
      }
    }
  }
  return out;
};

/**
 * S/site-and-app-both - OpenRTB 2.6 §3.2.13: "A bid request must not
 * contain both a Site and an App object." (Restated in §3.2.14.)
 */
export const siteAndAppBoth: Check = (request) => {
  const root = asObject(request);
  if (!present(root, 'site') || !present(root, 'app')) return [];
  return [make('site-and-app-both', 'S', 'ERROR', 'site + app',
    'OpenRTB 2.6 §3.2.13',
    'Both site and app are present at the top level; a bid request must not contain both.')];
};

/**
 * S/video-rqddurs-exclusive - OpenRTB 2.6 §3.2.7: "if rqddurs is
 * specified, minduration and maxduration must not be specified and vice
 * versa." §3.2.8 states the same for Audio.
 */
export const videoRqddursExclusive: Check = (request) => {
  const out: Finding[] = [];
  for (const node of walk(request)) {
    if (node.kind !== 'Video' && node.kind !== 'Audio') continue;
    if (!present(node.obj, 'rqddurs')) continue;
    const clashing = ['minduration', 'maxduration'].filter((f) => present(node.obj, f));
    if (clashing.length === 0) continue;
    out.push(make('video-rqddurs-exclusive', 'S', 'ERROR',
      join(node.path, 'rqddurs'), spec(node.kind),
      `rqddurs is mutually exclusive with ${clashing.join(' and ')}; all are present.`));
  }
  return out;
};

/**
 * S/wseat-bseat-both - OpenRTB 2.6 §3.2.1: "At most, only one of wseat
 * and bseat should be used in the same request." "Should", so WARNING.
 */
export const wseatBseatBoth: Check = (request) => {
  const root = asObject(request);
  if (!present(root, 'wseat') || !present(root, 'bseat')) return [];
  return [make('wseat-bseat-both', 'S', 'WARNING', 'wseat + bseat',
    'OpenRTB 2.6 §3.2.1',
    'Both wseat and bseat are present; at most one should be used in the same request.')];
};

function matchesType(value: unknown, expected: JsonType): boolean {
  switch (expected) {
    case 'string': return typeof value === 'string';
    case 'integer': return typeof value === 'number' && Number.isInteger(value);
    case 'float': return typeof value === 'number' && Number.isFinite(value);
    case 'object': return isObject(value);
    case 'string[]': return Array.isArray(value) && value.every((v) => typeof v === 'string');
    case 'integer[]': return Array.isArray(value)
      && value.every((v) => typeof v === 'number' && Number.isInteger(v));
    case 'object[]': return Array.isArray(value) && value.every(isObject);
    default: return true;
  }
}

function describe(value: unknown): string {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'float';
  return typeof value;
}

/**
 * S/wrong-json-type - a field carries a JSON type other than the one its
 * spec table declares. Types come from the Type column of §3.2.1-§3.2.30;
 * for Video.podid / Audio.podid, Appendix B records the July 2022
 * correction to string ("the specification was incorrectly labeled
 * integer").
 */
export const wrongJsonType: Check = (request) => {
  const out: Finding[] = [];
  for (const node of walk(request)) {
    const types = FIELD_TYPES[node.kind];
    for (const field of Object.keys(node.obj)) {
      const expected: JsonType | undefined = types[field];
      if (expected === undefined) continue;      // unknown field: reported by unknownField
      const value = node.obj[field];
      if (value === null || value === undefined) continue;
      if (matchesType(value, expected)) continue;
      out.push(make('wrong-json-type', 'S', 'WARNING',
        join(node.path, field), spec(node.kind),
        `${node.kind}.${field} is declared ${expected} but carries ${describe(value)}.`));
    }
  }
  return out;
};

/**
 * S/geo-country-not-alpha3 - OpenRTB 2.6 §3.2.19: "Country code using
 * ISO-3166-1-alpha-3." A 2-letter code (alpha-2) is the common mistake.
 */
export const geoCountryNotAlpha3: Check = (request) => {
  const out: Finding[] = [];
  for (const node of walk(request)) {
    if (node.kind !== 'Geo') continue;
    const country = str(node.obj.country);
    if (country === undefined || /^[A-Za-z]{3}$/.test(country)) continue;
    out.push(make('geo-country-not-alpha3', 'S', 'WARNING',
      join(node.path, 'country'), 'OpenRTB 2.6 §3.2.19',
      `country is "${country}"; ISO-3166-1-alpha-3 is required (e.g. "USA", not "US").`));
  }
  return out;
};

/**
 * S/keywords-kwarray-both - OpenRTB 2.6 §3.2.13, §3.2.14, §3.2.16,
 * §3.2.20: "Only one of 'keywords' or 'kwarray' may be present."
 */
export const keywordsKwarrayBoth: Check = (request) => {
  const out: Finding[] = [];
  const kinds: ObjectKind[] = ['Site', 'App', 'Content', 'User'];
  for (const node of walk(request)) {
    if (!kinds.includes(node.kind)) continue;
    if (!present(node.obj, 'keywords') || !present(node.obj, 'kwarray')) continue;
    out.push(make('keywords-kwarray-both', 'S', 'WARNING',
      `${join(node.path, 'keywords')} + ${join(node.path, 'kwarray')}`, spec(node.kind),
      'Both keywords and kwarray are present; only one may be present.'));
  }
  return out;
};

/**
 * S/wlang-wlangb-both - OpenRTB 2.6 §3.2.1: "Only one of wlang or wlangb
 * should be present."
 */
export const wlangWlangbBoth: Check = (request) => {
  const root = asObject(request);
  if (!present(root, 'wlang') || !present(root, 'wlangb')) return [];
  return [make('wlang-wlangb-both', 'S', 'WARNING', 'wlang + wlangb',
    'OpenRTB 2.6 §3.2.1',
    'Both wlang and wlangb are present; only one should be present.')];
};

/**
 * S/schain-hp-not-1 - OpenRTB 2.6 §3.2.26: "For version 1.0 of
 * SupplyChain, this property should always be 1." Only checked when the
 * chain declares ver "1.0"; an absent hp is left alone.
 */
export const schainHpNot1: Check = (request) => {
  const out: Finding[] = [];
  for (const node of walk(request)) {
    if (node.kind !== 'SupplyChain') continue;
    if (str(node.obj.ver) !== '1.0') continue;
    asArray(node.obj.nodes).forEach((entry, i) => {
      const chainNode = asObject(entry);
      if (chainNode === undefined || !present(chainNode, 'hp')) return;
      if (num(chainNode.hp) === 1) return;
      out.push(make('schain-hp-not-1', 'S', 'WARNING',
        `${join(node.path, 'nodes')}[${i}].hp`, 'OpenRTB 2.6 §3.2.26',
        `hp is ${JSON.stringify(chainNode.hp)} while SupplyChain.ver is "1.0"; hp should always be 1.`));
    });
  }
  return out;
};

/**
 * S/unknown-field - a field that does not appear in OpenRTB 2.6. Never an
 * error: §2.6 requires implementers to "tolerate receiving new or
 * unexpected fields and enumerated list values gracefully, treating them
 * as unknown or ignoring them". ext subtrees are not inspected at all.
 */
export const unknownField: Check = (request) => {
  const out: Finding[] = [];
  for (const node of walk(request)) {
    const known = FIELDS[node.kind];
    for (const field of Object.keys(node.obj)) {
      if (known.includes(field)) continue;
      out.push(make('unknown-field', 'S', 'INFO',
        join(node.path, field), 'OpenRTB 2.6 §2.6',
        `${field} does not appear in OpenRTB 2.6 ${node.kind}; treat as unknown and ignore.`));
    }
  }
  return out;
};

export const specChecks: Check[] = [
  missingRequiredField,
  siteAndAppBoth,
  videoRqddursExclusive,
  wseatBseatBoth,
  wrongJsonType,
  geoCountryNotAlpha3,
  keywordsKwarrayBoth,
  wlangWlangbBoth,
  schainHpNot1,
  unknownField,
];
