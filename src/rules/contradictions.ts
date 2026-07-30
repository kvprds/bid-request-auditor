/**
 * Category C - internal contradictions. Each request is individually
 * well-formed against its field definitions, but two fields cannot both
 * be true of the same impression.
 *
 * PLAN.md checks: schain-complete-single-node, bidfloorcur-not-in-cur,
 * duration-min-gt-max, skip-params-without-skip, devicetype-vs-ua,
 * secure-vs-http-page.
 */
import type { Check, Finding } from '../types.ts';
import {
  asArray, asObject, imps, join, make, num, present, str, streamMedia,
} from '../util.ts';
import type { DeviceFamily } from '../spec-data.ts';
import { DEVICE_TYPE_FAMILY, SECTION, spec, walk } from '../spec-data.ts';

/**
 * C/schain-complete-single-node - OpenRTB 2.6 §3.2.25: in a complete
 * chain "the first node represents ... the owner of the site, app, or
 * other medium" and "the last node represents the entity sending this bid
 * request". With one node those are the same entity, which claims the
 * sender is also the publisher.
 */
export const schainCompleteSingleNode: Check = (request) => {
  const out: Finding[] = [];
  for (const node of walk(request)) {
    if (node.kind !== 'SupplyChain') continue;
    if (num(node.obj.complete) !== 1) continue;
    const nodes = asArray(node.obj.nodes);
    if (nodes.length !== 1) continue;
    const asi = str(asObject(nodes[0])?.asi) ?? '(no asi)';
    out.push(make('schain-complete-single-node', 'C', 'WARNING',
      join(node.path, 'nodes'), 'OpenRTB 2.6 §3.2.25',
      `complete is 1 but the chain has a single node ("${asi}"); in a complete chain the first node is the inventory owner and the last is the sender, so this claims the sender is the publisher.`));
  }
  return out;
};

/**
 * C/bidfloorcur-not-in-cur - OpenRTB 2.6 §3.2.1 cur is the "Array of
 * allowed currencies for bids on this bid request"; §3.2.4 bidfloorcur
 * prices the floor. A floor in a currency no bidder may bid in cannot be
 * satisfied. (§3.2.12 deals carry their own bidfloorcur.)
 */
export const bidfloorcurNotInCur: Check = (request) => {
  const cur = asArray(asObject(request)?.cur)
    .map((c) => str(c)?.toUpperCase())
    .filter((c): c is string => c !== undefined);
  if (cur.length === 0) return [];
  const out: Finding[] = [];
  for (const node of walk(request)) {
    if (node.kind !== 'Imp' && node.kind !== 'Deal') continue;
    const floorCur = str(node.obj.bidfloorcur);
    if (floorCur === undefined || cur.includes(floorCur.toUpperCase())) continue;
    out.push(make('bidfloorcur-not-in-cur', 'C', 'WARNING',
      join(node.path, 'bidfloorcur'), `${spec(node.kind)}, ${SECTION.BidRequest}`,
      `bidfloorcur is "${floorCur}" but cur allows only ${cur.join(', ')}; the floor is priced in a currency no bidder may use.`));
  }
  return out;
};

/**
 * C/duration-min-gt-max - OpenRTB 2.6 §3.2.7 / §3.2.8: minduration is the
 * minimum and maxduration the maximum ad duration. When min exceeds max,
 * no creative duration can satisfy both.
 */
export const durationMinGtMax: Check = (request) => {
  const out: Finding[] = [];
  for (const { imp, path } of imps(request)) {
    for (const { media, path: mediaPath, section } of streamMedia(imp, path)) {
      const min = num(media.minduration);
      const max = num(media.maxduration);
      if (min === undefined || max === undefined || min <= max) continue;
      out.push(make('duration-min-gt-max', 'C', 'WARNING',
        mediaPath, `OpenRTB 2.6 ${section}`,
        `minduration ${min} is greater than maxduration ${max}; no creative can satisfy both.`));
    }
  }
  return out;
};

