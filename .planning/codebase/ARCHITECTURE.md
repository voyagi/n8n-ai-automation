# Architecture

**Analysis Date:** 2026-02-08

## Pattern Overview

**Overall:** Two-tier distributed system with client-side form submission and server-side workflow orchestration via n8n.

**Key Characteristics:**
- Client sends form data to webhook endpoint; server-side n8n orchestrates all processing
- API layer decoupling: form UI knows only about webhook URL, not internal workflow details
- Event-driven: form submission triggers a chain of processing steps (AI analysis, conditional routing, storage, notifications)
- External service orchestration: n8n coordinates OpenAI, Slack, and data storage integrations

## Layers

**Presentation Layer:**
- Purpose: User-facing form interface for contact submissions
- Location: `public/`
- Contains: HTML markup, CSS styling, client-side form handling
- Depends on: n8n webhook endpoint (configuration URL in `public/script.js`)
- Used by: End users submitting contact messages

**Integration Layer (n8n Workflow):**
- Purpose: Orchestrate the entire processing pipeline; bridge between client form and external services
- Location: `workflows/contact-form-ai.json` (to be created during development)
- Contains: Webhook trigger, data transformation, AI processing, conditional routing, storage, and notification nodes
- Depends on: OpenAI API, Slack API, Google Sheets/Supabase API
- Used by: Client form submission; routes data to downstream services

**External Service Integrations:**
- Purpose: Provide AI analysis, notifications, and persistent storage
- Components:
  - OpenAI: Sentiment analysis, categorization, summarization, reply drafting
  - Slack: Real-time notifications of processed messages
  - Google Sheets / Supabase: Persistent data store for submissions and AI analysis results

## Data Flow

**Contact Form Submission → AI Processing → Conditional Routing → Action:**

1. **User submits form** (`public/index.html`)
   - Captures: name, email, subject, message, timestamp
   - Validation: client-side required fields, email format
   - Action: POST to n8n webhook URL with JSON payload

2. **Webhook receives request** (n8n Webhook node)
   - Triggered by: POST to `localhost:5678/webhook/contact`
   - Passes: form data to next node

3. **Extract and normalize fields** (n8n Set node)
   - Prepares structured data for AI processing
   - Standardizes field names and formats

4. **AI Processing** (n8n OpenAI node)
   - Sends message + metadata to OpenAI API
   - Returns: sentiment (positive/negative/neutral), category (support/sales/feedback), summary, suggested reply

5. **Conditional Routing** (n8n Switch node)
   - Evaluates: Is this spam?
   - If spam: flag in storage, skip notifications → stop
   - If legitimate: continue to storage and notification

6. **Persistent Storage** (n8n Google Sheets or Supabase node)
   - Saves: Original submission + AI analysis results
   - Indexed by: timestamp for audit trail

7. **Send Notifications** (n8n Slack node)
   - Sends: Formatted message with AI analysis to Slack channel
   - Timing: Only if not spam

**State Management:**
- Stateless request processing: each form submission is independent
- n8n retains workflow execution history in its database
- Form data persisted to Google Sheets or Supabase for audit/review
- No client-side state persistence

## Key Abstractions

**Webhook Interface:**
- Purpose: HTTP-based trigger for the automation pipeline
- Examples: `public/script.js` (client calling webhook)
- Pattern: Standard REST POST with JSON body; idempotent (replay-safe via timestamp + email deduplication in storage)

**Form Data Contract:**
- Purpose: Define the shape of data flowing through the pipeline
- Structure:
  ```json
  {
    "name": "string",
    "email": "string",
    "subject": "string",
    "message": "string",
    "timestamp": "ISO-8601 string"
  }
  ```
- Pattern: Immutable payload; transformed but not mutated at each layer

**AI Analysis Result:**
- Purpose: Structured output from OpenAI processing
- Contains: sentiment, category, summary, draft reply
- Pattern: Used for conditional routing and notification enrichment

**Notification Message:**
- Purpose: Formatted output sent to Slack
- Pattern: Human-readable summary of submission + AI analysis results

## Entry Points

**Form Submission:**
- Location: `public/index.html` (form element with id="contact-form")
- Triggers: User clicks "Send Message" button
- Responsibilities: Collect user input, validate client-side, send POST request to webhook

**Webhook Endpoint:**
- Location: n8n workflow (Webhook node)
- Triggers: POST request from client form
- Responsibilities: Accept form data, initiate processing pipeline

## Error Handling

**Strategy:** Graceful degradation with visibility.

**Patterns:**
- Client-side: Form shows error message to user ("Failed to send: [error message]. Check that n8n is running.")
- Webhook validation: n8n logs errors in execution history; malformed requests rejected at webhook level
- AI processing failure: Workflow logs error; may flag as spam or retry depending on implementation
- Storage failure: Workflow logs error; notification may still be sent or queued for retry
- Notification failure: Logged but doesn't block storage; data preserved even if Slack is unreachable

**User Feedback:**
- Success state shown in `status` div with green background
- Error state shown with red background and detailed error message
- Button state changes during submission (disabled, "Sending..." text)

## Cross-Cutting Concerns

**Logging:** n8n execution history tracks each step; form submission logs in client console (browser developer tools)

**Validation:**
- Client-side: HTML5 form validation (required fields, email format)
- Webhook-level: n8n validates required fields before processing
- AI prompt: Implicitly validates message content by returning sentiment/category

**Authentication:**
- n8n dashboard: Basic auth (N8N_BASIC_AUTH_USER / N8N_BASIC_AUTH_PASSWORD)
- Webhook: No authentication required (can be protected via API key if needed for production)
- External services: API keys stored in `.env` (not committed; referenced in n8n credentials)

**Rate Limiting:** Not implemented; can be added at n8n workflow level or via reverse proxy if needed

---

*Architecture analysis: 2026-02-08*
