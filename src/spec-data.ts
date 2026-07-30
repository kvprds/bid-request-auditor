/**
 * Spec-derived reference tables. Every entry here was transcribed from
 * reference/OpenRTB-2.6.pdf and reference/AdCOM-v1.0.md - the only
 * sources of truth for field names, declared types and enum values.
 *
 * Nothing in this file encodes a judgement; the rule files do that.
 */
import { asArray, asObject, join } from './util.ts';

/** Object types defined by OpenRTB 2.6 §3.2.1 - §3.2.30. */
export type ObjectKind =
  | 'BidRequest' | 'Source' | 'Regs' | 'Imp' | 'Metric' | 'Banner' | 'Video'
  | 'Audio' | 'Native' | 'Format' | 'Pmp' | 'Deal' | 'Site' | 'App'
  | 'Publisher' | 'Content' | 'Producer' | 'Device' | 'Geo' | 'User' | 'Data'
  | 'Segment' | 'Network' | 'Channel' | 'SupplyChain' | 'SupplyChainNode'
  | 'EID' | 'UID' | 'UserAgent' | 'BrandVersion';

/** Spec section that defines each object. */
export const SECTION: Record<ObjectKind, string> = {
  BidRequest: '§3.2.1', Source: '§3.2.2', Regs: '§3.2.3', Imp: '§3.2.4',
  Metric: '§3.2.5', Banner: '§3.2.6', Video: '§3.2.7', Audio: '§3.2.8',
  Native: '§3.2.9', Format: '§3.2.10', Pmp: '§3.2.11', Deal: '§3.2.12',
  Site: '§3.2.13', App: '§3.2.14', Publisher: '§3.2.15', Content: '§3.2.16',
  Producer: '§3.2.17', Device: '§3.2.18', Geo: '§3.2.19', User: '§3.2.20',
  Data: '§3.2.21', Segment: '§3.2.22', Network: '§3.2.23', Channel: '§3.2.24',
  SupplyChain: '§3.2.25', SupplyChainNode: '§3.2.26', EID: '§3.2.27',
  UID: '§3.2.28', UserAgent: '§3.2.29', BrandVersion: '§3.2.30',
};

export function spec(kind: ObjectKind): string {
  return `OpenRTB 2.6 ${SECTION[kind]}`;
}

/**
 * Fields whose spec table entry literally reads "required". Nothing else
 * may be reported as a missing-field ERROR (CLAUDE.md).
 */
export const REQUIRED_FIELDS: Partial<Record<ObjectKind, string[]>> = {
  BidRequest: ['id', 'imp'],       // "string; required" / "object array; required"
  Imp: ['id'],                     // "string; required"
  Metric: ['type', 'value'],       // "string; required" / "float; required"
  Video: ['mimes'],                // "string array; required"
  Audio: ['mimes'],                // "string array; required"
  Native: ['request'],             // "string; required"
  Deal: ['id'],                    // "string; required"
  SupplyChain: ['complete', 'nodes', 'ver'],
  SupplyChainNode: ['asi', 'sid'], // both "string; required"
  BrandVersion: ['brand'],         // "string; required"
};

/**
 * Complete field inventory per object. Used only to classify a field as
 * unknown; per §2.6 that is never worse than INFO.
 */
