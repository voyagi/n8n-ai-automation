# Phase 2: Webhook Integration - Research

**Researched:** 2026-02-08
**Domain:** n8n webhook integration + JavaScript form submission
**Confidence:** MEDIUM

## Summary

Connecting the HTML contact form to n8n webhook involves three components: (1) n8n Webhook node configuration with authentication and synchronous response mode, (2) JavaScript fetch API with timeout handling and error states, (3) n8n Set node for payload normalization. The standard approach uses n8n's built-in Webhook trigger node with Header Auth, "When Last Node Finishes" response mode to wait for AI processing, and AbortSignal.timeout() for client-side timeout handling.

Key technical constraints discovered: n8n webhooks have a 16MB payload limit, production webhooks require workflow activation, and custom authentication headers trigger CORS preflight requests. The Set node provides both visual (Manual Mapping) and JSON Output modes for data transformation, with Manual Mapping recommended for straightforward field extraction.

For this phase, the critical path is: configure webhook with header auth → set response mode to synchronous → build Set node for payload normalization → implement fetch with timeout → handle server validation errors gracefully.

**Primary recommendation:** Use n8n Webhook node with Header Auth, "When Last Node Finishes" response mode, and Set node in Manual Mapping mode. Client-side uses fetch with AbortSignal.timeout(15000) and comprehensive error handling for network failures, timeouts, and validation errors.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| n8n | 1.82.0+ | Workflow automation platform | Project requirement, self-hosted via npm |
| Webhook node | Built-in | Receive HTTP POST from form | Standard n8n trigger node for HTTP endpoints |
| Set (Edit Fields) node | Built-in | Normalize and enrich payload | Standard n8n data transformation node |
| JavaScript Fetch API | Native | Submit form data to webhook | Modern browser standard, replaces XMLHttpRequest |
| AbortController | Native | Timeout handling for fetch | Standard Web API for request cancellation |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Respond to Webhook node | Built-in | Custom response control | Only when returning custom status codes on validation failure |
| serve | 14.2.4 | Local development server | Already in project for form hosting |
| n8n environment variables | N/A | Webhook URL configuration | Self-hosted deployment setup |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Header Auth | Basic Auth | Basic Auth simpler but provides limited security, base64-encoded not encrypted |
| Header Auth | JWT Auth | JWT adds unnecessary complexity for single webhook endpoint |
| "When Last Node Finishes" | "Using Respond to Webhook Node" | Respond to Webhook node required only for custom status codes or complex error responses |
| Manual Mapping | JSON Output | JSON Output gives full control but harder to maintain, use only for complex nested structures |
| AbortSignal.timeout() | Manual AbortController | Manual approach requires boilerplate, timeout() is cleaner modern API |

**Installation:**

n8n and serve already installed. No additional dependencies required.

## Architecture Patterns

### Recommended Project Structure

```
public/
├── index.html          # Form UI (existing)
├── script.js           # Form submission logic with webhook integration
└── styles.css          # Styling (existing)

workflows/
└── contact-form-ai.json # n8n workflow export (Phase 3)

.env                    # Local n8n configuration
```

### Pattern 1: Synchronous Webhook Response

**What:** Webhook waits for entire workflow to complete before responding to form

**When to use:** When form needs to display AI processing results back to user

**Implementation:**

n8n Webhook node configuration:
- **Respond:** "When Last Node Finishes"
- **Response Mode:** "Last Node"
- **Response Data:** "First Entry JSON"

This makes the webhook synchronous: the HTTP request waits for the full workflow (including AI processing in Phase 3) to complete before returning the response.

**Example:**

```
Webhook (POST /webhook/contact-form)
  ↓
Set Node (normalize + timestamp)
  ↓
[Phase 3: OpenAI processing]
  ↓
Last node returns: { category: "sales", estimatedResponse: "within 24 hours" }
  ↓
Webhook responds with 200 + JSON body
```

**Timeout consideration:** n8n workflows have execution time limits. For this demo with OpenAI API calls, expect 3-10 second response times. Client-side 15-second timeout is appropriate buffer.

### Pattern 2: Header-Based Authentication

**What:** Form sends custom HTTP header, webhook validates it

**When to use:** Demonstrates security awareness without complex OAuth for portfolio demo

**Implementation:**

n8n Webhook node:
- **Authentication:** "Header Auth"
- **Credential:** Create new Header Auth credential
  - Name: `X-Webhook-Auth` (or any custom header name)
  - Value: Random secure string (e.g., `wh_secret_abc123def456`)

