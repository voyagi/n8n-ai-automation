# Stack Research

**Domain:** n8n AI Automation Workflows
**Researched:** 2026-02-08
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| n8n | 1.82.0+ | Workflow automation platform | Industry-standard visual workflow builder with native AI node support, 350+ integrations, active community, and JSON workflow export. Already scaffolded in project. |
| OpenAI API | GPT-4o-mini | AI text analysis (sentiment, classification, summarization) | Cost-effective at $0.15/1M input tokens vs GPT-4o's $2.50/1M. 16x cheaper with same 128K context window. Sufficient for contact form classification tasks. |
| Google Sheets API | v4 | Data logging and storage | Built-in n8n node with OAuth2/Service Account auth. No additional database setup. Spreadsheet interface familiar to non-technical users. |
| Slack Incoming Webhooks | Current | Real-time notifications | Simple webhook-based notifications. No complex OAuth flow needed for outbound messages. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| serve | ^14.2.4 | Static file server for HTML form | Already in package.json. Simple HTTP server for local development and form hosting. |
| @biomejs/biome | 2.0.0 | Linting and formatting | Already in package.json. Replaces ESLint + Prettier with single fast tool. |

### n8n Workflow Nodes

| Node Type | Purpose | Configuration Notes |
|-----------|---------|---------------------|
| Webhook Trigger | Receive form POST submissions | Use POST method, JSON response mode, path `/contact` |
| Set Node | Extract and format form data | Map `name`, `email`, `message` fields before AI processing |
| OpenAI Node | AI analysis (sentiment, category, summary, draft reply) | Use "Generate a Chat Completion" operation with gpt-4o-mini model |
| Switch Node | Route based on spam classification | Multiple output branches (spam/not-spam). Fallback to "ignore item" |
| Google Sheets Node | Log processed submissions | Use "Append Row" operation with OAuth2 or Service Account credentials |
| Slack Node | Send notification with AI insights | Use Slack Incoming Webhook (simpler than App auth for outbound-only) |
| Send Email Node | Auto-reply to sender | Use SMTP credentials (SendGrid/SES recommended over Gmail SMTP) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| n8n CLI | Run workflow automation server | `npx n8n start` - opens at http://localhost:5678 |
| npm scripts | Development workflow commands | `npm run dev` for form, `npm run n8n` for automation server |

## Installation

