# Phase 3: AI Processing Core - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>

## Phase Boundary

OpenAI analyzes form submissions and returns classification, summary, and draft response. This phase builds the AI processing node(s) in the n8n workflow — prompt design, output structure, and response payload. Conditional routing (Phase 4), storage (Phase 5), and notifications (Phase 6) are separate phases.

</domain>

<decisions>

## Implementation Decisions

### Draft response style

- Tone: Professional & warm — business-friendly but not stiff, like a helpful customer success rep
- Length: Medium (4-6 sentences) — acknowledges the message, addresses the topic, suggests next steps
- Personalization: Echo back specifics from the original message ("Thanks for asking about [their topic]...")
- Vary by category: Yes — sales gets enthusiastic, support gets empathetic, feedback gets grateful, general inquiry gets helpful

### Classification boundaries

- Single primary category only — no secondary labels
- Five categories: support / sales / feedback / spam / general inquiry (added catch-all for ambiguous messages)
- Include classification confidence score (e.g., "sales: 85%")
- Sentiment analysis: Skipped — category + spam score + summary + draft is sufficient

### Spam sensitivity

- Conservative detection — only flag obvious spam, minimize false positives
- Spam definition: Obvious spam (gibberish, link farms) AND unsolicited marketing (SEO pitches, "boost your traffic" offers)
- Spam score includes a brief reason (e.g., "85% — Contains unsolicited SEO service pitch")
- Skip draft response generation for spam — save tokens and processing time

### Submitter-visible output

- Success card shows: AI summary + category label
- Draft reply stays internal (not shown to submitter)
- Spam submissions see the same "Message received!" card as everyone — don't tip off spammers
- Webhook response returns ALL AI fields (category, summary, spam score, draft) — frontend picks what to display

### Claude's Discretion

- Exact OpenAI prompt wording and structure
- Whether to use single or multiple OpenAI calls
- JSON output schema details
- Temperature and model parameter tuning
- Error handling for malformed AI responses

</decisions>

<specifics>

## Specific Ideas

- Draft responses should feel like they come from a real person, not a bot
- The portfolio demo should show that the AI "understood" the message — echoing back specifics is key
- Spam reason field is useful for reviewing false positives in the Google Sheet (Phase 5)

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-ai-processing-core*
*Context gathered: 2026-02-08*