JavaScript fetch:
```javascript
const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Auth': 'wh_secret_abc123def456'
  },
  body: JSON.stringify(data)
});
```

**CORS note:** Custom headers trigger preflight OPTIONS request. n8n handles this automatically when webhook authentication is enabled.

### Pattern 3: Set Node Field Mapping (Manual Mapping Mode)

**What:** Visual interface to extract and transform webhook payload fields

**When to use:** Straightforward field extraction, renaming, and simple enrichment (recommended for this phase)

**Configuration:**

Set node → Mode: "Manual Mapping" → Fields to Set:

| Field Name | Expression | Type |
|------------|-----------|------|
| `name` | `{{ $json.name }}` | String |
| `email` | `{{ $json.email }}` | String |
| `subject` | `{{ $json.subject }}` | String |
| `message` | `{{ $json.message }}` | String |
| `submittedAt` | `{{ $now.toISO() }}` | String (ISO timestamp) |

**Options:**
- **Keep Only Set:** OFF (preserves original fields)
- **Include Other Fields:** ON (passes through any additional data)

### Pattern 4: Client-Side Timeout with AbortSignal

**What:** Automatically cancel fetch request after timeout duration

**When to use:** All async form submissions to prevent indefinite hanging

**Implementation:**

```javascript
try {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { /* ... */ },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(15000) // 15 second timeout
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const result = await response.json();
  // Display success with AI results
} catch (err) {
  if (err.name === 'TimeoutError') {
    // Show timeout-specific error message
  } else if (err.name === 'AbortError') {
    // Request was cancelled (shouldn't happen in this flow)
  } else {
    // Network error or server error
  }
}
```

**Browser support:** AbortSignal.timeout() supported in all modern browsers (Chrome 103+, Firefox 100+, Safari 16+). No fallback needed for 2026 deployment.

### Pattern 5: Server-Side Validation with Error Response

**What:** Set node validates payload, returns 400 + error message on invalid data

**When to use:** Defense-in-depth alongside client-side validation

**Implementation:**

Approach A (Recommended): Use n8n IF node to branch on validation

```
Webhook
  ↓
Set Node (normalize)
  ↓
IF Node (check fields exist and valid)
  ├─ FALSE → Set Error Response Node → Respond to Webhook (400 + error JSON)
  └─ TRUE → Continue to AI processing
```

Approach B: Use Stop and Error node (simpler but less control)

```
Webhook
  ↓
Set Node (normalize + validate in expressions)
  ↓
IF validation fails → Stop and Error node
```

**Response format for validation errors:**

```json
{
  "error": "Validation failed",
  "message": "Email address is required"
}
```

Webhook returns HTTP 400. JavaScript catches this in `if (!response.ok)` block.

### Anti-Patterns to Avoid

- **Don't use Test URL in production:** Test webhooks only work when workflow editor is open. Always use Production URL and activate workflow.
- **Don't return HTML from webhook for JSON clients:** Ensure Webhook node "Response Data" is set to "First Entry JSON" not "First Entry Binary" or custom HTML.
- **Don't skip CORS configuration:** If serving form from different origin than n8n, ensure n8n CORS environment variables are set (`N8N_ALLOWED_CORS_ORIGINS`).
- **Don't ignore AbortController cleanup:** AbortControllers are single-use. If implementing retry logic, create new controller for each attempt.
- **Don't assume synchronous = instant:** "When Last Node Finishes" waits for entire workflow. Ensure timeout is longer than expected workflow duration.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Request timeout handling | setTimeout + manual abort | AbortSignal.timeout() | Native API handles cleanup, prevents memory leaks, cleaner syntax |
| Webhook URL configuration | Hardcoded URL in script.js | Environment variable / config object | Easier to update when deploying, clear separation of config from code |
| CORS preflight handling | Custom OPTIONS endpoint | n8n automatic CORS | n8n handles OPTIONS when auth enabled, no custom code needed |
| Payload validation | Custom JavaScript validation | n8n IF node + Stop and Error | Server-side validation in workflow more maintainable, centralized logic |
| Response status codes | Try/catch with generic errors | Respond to Webhook node | Proper HTTP semantics (400 for validation, 500 for server errors) |

**Key insight:** n8n provides first-class webhook capabilities. Don't recreate what the platform already does (CORS, auth, response handling). Focus on workflow logic and client-side UX.

## Common Pitfalls

### Pitfall 1: Production Webhook Not Registered

**What goes wrong:** Form submission fails with 404 even though workflow exists

