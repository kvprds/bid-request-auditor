### Legend

Category: **S** spec · **E** enum · **C** contradiction · **P** privacy

Severity: **ERROR** (bold) · WARNING · INFO

### `samples/01-banner-web.json` — clean

### `samples/02-app-inapp.json` — 9 findings

| Check | Detail |
|---|---|
| **S** `missing-required-field` | **ERROR** — `source.schain.nodes[0].sid` absent; §3.2.26 `sid` is "string; required". |
| **S** `site-and-app-both` | **ERROR** — both `site` and `app` at top level; §3.2.13 "A bid request must not contain both a Site and an App object." |
| **P** `gdpr-without-consent` | **ERROR** — `regs.gdpr: 1` with no `user.consent`, while `user.id` and `device.ifa` are still passed; §3.2.3, §3.2.20. |
| C `schain-complete-single-node` | WARNING — `complete: 1` but the chain has one node, `asi: "thebrave.io"`. §3.2.25: in a complete chain the first node is the inventory owner and the last is the sender; identical first and last implies Brave is the publisher. |
| P `tracking-limited-but-ids-sent` | WARNING — `lmt: 1` with `ifa` and `didmd5` populated; §3.2.18. |
| C `bidfloorcur-not-in-cur` | WARNING — `bidfloorcur: "EUR"` but `cur: ["USD"]`; floor priced in a currency no bidder may use. §3.2.1, §3.2.4. |
| S `wseat-bseat-both` | WARNING — `wseat` and `bseat` both present; §3.2.1 "At most, only one of wseat and bseat should be used in the same request." |
| E `at-value-undefined` | INFO — `at: 3`; §3.2.1 defines 1, 2, ≥500. Value 3 is defined only at deal level (§3.2.12), so likely a misplaced deal value. Reported as INFO per §2.6. |
| C `devicetype-vs-ua` | INFO — `devicetype: 2` (Personal Computer, AdCOM Device Types) with an iPhone user-agent and an `app` object. |

### `samples/03-video-ctv.json` — 9 findings

| Check | Detail |
|---|---|
| **S** `missing-required-field` | **ERROR** — `imp[0].video.mimes` absent; §3.2.7 `mimes` is "string array; required". |
| **S** `video-rqddurs-exclusive` | **ERROR** — `rqddurs: [15,30]` present alongside `minduration` and `maxduration`; §3.2.7 "if rqddurs is specified, minduration and maxduration must not be specified and vice versa." |
| C `duration-min-gt-max` | WARNING — `minduration: 30` > `maxduration: 15`; no creative can satisfy both. |
| S `wrong-json-type` | WARNING — `video.podid: 1` is an integer; §3.2.7 declares `podid` as string, confirmed by Appendix B (corrected July 2022). Contrast sample 04's `"pod_1"`. |
| S `geo-country-not-alpha3` | WARNING — `device.geo.country: "US"` is alpha-2; §3.2.19 requires ISO-3166-1-alpha-3 (`"USA"`). |
| C `skip-params-without-skip` | WARNING — `skip: 0` with `skipmin: 15` and `skipafter: 5`; §3.2.7 marks both as applicable only if the ad is skippable (see also §7.4 Case-3). |
| E `enum-not-in-adcom-list` | INFO — `imp[0].video.battr: [99]`; AdCOM Creative Attributes = 1–23, 500+. |
| E `enum-not-in-adcom-list` | INFO — `imp[0].video.api: [50]`; AdCOM API Frameworks = 1–9, 500+. |
| S `unknown-field` | INFO — `imp[0].video.plcmt` does not appear in OpenRTB 2.6. Never an error: §2.6 requires implementers to "tolerate receiving new or unexpected fields and enumerated list values gracefully, treating them as unknown or ignoring them." Likely a later revision or vendor field. |

### `samples/04-video-pod.json` — clean

### `samples/05-native-privacy.json` — 8 findings

| Check | Detail |
|---|---|
| **S** `missing-required-field` | **ERROR** — `imp[0].native.request` absent; §3.2.9 `request` is "string; required". Object carries only `ver`, `api`, `battr`. |
| **P** `coppa-with-user-data` | **ERROR** — `regs.coppa: 1` alongside `user.yob: 2016`, `gender`, `keywords`, `eids` (LiveRamp), `device.ifa`, and lat/lon at 10 m accuracy. §3.2.3, §7.5. |
| **P** `tracking-limited-but-ids-sent` | **ERROR** — `device.dnt: 1` with `ifa`, `eids`, and precise geo; §3.2.18. |
| S `keywords-kwarray-both` | WARNING — `site.keywords` and `site.kwarray` both present; §3.2.13 "Only one of 'keywords' or 'kwarray' may be present." |
| S `wlang-wlangb-both` | WARNING — `wlang: ["en"]` and `wlangb: ["en-US"]`; §3.2.1 "Only one of wlang or wlangb should be present." |
| S `schain-hp-not-1` | WARNING — `nodes[0].hp: 0` while `ver: "1.0"`; §3.2.26 "For version 1.0 of SupplyChain, this property should always be 1." |
| C `secure-vs-http-page` | INFO — `imp.secure: 1` requires HTTPS assets, but `site.page` is `http://`; §3.2.4. |
| E `enum-not-in-adcom-list` | INFO — `user.eids[0].uids[0].atype: 9`; AdCOM Agent Types = 1, 2, 3, 500+. |