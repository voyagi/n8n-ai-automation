---
phase: 04-conditional-routing
plan: 01
subsystem: workflow
tags: [n8n, switch-node, conditional-routing, spam-detection, frontend-ui]

# Dependency graph
requires:
  - phase: 03-ai-processing-core
    provides: "OpenAI classification with spam_score field in Parse AI Response node"
provides:
  - "Switch node routing spam submissions (spam_score > 70) to dedicated Spam Response branch"
  - "Frontend UI for spam detection with warning-styled message card"
  - "Dual response paths with appropriate HTTP 200 status for both spam and legitimate submissions"
affects: [05-storage, 06-notifications]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "n8n Switch node conditional routing with fallbackOutput configuration"
    - "Frontend dual-path response handling based on spam flag"
    - "Warning UI pattern with amber/yellow color scheme"

key-files:
  created: []
  modified:
    - "workflows/contact-form-ai.json"
    - "public/script.js"
    - "public/index.html"
    - "public/styles.css"

key-decisions:
  - "Use > (strictly greater than) for spam threshold: score of exactly 70 routes to legitimate branch"
  - "Return HTTP 200 for spam (not 400): submission was valid and processed, AI determined it's spam"
  - "Include spam metadata in response (spam_score, spam_reason, category) for frontend differentiation"
  - "fallbackOutput: extra ensures items not matching any rule still get processed (routed to legitimate branch)"
  - "Fallback spam detection in frontend (spam_score > 70) works regardless of which response node serves data"

patterns-established:
  - "Conditional routing pattern: Parse AI Response → Switch node → branch-specific Response nodes"
  - "Frontend response type detection: check result.spam flag OR result.spam_score threshold"
  - "Consolidated resetForm() function handles state reset for both success and spam paths"

# Metrics
duration: 215min
completed: 2026-02-09
---

# Phase 04 Plan 01: Conditional Routing Summary

**Switch node routes spam submissions (spam_score > 70) to dedicated branch with warning UI, legitimate submissions to success path - both return HTTP 200**

## Performance

- **Duration:** 215 min (3h 35m)
- **Started:** 2026-02-09T07:40:40+01:00
- **Completed:** 2026-02-09T11:15:49+01:00
- **Tasks:** 2 (plus 1 compatibility fix)
- **Files modified:** 4

## Accomplishments

- n8n Switch node separates spam from legitimate submissions based on AI spam_score
- Spam Response node returns structured spam metadata (score, reason, category) with HTTP 200
- Frontend displays warning-styled spam detection card instead of normal success card
- All routing visible in n8n execution history for demonstration purposes
- Fixed n8n 1.123.20 compatibility issues (Switch node rules structure, Set node options)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Switch node and Spam Response node to workflow** - `7e3c829` (feat)
   - Added "Route by Spam Score" Switch node with spam_score > 70 condition
   - Added "Spam Response" Respond to Webhook node with spam metadata
   - Updated connections: Parse AI Response → Route by Spam Score → (spam) Spam Response / (legitimate) Success Response
   - Moved Success Response position to make room for routing logic

2. **Task 2: Update frontend to handle spam detection response** - `2eb57bd` (feat)
   - Added spam-detected UI element with warning styling (amber/yellow theme)
   - Check result.spam in fetch callback and route to spam UI or normal success card
   - Display spam_score, spam_reason, and category in spam details card
   - Consolidate reset logic into resetForm() function for both send-another buttons
   - Add CSS variables for warning colors

3. **Compatibility fix** - `6e9de14` (fix)
   - Changed Switch node rules.rules to rules.values (correct fixedCollection key for n8n 1.123.20)
   - Added missing options and combinator fields in rule conditions
   - Removed invalid keepOnlySet option from Set node v3.4
   - Added fallback spam detection in frontend (spam_score > 70) for robustness

## Files Created/Modified

- `workflows/contact-form-ai.json` - Added Switch node and Spam Response node with conditional routing logic
- `public/script.js` - Added spam detection logic, consolidated reset function, fallback spam_score check
- `public/index.html` - Added spam-detected message card with warning icon and detail rows
- `public/styles.css` - Added spam-message styles with amber/yellow warning color scheme

## Decisions Made

**Spam threshold boundary:** Used `>` (strictly greater than) 70, not `>=`. Score of exactly 70 routes to legitimate branch (false negatives safer than false positives for UX).

**HTTP 200 for spam:** Spam returns 200 (not 400). The form submission was valid and successfully processed - AI determined it's spam, which is not a client error.

**Spam metadata in response:** Include spam_score, spam_reason, and category in Spam Response JSON so frontend can differentiate spam from legitimate responses and display details.

**Switch fallbackOutput:** Set to "extra" to ensure items not matching any rule (edge case: missing spam_score) still get processed and route to legitimate branch.

**Frontend fallback detection:** Added `result.spam_score > 70` check in addition to `result.spam === true` so spam UI displays correctly regardless of which response node serves the data.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed n8n 1.123.20 Switch node compatibility**
- **Found during:** Task 1 verification (workflow JSON imported but Switch node failed to route correctly)
- **Issue:** Switch node used incorrect fixedCollection key (`rules.rules` instead of `rules.values`), missing condition options/combinator fields, and invalid Set node option
- **Fix:** Changed rules structure to `rules.values`, added options object and combinator field to conditions, removed keepOnlySet from Set node
- **Files modified:** workflows/contact-form-ai.json
- **Verification:** Switch node routes items correctly based on spam_score threshold in n8n execution history
- **Committed in:** 6e9de14 (fix commit after Task 2)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking compatibility issue)
**Impact on plan:** Essential fix for n8n 1.123.20 compatibility. Switch node would silently route all items to output 0 without proper structure. No scope creep.

## Issues Encountered

**Switch node routing silently failed:** Initial implementation used `rules.rules` structure from n8n documentation examples, but n8n 1.123.20 requires `rules.values` as the fixedCollection inner key. Missing `options` and `combinator` fields caused Switch to skip rule evaluation and route all items to output 0. Fixed by consulting n8n memory context and adjusting JSON structure.

## User Setup Required

None - no external service configuration required.

Task 3 is a human verification checkpoint - user needs to test both spam and legitimate submissions end-to-end with n8n running. This verification has NOT been completed yet (checkpoint gate).

## Next Phase Readiness

**Ready for Phase 5 (Storage):** Conditional routing complete, spam and legitimate submissions take different execution paths. Phase 5 can add Google Sheets storage with spam flag column.

**Checkpoint pending:** Task 3 (human verification) must be completed before moving to Phase 5. User needs to verify:
- Legitimate submissions route to Success Response branch
- Spam submissions route to Spam Response branch
- Frontend displays appropriate UI for each path
- All routing visible in n8n execution history

---

## Self-Check: PASSED

**Files verified:**

- FOUND: workflows/contact-form-ai.json
- FOUND: public/script.js
- FOUND: public/index.html
- FOUND: public/styles.css

**Commits verified:**

- FOUND: 7e3c829 (Task 1)
- FOUND: 2eb57bd (Task 2)
- FOUND: 6e9de14 (Compatibility fix)

All claimed files and commits exist in the repository.

---
*Phase: 04-conditional-routing*
*Completed: 2026-02-09*