/**
 * C/skip-params-without-skip - OpenRTB 2.6 §3.2.7 marks skipmin and
 * skipafter "only applicable if the ad is skippable", and §7.4 reads a
 * skip of 1 as the publisher imposing a skip button. Skip tuning
 * alongside skip 0 (or an absent skip) describes an ad that cannot be
 * skipped.
 */
export const skipParamsWithoutSkip: Check = (request) => {
  const out: Finding[] = [];
  for (const { imp, path } of imps(request)) {
    const video = asObject(imp.video);
    if (video === undefined) continue;
    const params = ['skipmin', 'skipafter'].filter((f) => present(video, f));
    if (params.length === 0 || num(video.skip) === 1) continue;
    const skip = present(video, 'skip') ? `skip is ${JSON.stringify(video.skip)}` : 'skip is absent';
    out.push(make('skip-params-without-skip', 'C', 'WARNING',
      join(path, 'video'), 'OpenRTB 2.6 §3.2.7, §7.4',
      `${skip} but ${params.join(' and ')} ${params.length === 1 ? 'is' : 'are'} set; both apply only if the ad is skippable.`));
  }
  return out;
};

/**
 * Coarse device family implied by a user-agent string. Order matters:
 * mobile UAs routinely mention "Mac OS X". An unrecognised UA yields
 * undefined so the check stays silent rather than guessing.
 */
function uaFamily(ua: string): DeviceFamily | undefined {
  if (/(Roku|AppleTV|tvOS|SmartTV|SMART-TV|GoogleTV|Web0S|WebOS|Tizen|HbbTV|BRAVIA|CrKey|AFTB|AFTM|AFTT)/i.test(ua)) return 'tv';
  if (/(iPhone|iPod|iPad|Android|Windows Phone|BlackBerry|Opera Mini)/i.test(ua)) return 'mobile';
  if (/(Windows NT|Macintosh|Mac OS X|X11|CrOS)/i.test(ua)) return 'desktop';
  return undefined;
}

/**
 * C/devicetype-vs-ua - device.devicetype names an AdCOM 1.0 Device Types
 * value (OpenRTB 2.6 §3.2.18) that disagrees with the device family the
 * raw user agent describes. INFO: user agents can be frozen or reduced
 * (§3.2.18), so this is a signal, not a violation.
 */
export const devicetypeVsUa: Check = (request) => {
  const device = asObject(asObject(request)?.device);
  const ua = str(device?.ua);
  const devicetype = num(device?.devicetype);
  if (device === undefined || ua === undefined || devicetype === undefined) return [];
  const declared = DEVICE_TYPE_FAMILY[devicetype];
  const implied = uaFamily(ua);
  if (declared === undefined || implied === undefined || declared === implied) return [];
  const context = present(asObject(request), 'app') ? ' The request also carries an app object.' : '';
  return [make('devicetype-vs-ua', 'C', 'INFO', 'device.devicetype',
    'OpenRTB 2.6 §3.2.18, AdCOM 1.0 List: Device Types',
    `devicetype ${devicetype} is ${declared} but device.ua describes a ${implied} device ("${ua}").${context}`)];
};

/**
 * C/secure-vs-http-page - OpenRTB 2.6 §3.2.4: secure 1 means "the
 * impression requires secure HTTPS URL creative assets and markup", yet
 * site.page (§3.2.13) is plain http, so the page itself is not secure.
 */
export const secureVsHttpPage: Check = (request) => {
  const page = str(asObject(asObject(request)?.site)?.page);
  if (page === undefined || !/^http:\/\//i.test(page)) return [];
  const out: Finding[] = [];
  for (const { imp, path } of imps(request)) {
    if (num(imp.secure) !== 1) continue;
    out.push(make('secure-vs-http-page', 'C', 'INFO',
      join(path, 'secure'), 'OpenRTB 2.6 §3.2.4, §3.2.13',
      `secure is 1 (HTTPS assets required) but site.page is served over http ("${page}").`));
  }
  return out;
};

export const contradictionChecks: Check[] = [
  schainCompleteSingleNode,
  bidfloorcurNotInCur,
  durationMinGtMax,
  skipParamsWithoutSkip,
  devicetypeVsUa,
  secureVsHttpPage,
];