export const FIELDS: Record<ObjectKind, string[]> = {
  BidRequest: ['id', 'imp', 'site', 'app', 'device', 'user', 'test', 'at', 'tmax',
    'wseat', 'bseat', 'allimps', 'cur', 'wlang', 'wlangb', 'bcat', 'cattax',
    'badv', 'bapp', 'source', 'regs', 'ext'],
  Source: ['fd', 'tid', 'pchain', 'schain', 'ext'],
  Regs: ['coppa', 'gdpr', 'us_privacy', 'ext'],
  Imp: ['id', 'metric', 'banner', 'video', 'audio', 'native', 'pmp',
    'displaymanager', 'displaymanagerver', 'instl', 'tagid', 'bidfloor',
    'bidfloorcur', 'clickbrowser', 'secure', 'iframebuster', 'rwdd', 'ssai',
    'exp', 'ext'],
  Metric: ['type', 'value', 'vendor', 'ext'],
  Banner: ['format', 'w', 'h', 'btype', 'battr', 'pos', 'mimes', 'topframe',
    'expdir', 'api', 'id', 'vcm', 'ext'],
  Video: ['mimes', 'minduration', 'maxduration', 'startdelay', 'maxseq', 'poddur',
    'protocols', 'w', 'h', 'podid', 'podseq', 'rqddurs', 'placement', 'linearity',
    'skip', 'skipmin', 'skipafter', 'sequence', 'slotinpod', 'mincpmpersec',
    'battr', 'maxextended', 'minbitrate', 'maxbitrate', 'boxingallowed',
    'playbackmethod', 'playbackend', 'delivery', 'pos', 'companionad', 'api',
    'companiontype', 'ext'],
  Audio: ['mimes', 'minduration', 'maxduration', 'poddur', 'protocols',
    'startdelay', 'rqddurs', 'podid', 'podseq', 'sequence', 'slotinpod',
    'mincpmpersec', 'battr', 'maxextended', 'minbitrate', 'maxbitrate',
    'delivery', 'companionad', 'api', 'companiontype', 'maxseq', 'feed',
    'stitched', 'nvol', 'ext'],
  Native: ['request', 'ver', 'api', 'battr', 'ext'],
  Format: ['w', 'h', 'wratio', 'hratio', 'wmin', 'ext'],
  Pmp: ['private_auction', 'deals', 'ext'],
  Deal: ['id', 'bidfloor', 'bidfloorcur', 'at', 'wseat', 'wadomain', 'ext'],
  Site: ['id', 'name', 'domain', 'cattax', 'cat', 'sectioncat', 'pagecat', 'page',
    'ref', 'search', 'mobile', 'privacypolicy', 'publisher', 'content',
    'keywords', 'kwarray', 'ext'],
  App: ['id', 'name', 'bundle', 'domain', 'storeurl', 'cattax', 'cat',
    'sectioncat', 'pagecat', 'ver', 'privacypolicy', 'paid', 'publisher',
    'content', 'keywords', 'kwarray', 'ext'],
  Publisher: ['id', 'name', 'cattax', 'cat', 'domain', 'ext'],
  Content: ['id', 'episode', 'title', 'series', 'season', 'artist', 'genre',
    'album', 'isrc', 'producer', 'url', 'cattax', 'cat', 'prodq', 'context',
    'contentrating', 'userrating', 'qagmediarating', 'keywords', 'kwarray',
    'livestream', 'sourcerelationship', 'len', 'language', 'langb', 'embeddable',
    'data', 'network', 'channel', 'ext'],
  Producer: ['id', 'name', 'cattax', 'cat', 'domain', 'ext'],
  Device: ['geo', 'dnt', 'lmt', 'ua', 'sua', 'ip', 'ipv6', 'devicetype', 'make',
    'model', 'os', 'osv', 'hwv', 'h', 'w', 'ppi', 'pxratio', 'js', 'geofetch',
    'flashver', 'language', 'langb', 'carrier', 'mccmnc', 'connectiontype', 'ifa',
    'didsha1', 'didmd5', 'dpidsha1', 'dpidmd5', 'macsha1', 'macmd5', 'ext'],
  Geo: ['lat', 'lon', 'type', 'accuracy', 'lastfix', 'ipservice', 'country',
    'region', 'regionfips104', 'metro', 'city', 'zip', 'utcoffset', 'ext'],
  User: ['id', 'buyeruid', 'yob', 'gender', 'keywords', 'kwarray', 'customdata',
    'geo', 'data', 'consent', 'eids', 'ext'],
  Data: ['id', 'name', 'segment', 'ext'],
  Segment: ['id', 'name', 'value', 'ext'],
  Network: ['id', 'name', 'domain', 'ext'],
  Channel: ['id', 'name', 'domain', 'ext'],
  SupplyChain: ['complete', 'nodes', 'ver', 'ext'],
  SupplyChainNode: ['asi', 'sid', 'rid', 'name', 'domain', 'hp', 'ext'],
  EID: ['source', 'uids', 'ext'],
  UID: ['id', 'atype', 'ext'],
  UserAgent: ['browsers', 'platform', 'mobile', 'architecture', 'bitness',
    'model', 'source', 'ext'],
  BrandVersion: ['brand', 'version', 'ext'],
};

