# Phase 06: Notification System - Research

**Researched:** 2026-02-09
**Domain:** n8n notification nodes (Slack, Email) with conditional execution
**Confidence:** MEDIUM

## Summary

Phase 6 implements Slack and email notifications for legitimate contact form submissions, using n8n's native Slack and Send Email nodes. The research reveals that n8n's Slack node supports Block Kit through multiple message types (text, block, attachment), with color-coded sentiment indicators achievable via legacy attachments. Email notifications can be formatted with HTML using standard n8n email node capabilities.

The key architectural decision is where to insert notifications in the existing workflow. Based on Phase 5's dual-branch convergence pattern (Flag nodes → Google Sheets → branch-specific response nodes), notifications should be added to the legitimate branch BEFORE the Success Response node, ensuring they execute only for non-spam submissions and don't block the HTTP response.

**Primary recommendation:** Use Slack node with "attachment" message type (not "block") to achieve color-coded bars. Use Send Email node with HTML format. Add both nodes between "Flag as Legitimate" and "Success Response" in parallel execution (both connected from Flag, both connecting to Success Response).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| n8n Slack node | v2.2+ | Send Slack notifications with Block Kit | Built-in node, supports all Slack message types |
| n8n Send Email | v2+ | Send HTML/text emails via SMTP | Built-in node, supports HTML templates and attachments |
| Slack Block Kit | Current | Rich message formatting | Official Slack UI framework for message composition |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| n8n HTML node | v1+ | Generate HTML email templates | When email needs dynamic content rendering |
| n8n Error Workflow | v1+ | Error handling for notification failures | Production deployments needing robust error recovery |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Slack node attachment type | Slack node block type | Block type has modern UI but NO color bar support (attachment is legacy but supports color parameter) |
| Send Email node | Gmail node | Gmail requires OAuth2 setup, Send Email uses simple SMTP (better for portfolio demo) |
| Inline notification retry | Error Workflow with retry logic | Error Workflow adds complexity, inline retry via node settings is simpler for demo |

**Installation:**
```bash
# No installation needed - both nodes are built-in to n8n
# Credentials required:
# - Slack: OAuth2 or Bot Token
# - Email: SMTP credentials (host, port, user, password)
```

## Architecture Patterns

### Recommended Project Structure
```
workflows/
├── contact-form-ai.json     # Main workflow (includes notification nodes)
└── error-handler.json       # Optional: Error workflow for notification failures
```

### Pattern 1: Conditional Notification Routing
**What:** Notifications execute ONLY for legitimate submissions by placing them on the legitimate branch after routing
**When to use:** When different submission types need different notification behavior (spam = silent, legitimate = notify)
**Example:**
```
Route by Spam Score
  → output 0 (spam) → Flag as Spam → Log to Google Sheets → Spam Response
  → output 1 (legitimate) → Flag as Legitimate → [SLACK NODE] → [EMAIL NODE] → Success Response
                                                 ↓                ↓
                                                 └────────────────┘
                                                 (parallel execution)
```

**Why parallel, not sequential:**
- Both notifications can execute simultaneously (no dependency)
- If one fails, the other still sends
- Faster execution (no blocking)
- HTTP response returns faster (not waiting for both sequentially)