**Why it happens:** Production webhooks only register when workflow is ACTIVATED. Test webhooks work with editor open, production webhooks require the activation toggle in top-right of n8n editor.

**How to avoid:**

1. Save workflow
2. Click activation toggle in top-right (switch to ON)
3. Verify production webhook URL appears in Webhook node
4. Test with production URL

**Warning signs:**
- Webhook works when editor is open, fails when closed
- n8n logs show no incoming request
- 404 response from n8n domain

### Pitfall 2: CORS Preflight Failure with Custom Headers

**What goes wrong:** Browser blocks fetch request with CORS error

**Why it happens:** Custom authentication headers (X-Webhook-Auth) trigger CORS preflight OPTIONS request. If n8n not configured to allow origin, browser blocks the POST.

**How to avoid:**

**For local development (form at localhost:3000, n8n at localhost:5678):**

Set environment variable in n8n:
```bash
N8N_ALLOWED_CORS_ORIGINS=http://localhost:3000
```

Restart n8n after setting environment variable.

**For production:** Set to actual form domain (e.g., `https://demo.example.com`)

**Warning signs:**
- Browser console shows CORS error
- Network tab shows OPTIONS request failed
- POST request never sent

### Pitfall 3: Webhook Response Not Parsed by Client

**What goes wrong:** Success response received but JavaScript fails to parse, shows error to user

**Why it happens:** Webhook "Response Data" misconfigured (returns HTML or binary instead of JSON), or last node in workflow doesn't output data in expected format.

**How to avoid:**

1. Set Webhook node "Response Data" to **"First Entry JSON"**
2. Ensure last node in workflow outputs JSON object (in Phase 3: OpenAI node outputs object)
3. In JavaScript, check response Content-Type before parsing:

```javascript
const response = await fetch(webhookUrl, { /* ... */ });

if (!response.ok) {
  throw new Error(`Server error: ${response.status}`);
}

// Verify JSON response
const contentType = response.headers.get('Content-Type');
if (!contentType || !contentType.includes('application/json')) {
  throw new Error('Expected JSON response from webhook');
}

const result = await response.json();
```

**Warning signs:**
- Response status 200 but parsing fails
- `Unexpected token < in JSON` error (HTML response)
- Empty response body

### Pitfall 4: Timeout Too Short for AI Processing

**What goes wrong:** Form shows timeout error even though workflow completed successfully on server

**Why it happens:** OpenAI API calls take 3-10 seconds. If client timeout is 5 seconds, race condition occurs.

**How to avoid:**

Set client timeout LONGER than expected workflow duration:
- OpenAI API: typically 2-5 seconds
- n8n processing overhead: 1-2 seconds
- Buffer for network latency: 5+ seconds
- **Recommended timeout: 15 seconds**

If workflow takes longer than 15 seconds in practice, increase timeout or optimize workflow (cache, parallel processing).

**Warning signs:**
- "TimeoutError" on client but n8n execution log shows success
- Inconsistent timeout failures (sometimes succeeds, sometimes times out)
- Timeout occurs around same duration every time (e.g., always at 10 seconds)

### Pitfall 5: Form State Not Preserved on Error

**What goes wrong:** User fills out long form, submission fails, form clears and user must re-enter everything

**Why it happens:** Form reset logic runs on error instead of only on success

**How to avoid:**

```javascript
try {
  const response = await fetch(webhookUrl, { /* ... */ });
  // Handle response

  // SUCCESS: clear form
  form.reset();

} catch (err) {
  // ERROR: preserve form data, show error message
  // DO NOT call form.reset() here
  errorBanner.textContent = `Failed to send: ${err.message}`;
  errorBanner.classList.remove('hidden');
} finally {
  // Re-enable fields regardless of outcome
  fields.forEach(f => f.disabled = false);
  submitBtn.disabled = false;
}
```

**Current script.js already handles this correctly** (line 127-139). Keep this pattern.

**Warning signs:**
- User complaints about lost data
- Network errors result in empty form

### Pitfall 6: Missing Timestamp Causes Confusion

**What goes wrong:** Multiple test submissions appear in n8n execution log, can't tell which is which or when submitted

**Why it happens:** Form payload doesn't include submission timestamp

**How to avoid:**

Add timestamp in Set node (server-side, trusted time):
```
Field: submittedAt
Expression: {{ $now.toISO() }}
```

Or in JavaScript (client-side, less reliable):
```javascript
const data = {
  name: form.name.value.trim(),
  email: form.email.value.trim(),
  subject: form.subject.value.trim(),
  message: form.message.value.trim(),
  timestamp: new Date().toISOString()
};
```