export type JsonType =
  | 'string' | 'integer' | 'float' | 'object'
  | 'string[]' | 'integer[]' | 'object[]';

/**
 * Declared JSON type per field. Transcribed from the Type column of each
 * spec table. Note Video.podid / Audio.podid: Appendix B records that the
 * July 2022 revision corrected these to string ("the specification was
 * incorrectly labeled integer").
 */
export const FIELD_TYPES: Record<ObjectKind, Record<string, JsonType>> = {
  BidRequest: {
    id: 'string', imp: 'object[]', site: 'object', app: 'object',
    device: 'object', user: 'object', test: 'integer', at: 'integer',
    tmax: 'integer', wseat: 'string[]', bseat: 'string[]', allimps: 'integer',
    cur: 'string[]', wlang: 'string[]', wlangb: 'string[]', bcat: 'string[]',
    cattax: 'integer', badv: 'string[]', bapp: 'string[]', source: 'object',
    regs: 'object', ext: 'object',
  },
  Source: { fd: 'integer', tid: 'string', pchain: 'string', schain: 'object', ext: 'object' },
  Regs: { coppa: 'integer', gdpr: 'integer', us_privacy: 'string', ext: 'object' },
  Imp: {
    id: 'string', metric: 'object[]', banner: 'object', video: 'object',
    audio: 'object', native: 'object', pmp: 'object', displaymanager: 'string',
    displaymanagerver: 'string', instl: 'integer', tagid: 'string',
    bidfloor: 'float', bidfloorcur: 'string', clickbrowser: 'integer',
    secure: 'integer', iframebuster: 'string[]', rwdd: 'integer',
    ssai: 'integer', exp: 'integer', ext: 'object',
  },
  Metric: { type: 'string', value: 'float', vendor: 'string', ext: 'object' },
  Banner: {
    format: 'object[]', w: 'integer', h: 'integer', btype: 'integer[]',
    battr: 'integer[]', pos: 'integer', mimes: 'string[]', topframe: 'integer',
    expdir: 'integer[]', api: 'integer[]', id: 'string', vcm: 'integer',
    ext: 'object',
  },
  Video: {
    mimes: 'string[]', minduration: 'integer', maxduration: 'integer',
    startdelay: 'integer', maxseq: 'integer', poddur: 'integer',
    protocols: 'integer[]', w: 'integer', h: 'integer', podid: 'string',
    podseq: 'integer', rqddurs: 'integer[]', placement: 'integer',
    linearity: 'integer', skip: 'integer', skipmin: 'integer',
    skipafter: 'integer', sequence: 'integer', slotinpod: 'integer',
    mincpmpersec: 'float', battr: 'integer[]', maxextended: 'integer',
    minbitrate: 'integer', maxbitrate: 'integer', boxingallowed: 'integer',
    playbackmethod: 'integer[]', playbackend: 'integer', delivery: 'integer[]',
    pos: 'integer', companionad: 'object[]', api: 'integer[]',
    companiontype: 'integer[]', ext: 'object',
  },
  Audio: {
    mimes: 'string[]', minduration: 'integer', maxduration: 'integer',
    poddur: 'integer', protocols: 'integer[]', startdelay: 'integer',
    rqddurs: 'integer[]', podid: 'string', podseq: 'integer',
    sequence: 'integer', slotinpod: 'integer', mincpmpersec: 'float',
    battr: 'integer[]', maxextended: 'integer', minbitrate: 'integer',
    maxbitrate: 'integer', delivery: 'integer[]', companionad: 'object[]',
    api: 'integer[]', companiontype: 'integer[]', maxseq: 'integer',
    feed: 'integer', stitched: 'integer', nvol: 'integer', ext: 'object',
  },
  Native: { request: 'string', ver: 'string', api: 'integer[]', battr: 'integer[]', ext: 'object' },
  Format: { w: 'integer', h: 'integer', wratio: 'integer', hratio: 'integer', wmin: 'integer', ext: 'object' },
  Pmp: { private_auction: 'integer', deals: 'object[]', ext: 'object' },
  Deal: {
    id: 'string', bidfloor: 'float', bidfloorcur: 'string', at: 'integer',
    wseat: 'string[]', wadomain: 'string[]', ext: 'object',
  },
  Site: {
    id: 'string', name: 'string', domain: 'string', cattax: 'integer',
    cat: 'string[]', sectioncat: 'string[]', pagecat: 'string[]', page: 'string',
    ref: 'string', search: 'string', mobile: 'integer', privacypolicy: 'integer',
    publisher: 'object', content: 'object', keywords: 'string',
    kwarray: 'string[]', ext: 'object',
  },
  App: {
    id: 'string', name: 'string', bundle: 'string', domain: 'string',
    storeurl: 'string', cattax: 'integer', cat: 'string[]',
    sectioncat: 'string[]', pagecat: 'string[]', ver: 'string',
    privacypolicy: 'integer', paid: 'integer', publisher: 'object',
    content: 'object', keywords: 'string', kwarray: 'string[]', ext: 'object',
  },
  Publisher: { id: 'string', name: 'string', cattax: 'integer', cat: 'string[]', domain: 'string', ext: 'object' },
  Content: {
    id: 'string', episode: 'integer', title: 'string', series: 'string',
    season: 'string', artist: 'string', genre: 'string', album: 'string',
    isrc: 'string', producer: 'object', url: 'string', cattax: 'integer',
    cat: 'string[]', prodq: 'integer', context: 'integer',
    contentrating: 'string', userrating: 'string', qagmediarating: 'integer',
    keywords: 'string', kwarray: 'string[]', livestream: 'integer',
    sourcerelationship: 'integer', len: 'integer', language: 'string',
    langb: 'string', embeddable: 'integer', data: 'object[]',
    network: 'object', channel: 'object', ext: 'object',
  },
  Producer: { id: 'string', name: 'string', cattax: 'integer', cat: 'string[]', domain: 'string', ext: 'object' },
  Device: {
    geo: 'object', dnt: 'integer', lmt: 'integer', ua: 'string', sua: 'object',
    ip: 'string', ipv6: 'string', devicetype: 'integer', make: 'string',
    model: 'string', os: 'string', osv: 'string', hwv: 'string', h: 'integer',
    w: 'integer', ppi: 'integer', pxratio: 'float', js: 'integer',
    geofetch: 'integer', flashver: 'string', language: 'string',
    langb: 'string', carrier: 'string', mccmnc: 'string',
    connectiontype: 'integer', ifa: 'string', didsha1: 'string',
    didmd5: 'string', dpidsha1: 'string', dpidmd5: 'string', macsha1: 'string',
    macmd5: 'string', ext: 'object',
  },
  Geo: {
    lat: 'float', lon: 'float', type: 'integer', accuracy: 'integer',
    lastfix: 'integer', ipservice: 'integer', country: 'string',
    region: 'string', regionfips104: 'string', metro: 'string', city: 'string',
    zip: 'string', utcoffset: 'integer', ext: 'object',
  },
  User: {
    id: 'string', buyeruid: 'string', yob: 'integer', gender: 'string',
    keywords: 'string', kwarray: 'string[]', customdata: 'string',
    geo: 'object', data: 'object[]', consent: 'string', eids: 'object[]',
    ext: 'object',
  },
  Data: { id: 'string', name: 'string', segment: 'object[]', ext: 'object' },
  Segment: { id: 'string', name: 'string', value: 'string', ext: 'object' },
  Network: { id: 'string', name: 'string', domain: 'string', ext: 'object' },
  Channel: { id: 'string', name: 'string', domain: 'string', ext: 'object' },
  SupplyChain: { complete: 'integer', nodes: 'object[]', ver: 'string', ext: 'object' },
  SupplyChainNode: {
    asi: 'string', sid: 'string', rid: 'string', name: 'string',
    domain: 'string', hp: 'integer', ext: 'object',
  },
  EID: { source: 'string', uids: 'object[]', ext: 'object' },
  UID: { id: 'string', atype: 'integer', ext: 'object' },
  UserAgent: {
    browsers: 'object[]', platform: 'object', mobile: 'integer',
    architecture: 'string', bitness: 'string', model: 'string',
    source: 'integer', ext: 'object',
  },
  BrandVersion: { brand: 'string', version: 'string[]', ext: 'object' },
};

