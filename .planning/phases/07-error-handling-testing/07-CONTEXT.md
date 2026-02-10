# Phase 7: Error Handling & Testing - Context

**Gathered:** 2026-02-10
**Status:** Ready for planning

<domain>

## Phase Boundary

Make the workflow resilient to node-level failures (OpenAI down, Google Sheets unavailable, Slack rate-limited) with per-node retry and graceful degradation. Validate the complete pipeline with a realistic test dataset (10+ submissions across all categories) and a rapid-fire load test. No global error workflow, no new features.

</domain>

<decisions>

## Implementation Decisions

### Error handling strategy

- Per-node error handling only (no global error workflow) — each critical node has its own retry + continueOnFail config
- Retry policy: 2 retries (3 total attempts) per failing node — keeps user wait under ~15 seconds
- OpenAI failure: retry then skip AI analysis — save submission without classification, return normal success to user
- Google Sheets failure: submission still succeeds (HTTP 200) — form user is not blocked by storage failures
- Design principle: the form user should always get a response; backend failures are invisible to them

### Failure user experience

- Generic friendly error message when backend completely fails: "Something went wrong. Please try again in a moment."
- No category-specific errors (AI failure vs network) — keep it simple for the portfolio
- When AI is skipped (graceful degradation): normal success card, no mention of missing AI — user sees "Message received!" as usual
- No submit cooldown after errors — user can retry immediately
- Demo recording shows happy path only — error handling exists but isn't demonstrated in the recording

### Test dataset design

- All 4 categories represented: 2-3 submissions each for support, sales, feedback, spam + edge cases (borderline spam, mixed intent)
- English only — demo targets English-speaking Upwork clients
- Two deliverables: JSON file (test-data.json) for automated batch submission + markdown doc for portfolio README
- Batch script POSTs each submission with appropriate delays
- Rapid-fire mode built into the script: sends 5+ submissions within 30 seconds to test concurrency
- Edge cases to include: long messages, minimal input, borderline spam scores

### Error logging approach

- No extra error logging beyond n8n execution history — failed executions are visible in n8n UI
- Partial failures logged to Google Sheets: a "warnings" column lists failed services (e.g., "Slack notification failed", "Slack, Email failed")
- Invalid credential errors (expired API keys) visible only in n8n execution history — no special admin alerts
- The warnings column gives visibility into partial failures without requiring n8n UI access

### Claude's Discretion

- Exact error message wording (within "generic friendly" constraint)
- How graceful degradation works internally (Code node fallback logic for missing AI fields)
- Test dataset content (specific names, emails, messages for each category)
- Batch script implementation details (Node.js script, bash curl loop, etc.)
- How warnings column gets populated (Code node that checks upstream node errors)

</decisions>

<specifics>

## Specific Ideas

No specific requirements — open to standard approaches. Key constraint is that this is a portfolio demo, not production software, so error handling should be correct but not over-engineered.

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-error-handling-testing*
*Context gathered: 2026-02-10*
