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

**Important:** Any auth token in client-side JavaScript is visible to
anyone inspecting the page source. Header auth here acts as a basic
filter to prevent casual abuse, not as real authentication. For
production use, consider server-side form handling or rate limiting.

## Threat Model

This section maps relevant OWASP Top 10 risks to this project.

### Addressed Threats

| Threat | Mitigation |
|---|---|
| **Injection (A03)** | Server-side field validation in n8n. HTML entity escaping in email templates. CSP headers block inline script execution. |
| **Security Misconfiguration (A05)** | Restrictive CSP in `serve.json`. Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy). |
| **Vulnerable Components (A06)** | Dependency overrides patch known CVEs. Zero client-side npm dependencies. Trivy scanning in CI. |
| **Identification Failures (A07)** | Webhook requires Header Auth token. CORS restricts allowed origins. |
| **Data Integrity Failures (A08)** | Input validation on both client and server. JSON-only request body parsing. |

### Accepted Risks (Demo Scope)

| Risk | Rationale |
|---|---|
| **Client-side auth token** | Visible in page source. Acceptable for demo. Production requires a server-side proxy. |
| **No rate limiting** | Webhook accepts unlimited requests. See Rate Limiting section below. |
| **No CSRF protection** | Stateless webhook with no session cookies. CORS + auth header provide baseline protection. |
| **AI fail-open** | AI failure defaults to non-spam (spam_score=0). During OpenAI outage, spam passes through with notifications. Acceptable for demo, production should queue for manual review. |

## Rate Limiting

The webhook endpoint has no built-in rate limiting. For production
deployments, choose one of these approaches:

**Option 1 - Reverse proxy (recommended):**

Place nginx or Caddy in front of n8n with rate limiting rules:

```nginx
# nginx: 10 requests/minute per IP
limit_req_zone $binary_remote_addr zone=webhook:10m rate=10r/m;
location /webhook/contact-form {
    limit_req zone=webhook burst=5 nodelay;
    proxy_pass http://localhost:5678;
}
```

**Option 2 - n8n environment variables:**

```env
N8N_RATE_LIMIT_ENABLED=true
N8N_RATE_LIMIT_REQUESTS_PER_MINUTE=30
```

**Option 3 - Application-level:**

Add a Code node after the webhook that tracks submissions per IP using
n8n's static data and rejects excessive requests.

## Secrets Rotation

Rotate credentials on this schedule for production deployments:

| Credential | Frequency | Procedure |
|---|---|---|
| Webhook auth token | Every 90 days | Generate new token, update n8n Header Auth credential, update `CONFIG.webhookAuth` in script.js, deploy updated frontend. |
| OpenAI API key | Every 90 days or on suspected compromise | Generate new key in OpenAI dashboard, update `.env`, restart n8n. |
| Google OAuth2 | Auto-refreshes, revoke on compromise | Re-authorize in n8n credential store if revoked. |
| Slack bot token | On compromise only | Regenerate in Slack app settings, update n8n credential. |
| SMTP password | Per organization policy | Update in n8n credential store. |

## .env Protection

The `.env` file is listed in `.gitignore` and must never be committed.
To verify this is working:

```bash
git status --short .env
```

If `.env` appears in the output, it is being tracked. Stop and fix
`.gitignore` before committing.

## CORS Configuration

The `.env` file configures allowed origins via `N8N_ALLOWED_CORS_ORIGINS`.
Default value for local development: `http://localhost:3000`.

For production, set this to your form's actual domain:

```env
N8N_ALLOWED_CORS_ORIGINS=https://yourdomain.com
```

Never use `*` (wildcard) in production, as it allows any website to
submit to your webhook.

## Pre-Deployment Checklist

- [ ] Replace `demo-token-2026` with a strong webhook token
- [ ] Replace `localhost:5678` webhook URL with production URL
- [ ] Rotate any API keys that were used during development
- [ ] Verify `.env` is not tracked by git
- [ ] Configure n8n credentials through the UI (not in workflow JSON)
- [ ] Review CORS origins in `.env` (`N8N_ALLOWED_CORS_ORIGINS`)
- [ ] Enable rate limiting (see Rate Limiting section above)
- [ ] Set up a secrets rotation schedule (see Secrets Rotation above)

## Vulnerability Reporting

If you discover a security vulnerability in this project:

1. **Do not** open a public GitHub issue
2. Email the maintainer with details of the vulnerability
3. Include steps to reproduce and potential impact
4. Allow 48 hours for initial response

For vulnerabilities in n8n itself, report to
[n8n's security policy](https://github.com/n8n-io/n8n/security/policy).
