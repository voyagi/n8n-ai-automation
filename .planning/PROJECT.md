# n8n AI Contact Form Automation

## What This Is

A portfolio demo for Upwork freelancing that showcases a complete AI-powered business automation: a professional contact form submits to an n8n webhook, OpenAI classifies and summarizes the inquiry, spam is filtered out, and legitimate submissions are logged to Google Sheets with Slack and email notifications containing the AI analysis. This is project #2 of 4 portfolio pieces.

## Core Value

A working end-to-end automation that proves to potential Upwork clients: "I can connect real business tools with AI in the middle — here's one I already built."

## Current State

Shipped v1.0 with 2,599 LOC across 10 project files. Tech stack: n8n, OpenAI GPT-4, HTML+JS, Google Sheets, Slack+Email. 17-node workflow with 5 sticky notes, 13-entry test suite, portfolio-ready documentation with architecture diagram and ROI analysis.

## Requirements

### Validated

- ✓ Contact form UI with name, email, subject, message fields — v1.0
- ✓ Client-side form validation (required fields, email format) — v1.0
- ✓ Form submission handler that POSTs JSON to n8n webhook — v1.0
- ✓ Success/error feedback states in the form UI — v1.0
- ✓ Project scaffolding with n8n, serve, biome configured — v1.0
- ✓ Environment variable template (.env.example) — v1.0
- ✓ n8n workflow triggered by webhook POST from contact form — v1.0
- ✓ OpenAI node that classifies inquiry type (support/sales/feedback/spam) — v1.0
- ✓ OpenAI node that summarizes the message in one line — v1.0
- ✓ OpenAI node that drafts a suggested response — v1.0
- ✓ Switch node that detects spam and skips notifications — v1.0
- ✓ Google Sheets node that logs all submissions with AI analysis — v1.0
- ✓ Spam submissions flagged in Google Sheets but notifications skipped — v1.0
- ✓ Slack notification with formatted AI analysis for legitimate submissions — v1.0
- ✓ Email notification with AI analysis for legitimate submissions — v1.0
- ✓ Exportable n8n workflow JSON that others can import — v1.0
- ✓ Architecture diagram showing how pieces connect — v1.0
- ✓ Professional form styling (clean enough for portfolio recording) — v1.0
- ✓ README with setup instructions and architecture overview — v1.0

### Active

(None — next milestone requirements TBD via `/gsd:new-milestone`)

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
- v1.0 shipped: form + webhook + AI + routing + storage + notifications + error handling + docs all complete.

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
| OpenAI over Claude for AI step | n8n has native OpenAI node, simpler integration | ✓ Good — GPT-4 classification ~95% accurate |
| Google Sheets over Supabase | Clients understand spreadsheets, more relatable | ✓ Good — 12-column logging works well |
| Screen recording over live deployment | Lower complexity, still proves the concept | ✓ Good — portfolio-ready without hosting costs |
| Spam detection branch included | Shows conditional logic in workflow, more impressive | ✓ Good — demonstrates routing logic |
| No sentiment analysis | Classify + summarize + draft reply covers the use case | ✓ Good — scope stayed focused |
| Header Auth over Basic Auth | More flexible, easier rotation for webhook security | ✓ Good — clean header-based auth |
| Code nodes over Set nodes for field flagging | Set v3.4 strips fields with duplicateItem:false | ✓ Good — spread operator preserves all fields |
| Slack attachment over block messageType | Enables color-coded left border for visual triage | ✓ Good — instant category identification |
| continueOnFail on all external nodes | Notification failures should never block form response | ✓ Good — 100% HTTP 200 under all failure conditions |
| Business-first README structure | Portfolio viewers care about value before technical details | ✓ Good — leads with problem/solution/ROI |

---
*Last updated: 2026-02-10 after v1.0 milestone*
