# Bid Request Auditor

A validator for **OpenRTB 2.6** bid requests. It reports spec violations,
invalid AdCOM 1.0 enum values, internal contradictions, and privacy
signals contradicted by the identifiers actually carried in the request.

- **21 checks**, each citing the spec section it came from, plus
  `invalid-json` for unparseable input — 22 distinct finding IDs in
  total. `CHECKS.length` in `src/audit.ts` is the authority; by
  category that is spec 10, enums 2, contradictions 6, privacy 3.
- Severity is disciplined: **ERROR only where a spec table literally says
  "required"** (plus three privacy contradictions). "Recommended" is at
  most WARNING. Unknown fields and unrecognised enum values are INFO at
  most, per OpenRTB 2.6 §2.6.
- **No LLM calls at runtime** and no network — validation is deterministic
  code. `audit()` is pure and never throws.
- Zero runtime dependencies. The same modules run in Node and in the
  browser.

Every rule is derived from `reference/OpenRTB-2.6.pdf` and
`reference/AdCOM-v1.0.md`, which are the only source of truth.
`reference/` and `samples/` are read-only.

**Live page:** <https://bid-request-auditor.vercel.app>

## Requirements

Node with TypeScript type stripping, so the `.ts` sources run with no
build step. Tested on **v24.13.0**.

| Node | Command |
| --- | --- |
| 22.18+ / 23.6+ | `node src/cli.ts …` |
| 22.6 – 23.5 | `node --experimental-strip-types src/cli.ts …` |

## Run the CLI

```bash
node src/cli.ts samples/03-video-ctv.json
```

Findings print grouped by severity, each with its check ID, field path,
message and spec reference. Exit status is `1` if any ERROR was found, `2`
on a usage or read failure, `0` otherwise — so it drops into CI as-is.

## Run the tests

```bash
node --test tests/samples.test.ts tests/web-bundle.test.ts
```

21 tests. `samples.test.ts` asserts the exact set of findings PLAN.md
predicts for each sample — severity and per-check count included.
`web-bundle.test.ts` asserts the browser build is neither stale nor
behaviourally different from `src/`.

Pass the files explicitly. The directory form (`node --test tests/`)
misparses the path on some Node builds.

## Open the web page

Open `web/index.html` in a browser — double-clicking works, no server
needed. Paste a request, drop a `.json` file, or load any of the five
samples. Everything runs client-side; nothing is uploaded.

`web/auditor.js` is **generated** from `src/` by Node's own TypeScript
type stripper, so the page runs the real rules and no rule is duplicated.
Regenerate after any change under `src/`:

```bash
node tools/build-web.mjs
```

The staleness test above fails if you forget.

## Samples

| Sample | What it demonstrates |
| --- | --- |
| `01-banner-web.json` | Clean web display request — HTTPS page, GDPR off, two-node complete supply chain. A baseline that must stay silent. |
| `02-app-inapp.json` | Both `site` and `app` at once, a one-node "complete" supply chain missing `sid`, GDPR asserted with no consent string, and a EUR floor against a USD-only `cur`. |
| `03-video-ctv.json` | CTV slot missing `mimes`, `rqddurs` colliding with an inverted `minduration`/`maxduration` pair, integer `podid`, alpha-2 country, skip tuning on a non-skippable ad, out-of-range AdCOM enums. |
| `04-video-pod.json` | Clean two-slot video ad pod — shared string `podid`, `mimes` on both imps. The second baseline. |
| `05-native-privacy.json` | Native placement missing `request`, under COPPA and `dnt: 1` while still sending `ifa`, `eids` and 10-metre geo; plus `keywords`+`kwarray`, `wlang`+`wlangb`, `hp: 0`. |

## Layout

```
src/types.ts            Finding, Severity, Category, AuditResult
src/util.ts             Total accessors — never throw on malformed input
src/spec-data.ts        Spec-derived tables: required fields, declared
                        JSON types, field inventories, AdCOM enum lists
src/rules/spec.ts       10 S checks — spec conformance
src/rules/enums.ts       2 E checks — enumerated values
src/rules/contradictions.ts  6 C checks — internal contradictions
src/rules/privacy.ts     3 P checks — privacy signals
src/audit.ts            Runs every check, sorts by severity
src/cli.ts              Node entry point (the only file that does I/O)
tools/build-web.mjs     Generates web/auditor.js from src/
web/index.html          Static single-page UI
tests/                  Sample expectations and browser-build guards
```

`PLAN.md` is the agreed check list and the source of truth for severities.
If the implementation and the plan ever disagree, the plan wins.
