# Security

## Credential Setup

This project requires several credentials to function. None are stored in
source code. All secrets must live in your local `.env` file or in the
n8n credential store.

### Required Credentials

| Credential | Where to configure | Used by |
|---|---|---|
| OpenAI API key | `.env` as `OPENAI_API_KEY` | n8n OpenAI node |
| Webhook auth token | n8n Header Auth credential | Webhook node + form `CONFIG.webhookAuth` |
| Google OAuth2 | n8n credential store | Google Sheets node |
| Slack bot token | n8n credential store | Slack notification node |
| SMTP account | n8n credential store | Email notification node |

### Demo Placeholder

The file `public/script.js` contains `webhookAuth: "demo-token-2026"`.
This is a **demo placeholder** for local development only. Before any
production deployment:

1. Create a Header Auth credential in n8n with a strong, unique token
2. Update `CONFIG.webhookAuth` in `script.js` to match
3. Never reuse this demo value

## .env Protection

The `.env` file is listed in `.gitignore` and must never be committed.
To verify this is working:

```bash
git status --short .env
```

If `.env` appears in the output, it is being tracked. Stop and fix
`.gitignore` before committing.

## Pre-Deployment Checklist

- [ ] Replace `demo-token-2026` with a strong webhook token
- [ ] Replace `localhost:5678` webhook URL with production URL
- [ ] Rotate any API keys that were used during development
- [ ] Verify `.env` is not tracked by git
- [ ] Configure n8n credentials through the UI (not in workflow JSON)
- [ ] Review CORS origins in `.env` (`N8N_ALLOWED_CORS_ORIGINS`)