```bash
# Core (already installed)
npm install n8n@^1.82.0

# Supporting (already installed)
npm install serve@^14.2.4

# Dev dependencies (already installed)
npm install -D @biomejs/biome@2.0.0
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| OpenAI GPT-4o-mini | OpenAI GPT-4o | Use GPT-4o only if classification accuracy is insufficient with mini. For contact form analysis, mini is adequate and 16x cheaper. |
| Google Sheets | Supabase/PostgreSQL | Use database if handling >10K submissions or need relational queries. For portfolio demo, Sheets is simpler and more visual. |
| Slack Incoming Webhook | Slack App OAuth | Use App OAuth only if you need bidirectional communication (reading messages, responding to commands). For notifications only, webhooks are simpler. |
| Send Email Node (SMTP) | SendGrid Node | Use SendGrid node if you need advanced features (templates, analytics, list management). SMTP is sufficient for simple auto-replies. |
| Switch Node | IF Node | Use IF node only if you have exactly 2 branches (true/false). Switch node supports multiple categories (spam/sales/support/feedback). |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Gmail SMTP for production | Gmail frequently blocks SMTP from servers, unreliable for automated workflows | SendGrid ($0 free tier 100 emails/day) or AWS SES |
| OpenAI Assistants API | Being deprecated by OpenAI. n8n removed support in v1.117.0 | OpenAI Chat Completion API (standard text generation) |
| Slack OAuth App (for outbound-only) | Complex setup, token rotation issues after 12 hours, overkill for notifications | Slack Incoming Webhook (one URL, no expiration) |
| ESLint + Prettier | Replaced by Biome in modern projects. Slower, more configuration | Biome (already configured in project) |
| n8n default Google credentials | Free tier limitation, may hit rate limits | Custom Google OAuth2 app or Service Account for production |

## Stack Patterns by Variant

**If spam detection is critical:**
- Use OpenAI GPT-4o (not mini) for better classification accuracy
- Add Function Calling to force structured JSON output with confidence scores
- Consider adding second AI call to verify spam classification

**If cost is primary concern:**
- Use GPT-4o-mini for all operations
- Cache OpenAI prompt instructions (reduce input tokens by ~50%)
- Log to Google Sheets (free) instead of paid database

**If handling sensitive data (PII, GDPR):**
- Replace Google Sheets with self-hosted PostgreSQL or Supabase
- Use environment variables for all credentials (never hardcode)
- Enable n8n credential encryption at rest
- Consider OpenAI zero-retention mode (request via support)

**If scaling beyond portfolio demo:**
- Migrate from Google Sheets to PostgreSQL/Supabase
- Add rate limiting on webhook trigger (prevent abuse)
- Implement error handling nodes for AI API failures
- Use n8n queue mode for async processing

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| n8n@1.82.0 | OpenAI API gpt-4o-mini | Fully supported. n8n 1.117.0+ removes deprecated Assistants API but Chat Completions remain stable. |
| n8n@1.82.0 | Google Sheets API v4 | Built-in node supports OAuth2 and Service Account auth methods. |
| n8n@1.82.0 | Slack Incoming Webhooks | Stable webhook format. No version conflicts. |
| serve@14.2.4 | Node.js 18+ | Works with modern Node.js versions. No conflicts with n8n. |

## OpenAI Model Selection

### GPT-4o-mini (Recommended for this project)
- **Pricing:** $0.15/1M input tokens, $0.60/1M output tokens
- **Context:** 128K tokens
- **Speed:** Fastest
- **Use case:** Contact form classification, sentiment analysis, summarization
- **Expected cost:** ~$0.01 per 100 form submissions (assuming 500 tokens in + 200 tokens out per submission)

### GPT-4o (Premium alternative)
- **Pricing:** $2.50/1M input tokens, $10.00/1M output tokens
- **Context:** 128K tokens
- **Intelligence:** Highest
- **Use case:** Only if GPT-4o-mini accuracy is insufficient after testing
- **Expected cost:** ~$0.17 per 100 form submissions (16x more expensive)

## Authentication Requirements

### OpenAI
- **Method:** API Key
- **Setup:** Sign up at platform.openai.com, create API key under "API Keys"
- **Storage:** Add to n8n credentials manager (type: OpenAI)
- **Security:** Never commit to git. Use environment variable `OPENAI_API_KEY` in production.

### Google Sheets
- **Method 1 (Development):** OAuth2 Single Service
  - Create Google Cloud project
  - Enable Google Sheets API
  - Create OAuth2 credentials (client ID + secret)
  - Configure redirect URI: `http://localhost:5678/rest/oauth2-credential/callback`
  - Store in n8n credentials manager

- **Method 2 (Production):** Service Account
  - Create service account in Google Cloud Console
  - Download JSON key file
  - Share spreadsheet with service account email
  - Upload JSON to n8n credentials (type: Google Service Account)
  - More reliable for automation (no token expiration)