**Recommendation:** Add in Set node (Phase 2) so timestamp is consistent and server-controlled.

**Warning signs:**
- Can't identify which execution corresponds to which test
- Debugging becomes difficult with multiple similar submissions

## Code Examples

Verified patterns from official sources:

### n8n Webhook Node Configuration

**Source:** [n8n Webhook node documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

**Webhook Node Settings:**
```
HTTP Method: POST
Path: contact-form
Authentication: Header Auth
Respond: When Last Node Finishes
Response Mode: Last Node
Response Data: First Entry JSON
```

**Header Auth Credential:**
```
Credential Type: Header Auth
Name: X-Webhook-Auth
Value: <generated-secret-token>
```

### n8n Set Node Configuration (Manual Mapping)

**Source:** [Edit Fields (Set) node documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.set/)

**Set Node Settings:**
```
Mode: Manual Mapping

Fields to Set:
  - name: {{ $json.name }}
  - email: {{ $json.email }}
  - subject: {{ $json.subject }}
  - message: {{ $json.message }}
  - submittedAt: {{ $now.toISO() }}

Options:
  Keep Only Set: false
  Include Other Fields: true
```

### JavaScript Fetch with Timeout and Auth Header

**Source:** [MDN AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)

```javascript
const CONFIG = {
  webhookUrl: 'http://localhost:5678/webhook/contact-form',
  authToken: 'wh_secret_abc123def456', // Move to config or env
  timeout: 15000 // 15 seconds
};

async function submitForm(formData) {
  try {
    const response = await fetch(CONFIG.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Auth': CONFIG.authToken
      },
      body: JSON.stringify(formData),
      signal: AbortSignal.timeout(CONFIG.timeout)
    });

    if (!response.ok) {
      // Server returned error status (400, 500, etc.)
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new Error('Request timed out. Please try again.');
    } else if (err.name === 'AbortError') {
      throw new Error('Request was cancelled.');
    } else {
      // Network error or server error
      throw err;
    }
  }
}
```

### Error Handling with User-Friendly Messages

**Source:** Best practices from [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validate first (existing validation logic)
  if (!form.checkValidity()) {
    const firstInvalid = form.querySelector(':invalid');
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  // Show loading state
  submitBtn.disabled = true;
  spinner.classList.remove('hidden');
  btnText.textContent = 'Sending...';
  fields.forEach(f => f.disabled = true);
  errorBanner.classList.add('hidden');

  try {
    const formData = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim()
    };

    const result = await submitForm(formData);

    // SUCCESS: show results
    form.classList.add('hidden');
    errorBanner.classList.add('hidden');
    successCard.classList.remove('hidden');

    // Display AI analysis (Phase 3 will populate this)
    // For Phase 2: just show success message

  } catch (err) {
    // ERROR: show friendly message, preserve form data
    let errorMessage = 'Something went wrong. Please try again.';

    if (err.message.includes('timeout')) {
      errorMessage = 'The request took too long. Please try again.';
    } else if (err.message.includes('Failed to fetch')) {
      errorMessage = 'Could not connect to server. Please check that n8n is running and try again.';
    } else if (err.message) {
      errorMessage = err.message;
    }

    errorBanner.textContent = errorMessage;
    errorBanner.classList.remove('hidden');

  } finally {
    // Re-enable form controls
    fields.forEach(f => f.disabled = false);
    spinner.classList.add('hidden');
    btnText.textContent = 'Send Message';
    submitBtn.disabled = false;
  }
});
```

### Validation Error Response Pattern (n8n)

**Source:** [n8n community discussions](https://community.n8n.io/t/return-error-message-to-respond-to-webhook/71218)

**Workflow structure for server-side validation:**

```
Webhook (POST /webhook/contact-form)
  ↓
Set Node (normalize fields)
  ↓
IF Node
  Conditions:
    - {{ $json.email }} is not empty
    - {{ $json.email }} matches regex
    - {{ $json.name }} is not empty
    - {{ $json.message }} is not empty

  TRUE branch → Continue to AI processing

  FALSE branch →
    Set Node (create error response)
      Field: error = "Validation failed"
      Field: message = "All fields are required and email must be valid"
    ↓
    Respond to Webhook
      Respond With: JSON
      Response Code: 400
      Response Body: {{ $json }}
