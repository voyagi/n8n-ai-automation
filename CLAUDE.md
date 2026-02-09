# n8n AI Automation — Upwork Portfolio Project

## Purpose

Portfolio demo for an Upwork freelancing profile. Demonstrates ability to
build AI-powered workflow automations using n8n. This is project #2 of 4
portfolio pieces.

Full Upwork strategy: `C:\Users\Eagi\Making money\side-projects\upwork-strategy.md`

## What to Build

A **contact form → AI processing → notification** automation pipeline:

1. **Trigger**: Simple HTML form submits to n8n webhook
2. **AI Processing**: n8n sends form data to OpenAI for:
   - Sentiment analysis (positive/negative/neutral)
   - Category classification (support / sales / feedback / spam)
   - Auto-generated summary
   - Suggested response draft
3. **Actions**:
   - Save processed result to a Google Sheet (or Supabase)
   - Send Slack/email notification with the AI analysis
   - If spam → flag and skip notification

### Why This Impresses Upwork Clients

- Shows real business automation (not toy example)
- Demonstrates AI integration in a workflow tool
- Easy to adapt: swap form for CRM trigger, swap Slack for Teams
- Clients can see the n8n workflow visually

## Project Structure

```
public/
  index.html          — Contact form (submits to n8n webhook)
  styles.css          — Simple styling
  script.js           — Form submission handler
workflows/
  contact-form-ai.json — Exportable n8n workflow
  README.md           — How to import the workflow into n8n
screenshots/
  workflow-editor.png  — n8n workflow canvas screenshot
  form-demo.png        — Form UI screenshot
  slack-notification.png — Example Slack notification
```

## Tech Stack

- **Automation**: n8n (self-hosted via npm or Docker)
- **AI**: OpenAI API (via n8n's OpenAI node)
- **Form**: Plain HTML + vanilla JS (intentionally simple)
- **Storage**: Google Sheets or Supabase (whichever is easier)
- **Notifications**: Slack webhook or email via n8n

## n8n Workflow Design

```
Webhook Trigger (POST /contact)
  → Set Node (extract name, email, message)
  → OpenAI Node (analyze: sentiment, category, summary, draft reply)
  → Switch Node
    → [spam] → Log to sheet with "spam" flag → Stop
    → [not spam] → Google Sheets Node (save processed data)
                  → Slack Node (send notification with AI analysis)
                  → Email Node (send auto-reply to sender)
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

- `N8N_BASIC_AUTH_USER` — n8n dashboard username
- `N8N_BASIC_AUTH_PASSWORD` — n8n dashboard password
- `OPENAI_API_KEY` — For the OpenAI node
- `SLACK_WEBHOOK_URL` — Slack incoming webhook
- `GOOGLE_SHEETS_CREDENTIALS` — Google service account JSON

## How to Run

```bash
# Start n8n locally
npm run n8n
# n8n opens at http://localhost:5678

# In another terminal, serve the form
npm run dev
# Form at http://localhost:3000

# Import workflow: n8n UI → Workflows → Import → paste workflows/contact-form-ai.json
```

## Demo Strategy

For the Upwork portfolio:

1. Screen-record yourself filling in the form
2. Show the n8n workflow processing in real-time
3. Show the Slack notification arriving
4. Screenshot the Google Sheet with processed entries
5. Export a clean workflow JSON that clients could import

## Browser Testing

For any task that requires visual verification, clicking, typing, form
testing, or seeing a rendered page: use the dev-browser skill in
`.claude/skills/dev-browser/`. Read its `SKILL.md` for the API.

- ALWAYS use extension mode (`npm run start-extension`) — connects to the
  user's Chrome, no separate window
- NEVER install Playwright MCP or write raw Playwright scripts
- Use `cdpScreenshot()` for screenshots (never `page.screenshot()`)
- Use `getIframeContent()` / `evaluateInIframe()` for cross-origin iframes
- If the skill isn't deployed yet, copy from
  `/c/Users/Eagi/.claude/skill-library/dev-browser/`
- **Never use `~` in bash paths** — MSYS expands to `/home/Eagi` not
  `/c/Users/Eagi`

## Commands

```bash
npm run n8n      # Start n8n server
npm run dev      # Serve the form locally
npm run check    # Biome check
```