/** Subordinate objects, so the walk knows each child's object kind. */
const CHILDREN: Partial<Record<ObjectKind, Record<string, { kind: ObjectKind; array?: true }>>> = {
  BidRequest: {
    imp: { kind: 'Imp', array: true }, site: { kind: 'Site' }, app: { kind: 'App' },
    device: { kind: 'Device' }, user: { kind: 'User' }, source: { kind: 'Source' },
    regs: { kind: 'Regs' },
  },
  Imp: {
    metric: { kind: 'Metric', array: true }, banner: { kind: 'Banner' },
    video: { kind: 'Video' }, audio: { kind: 'Audio' },
    native: { kind: 'Native' }, pmp: { kind: 'Pmp' },
  },
  Banner: { format: { kind: 'Format', array: true } },
  Video: { companionad: { kind: 'Banner', array: true } },
  Audio: { companionad: { kind: 'Banner', array: true } },
  Pmp: { deals: { kind: 'Deal', array: true } },
  Site: { publisher: { kind: 'Publisher' }, content: { kind: 'Content' } },
  App: { publisher: { kind: 'Publisher' }, content: { kind: 'Content' } },
  Content: {
    producer: { kind: 'Producer' }, data: { kind: 'Data', array: true },
    network: { kind: 'Network' }, channel: { kind: 'Channel' },
  },
  Data: { segment: { kind: 'Segment', array: true } },
  Device: { geo: { kind: 'Geo' }, sua: { kind: 'UserAgent' } },
  UserAgent: { browsers: { kind: 'BrandVersion', array: true }, platform: { kind: 'BrandVersion' } },
  User: {
    geo: { kind: 'Geo' }, data: { kind: 'Data', array: true },
    eids: { kind: 'EID', array: true },
  },
  EID: { uids: { kind: 'UID', array: true } },
  Source: { schain: { kind: 'SupplyChain' } },
  SupplyChain: { nodes: { kind: 'SupplyChainNode', array: true } },
};

