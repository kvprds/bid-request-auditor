/**
 * GENERATED FILE - DO NOT EDIT.
 *
 * Built from src/*.ts by tools/build-web.mjs using Node's built-in
 * TypeScript type stripper. The rules live in src/rules/ and exist only
 * there; this file is a mechanical transcription of them for the browser.
 *
 * Regenerate after any change under src/:
 *   node tools/build-web.mjs
 *
 * Sources: src/types.ts, src/util.ts, src/spec-data.ts, src/rules/spec.ts, src/rules/enums.ts, src/rules/contradictions.ts, src/rules/privacy.ts, src/audit.ts
 * Samples: embedded from samples/*.json so the page needs no fetch().
 */
(function () {
  'use strict';

  // ---- src/types.ts ------------------------------------------------------
  /**
   * Core types for the OpenRTB 2.6 bid request auditor.
   *
   * Severity policy (CLAUDE.md): ERROR is used only where a spec table
   * literally says "required", plus the privacy contradictions PLAN.md
   * agrees are errors. "Recommended" is at most WARNING. Unknown fields
   * and unknown enum values are INFO at most - OpenRTB 2.6 §2.6.
   */

  /** PLAN.md categories: S spec - E enum - C contradiction - P privacy. */

                                                            

  /** Every check is a pure function of the parsed request. */

  // ---- src/util.ts -------------------------------------------------------
  /**
   * Generic helpers shared by the rule files. Deliberately tiny and
   * total: every accessor returns undefined or an empty array rather than
   * throwing, because audit() must never throw on malformed input.
   */

  function isObject(v         )                               {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
  }

  function asObject(v         )                                      {
    return isObject(v) ? v : undefined;
  }

  function asArray(v         )            {
    return Array.isArray(v) ? v : [];
  }

  /** JSON null is treated as absent, so "both present" checks stay honest. */
  function present(obj                                     , key        )          {
    return obj !== undefined && obj[key] !== undefined && obj[key] !== null;
  }

  function str(v         )                     {
    return typeof v === 'string' ? v : undefined;
  }

  function num(v         )                     {
    return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
  }

  /** Path segments joined for display: "imp[0]" + "video" -> "imp[0].video". */
  function join(base        , field        )         {
    return base === '' ? field : `${base}.${field}`;
  }

  function make(
    id        ,
    category          ,
    severity          ,
    path        ,
    spec        ,
    message        ,
  )          {
    return { id, category, severity, path, spec, message };
  }

  /** The Imp array with indices, skipping entries that are not objects. */
  function imps(request         )                                                        {
    const out                                                        = [];
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
  function streamMedia(
    imp                         ,
    impPath        ,
  )                                                                           {
    const out                                                                           = [];
    const video = asObject(imp.video);
    // OpenRTB 2.6 §3.2.7
    if (video) out.push({ media: video, path: join(impPath, 'video'), section: '§3.2.7' });
    const audio = asObject(imp.audio);
    // OpenRTB 2.6 §3.2.8
    if (audio) out.push({ media: audio, path: join(impPath, 'audio'), section: '§3.2.8' });
    return out;
  }

  // ---- src/spec-data.ts --------------------------------------------------
  /**
   * Spec-derived reference tables. Every entry here was transcribed from
   * reference/OpenRTB-2.6.pdf and reference/AdCOM-v1.0.md - the only
   * sources of truth for field names, declared types and enum values.
   *
   * Nothing in this file encodes a judgement; the rule files do that.
   */

  /** Object types defined by OpenRTB 2.6 §3.2.1 - §3.2.30. */

  /** Spec section that defines each object. */
  const SECTION                             = {
    BidRequest: '§3.2.1', Source: '§3.2.2', Regs: '§3.2.3', Imp: '§3.2.4',
    Metric: '§3.2.5', Banner: '§3.2.6', Video: '§3.2.7', Audio: '§3.2.8',
    Native: '§3.2.9', Format: '§3.2.10', Pmp: '§3.2.11', Deal: '§3.2.12',
    Site: '§3.2.13', App: '§3.2.14', Publisher: '§3.2.15', Content: '§3.2.16',
    Producer: '§3.2.17', Device: '§3.2.18', Geo: '§3.2.19', User: '§3.2.20',
    Data: '§3.2.21', Segment: '§3.2.22', Network: '§3.2.23', Channel: '§3.2.24',
    SupplyChain: '§3.2.25', SupplyChainNode: '§3.2.26', EID: '§3.2.27',
    UID: '§3.2.28', UserAgent: '§3.2.29', BrandVersion: '§3.2.30',
  };

  function spec(kind            )         {
    return `OpenRTB 2.6 ${SECTION[kind]}`;
  }

  /**
   * Fields whose spec table entry literally reads "required". Nothing else
   * may be reported as a missing-field ERROR (CLAUDE.md).
   */
  const REQUIRED_FIELDS                                        = {
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
  const FIELDS                               = {
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

  /**
   * Declared JSON type per field. Transcribed from the Type column of each
   * spec table. Note Video.podid / Audio.podid: Appendix B records that the
   * July 2022 revision corrected these to string ("the specification was
   * incorrectly labeled integer").
   */
  const FIELD_TYPES                                               = {
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
  const CHILDREN                                                                                  = {
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

  /**
   * Every spec-defined object present in the request, depth first. ext
   * subtrees are never entered: §3.2.x describe ext as a placeholder for
   * extensions, so its contents are outside the spec's field inventory.
   */
  function walk(request         )             {
    const out             = [];
    const visit = (kind            , value         , path        )       => {
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

  function range(from        , to        )           {
    const out           = [];
    for (let v = from; v <= to; v += 1) out.push(v);
    return out;
  }

  const CREATIVE_ATTRIBUTES            = { name: 'Creative Attributes', values: range(1, 23), vendorFrom: 500 };
  const API_FRAMEWORKS            = { name: 'API Frameworks', values: range(1, 9), vendorFrom: 500 };
  const AGENT_TYPES            = { name: 'Agent Types', values: [1, 2, 3], vendorFrom: 500 };
  const PLACEMENT_POSITIONS            = { name: 'Placement Positions', values: range(0, 17) };
  const CREATIVE_SUBTYPES_AV            = { name: 'Creative Subtypes - Audio/Video', values: range(1, 16) };
  const COMPANION_TYPES            = { name: 'Companion Types', values: [1, 2, 3] };
  const DEVICE_TYPES            = { name: 'Device Types', values: range(1, 8) };
  const LOCATION_TYPES            = { name: 'Location Types', values: [1, 2, 3] };
  const LINEARITY_MODES            = { name: 'Linearity Modes', values: [1, 2] };
  const POD_SEQUENCE            = { name: 'Pod Sequence', values: [-1, 0, 1] };
  const SLOT_IN_POD            = { name: 'Slot Position in Pod', values: [-1, 0, 1, 2] };

  /**
   * Fields whose OpenRTB 2.6 entry says "Refer to List: X in AdCOM 1.0"
   * and for which AdCOM 1.0 publishes a value table. Video.placement is
   * deliberately absent: AdCOM deprecated List: Placement Subtypes - Video
   * and no longer publishes values for it, so there is nothing to check
   * against.
   */
  const ADCOM_ENUM_FIELDS                            = {
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

  const DEVICE_TYPE_FAMILY                               = {
    1: 'mobile',   // Mobile/Tablet - General
    2: 'desktop',  // Personal Computer
    3: 'tv',       // Connected TV
    4: 'mobile',   // Phone
    5: 'mobile',   // Tablet
    6: 'tv',       // Connected Device
    7: 'tv',       // Set Top Box
    8: 'ooh',      // OOH Device
  };

  // ---- src/rules/spec.ts -------------------------------------------------
  /**
   * Category S - spec conformance.
   *
   * PLAN.md checks: missing-required-field, site-and-app-both,
   * video-rqddurs-exclusive, wseat-bseat-both, wrong-json-type,
   * geo-country-not-alpha3, keywords-kwarray-both, wlang-wlangb-both,
   * schain-hp-not-1, unknown-field.
   */

  /**
   * S/missing-required-field - a field the spec table literally marks
   * "required" is absent. Per CLAUDE.md this is the only shape of missing
   * field that may be an ERROR.
   * OpenRTB 2.6 §3.2.1, §3.2.4, §3.2.5, §3.2.7, §3.2.8, §3.2.9, §3.2.12,
   * §3.2.25, §3.2.26, §3.2.30
   */
  const missingRequiredField        = (request) => {
    const out            = [];
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
  const siteAndAppBoth        = (request) => {
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
  const videoRqddursExclusive        = (request) => {
    const out            = [];
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
  const wseatBseatBoth        = (request) => {
    const root = asObject(request);
    if (!present(root, 'wseat') || !present(root, 'bseat')) return [];
    return [make('wseat-bseat-both', 'S', 'WARNING', 'wseat + bseat',
      'OpenRTB 2.6 §3.2.1',
      'Both wseat and bseat are present; at most one should be used in the same request.')];
  };

  function matchesType(value         , expected          )          {
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

  function describe(value         )         {
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
  const wrongJsonType        = (request) => {
    const out            = [];
    for (const node of walk(request)) {
      const types = FIELD_TYPES[node.kind];
      for (const field of Object.keys(node.obj)) {
        const expected                       = types[field];
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
  const geoCountryNotAlpha3        = (request) => {
    const out            = [];
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
  const keywordsKwarrayBoth        = (request) => {
    const out            = [];
    const kinds               = ['Site', 'App', 'Content', 'User'];
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
  const wlangWlangbBoth        = (request) => {
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
  const schainHpNot1        = (request) => {
    const out            = [];
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
  const unknownField        = (request) => {
    const out            = [];
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

  const specChecks          = [
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

  // ---- src/rules/enums.ts ------------------------------------------------
  /**
   * Category E - enumerated values.
   *
   * PLAN.md checks: at-value-undefined, enum-not-in-adcom-list.
   *
   * Both are INFO. OpenRTB 2.6 §2.6 requires implementers to "tolerate
   * receiving new or unexpected fields and enumerated list values
   * gracefully", so an unrecognised enum value is never an error here.
   */

  /**
   * E/at-value-undefined - OpenRTB 2.6 §3.2.1 defines request-level at as
   * "1 = First Price, 2 = Second Price Plus" with "Exchange-specific
   * auction types ... using values 500 and greater". §3.2.12 additionally
   * defines 3 at deal level, so a request-level 3 is usually a deal value
   * in the wrong place.
   */
  const atValueUndefined        = (request) => {
    const out            = [];
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
  const enumNotInAdcomList        = (request) => {
    const out            = [];
    for (const node of walk(request)) {
      for (const field of Object.keys(node.obj)) {
        const list = ADCOM_ENUM_FIELDS[`${node.kind}.${field}`];
        if (list === undefined) continue;
        const isArrayField = FIELD_TYPES[node.kind][field] === 'integer[]';
        const entries                                          = isArrayField
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
  function summarise(values          )         {
    const contiguous = values.every((v, i) => i === 0 || v === values[i - 1] + 1);
    return contiguous && values.length > 3
      ? `${values[0]}-${values[values.length - 1]}`
      : values.join(', ');
  }

  const enumChecks          = [
    atValueUndefined,
    enumNotInAdcomList,
  ];

  // ---- src/rules/contradictions.ts ---------------------------------------
  /**
   * Category C - internal contradictions. Each request is individually
   * well-formed against its field definitions, but two fields cannot both
   * be true of the same impression.
   *
   * PLAN.md checks: schain-complete-single-node, bidfloorcur-not-in-cur,
   * duration-min-gt-max, skip-params-without-skip, devicetype-vs-ua,
   * secure-vs-http-page.
   */

  /**
   * C/schain-complete-single-node - OpenRTB 2.6 §3.2.25: in a complete
   * chain "the first node represents ... the owner of the site, app, or
   * other medium" and "the last node represents the entity sending this bid
   * request". With one node those are the same entity, which claims the
   * sender is also the publisher.
   */
  const schainCompleteSingleNode        = (request) => {
    const out            = [];
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
  const bidfloorcurNotInCur        = (request) => {
    const cur = asArray(asObject(request)?.cur)
      .map((c) => str(c)?.toUpperCase())
      .filter((c)              => c !== undefined);
    if (cur.length === 0) return [];
    const out            = [];
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
  const durationMinGtMax        = (request) => {
    const out            = [];
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
  const skipParamsWithoutSkip        = (request) => {
    const out            = [];
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
  function uaFamily(ua        )                           {
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
  const devicetypeVsUa        = (request) => {
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
  const secureVsHttpPage        = (request) => {
    const page = str(asObject(asObject(request)?.site)?.page);
    if (page === undefined || !/^http:\/\//i.test(page)) return [];
    const out            = [];
    for (const { imp, path } of imps(request)) {
      if (num(imp.secure) !== 1) continue;
      out.push(make('secure-vs-http-page', 'C', 'INFO',
        join(path, 'secure'), 'OpenRTB 2.6 §3.2.4, §3.2.13',
        `secure is 1 (HTTPS assets required) but site.page is served over http ("${page}").`));
    }
    return out;
  };

  const contradictionChecks          = [
    schainCompleteSingleNode,
    bidfloorcurNotInCur,
    durationMinGtMax,
    skipParamsWithoutSkip,
    devicetypeVsUa,
    secureVsHttpPage,
  ];

  // ---- src/rules/privacy.ts ----------------------------------------------
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

  /** Device IDs that identify hardware or a platform install. §3.2.18 */
  const DEVICE_ID_FIELDS = ['ifa', 'didsha1', 'didmd5', 'dpidsha1', 'dpidmd5', 'macsha1', 'macmd5'];

  /** Fields carrying data about the human user. §3.2.20 */
  const USER_DATA_FIELDS = ['id', 'buyeruid', 'yob', 'gender', 'keywords', 'kwarray', 'customdata'];

  /** lat/lon are only sent "if they conform to the accuracy depicted in the type attribute". §3.2.19 */
  function preciseGeo(device                                     )                     {
    const geo = asObject(device?.geo);
    if (geo === undefined || !present(geo, 'lat') || !present(geo, 'lon')) return undefined;
    const accuracy = num(geo.accuracy);
    return accuracy === undefined
      ? 'device.geo.lat/lon'
      : `device.geo.lat/lon at ${accuracy} m accuracy`;
  }

  /** Every identifier-bearing field present, named for the finding message. */
  function identifierSignals(request         )           {
    const root = asObject(request);
    const device = asObject(root?.device);
    const user = asObject(root?.user);
    const signals           = [];
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
  const gdprWithoutConsent        = (request) => {
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
  const coppaWithUserData        = (request) => {
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
  const trackingLimitedButIdsSent        = (request) => {
    const root = asObject(request);
    const device = asObject(root?.device);
    const user = asObject(root?.user);
    if (device === undefined) return [];
    const dnt = num(device.dnt) === 1;
    const lmt = num(device.lmt) === 1;
    if (!dnt && !lmt) return [];

    const signals           = [];
    for (const field of DEVICE_ID_FIELDS) if (present(device, field)) signals.push(`device.${field}`);
    if (asArray(user?.eids).length > 0) signals.push('user.eids');
    const geo = preciseGeo(device);
    if (geo !== undefined) signals.push(geo);
    if (signals.length === 0) return [];

    const flags = ['dnt', 'lmt'].filter((f) => (f === 'dnt' ? dnt : lmt));
    const severity           = dnt ? 'ERROR' : 'WARNING';
    return [make('tracking-limited-but-ids-sent', 'P', severity,
      `device.${flags[0]}`, 'OpenRTB 2.6 §3.2.18',
      `device.${flags.join(' and device.')} ${flags.length === 1 ? 'is' : 'are'} 1 but ${signals.join(', ')} ${signals.length === 1 ? 'is' : 'are'} populated.`)];
  };

  const privacyChecks          = [
    gdprWithoutConsent,
    coppaWithUserData,
    trackingLimitedButIdsSent,
  ];

  // ---- src/audit.ts ------------------------------------------------------
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

  /** Every check, in category order: S, E, C, P. */
  const CHECKS          = [
    ...specChecks,
    ...enumChecks,
    ...contradictionChecks,
    ...privacyChecks,
  ];

  const SEVERITY_ORDER             = ['ERROR', 'WARNING', 'INFO'];

  const RANK                           = { ERROR: 0, WARNING: 1, INFO: 2 };

  /**
   * Audit a bid request. Accepts either raw JSON text or an already-parsed
   * value; anything that is not a JSON object yields a single invalid-json
   * Finding, because §2.3 carries the request as a JSON payload and §3.2.1
   * describes it as a top-level object.
   */
  function audit(input         )              {
    let request          = input;

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

    const findings            = [];
    for (const check of CHECKS) findings.push(...check(request));
    return collect(findings);
  }

  /** Stable sort by severity: ERROR, then WARNING, then INFO. */
  function collect(findings           )              {
    const sorted = findings
      .map((finding, i) => ({ finding, i }))
      .sort((a, b) => (RANK[a.finding.severity] - RANK[b.finding.severity]) || (a.i - b.i))
      .map((entry) => entry.finding);

    const counts = { ERROR: 0, WARNING: 0, INFO: 0 };
    for (const finding of sorted) counts[finding.severity] += 1;
    return { findings: sorted, counts };
  }

  const samples = {
    "01-banner-web.json": "{\n  \"id\": \"80ce30c53c16e6ede735f123ef6e32361bfc7b22\",\n  \"at\": 2,\n  \"tmax\": 120,\n  \"cur\": [\"USD\"],\n  \"imp\": [\n    {\n      \"id\": \"1\",\n      \"tagid\": \"header-728x90\",\n      \"bidfloor\": 0.35,\n      \"bidfloorcur\": \"USD\",\n      \"secure\": 1,\n      \"banner\": {\n        \"w\": 728,\n        \"h\": 90,\n        \"pos\": 1,\n        \"battr\": [1, 3, 8],\n        \"api\": [7]\n      }\n    }\n  ],\n  \"site\": {\n    \"id\": \"102855\",\n    \"name\": \"Foobar News\",\n    \"domain\": \"www.foobar.com\",\n    \"cat\": [\"IAB12\"],\n    \"page\": \"https://www.foobar.com/1234.html\",\n    \"publisher\": {\n      \"id\": \"8953\",\n      \"name\": \"foobar.com\",\n      \"domain\": \"foobar.com\"\n    }\n  },\n  \"device\": {\n    \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\",\n    \"ip\": \"192.0.2.1\",\n    \"devicetype\": 2,\n    \"os\": \"Windows\",\n    \"language\": \"en\"\n  },\n  \"user\": {\n    \"id\": \"55816b39711f9b5acf3b90e313ed29e51665623f\"\n  },\n  \"regs\": {\n    \"gdpr\": 0\n  },\n  \"source\": {\n    \"fd\": 0,\n    \"tid\": \"402e2d0b-3d0f-4b1c-9c2e-0f0c9a7b1a11\",\n    \"schain\": {\n      \"complete\": 1,\n      \"ver\": \"1.0\",\n      \"nodes\": [\n        {\n          \"asi\": \"foobar.com\",\n          \"sid\": \"8953\",\n          \"hp\": 1\n        },\n        {\n          \"asi\": \"thebrave.io\",\n          \"sid\": \"brave-4471\",\n          \"hp\": 1\n        }\n      ]\n    }\n  }\n}\n",
    "02-app-inapp.json": "{\n  \"id\": \"a1b2c3d4-inapp-0002\",\n  \"at\": 3,\n  \"tmax\": 150,\n  \"cur\": [\"USD\"],\n  \"wseat\": [\"agency-1\", \"agency-2\"],\n  \"bseat\": [\"blocked-seat-9\"],\n  \"imp\": [\n    {\n      \"id\": \"1\",\n      \"tagid\": \"interstitial-slot\",\n      \"bidfloor\": 0.5,\n      \"bidfloorcur\": \"EUR\",\n      \"instl\": 1,\n      \"secure\": 1,\n      \"banner\": {\n        \"w\": 728,\n        \"h\": 90,\n        \"pos\": 1,\n        \"battr\": [3, 8]\n      }\n    }\n  ],\n  \"site\": {\n    \"id\": \"site-999\",\n    \"domain\": \"m.foobar.com\",\n    \"page\": \"https://m.foobar.com/article\"\n  },\n  \"app\": {\n    \"id\": \"app-628677149\",\n    \"name\": \"Foobar Weather\",\n    \"cat\": [\"IAB15\"],\n    \"publisher\": {\n      \"id\": \"pub-7781\",\n      \"name\": \"Foobar Mobile\"\n    }\n  },\n  \"device\": {\n    \"ua\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15\",\n    \"ip\": \"198.51.100.24\",\n    \"devicetype\": 2,\n    \"make\": \"Apple\",\n    \"model\": \"iPhone\",\n    \"os\": \"iOS\",\n    \"osv\": \"17.1\",\n    \"lmt\": 1,\n    \"ifa\": \"AA000DFE-7416-8477-C70D-291F574D3447\",\n    \"didmd5\": \"9f86d081884c7d659a2feaa0c55ad015\"\n  },\n  \"user\": {\n    \"id\": \"ffffffd5135596709273b3a1a07e466ea2bf4fff\"\n  },\n  \"regs\": {\n    \"gdpr\": 1\n  },\n  \"source\": {\n    \"fd\": 1,\n    \"tid\": \"77c1e2a4-inapp-tid-0002\",\n    \"schain\": {\n      \"complete\": 1,\n      \"ver\": \"1.0\",\n      \"nodes\": [\n        {\n          \"asi\": \"thebrave.io\",\n          \"hp\": 1\n        }\n      ]\n    }\n  }\n}\n",
    "03-video-ctv.json": "{\n  \"id\": \"ctv-req-0003\",\n  \"at\": 2,\n  \"tmax\": 300,\n  \"cur\": [\"USD\"],\n  \"imp\": [\n    {\n      \"id\": \"1\",\n      \"bidfloor\": 8,\n      \"bidfloorcur\": \"USD\",\n      \"exp\": 7200,\n      \"video\": {\n        \"w\": 1920,\n        \"h\": 1080,\n        \"pos\": 7,\n        \"startdelay\": 0,\n        \"minduration\": 30,\n        \"maxduration\": 15,\n        \"rqddurs\": [15, 30],\n        \"placement\": 1,\n        \"plcmt\": 4,\n        \"skip\": 0,\n        \"skipmin\": 15,\n        \"skipafter\": 5,\n        \"protocols\": [2, 3, 7],\n        \"api\": [50],\n        \"battr\": [99],\n        \"companiontype\": [1, 2],\n        \"podid\": 1,\n        \"podseq\": 1,\n        \"slotinpod\": 1\n      }\n    }\n  ],\n  \"app\": {\n    \"id\": \"ctv-app-1001\",\n    \"name\": \"Foobar TV\",\n    \"bundle\": \"com.foobar.ctv\",\n    \"cat\": [\"IAB1\"],\n    \"publisher\": {\n      \"id\": \"pub-ctv-55\",\n      \"name\": \"Foobar Streaming\",\n      \"domain\": \"foobar.tv\"\n    },\n    \"content\": {\n      \"id\": \"ep-4471\",\n      \"title\": \"Late Night Foobar\",\n      \"series\": \"Foobar After Dark\",\n      \"season\": \"2\",\n      \"episode\": 12,\n      \"livestream\": 0\n    }\n  },\n  \"device\": {\n    \"ua\": \"Roku/DVP-13.0\",\n    \"ip\": \"203.0.113.7\",\n    \"devicetype\": 3,\n    \"make\": \"Roku\",\n    \"os\": \"Roku OS\",\n    \"language\": \"en\",\n    \"geo\": {\n      \"country\": \"US\",\n      \"region\": \"NY\",\n      \"type\": 2\n    }\n  },\n  \"user\": {\n    \"id\": \"ctv-user-88f2\"\n  },\n  \"regs\": {\n    \"coppa\": 0,\n    \"gdpr\": 0\n  },\n  \"source\": {\n    \"fd\": 0,\n    \"tid\": \"ctv-tid-0003\",\n    \"schain\": {\n      \"complete\": 1,\n      \"ver\": \"1.0\",\n      \"nodes\": [\n        {\n          \"asi\": \"foobar.tv\",\n          \"sid\": \"pub-ctv-55\",\n          \"hp\": 1\n        },\n        {\n          \"asi\": \"thebrave.io\",\n          \"sid\": \"brave-4471\",\n          \"hp\": 1\n        }\n      ]\n    }\n  }\n}\n",
    "04-video-pod.json": "{\n  \"id\": \"9b9ee818a85d948d5231ffe839a9729a\",\n  \"at\": 2,\n  \"tmax\": 300,\n  \"cur\": [\"USD\"],\n  \"imp\": [\n    {\n      \"id\": \"1\",\n      \"bidfloor\": 8,\n      \"bidfloorcur\": \"USD\",\n      \"exp\": 7200,\n      \"video\": {\n        \"podid\": \"pod_1\",\n        \"podseq\": 1,\n        \"slotinpod\": 1,\n        \"mimes\": [\"video/mp4\", \"video/ogg\", \"video/webm\"],\n        \"linearity\": 1,\n        \"maxduration\": 60,\n        \"minduration\": 0,\n        \"protocols\": [2, 3, 7],\n        \"startdelay\": 0,\n        \"w\": 1920,\n        \"h\": 1080,\n        \"api\": [7],\n        \"battr\": [1, 2, 16]\n      }\n    },\n    {\n      \"id\": \"2\",\n      \"bidfloor\": 8,\n      \"bidfloorcur\": \"USD\",\n      \"exp\": 7200,\n      \"video\": {\n        \"podid\": \"pod_1\",\n        \"podseq\": 1,\n        \"slotinpod\": 0,\n        \"mimes\": [\"video/mp4\", \"video/ogg\", \"video/webm\"],\n        \"linearity\": 1,\n        \"maxduration\": 30,\n        \"minduration\": 0,\n        \"protocols\": [2, 3, 7],\n        \"startdelay\": 0,\n        \"w\": 1920,\n        \"h\": 1080\n      }\n    }\n  ],\n  \"app\": {\n    \"id\": \"ctv-app-2002\",\n    \"name\": \"Foobar TV\",\n    \"bundle\": \"com.foobar.ctv\",\n    \"storeurl\": \"https://channelstore.roku.com/details/foobar-tv\",\n    \"cat\": [\"IAB1\"],\n    \"publisher\": {\n      \"id\": \"pub-ctv-55\",\n      \"name\": \"Foobar Streaming\",\n      \"domain\": \"foobar.tv\"\n    },\n    \"content\": {\n      \"id\": \"ep-5590\",\n      \"title\": \"Foobar Morning Show\",\n      \"url\": \"https://foobar.tv/watch/ep-5590\",\n      \"livestream\": 0\n    }\n  },\n  \"device\": {\n    \"ua\": \"Roku/DVP-13.0\",\n    \"ip\": \"203.0.113.7\",\n    \"devicetype\": 3,\n    \"make\": \"Roku\",\n    \"os\": \"Roku OS\",\n    \"language\": \"en\"\n  },\n  \"user\": {\n    \"id\": \"ctv-user-2002\"\n  },\n  \"regs\": {\n    \"coppa\": 0,\n    \"gdpr\": 0\n  },\n  \"source\": {\n    \"fd\": 0,\n    \"tid\": \"pod-tid-0004\",\n    \"schain\": {\n      \"complete\": 1,\n      \"ver\": \"1.0\",\n      \"nodes\": [\n        {\n          \"asi\": \"foobar.tv\",\n          \"sid\": \"pub-ctv-55\",\n          \"hp\": 1\n        },\n        {\n          \"asi\": \"thebrave.io\",\n          \"sid\": \"brave-4471\",\n          \"hp\": 1\n        }\n      ]\n    }\n  }\n}\n",
    "05-native-privacy.json": "{\n  \"id\": \"native-req-0005\",\n  \"at\": 2,\n  \"tmax\": 200,\n  \"cur\": [\"USD\"],\n  \"wlang\": [\"en\"],\n  \"wlangb\": [\"en-US\"],\n  \"imp\": [\n    {\n      \"id\": \"1\",\n      \"tagid\": \"feed-native-1\",\n      \"bidfloor\": 1.2,\n      \"bidfloorcur\": \"USD\",\n      \"secure\": 1,\n      \"native\": {\n        \"ver\": \"1.2\",\n        \"api\": [3],\n        \"battr\": [1, 9]\n      }\n    }\n  ],\n  \"site\": {\n    \"id\": \"site-5501\",\n    \"name\": \"Foobar Kids Games\",\n    \"domain\": \"kids.foobar.com\",\n    \"page\": \"http://kids.foobar.com/games/puzzle\",\n    \"cat\": [\"IAB6-7\"],\n    \"keywords\": \"games,kids,puzzle\",\n    \"kwarray\": [\"games\", \"kids\", \"puzzle\"],\n    \"privacypolicy\": 1,\n    \"publisher\": {\n      \"id\": \"pub-5501\",\n      \"name\": \"Foobar Kids\",\n      \"domain\": \"foobar.com\"\n    }\n  },\n  \"device\": {\n    \"ua\": \"Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36\",\n    \"ip\": \"192.0.2.55\",\n    \"devicetype\": 4,\n    \"make\": \"Google\",\n    \"model\": \"Pixel 8\",\n    \"os\": \"Android\",\n    \"osv\": \"14\",\n    \"dnt\": 1,\n    \"ifa\": \"38400000-8cf0-11bd-b23e-10b96e40000d\",\n    \"geo\": {\n      \"lat\": 32.085300,\n      \"lon\": 34.781768,\n      \"type\": 2,\n      \"accuracy\": 10,\n      \"country\": \"ISR\",\n      \"city\": \"Tel Aviv\"\n    }\n  },\n  \"user\": {\n    \"id\": \"user-kids-7781\",\n    \"yob\": 2016,\n    \"gender\": \"M\",\n    \"keywords\": \"cartoons,toys\",\n    \"consent\": \"CPzXuUAPzXuUAAcABBENAUCoAP_AAH_AAAqIJNNd_X__bX9j-_59_9t0eY1f9_7_v-0zjhfdt-8N3f_X_L8X52M7vF36pq4KuR4Eu3LBIQdlHOHcTUmw6IkVqTPsbk2Mr7NKJ7PEinMbe2dYGH9_n1_z-ZKY7___f__z_v-v___9____7-3f3__5_3---_e_V_99zbv9____39nP___9v-_9_\",\n    \"eids\": [\n      {\n        \"source\": \"liveramp.com\",\n        \"uids\": [\n          {\n            \"id\": \"XY1000bIVBVah9ium-sZ3ykhPiXQbEcUpn4GjCtxrrw2BB\",\n            \"atype\": 9\n          }\n        ]\n      }\n    ]\n  },\n  \"regs\": {\n    \"coppa\": 1,\n    \"gdpr\": 0\n  },\n  \"source\": {\n    \"fd\": 0,\n    \"tid\": \"native-tid-0005\",\n    \"schain\": {\n      \"complete\": 1,\n      \"ver\": \"1.0\",\n      \"nodes\": [\n        {\n          \"asi\": \"foobar.com\",\n          \"sid\": \"pub-5501\",\n          \"hp\": 0\n        },\n        {\n          \"asi\": \"thebrave.io\",\n          \"sid\": \"brave-4471\",\n          \"hp\": 1\n        }\n      ]\n    }\n  }\n}\n",
  };

  globalThis.BidRequestAuditor = { audit, CHECKS, SEVERITY_ORDER, samples };
}());