### Slack
- **Method:** Incoming Webhook URL
- **Setup:**
  1. Go to https://api.slack.com/apps
  2. Create new app or select existing
  3. Features > Incoming Webhooks > Activate
  4. "Add New Webhook to Workspace" > Select channel
  5. Copy webhook URL (format: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`)
- **Storage:** Store URL in n8n credentials or environment variable `SLACK_WEBHOOK_URL`
- **Security:** Never commit to git. Treat like API key.

### Email (SMTP)
- **Recommended:** SendGrid Free Tier
  - Sign up at sendgrid.com
  - Verify sender email address
  - Create API key (Settings > API Keys)
  - Use in n8n SMTP credentials:
    - Host: `smtp.sendgrid.net`
    - Port: `587`
    - User: `apikey` (literal string)
    - Password: `[your-api-key]`
    - TLS: Enabled

- **Alternative:** AWS SES
  - Lower cost at scale
  - Requires SMTP credentials from AWS Console
  - May require sandbox exit approval

## n8n Workflow Structure

```
1. Webhook Trigger (POST /contact)
   ↓
2. Set Node (extract: name, email, message)
   ↓
3. OpenAI Node (GPT-4o-mini)
   Prompt: "Analyze this contact form submission. Return JSON with:
   - sentiment: positive/negative/neutral
   - category: support/sales/feedback/spam
   - summary: one sentence
   - suggested_reply: professional draft response"
   ↓
4. Switch Node (route by category)
   ├─ Case: spam
   │  ↓
   │  Google Sheets Node (append with spam=true flag)
   │  ↓
   │  Stop (no notification)
   │
   └─ Default (not spam)
      ↓
      Google Sheets Node (append with AI analysis)
      ↓
      Slack Node (send notification with summary)
      ↓
      Send Email Node (auto-reply to sender)
```

## Error Handling Best Practices

1. **OpenAI Node:**
   - Configure retry: 3 attempts with exponential backoff
   - Set timeout: 30 seconds
   - Add error route to log failures to separate Google Sheet tab

2. **Google Sheets Node:**
   - Pre-create spreadsheet with headers: `timestamp, name, email, message, sentiment, category, summary, spam_flag`
   - Use "Append Row" (never "Update Row" which fails if row doesn't exist)
   - Grant edit permissions to service account or OAuth user

3. **Slack Node:**
   - Use webhook URL (more reliable than OAuth for notifications)
   - Format message with Slack markdown for readability
   - Include link to Google Sheets row for easy access

4. **Send Email Node:**
   - Use try/catch via error workflow
   - Don't block main workflow if email fails
   - Log email send failures to Sheets

## Workflow Export/Import

- **Format:** JSON
- **Export:** n8n UI → (three dots) → Download → `contact-form-ai.json`
- **Import:** n8n UI → Workflows → Import from File/URL
- **Security:** Exported JSON includes credential names but NOT credential values. Recipients must configure their own credentials.
- **Portability:** Workflow JSON is cross-platform. Works on Windows, Linux, macOS, Docker, n8n Cloud.

## Sources

**n8n Core Documentation:**
- [n8n Release Notes](https://docs.n8n.io/release-notes/) — Version information and updates
- [n8n Google Sheets Node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/) — Official node documentation
- [n8n Switch Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.switch/) — Conditional branching
- [n8n Send Email Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.sendemail/) — SMTP configuration
- [n8n Workflow Export/Import](https://docs.n8n.io/workflows/export-import/) — JSON workflow format

**OpenAI Integration:**
- [n8n OpenAI Node Documentation](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/) — MEDIUM confidence (doc structure verified via WebSearch)
- [OpenAI Pricing 2026](https://openai.com/api/pricing/) — HIGH confidence (official pricing page)
- [GPT-4o mini vs GPT-4o Comparison](https://platform.openai.com/docs/models/compare?model=gpt-4o-mini) — HIGH confidence (official OpenAI docs)
- [n8n OpenAI Integration Guide 2026](https://hatchworks.com/blog/ai-agents/n8n-guide/) — MEDIUM confidence (verified patterns match official docs)

**Google Sheets Integration:**
- [Google Sheets Sheet Operations](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/sheet-operations/) — HIGH confidence (official n8n docs via WebFetch)
- [n8n Google Sheets Integration Guide](https://www.codecademy.com/article/n8n-google-sheets-integration) — MEDIUM confidence (community resource)

**Slack Integration:**
- [n8n Slack Credentials](https://docs.n8n.io/integrations/builtin/credentials/slack/) — HIGH confidence (official docs)
- [Webhook vs App Authentication](https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.slacktrigger/) — HIGH confidence (official docs via WebSearch)

**Workflow Patterns:**
- [n8n AI Workflow Design 2026](https://medium.com/@aksh8t/n8n-workflow-automation-the-2026-guide-to-building-ai-powered-workflows-that-actually-work-cd62f22afcc8) — MEDIUM confidence (recent community guide, patterns align with official docs)
- [n8n Error Handling Patterns](https://evalics.com/blog/n8n-workflow-design-patterns-error-handling-production-setup) — MEDIUM confidence (best practices guide)

**Email Configuration:**
- [SendGrid Node Documentation](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.sendgrid/) — HIGH confidence (official n8n docs)
- [n8n Email Notifications Tutorial](https://www.rapidevelopers.com/n8n-tutorial/how-to-send-email-notifications-in-n8n) — MEDIUM confidence (community tutorial)

---
*Stack research for: n8n AI Automation Workflows (Contact Form Processing)*
*Researched: 2026-02-08*
*Confidence: HIGH (core technologies verified via official docs), MEDIUM (integration patterns verified via community resources + official docs)*