export interface SpecNode {
  kind: ObjectKind;
  obj: Record<string, unknown>;
  /** "" for the request root, otherwise e.g. "imp[0].video". */
  path: string;
}

/**
 * Every spec-defined object present in the request, depth first. ext
 * subtrees are never entered: §3.2.x describe ext as a placeholder for
 * extensions, so its contents are outside the spec's field inventory.
 */
export function walk(request: unknown): SpecNode[] {
  const out: SpecNode[] = [];
  const visit = (kind: ObjectKind, value: unknown, path: string): void => {
    const obj = asObject(value);
    if (obj === undefined) return;
    out.push({ kind, obj, path });
    const children = CHILDREN[kind];
    if (children === undefined) return;
    for (const field of Object.keys(children)) {
      const child = children[field];
      if (child.array === true) {
        asArray(obj[field]).forEach((el, i) => visit(child.kind, el, `${join(path, field)}[${i}]`));
      } else {
        visit(child.kind, obj[field], join(path, field));
      }
    }
  };
  visit('BidRequest', request, '');
  return out;
}

/** An AdCOM 1.0 enumerated list: allowed values plus any vendor range. */
export interface AdcomList {
  /** List name as it appears in AdCOM 1.0. */
  name: string;
  values: number[];
  /** Lowest vendor-specific value, when the list defines a "500+" row. */
  vendorFrom?: number;
}

