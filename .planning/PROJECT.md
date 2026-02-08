# n8n AI Contact Form Automation

## What This Is

A portfolio demo for Upwork freelancing that showcases a complete AI-powered business automation: a professional contact form submits to an n8n webhook, OpenAI classifies and summarizes the inquiry, spam is filtered out, and legitimate submissions are logged to Google Sheets with Slack and email notifications containing the AI analysis. This is project #2 of 4 portfolio pieces.

## Core Value

A working end-to-end automation that proves to potential Upwork clients: "I can connect real business tools with AI in the middle — here's one I already built."

## Requirements

### Validated

- [x] Contact form UI with name, email, subject, message fields — existing
- [x] Client-side form validation (required fields, email format) — existing
- [x] Form submission handler that POSTs JSON to n8n webhook — existing
- [x] Success/error feedback states in the form UI — existing
- [x] Project scaffolding with n8n, serve, biome configured — existing
- [x] Environment variable template (.env.example) — existing

### Active

- [ ] n8n workflow triggered by webhook POST from contact form
- [ ] OpenAI node that classifies inquiry type (support/sales/feedback/spam)
- [ ] OpenAI node that summarizes the message in one line
- [ ] OpenAI node that drafts a suggested response
- [ ] Switch node that detects spam and skips notifications
- [ ] Google Sheets node that logs all submissions with AI analysis
- [ ] Spam submissions flagged in Google Sheets but notifications skipped
- [ ] Slack notification with formatted AI analysis for legitimate submissions
- [ ] Email notification with AI analysis for legitimate submissions
- [ ] Exportable n8n workflow JSON that others can import
- [ ] Architecture diagram showing how pieces connect
- [ ] Professional form styling (clean enough for portfolio recording)
- [ ] README with setup instructions and architecture overview

### Out of Scope

- Deployment/hosting — local demo with screen recording only
- Auto-reply email to the form submitter — adds complexity without portfolio value
- Sentiment analysis — classify + summarize + draft reply is enough
- Supabase storage — Google Sheets is more relatable for clients
- OAuth/social login — not relevant to this demo
- Real-time chat or WebSocket features — overkill for a contact form demo

## Context

- This is an Upwork portfolio piece, not a production app. Polish matters for the demo recording, but production hardening doesn't.
- The target audience is non-technical business owners who want "automate my workflow with AI." They need to see real tools connected, not just code.
- n8n's visual workflow editor is a selling point — the workflow canvas screenshot is as important as the code.
- Full Upwork strategy document: `C:\Users\Eagi\Making money\side-projects\upwork-strategy.md`
- Existing scaffolding includes a working contact form UI, but the n8n workflow (the core deliverable) hasn't been built yet.

## Constraints

- **AI Provider**: OpenAI via n8n's native OpenAI node — simplest integration path
- **Storage**: Google Sheets — clients understand spreadsheets, more impressive than a database
- **Notifications**: Slack + email via n8n built-in nodes
- **Form**: Plain HTML + vanilla JS — intentionally simple, the n8n workflow is the star
- **Linter**: Biome (already configured) — no ESLint/Prettier
- **Demo format**: Local run + screen recording, not deployed

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| OpenAI over Claude for AI step | n8n has native OpenAI node, simpler integration | -- Pending |
| Google Sheets over Supabase | Clients understand spreadsheets, more relatable | -- Pending |
| Screen recording over live deployment | Lower complexity, still proves the concept | -- Pending |
| Spam detection branch included | Shows conditional logic in workflow, more impressive | -- Pending |
| No sentiment analysis | Classify + summarize + draft reply covers the use case | -- Pending |

---
*Last updated: 2026-02-08 after initialization*
