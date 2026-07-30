/**
 * Category P - privacy signals contradicted by the identifiers actually
 * carried in the request.
 *
 * PLAN.md checks: gdpr-without-consent, coppa-with-user-data,
 * tracking-limited-but-ids-sent.
 *
 * Severity note: these are the one place where ERROR is not backed by a
 * spec table saying "required" - the spec states the flags' meaning
 * (§3.2.3, §3.2.18, §7.5) but does not itself forbid the combination.
 * The ERROR/WARNING split below is the severity PLAN.md agreed for each
 * check, not an invented spec requirement.
 */
import type { Check, Severity } from '../types.ts';
import { asArray, asObject, make, num, present, str } from '../util.ts';

/** Device IDs that identify hardware or a platform install. §3.2.18 */
const DEVICE_ID_FIELDS = ['ifa', 'didsha1', 'didmd5', 'dpidsha1', 'dpidmd5', 'macsha1', 'macmd5'];

/** Fields carrying data about the human user. §3.2.20 */
const USER_DATA_FIELDS = ['id', 'buyeruid', 'yob', 'gender', 'keywords', 'kwarray', 'customdata'];

/** lat/lon are only sent "if they conform to the accuracy depicted in the type attribute". §3.2.19 */
function preciseGeo(device: Record<string, unknown> | undefined): string | undefined {
  const geo = asObject(device?.geo);
  if (geo === undefined || !present(geo, 'lat') || !present(geo, 'lon')) return undefined;
  const accuracy = num(geo.accuracy);
  return accuracy === undefined
    ? 'device.geo.lat/lon'
    : `device.geo.lat/lon at ${accuracy} m accuracy`;
}

/** Every identifier-bearing field present, named for the finding message. */
function identifierSignals(request: unknown): string[] {
  const root = asObject(request);
  const device = asObject(root?.device);
  const user = asObject(root?.user);
  const signals: string[] = [];
  for (const field of USER_DATA_FIELDS) if (present(user, field)) signals.push(`user.${field}`);
  if (asArray(user?.eids).length > 0) signals.push('user.eids');
  if (asArray(user?.data).length > 0) signals.push('user.data');
  for (const field of DEVICE_ID_FIELDS) if (present(device, field)) signals.push(`device.${field}`);
  const geo = preciseGeo(device);
  if (geo !== undefined) signals.push(geo);
  return signals;
}

/**
 * P/gdpr-without-consent - OpenRTB 2.6 §3.2.3 regs.gdpr 1 means the
 * request "is subject to GDPR regulations", and §3.2.20 user.consent is
 * where the TCF consent string travels. Identifiers are still being
 * passed with no consent string to authorise them.
 */
export const gdprWithoutConsent: Check = (request) => {
  const root = asObject(request);
  if (num(asObject(root?.regs)?.gdpr) !== 1) return [];
  const consent = str(asObject(root?.user)?.consent);
  if (consent !== undefined && consent !== '') return [];
  const signals = identifierSignals(request);
  if (signals.length === 0) return [];
  return [make('gdpr-without-consent', 'P', 'ERROR', 'regs.gdpr',
    'OpenRTB 2.6 §3.2.3, §3.2.20',
    `regs.gdpr is 1 but user.consent is absent, while ${signals.join(', ')} ${signals.length === 1 ? 'is' : 'are'} still passed.`)];
};

/**
 * P/coppa-with-user-data - OpenRTB 2.6 §3.2.3 regs.coppa 1 means the
 * request "is subject to the COPPA regulations established by the USA
 * FTC" (see also §7.5), yet the request carries data about the user and
 * their device.
 */
export const coppaWithUserData: Check = (request) => {
  const root = asObject(request);
  if (num(asObject(root?.regs)?.coppa) !== 1) return [];
  const signals = identifierSignals(request);
  if (signals.length === 0) return [];
  return [make('coppa-with-user-data', 'P', 'ERROR', 'regs.coppa',
    'OpenRTB 2.6 §3.2.3, §7.5',
    `regs.coppa is 1 but the request carries ${signals.join(', ')}.`)];
};

/**
 * P/tracking-limited-but-ids-sent - OpenRTB 2.6 §3.2.18: dnt 1 is "do not
 * track" and lmt 1 means "tracking must be limited per commercial
 * guidelines". Device IDs, extended IDs or precise geo are still present.
 *
 * PLAN.md severity: dnt is an explicit user signal and is reported as
 * ERROR; lmt is a commercial endorsement and is reported as WARNING.
 */
export const trackingLimitedButIdsSent: Check = (request) => {
  const root = asObject(request);
  const device = asObject(root?.device);
  const user = asObject(root?.user);
  if (device === undefined) return [];
  const dnt = num(device.dnt) === 1;
  const lmt = num(device.lmt) === 1;
  if (!dnt && !lmt) return [];

  const signals: string[] = [];
  for (const field of DEVICE_ID_FIELDS) if (present(device, field)) signals.push(`device.${field}`);
  if (asArray(user?.eids).length > 0) signals.push('user.eids');
  const geo = preciseGeo(device);
  if (geo !== undefined) signals.push(geo);
  if (signals.length === 0) return [];

  const flags = ['dnt', 'lmt'].filter((f) => (f === 'dnt' ? dnt : lmt));
  const severity: Severity = dnt ? 'ERROR' : 'WARNING';
  return [make('tracking-limited-but-ids-sent', 'P', severity,
    `device.${flags[0]}`, 'OpenRTB 2.6 §3.2.18',
    `device.${flags.join(' and device.')} ${flags.length === 1 ? 'is' : 'are'} 1 but ${signals.join(', ')} ${signals.length === 1 ? 'is' : 'are'} populated.`)];
};

export const privacyChecks: Check[] = [
  gdprWithoutConsent,
  coppaWithUserData,
  trackingLimitedButIdsSent,
];