function range(from: number, to: number): number[] {
  const out: number[] = [];
  for (let v = from; v <= to; v += 1) out.push(v);
  return out;
}

const CREATIVE_ATTRIBUTES: AdcomList = { name: 'Creative Attributes', values: range(1, 23), vendorFrom: 500 };
const API_FRAMEWORKS: AdcomList = { name: 'API Frameworks', values: range(1, 9), vendorFrom: 500 };
const AGENT_TYPES: AdcomList = { name: 'Agent Types', values: [1, 2, 3], vendorFrom: 500 };
const PLACEMENT_POSITIONS: AdcomList = { name: 'Placement Positions', values: range(0, 17) };
const CREATIVE_SUBTYPES_AV: AdcomList = { name: 'Creative Subtypes - Audio/Video', values: range(1, 16) };
const COMPANION_TYPES: AdcomList = { name: 'Companion Types', values: [1, 2, 3] };
const DEVICE_TYPES: AdcomList = { name: 'Device Types', values: range(1, 8) };
const LOCATION_TYPES: AdcomList = { name: 'Location Types', values: [1, 2, 3] };
const LINEARITY_MODES: AdcomList = { name: 'Linearity Modes', values: [1, 2] };
const POD_SEQUENCE: AdcomList = { name: 'Pod Sequence', values: [-1, 0, 1] };
const SLOT_IN_POD: AdcomList = { name: 'Slot Position in Pod', values: [-1, 0, 1, 2] };

/**
 * Fields whose OpenRTB 2.6 entry says "Refer to List: X in AdCOM 1.0"
 * and for which AdCOM 1.0 publishes a value table. Video.placement is
 * deliberately absent: AdCOM deprecated List: Placement Subtypes - Video
 * and no longer publishes values for it, so there is nothing to check
 * against.
 */
export const ADCOM_ENUM_FIELDS: Record<string, AdcomList> = {
  'Banner.battr': CREATIVE_ATTRIBUTES,
  'Video.battr': CREATIVE_ATTRIBUTES,
  'Audio.battr': CREATIVE_ATTRIBUTES,
  'Native.battr': CREATIVE_ATTRIBUTES,
  'Banner.api': API_FRAMEWORKS,
  'Video.api': API_FRAMEWORKS,
  'Audio.api': API_FRAMEWORKS,
  'Native.api': API_FRAMEWORKS,
  'UID.atype': AGENT_TYPES,
  'Banner.pos': PLACEMENT_POSITIONS,
  'Video.pos': PLACEMENT_POSITIONS,
  'Video.protocols': CREATIVE_SUBTYPES_AV,
  'Audio.protocols': CREATIVE_SUBTYPES_AV,
  'Video.companiontype': COMPANION_TYPES,
  'Audio.companiontype': COMPANION_TYPES,
  'Device.devicetype': DEVICE_TYPES,
  'Geo.type': LOCATION_TYPES,
  'Video.linearity': LINEARITY_MODES,
  'Video.podseq': POD_SEQUENCE,
  'Audio.podseq': POD_SEQUENCE,
  'Video.slotinpod': SLOT_IN_POD,
  'Audio.slotinpod': SLOT_IN_POD,
};

/**
 * Coarse device families, used to compare device.devicetype against the
 * user-agent string. Values from AdCOM 1.0 List: Device Types.
 */
export type DeviceFamily = 'mobile' | 'desktop' | 'tv' | 'ooh';

export const DEVICE_TYPE_FAMILY: Record<number, DeviceFamily> = {
  1: 'mobile',   // Mobile/Tablet - General
  2: 'desktop',  // Personal Computer
  3: 'tv',       // Connected TV
  4: 'mobile',   // Phone
  5: 'mobile',   // Tablet
  6: 'tv',       // Connected Device
  7: 'tv',       // Set Top Box
  8: 'ooh',      // OOH Device
};
