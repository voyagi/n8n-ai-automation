# External Integrations

**Analysis Date:** 2026-02-08

## APIs & External Services

**AI Processing:**
- OpenAI API - Used by n8n's OpenAI node for sentiment analysis, category classification, text summarization, and draft response generation
  - SDK/Client: n8n built-in OpenAI node (no direct SDK in project)
  - Auth: `OPENAI_API_KEY` environment variable

**Notifications:**
- Slack - Incoming webhooks for notification delivery
  - SDK/Client: n8n built-in Slack node
  - Auth: `SLACK_WEBHOOK_URL` environment variable (format: `https://hooks.slack.com/services/...`)

**Email:**
- Email delivery via n8n (implementation method TBD - could be SMTP or cloud provider)
  - SDK/Client: n8n built-in Email node
  - Auth: Configured via n8n UI (Credentials section)

## Data Storage

**Databases:**
- Google Sheets (primary planned storage per CLAUDE.md)
  - Connection: Google service account credentials
  - Client: n8n built-in Google Sheets node
  - Auth: `GOOGLE_SHEETS_CREDENTIALS` environment variable (service account JSON)
- Alternative: Supabase (mentioned as option in CLAUDE.md but not yet implemented)

**File Storage:**
- Local filesystem only during development (form data submitted as JSON to n8n webhook)

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- Custom basic auth for n8n dashboard
  - Implementation: n8n built-in basic auth
  - Env vars: `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD`

## Monitoring & Observability

**Error Tracking:**
- None detected; errors logged to browser console and n8n execution logs

**Logs:**
- n8n execution logs viewable in web UI
- Browser console logging in `public/script.js` for form submission errors

## CI/CD & Deployment

**Hosting:**
- Self-hosted n8n via npm (`npm run n8n`) opens at `http://localhost:5678`
- Alternative: n8n Cloud available
- Static form served via `serve` npm package at `http://localhost:3000`

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars:**
```
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=changeme
OPENAI_API_KEY=sk-...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
GOOGLE_SHEETS_CREDENTIALS=<service-account-json>
```

**Secrets location:**
- Local `.env` file (git-ignored via `.gitignore`)
- Template: `.env.example`

## Webhooks & Callbacks

**Incoming:**
- `POST http://localhost:5678/webhook/contact` - n8n webhook receives form submissions from `public/script.js`
  - Expected payload: `{ name, email, subject, message, timestamp }`

**Outgoing:**
- OpenAI API calls (n8n → OpenAI)
- Google Sheets API calls (n8n → Google)
- Slack webhook POST (n8n → Slack)
- Email delivery (n8n → SMTP/email provider)

---

*Integration audit: 2026-02-08*
