# NOTES.md

Audits an OpenRTB 2.6 bid request and reports spec violations, invalid
AdCOM enum values, and internal contradictions. 26 checks. Live page:\
Repo: <link> https://github.com/kvprds/bid-request-auditor <link>

## How I directed the tools I used

**Tools:** Claude Code for everything inside the repo, plus separate
Claude chat sessions for learning the domain and reviewing my own plan.
I had no adtech background going in, so the first block of work was
understanding the problem, not writing code.

1. **Learned the domain first.** I used a chat session to understand what
   an SSP is, what a bid request is for, and why a malformed one costs
   money (DSPs drop it and nobody tells you why). Then required fields,
   AdCOM enums, schain, and the privacy signals.

2. **Wrote CLAUDE.md before any code**, so Claude Code was constrained
   from the first prompt. The rules that mattered:
   - The specs in `reference/` are the only source of truth. Never rely
     on memory for field names, types, or enum values.
   - Every rule must carry a comment citing its spec section.
   - ERROR only where a spec table literally says "required".
     "Recommended" is at most a WARNING. Never invent requirements.
   - Unknown fields are never errors (§2.6).
   - No LLM calls at runtime — all validation is deterministic.
   - The same TypeScript must run in Node and the browser, no backend.
   - Never modify `reference/` or `samples/`.

   The first three exist because the failure mode I was most worried
   about was a rule that sounds authoritative and isn't in the spec.

3. **Investigation before implementation.** I told Claude Code to write
   no code and produce `PLAN.md` instead: every field the spec marks
   required in the objects our samples use, candidate checks with the
   exact sentence justifying each, which checks fire on which sample,
   and — explicitly — anything it was unsure about.

4. **Reviewed PLAN.md instead of trusting it.** Separate session, plus
   hand-checking citations against the PDF and AdCOM file. This is where
   both of the problems below came out. I also cut checks and fixed the
   severity model here (see below).

5. **Built the engine** from the trimmed plan: one small pure function
   per check returning `Finding[]`. Tests assert the exact
   (check, field) pairs for all five samples, and that 01 and 04 stay
   silent. I told Claude Code that if the code disagreed with PLAN.md it
   had to stop and tell me, not edit PLAN.md to match.

6. **Built the web page** on top of the same engine — no duplicated
   rules.

7. **Wrote the skill** (`.claude/skills/bid-request-audit/SKILL.md`) so
   the technical team can audit a file from Claude Code directly, then
   verified it triggers from a clean session.

8. **Deployed** to Vercel, repo on GitHub.

### What I changed along the way

- **Severity model, rebuilt.** My first pass had only
  ERROR/WARNING/INFO, which put "missing required field" and "COPPA flag
  set while sending a child's ad ID and GPS" in unrelated places. I added
  a second axis — SPEC / ENUM / CONTRADICTION / PRIVACY — and promoted
  the three privacy findings to ERROR. They had been ranked below
  cosmetic issues, which is backwards for an SSP.
- **Deliberately dropped `geo-city-not-unlocode`.** §3.2.19 does say
  city should use UN/LOCODE, but almost nobody does — everyone sends
  plain city names. Flagging "Tel Aviv" would be inventing a problem, so
  it's out. Spec-supported and still wrong to ship.
- **Kept `at: 3` at INFO.** Value 3 is real, but only at deal level
  (§3.2.12), so it looks like a deal value copied to the top of the
  request. §2.6 says tolerate unexpected enum values, so it's not an
  error.
- **Capped at 26 checks** rather than covering the spec. Left out:
  deprecated-field notices, IP-vs-geo consistency, most of the Content
  object.

## Two places the AI got something wrong

**1. A rule that couldn't be built.** Claude Code produced a check
asserting that the first node of the `schain` must match the publisher's
domain, citing §3.2.25. The spec sentence is real. The problem is that
sample 02's `app.publisher` has no `domain` field, so there is nothing to
compare against — the code cannot determine who owns an app. The rule
read as authoritative and was quietly impossible.

I replaced it with a structural test that uses only data actually in the
request: with `complete: 1`, the first node is the inventory owner and
the last is the sender, so first and last `asi` must differ. Sample 02
has one node, `thebrave.io` — which would only be correct if Brave were
the publisher. Same finding, deterministic.

**2. A wrong citation.** It justified reporting unknown fields as INFO by
citing "§4". §4 is the Bid Response Specification and has nothing to do
with unknown request fields. The correct section is **§2.6, Versioning
Behavior**, which says implementers must tolerate receiving new or
unexpected fields and enum values gracefully, treating them as unknown or
ignoring them. That is the whole basis for the check — sample 03 carries
`video.plcmt`, which is not in 2.6, and the right answer is to note it,
never to reject the request.

**How I caught both:** I didn't trust PLAN.md. I ran it through a
separate review pass and then opened the PDF and AdCOM file myself to
confirm each cited sentence was really there. That is also why every rule
in the code carries its section number — the citation is the thing worth
checking, so it has to be visible.

## Why this deliverable

**A static page, no backend.** The audit runs entirely in the browser, so
a bid request pasted into it never leaves the analyst's machine. For a
tool handling request data that seemed worth more than any feature I
could have added with a server, and it makes deployment a single Vercel
static upload.

**One engine, two front doors.** The same TypeScript module is imported
by the CLI (and therefore the Claude Code skill) and by the page. The
technical team and the non-technical team cannot get different answers
about the same file, because there is only one set of rules.

**No AI in the validation path.** I used AI heavily to build this and not
at all to run it. A validator that might answer differently on the same
input twice is not usable as a reference, and "the spec says X" needs to
be traceable to a line of code and a section number, not to a model's
judgment.

## What I'd do differently

1. **Decide the severity and category model before generating checks.**
   I wrote the checks first and retrofitted the model, which meant
   revisiting every row. The severity of a finding is a business
   decision, not a detail — it should have been the first thing I fixed.
2. **Verify citations as they're produced, not in a review pass.** The
   §4 error survived until I checked. Confirming a section number takes
   fifteen seconds and would have cost nothing to do inline.
3. **Read §2.6 and the Getting Started page before anything else.** The
   required/recommended distinction and the unknown-field rule are the
   two ideas the whole tool rests on, and both are in the first eight
   pages.

## How I'd take it further

**In the product**
1. Plain-language explanations of each finding for non-technical users,
   with a link to the relevant spec section. The model would explain and
   suggest fixes; it would never decide whether something is a violation.
   The rules stay deterministic.
2. Batch mode: audit a file of many requests, then report violation rates
   grouped by publisher, partner, and check over time. The useful
   question isn't "is this request broken" but "which supply is
   consistently sending us broken requests" — that's where the money is.

**In production**
3. Run it as a gate in the request pipeline rather than as a tool someone
   opens: sample live traffic, alert when a check's rate jumps.
4. Version the rule set against spec revisions, so 2.6 vs. a later
   revision is a config change rather than a rewrite. `plcmt` is the
   obvious first case.
5. Reconcile findings against actual no-bid rates to learn which checks
   predict lost revenue and which are noise. That would let me re-rank
   severities with evidence instead of judgment.

Out of scope here by the ground rules, but worth naming: connecting to
live systems. Everything above was built and tested against the five
synthetic samples only.