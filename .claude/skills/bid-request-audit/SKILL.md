---
name: bid-request-audit
description: Audit an OpenRTB 2.6 bid request JSON for spec violations, invalid AdCOM 1.0 enum values, and internal contradictions. Use when the user supplies a bid request, points at a .json file containing one, or asks to validate, check, lint, or review a bid request against the OpenRTB 2.6 / AdCOM specs.
---

# Bid request audit

Run the auditor; do not audit by reading the JSON yourself. The 26 checks
are deterministic and each cites the spec section it came from.

```bash
node src/cli.ts path/to/bid-request.json
```

From the repo root. Exit status: `1` if any ERROR was found, `2` on a
usage or read failure, `0` otherwise. A JSON parse failure comes back as
an `invalid-json` finding, not a crash.

## Presenting the findings

- **Lead with the privacy findings** — category `P`:
  `gdpr-without-consent`, `coppa-with-user-data`,
  `tracking-limited-but-ids-sent`. These mean identifiers were sent
  against a signal that forbids them, so they matter before anything
  structural. Then cover the rest.
- Group by severity: ERROR, then WARNING, then INFO.
- Give every finding its check ID, the field path, and the spec reference
  the CLI printed — e.g. `missing-required-field` at
  `imp[0].video.mimes`, OpenRTB 2.6 §3.2.7.

## Do not restate severity

- ERROR appears only where a spec table literally says "required", plus
  the three privacy contradictions. Never promote a WARNING.
- **Unknown fields are informational, never errors.** OpenRTB 2.6 §2.6
  requires implementers to tolerate unexpected fields and enum values
  gracefully. Report `unknown-field` and out-of-range enum values as
  INFO — a later revision or a vendor field, not something broken.
- `reference/` and `samples/` are read-only.
