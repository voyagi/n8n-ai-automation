# n8n Workflow: Contact Form AI Automation

## Quick Import

1. Start n8n: `npm run n8n` (opens at [http://localhost:5678](http://localhost:5678))
2. Log in with your n8n credentials
3. Go to **Workflows** > **Import from File**
4. Select `contact-form-ai.json`
5. The workflow imports with 17 nodes + 5 sticky notes

## Required Credentials

Before activating the workflow, create these credentials in **Settings > Credentials**:

| # | Credential Type | Name in Workflow | Setup Steps |
|---|----------------|------------------|-------------|
| 1 | **Header Auth** | Webhook Header Auth | Create new Header Auth credential. Set Header Name: `X-Webhook-Auth`, Header Value: generate a secure token (e.g., `openssl rand -hex 32`). Copy the same token to your `.env` file as `WEBHOOK_AUTH_TOKEN`. |
| 2 | **OpenAI API** | OpenAI API | Create new OpenAI credential. Paste your API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys). Requires GPT-4 access. |
| 3 | **Google Sheets OAuth2** | Google OAuth2 | Create new Google Sheets credential. Follow OAuth2 flow to authorize your Google account. Create a spreadsheet named "Contact Form Submissions" with columns: Submitted At, Name, Email, Subject, Message, Category, Summary, Spam Score, Spam Reason, Draft Response, Is Spam, Warnings. |
| 4 | **Slack API** | Slack Bot Token | Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps). Add `chat:write` scope. Install to workspace. Copy Bot User OAuth Token to credential. Set channel in the Slack node. |

## After Import Checklist

- [ ] Create all 4 credentials above
- [ ] Assign credentials to nodes (click each node, select the credential from dropdown)
- [ ] Update Google Sheets node with your spreadsheet name/ID
- [ ] Update Slack node with your channel name (in the node parameters, not credential)
- [ ] Update Email node with recipient address (fromEmail and toEmail fields)
- [ ] Activate the workflow (toggle in top-right)
- [ ] Test with: `curl -X POST http://localhost:5678/webhook/contact-form -H "Content-Type: application/json" -H "X-Webhook-Auth: YOUR_TOKEN" -d '{"name":"Test User","email":"test@example.com","subject":"Test Subject","message":"This is a test message"}'`

## Troubleshooting

**"Credential not found" error on import:**

This is normal. n8n exports credential names but not secrets. Create the credentials first, then assign them to the nodes.

**Workflow doesn't trigger:**

1. Ensure workflow is active (green toggle in top-right)
2. Check webhook URL matches what your form sends to
3. Verify X-Webhook-Auth header value matches between credential and client
4. Check n8n logs for incoming requests

**OpenAI returns errors:**

1. Verify API key is valid and has GPT-4 access
2. Check account has sufficient credits
3. AI fallback handler will inject defaults if OpenAI is down (category: general_inquiry, spam_score: 0)

**Google Sheets errors:**

1. Verify OAuth2 credential is authorized
2. Check spreadsheet ID is correct in the Google Sheets node
3. Ensure sheet name matches (default: "Sheet1")
4. Verify all column headers exist in the spreadsheet

**Slack notification not sent:**

1. Verify Slack app has `chat:write` scope
2. Check Bot User OAuth Token is correct
3. Ensure channel ID/name is valid and bot is invited to the channel
4. Notifications are fire-and-forget — failures won't block the form response

**Email notification not sent:**

1. Verify SMTP credential is configured correctly
2. Check SMTP server allows authentication
3. Test with a simple email first
4. Notifications are fire-and-forget — failures won't block the form response

## Workflow Structure

17 processing nodes + 5 annotation sticky notes:

**Trigger:**

- Webhook (POST /contact-form)

**Validation:**

- Normalize Fields (Set node extracts and normalizes form fields)
- Validate Fields (If node checks required fields and email format)
- Error Response (Set node creates validation error message)
- Validation Error (Respond to Webhook with 400 status)

**AI Analysis:**

- Analyze Contact Form (HTTP Request to OpenAI API)
- Parse AI Response (Code node parses JSON response)
- AI Fallback Handler (Code node provides defaults if AI fails)

**Routing:**

- Route by Spam Score (Switch node routes by spam_score > 70%)

**Spam Branch:**

- Flag as Spam (Code node sets is_spam: true, warnings: 'None')
- Spam Response (Respond to Webhook with spam flag)

**Legitimate Branch:**

- Flag as Legitimate (Code node sets is_spam: false)
- Send Slack Notification (Slack node with rich attachment)
- Send Email Notification (Email Send node with HTML email)
- Build Warnings (Code node aggregates AI/Slack/Email failures)
- Success Response (Respond to Webhook with AI analysis)

**Logging:**

- Log to Google Sheets (Both branches converge here)

**Sticky Notes (visual annotations):**

- Workflow Overview
- Input & Validation
- AI Analysis
- Spam Routing
- Logging & Notifications

## Credential Assignment After Import

After importing the workflow, you'll need to manually assign credentials to these nodes:

1. **Webhook** → Assign "Webhook Header Auth" (Header Auth credential)
2. **Analyze Contact Form** → Assign "OpenAI API" (OpenAI API credential)
3. **Log to Google Sheets** → Assign "Google OAuth2" (Google Sheets OAuth2 credential)
4. **Send Slack Notification** → Assign "Slack Bot Token" (Slack API credential)
5. **Send Email Notification** → Assign "SMTP Account" (SMTP credential)

## Testing

Test the workflow with various scenarios:

**Legitimate submission (support):**

```bash
curl -X POST http://localhost:5678/webhook/contact-form \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Auth: YOUR_TOKEN" \
  -d '{"name":"John Doe","email":"john@example.com","subject":"Login issue","message":"I cannot log in to my account. Getting error: Invalid credentials."}'
```

**Legitimate submission (sales):**

```bash
curl -X POST http://localhost:5678/webhook/contact-form \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Auth: YOUR_TOKEN" \
  -d '{"name":"Jane Smith","email":"jane@example.com","subject":"Pricing question","message":"What are your enterprise pricing plans?"}'
```

**Spam submission:**

```bash
curl -X POST http://localhost:5678/webhook/contact-form \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Auth: YOUR_TOKEN" \
  -d '{"name":"SEO Expert","email":"seo@spam.com","subject":"Boost your traffic","message":"We can increase your website traffic by 1000%! Click here for more info."}'
```

**Validation error:**

```bash
curl -X POST http://localhost:5678/webhook/contact-form \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Auth: YOUR_TOKEN" \
  -d '{"name":"","email":"invalid","subject":"Test","message":""}'
```

## Demo for Portfolio

This workflow is designed as a portfolio piece for Upwork. For demo purposes:

1. Record a screen capture showing:
   - The workflow canvas with sticky notes visible
   - A form submission going through
   - Real-time execution highlighting in n8n
   - The Google Sheets log updating
   - The Slack notification arriving

2. Export clean screenshots:
   - Workflow canvas (full view)
   - Individual sticky note close-ups
   - Slack notification example
   - Google Sheets with sample data

3. Highlight to potential clients:
   - AI integration for intelligent routing
   - Error handling and graceful degradation
   - Multi-channel notifications
   - Visual workflow documentation (sticky notes)
   - Production-ready patterns (auth, validation, logging)
