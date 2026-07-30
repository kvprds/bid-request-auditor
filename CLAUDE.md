- This is a validator for OpenRTB 2.6 bid requests. The specs are in
  reference/. They are the only source of truth — never rely on
  memory about OpenRTB or AdCOM field names, types, or enum values.
- Every validation rule MUST have a comment citing its spec section,
  e.g. // OpenRTB 2.6 §3.2.13
- Only report severity ERROR when the spec table literally says
  "required". "recommended" is at most a WARNING. Never invent
  requirements.
- ERROR only where a spec table literally says "required."
  "Recommended" is at most WARNING.
- No LLM calls at runtime. All validation is deterministic code.
- Unknown fields are never errors. OpenRTB 2.6 §2.6 says implementers
  must tolerate unexpected fields and enum values gracefully. Report
  them as INFO at most.
- Language: TypeScript. The same code must run in Node and in the
  browser with no changes and no backend.
- PLAN.md before any code; if the implementation disagrees with the
  plan, stop and report rather than editing the plan to match the code.
- Final count: 26 distinct checks. Capped deliberately.
- Never modify anything in reference/ or samples/.