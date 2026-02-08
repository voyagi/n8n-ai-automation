# Phase 2: Webhook Integration - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>

## Phase Boundary

Connect the HTML contact form to an n8n webhook so form submissions flow into the workflow for processing. The webhook receives form data, normalizes it via a Set node, and returns the AI processing result to the form. Creating the AI processing itself is Phase 3.

</domain>

<decisions>

## Implementation Decisions

### Response timing

- Webhook waits for the full AI pipeline to complete before responding (synchronous)
- Form shows loading state during processing (disable button + spinner)
- On success, display AI analysis back to the user: category + estimated response time (e.g., "Categorized as: Sales inquiry. Expected response: within 24 hours.")
- 15-second timeout before showing a timeout error
- After success, show results with a "Send another" button — don't auto-reset the form

### Payload enrichment

- Keep original form field names: name, email, subject, message
- Add a submission timestamp in the Set node (single metadata addition)
- No other metadata (user-agent, source URL, etc.)

### Server-side validation

- Set node validates incoming data (defense-in-depth alongside client-side validation)
- On validation failure, return 400 status + error message to the form
- Form displays the server-side error to the user

### Webhook URL strategy

- Webhook path: `/webhook/contact-form`
- CONFIG object at the top of script.js holds the webhook URL (clearly separated, easy to find)
- Use n8n production URL (requires workflow activation — more realistic demo)
- Header-based authentication: form sends a secret header, webhook checks it

### Error experience

- n8n unreachable: friendly error message + retry button ("Something went wrong. Please try again.")
- Preserve form input on error, clear fields only on successful submission
- Disable submit button + show spinner while waiting for response (prevents double-submit)
- After success: display AI results, show "Send another" button to manually reset

### Claude's Discretion

- Exact error message wording for different failure modes (timeout vs server error vs validation)
- Loading spinner implementation details
- Auth header name and secret value format
- Set node field mapping configuration

</decisions>

<specifics>

## Specific Ideas

- Success response should show category + estimated response time — clean and professional, not overwhelming
- The "Send another" button keeps the AI analysis visible longer for demo impact
- Header auth shows security awareness to Upwork clients without overcomplicating the demo

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-webhook-integration*
*Context gathered: 2026-02-08*