### Pattern 2: Color-Coded Sentiment in Slack (Attachment Type)
**What:** Use Slack attachments with color parameter to show sentiment via left border color
**When to use:** When visual sentiment indication is required (requirement NOTF-01)
**Example:**
```javascript
// n8n Slack node configuration
// Message Type: "attachment"
// Attachments:
{
  "attachments": [
    {
      "color": "{{ $('Parse AI Response').item.json.sentiment === 'positive' ? 'good' : ($('Parse AI Response').item.json.sentiment === 'negative' ? 'danger' : 'warning') }}",
      "blocks": [
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "New Contact Form Submission"
          }
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": "*Name:*\n{{ $('Normalize Fields').item.json.name }}"
            },
            {
              "type": "mrkdwn",
              "text": "*Email:*\n{{ $('Normalize Fields').item.json.email }}"
            }
          ]
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": "*Category:*\n{{ $('Parse AI Response').item.json.category }}"
            },
            {
              "type": "mrkdwn",
              "text": "*Sentiment:*\n{{ $('Parse AI Response').item.json.sentiment }}"
            }
          ]
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*AI Summary:*\n{{ $('Parse AI Response').item.json.summary }}"
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*Suggested Response:*\n{{ $('Parse AI Response').item.json.draft_response }}"
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": "Submitted: {{ $('Normalize Fields').item.json.timestamp }}"
            }
          ]
        }
      ]
    }
  ]
}
```
**Source:** Derived from [Slack MessageAttachment API](https://docs.slack.dev/tools/node-slack-sdk/reference/types/interfaces/MessageAttachment/) and [n8n Slack node parameters](https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/Slack/V2/MessageDescription.ts)

**Color mapping for sentiment:**
- positive → "good" (green)
- negative → "danger" (red)
- neutral/mixed → "warning" (yellow)

### Pattern 3: HTML Email Template with AI Analysis
**What:** Use Send Email node with HTML format to send formatted notifications with AI data
**When to use:** When email notifications need visual structure (requirement NOTF-02)
**Example:**
```javascript
// n8n Send Email node configuration
// Email Format: "html"
// HTML:
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #4a90e2; color: white; padding: 20px; }
    .content { padding: 20px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #555; }
    .value { margin-top: 5px; }
    .sentiment-positive { color: #28a745; }
    .sentiment-negative { color: #dc3545; }
    .sentiment-neutral { color: #ffc107; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="header">
    <h2>New Contact Form Submission</h2>
  </div>
  <div class="content">
    <div class="field">
      <div class="label">Name:</div>
      <div class="value">{{ $('Normalize Fields').item.json.name }}</div>
    </div>
    <div class="field">
      <div class="label">Email:</div>
      <div class="value">{{ $('Normalize Fields').item.json.email }}</div>
    </div>
    <div class="field">
      <div class="label">Subject:</div>
      <div class="value">{{ $('Normalize Fields').item.json.subject }}</div>
    </div>
    <div class="field">
      <div class="label">Message:</div>
      <div class="value">{{ $('Normalize Fields').item.json.message }}</div>
    </div>
    <hr>
    <h3>AI Analysis</h3>
    <div class="field">
      <div class="label">Category:</div>
      <div class="value">{{ $('Parse AI Response').item.json.category }}</div>
    </div>
    <div class="field">
      <div class="label">Sentiment:</div>
      <div class="value sentiment-{{ $('Parse AI Response').item.json.sentiment }}">
        {{ $('Parse AI Response').item.json.sentiment }}
      </div>
    </div>
    <div class="field">
      <div class="label">Summary:</div>
      <div class="value">{{ $('Parse AI Response').item.json.summary }}</div>
    </div>
    <div class="field">
      <div class="label">Suggested Response:</div>
      <div class="value">{{ $('Parse AI Response').item.json.draft_response }}</div>
    </div>
    <div class="footer">
      Submitted: {{ $('Normalize Fields').item.json.timestamp }}
    </div>
  </div>
</body>
</html>
```
**Source:** Adapted from [n8n HTML email workflow template](https://n8n.io/workflows/1790-generate-dynamic-contents-for-emails-or-html-pages/) and [n8n Send Email docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.sendemail/)

### Anti-Patterns to Avoid
- **Sequential notification chaining:** Don't connect Slack → Email → Response. Use parallel execution (both from Flag, both to Response) to avoid blocking the HTTP response on notification completion.
- **Notification on spam branch:** Don't add notification nodes to the spam branch (output 0 from Route by Spam Score). This violates requirement NOTF-03.
- **Block Kit without attachment wrapper:** Don't use "block" message type for color indicators. Color parameter only exists in attachments. Use "attachment" type with blocks nested inside.
- **Hardcoded color values:** Don't use static colors. Map sentiment dynamically (positive=good, negative=danger, neutral=warning).
- **Missing fallback text:** Don't omit the `text` parameter in Slack attachments. It's required for notifications and accessibility.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slack message formatting | Custom JSON builder with string concatenation | Slack Block Kit Builder → copy JSON into n8n | Block Kit Builder validates structure, provides preview, catches errors |
| HTML email templates | String concatenation with escaped HTML | n8n HTML node or inline HTML in Send Email node | Built-in expression support, no escaping issues |
| Notification retry logic | Custom retry loops with Wait/Loop nodes | Node-level "Retry On Fail" setting in n8n | Exponential backoff, error tracking, simpler workflow |
| Email delivery tracking | Custom delivery confirmation logic | Send Email node's "Send and Wait for Response" operation | Built-in when supported by SMTP server |
| Sentiment color mapping | Multiple If nodes for color selection | Single ternary expression in attachment color field | Fewer nodes, easier to maintain |

**Key insight:** n8n's built-in node settings (retry, error handling, expressions) eliminate the need for custom control flow. Use expressions over additional nodes whenever possible to reduce workflow complexity.

## Common Pitfalls

### Pitfall 1: Slack Blocks Ignored (Only Text Displayed)
**What goes wrong:** Slack message displays only fallback text, blocks don't render
**Why it happens:** Using "block" message type instead of "attachment", or malformed JSON in blocks parameter
**How to avoid:**
  1. Use "attachment" message type (not "block") when color bars are needed
  2. Validate blocks JSON in Slack Block Kit Builder before pasting into n8n
  3. Always include `text` parameter as fallback (required even with blocks)
**Warning signs:** Slack notification appears as plain text only, no visual formatting visible
**Source:** [n8n community issue thread](https://community.n8n.io/t/slack-node-blocks-are-ignored-only-text-is-displayed-despite-successful-api-call/154767)

### Pitfall 2: Notifications Block HTTP Response
**What goes wrong:** Webhook response takes 3-5+ seconds, feels slow to user
**Why it happens:** Notifications are sequential (Slack → Email → Response) instead of parallel
**How to avoid:**
  1. Connect both notification nodes from same parent (Flag as Legitimate)
  2. Connect both notification nodes to same child (Success Response)
  3. This creates parallel execution: notifications run simultaneously, don't block response
**Warning signs:** Slow form submission on frontend, n8n execution shows sequential timing
**Source:** General n8n flow logic best practice from [workflow optimization discussions](https://community.n8n.io/t/pointers-on-slack-node-and-dynamic-messages/35498)

### Pitfall 3: Spam Submissions Send Notifications
**What goes wrong:** Spam messages trigger Slack/email alerts
**Why it happens:** Notifications added to wrong branch or before routing logic
**How to avoid:**
  1. Only add notification nodes AFTER "Route by Spam Score" node
  2. Only connect notifications to output 1 (legitimate) branch
  3. Never add notifications before routing or on output 0 (spam) branch
**Warning signs:** Receiving Slack/email for obvious spam submissions
**Source:** Requirement NOTF-03 and Phase 5 routing pattern

### Pitfall 4: Email HTML Not Rendering
**What goes wrong:** Email displays HTML source code instead of formatted content
**Why it happens:** Email Format set to "text" instead of "html", or recipient's email client blocks HTML
**How to avoid:**
  1. Set Email Format to "html" or "both" (not "text")
  2. Test with multiple email clients
  3. Provide meaningful plain-text fallback if using "both"
**Warning signs:** Email body shows `<div>` tags and HTML markup
**Source:** [n8n Send Email node documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.sendemail/)

### Pitfall 5: Missing Error Handling for Notification Failures
**What goes wrong:** Workflow execution fails entirely if Slack/Email node errors (API down, credentials expired, network issue)
**Why it happens:** No retry logic or error handling configured on notification nodes
**How to avoid:**
  1. Enable "Retry On Fail" in notification node settings (3-5 retries, 5-second wait)
  2. Set "Continue On Fail" to true if notifications are non-critical
  3. Optional: Create error workflow to log notification failures
**Warning signs:** Workflow shows error state, no response sent to user, all because Slack was temporarily down
**Source:** [n8n error handling best practices](https://docs.n8n.io/flow-logic/error-handling/) and [retry logic guide](https://prosperasoft.com/blog/automation-tools/n8n/n8n-error-handling-retry/)

## Code Examples

Verified patterns from official sources:

### Slack Node Configuration (Attachment with Blocks)
```json
{
  "parameters": {
    "select": "channel",
    "channelId": {
      "mode": "list",
      "value": "C0123456789",
      "cachedResultName": "#notifications"
    },
    "messageType": "attachment",
    "text": "New contact form submission received",
    "attachments": [
      {
        "color": "{{ $('Parse AI Response').item.json.sentiment === 'positive' ? 'good' : ($('Parse AI Response').item.json.sentiment === 'negative' ? 'danger' : 'warning') }}",
        "blocks": [
          {
            "type": "header",
            "text": {
              "type": "plain_text",
              "text": "New Contact Form Submission"
            }
          },
          {
            "type": "section",
            "fields": [
              {
                "type": "mrkdwn",
                "text": "*Name:*\n{{ $('Normalize Fields').item.json.name }}"
              },
              {
                "type": "mrkdwn",
                "text": "*Email:*\n{{ $('Normalize Fields').item.json.email }}"
              }
            ]
          },
          {
            "type": "section",
            "fields": [
              {
                "type": "mrkdwn",
                "text": "*Category:*\n{{ $('Parse AI Response').item.json.category }}"
              },
              {
                "type": "mrkdwn",
                "text": "*Sentiment:*\n{{ $('Parse AI Response').item.json.sentiment }}"
              }
            ]
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Summary:*\n{{ $('Parse AI Response').item.json.summary }}"
            }
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Suggested Reply:*\n{{ $('Parse AI Response').item.json.draft_response }}"
            }
          }
        ]
      }
    ],
    "otherOptions": {
      "includeLinkToWorkflow": false
    }
  },
  "id": "slack-notification",
  "name": "Send Slack Notification",
  "type": "n8n-nodes-base.slack",
  "typeVersion": 2.2,
  "position": [1100, 240],
  "credentials": {
    "slackOAuth2Api": {
      "id": "slack-oauth-cred",
      "name": "Slack OAuth2"
    }
  }
}
```
**Source:** Combined from [n8n Slack node MessageDescription.ts](https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/Slack/V2/MessageDescription.ts) and [Slack attachment color docs](https://github.com/slackhq/slack-api-docs/blob/master/page_attachments.md)

### Send Email Node Configuration (HTML Format)
```json
{
  "parameters": {
    "fromEmail": "notifications@example.com",
    "toEmail": "admin@example.com",
    "subject": "New Contact: {{ $('Normalize Fields').item.json.name }} - {{ $('Parse AI Response').item.json.category }}",
    "emailFormat": "html",
    "html": "<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n    .header { background-color: #4a90e2; color: white; padding: 20px; }\n    .content { padding: 20px; }\n    .field { margin-bottom: 15px; }\n    .label { font-weight: bold; color: #555; }\n  </style>\n</head>\n<body>\n  <div class=\"header\"><h2>New Contact Form</h2></div>\n  <div class=\"content\">\n    <div class=\"field\"><div class=\"label\">Name:</div><div>{{ $('Normalize Fields').item.json.name }}</div></div>\n    <div class=\"field\"><div class=\"label\">Email:</div><div>{{ $('Normalize Fields').item.json.email }}</div></div>\n    <div class=\"field\"><div class=\"label\">Category:</div><div>{{ $('Parse AI Response').item.json.category }}</div></div>\n    <div class=\"field\"><div class=\"label\">Sentiment:</div><div>{{ $('Parse AI Response').item.json.sentiment }}</div></div>\n    <div class=\"field\"><div class=\"label\">Summary:</div><div>{{ $('Parse AI Response').item.json.summary }}</div></div>\n  </div>\n</body>\n</html>",
    "options": {
      "appendAttribution": false
    }
  },
  "id": "email-notification",
  "name": "Send Email Notification",
  "type": "n8n-nodes-base.emailSend",
  "typeVersion": 2.1,
  "position": [1100, 380],
  "credentials": {
    "smtp": {
      "id": "smtp-cred",
      "name": "SMTP Account"
    }
  }
}
```
**Source:** [n8n Send Email node documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.sendemail/) and [HTML email workflow template](https://n8n.io/workflows/1790-generate-dynamic-contents-for-emails-or-html-pages/)

### Retry Configuration for Notification Nodes
```json
{
  "continueOnFail": true,
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 5000
}
```
**Usage:** Add to node settings for both Slack and Email nodes
**Source:** [n8n error handling documentation](https://docs.n8n.io/flow-logic/error-handling/)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Slack attachments for all formatting | Block Kit for most messages, attachments only for color bars | ~2019-2020 | Attachments now "legacy" but still needed for color parameter |
| Block message type in n8n Slack node | Attachment message type with nested blocks | n8n v1.0+ | Enables color bars while using modern Block Kit formatting |
| Sequential notification nodes | Parallel notification execution | Best practice since n8n introduced multi-connection support | Faster workflows, non-blocking notifications |
| Manual HTML email composition | HTML node for dynamic templates | n8n v0.180+ | Cleaner workflow, better expression support |

**Deprecated/outdated:**
- **Slack legacy formatting (bold/italic with * and _):** Still works but Block Kit mrkdwn is preferred. Use mrkdwn in Block Kit blocks.
- **n8n Slack node v1:** Replaced by v2 with better Block Kit support. Always use typeVersion 2.2+.
- **Send Email node v1:** Replaced by v2 with improved HTML support and attachments. Use typeVersion 2.1+.

## Open Questions

1. **Should notifications include a link to the Google Sheet row?**
   - What we know: Google Sheets rows don't have direct URLs without Sheet ID + row number
   - What's unclear: Is it worth adding this complexity for portfolio demo?
   - Recommendation: Skip for now. Add to future enhancements if needed.

2. **What SMTP provider should be recommended for the demo?**
   - What we know: Send Email node requires SMTP credentials, Gmail requires OAuth2
   - What's unclear: Best balance of easy setup vs. realistic demo
   - Recommendation: Use Mailtrap (SMTP testing service) or local SMTP for demo, document Gmail setup for production

3. **Should error notifications be separate from success notifications?**
   - What we know: n8n supports error workflows for handling failures
   - What's unclear: Is this overkill for portfolio project?
   - Recommendation: Use node-level retry settings (simpler), mention error workflows in documentation as production enhancement

## Sources

### Primary (HIGH confidence)
- [n8n Slack node source code (MessageDescription.ts)](https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/Slack/V2/MessageDescription.ts) - Slack node parameters and configuration
- [n8n Send Email documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.sendemail/) - Email node capabilities
- [Slack attachment color documentation](https://github.com/slackhq/slack-api-docs/blob/master/page_attachments.md) - Color parameter usage
- [n8n error handling documentation](https://docs.n8n.io/flow-logic/error-handling/) - Retry logic and error workflows

### Secondary (MEDIUM confidence)
- [n8n HTML email workflow template](https://n8n.io/workflows/1790-generate-dynamic-contents-for-emails-or-html-pages/) - Verified HTML email examples
- [Slack Block Kit documentation](https://docs.slack.dev/block-kit/) - Block structure and formatting
- [n8n Slack notification workflow templates](https://n8n.io/workflows/1326-get-a-slack-alert-when-a-workflow-went-wrong/) - Community patterns
- [n8n error handling guide](https://prosperasoft.com/blog/automation-tools/n8n/n8n-error-handling-retry/) - Retry best practices

### Tertiary (LOW confidence)
- [n8n community: Slack blocks ignored issue](https://community.n8n.io/t/slack-node-blocks-are-ignored-only-text-is-displayed-despite-successful-api-call/154767) - Community-reported pitfall
- [n8n community: Slack blocks posting](https://community.n8n.io/t/trying-to-post-blocks-to-slack/5288) - Community examples (unverified)

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - n8n nodes verified via official docs and source code, Slack/Email patterns verified but version compatibility needs testing
- Architecture: MEDIUM - Patterns derived from official docs and workflow templates, parallel execution pattern is best practice but not explicitly documented for this use case
- Pitfalls: MEDIUM - Most pitfalls verified via community threads and official docs, some based on general n8n flow logic principles

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days - n8n is stable, Slack API changes infrequently)

**Notes for planner:**
- Color-coded sentiment REQUIRES attachment message type (not block type)
- Parallel notification execution is CRITICAL for non-blocking HTTP response
- Notification nodes must be on legitimate branch ONLY (never on spam branch)
- HTML email format requires explicit "html" setting in Send Email node
- Retry logic should be configured at node level (not error workflow) for simplicity