```

**Note:** For Phase 2, validation logic can be simple (field existence). Phase 3 may add more sophisticated validation (spam detection).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| XMLHttpRequest | Fetch API | ~2015 (widespread 2020+) | Cleaner promise-based syntax, better error handling |
| setTimeout + manual abort | AbortSignal.timeout() | 2022 (Chrome 103) | Single-line timeout, automatic cleanup |
| Separate test/prod workflows | Single workflow with test/prod URLs | n8n core feature | Easier workflow management, same logic for both environments |
| "Respond Immediately" mode | "When Last Node Finishes" mode | Always available but increasingly used | Enables synchronous API-like webhooks |
| Basic Auth | Header Auth | Always available but Header Auth more flexible | Custom header names, easier to rotate secrets |

**Deprecated/outdated:**
- **n8n Webhook "Respond Immediately" for this use case:** Returns "Workflow started" message before processing completes. Not suitable when client needs AI results. Use "When Last Node Finishes" instead.
- **XMLHttpRequest for new projects:** Deprecated in favor of Fetch API. No reason to use XHR in 2026.
- **Manual setTimeout + abort with XMLHttpRequest:** AbortController + Fetch is the modern standard.

## Open Questions

Things that couldn't be fully resolved:

1. **What is the exact webhook response format when using "When Last Node Finishes"?**
   - What we know: Last node's JSON output is returned in response body
   - What's unclear: Does n8n wrap it in an envelope (e.g., `{ data: {...} }`) or return raw?
   - Recommendation: Test during implementation (Phase 2). Most likely raw JSON from last node.

2. **Does n8n automatically handle CORS for localhost development?**
   - What we know: n8n has N8N_ALLOWED_CORS_ORIGINS environment variable
   - What's unclear: Is localhost automatically allowed or must it be explicitly configured?
   - Recommendation: Test without setting variable first. If CORS error occurs, add to .env file.

3. **What happens if workflow execution exceeds client timeout (15 sec)?**
   - What we know: Client throws TimeoutError and stops waiting
   - What's unclear: Does n8n continue executing workflow in background? Can it be cancelled?
   - Recommendation: Workflow should complete in < 10 seconds for good UX. If timeout occurs, workflow likely completes but client doesn't see result. Acceptable for demo (user can retry).

4. **Should webhook auth token be in .env or public/script.js?**
   - What we know: Sensitive credentials should be in .env and not committed
   - What's unclear: Frontend needs the token to send in headers, but .env is server-side only
   - Recommendation: For this demo (local only), hardcode token in CONFIG object at top of script.js with a comment explaining production would use environment variable or build-time injection. Acceptable tradeoff for portfolio demo.

## Sources

### Primary (HIGH confidence)

- [n8n Webhook node documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) - Webhook configuration and response modes
- [n8n Edit Fields (Set) node documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.set/) - Manual Mapping vs JSON Output modes
- [MDN AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) - Modern timeout API
- [MDN Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) - Fetch best practices and error handling
- [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) - CORS preflight behavior with custom headers

### Secondary (MEDIUM confidence)

- [n8n Webhook credentials documentation](https://docs.n8n.io/integrations/builtin/credentials/webhook/) - Authentication options (WebSearch verified)
- [n8n Environment Variables](https://docs.n8n.io/hosting/configuration/environment-variables/) - Configuration for self-hosted instances (WebSearch verified)
- [n8n community: Header authentication](https://community.n8n.io/t/header-authentication-in-webhook/19511) - Real-world Header Auth setup (WebSearch)
- [n8n community: Webhook error handling](https://community.n8n.io/t/webhook-error-handling/11471) - Validation error patterns (WebSearch)

### Tertiary (LOW confidence)

- [AutomateGeniusHub: Mastering n8n Webhook Node Part B](https://automategeniushub.com/mastering-the-n8n-webhook-node-part-b/) - Security patterns (blog post, not official)
- [LogicWorkflow: n8n Webhook Node Tutorial](https://logicworkflow.com/nodes/webhook-node/) - Examples (third-party tutorial)

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - n8n documentation confirmed, Fetch/AbortSignal confirmed via MDN, but some n8n response format details unclear
- Architecture: MEDIUM - Patterns verified through documentation and community discussions, but exact response envelope structure needs testing
- Pitfalls: HIGH - Most pitfalls documented in community discussions with confirmed solutions
- Code examples: HIGH - MDN examples authoritative, n8n examples from official docs

**Research date:** 2026-02-08
**Valid until:** 2026-03-10 (30 days - stable technologies, n8n updates monthly but webhook core features stable)
