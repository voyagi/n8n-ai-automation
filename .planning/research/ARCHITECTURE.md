# Architecture Research

**Domain:** n8n AI Workflow Automation
**Researched:** 2026-02-08
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  HTML Form (Webhook Target)                          │   │
│  └─────────────────┬────────────────────────────────────┘   │
│                    │ POST /contact                           │
├────────────────────┼─────────────────────────────────────────┤
│                    │     n8n WORKFLOW LAYER                  │
│  ┌─────────────────▼────────────────────────────────────┐   │
│  │ Webhook Trigger → Set Node (Extract Data)            │   │
│  └─────────────────┬────────────────────────────────────┘   │
│                    │                                         │
│  ┌─────────────────▼────────────────────────────────────┐   │
│  │ OpenAI Node (Classify + Summarize + Draft Reply)     │   │
│  └─────────────────┬────────────────────────────────────┘   │
│                    │                                         │
│  ┌─────────────────▼────────────────────────────────────┐   │
│  │ Switch Node (Route by Category)                      │   │
│  └──┬────────────┬─────────────┬────────────────────────┘   │
│     │ spam       │ support     │ sales/feedback             │
│     ▼            ▼             ▼                            │
│  ┌──────┐  ┌────────────┐  ┌────────────┐                  │
│  │ Log  │  │ Save Sheet │  │ Save Sheet │                  │
│  │ Stop │  │ + Notify   │  │ + Notify   │                  │
│  └──────┘  └────────────┘  └────────────┘                  │
├─────────────────────────────────────────────────────────────┤
│              INTEGRATION LAYER                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ OpenAI   │  │ G Sheets │  │  Slack   │                  │
│  │   API    │  │   API    │  │ Webhook  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Webhook Trigger | Receive form submissions | n8n Webhook node (POST endpoint) |
| Set Node | Extract and normalize input data | n8n Set/Edit Fields node |
| OpenAI Node | Multi-task AI analysis (classify, summarize, draft) | n8n OpenAI Text node with structured prompt |
| Switch Node | Route based on classification | n8n Switch node with category rules |
| Google Sheets Node | Persist processed data | n8n Google Sheets Append node |
| Slack Node | Send notifications | n8n Slack Message node |
| Error Workflow | Centralized error handling | Separate workflow with Error Trigger |

## Recommended Project Structure

```
upwork-n8n-automation/
├── public/
│   ├── index.html              # Contact form (webhook target)
│   ├── styles.css              # Form styling
│   └── script.js               # Form submission handler
├── workflows/
│   ├── contact-form-ai.json    # Main workflow (exportable)
│   ├── error-handler.json      # Error workflow (shared)
│   └── README.md               # Import instructions
├── screenshots/
│   ├── workflow-editor.png     # Canvas visual
│   ├── form-demo.png           # Form UI
│   └── slack-notification.png  # Example notification
├── .env.example                # Template for credentials
└── package.json                # Scripts for n8n + form server
```

### Structure Rationale

- **workflows/:** Exported JSON files are the core deliverable — clients can import and customize them
- **public/:** Keep form simple (no build step) so it's easy for clients to understand
- **screenshots/:** Visual proof for Upwork portfolio — shows the workflow in action
- **.env.example:** Clear documentation of required credentials for easy setup

## Architectural Patterns

### Pattern 1: Linear Processing with Conditional Branching

**What:** Webhook → Extract → AI Process → Branch by Category → Parallel Actions

**When to use:** When each submission needs the same analysis but different handling based on results

**Trade-offs:**
- **Pros:** Simple to understand, easy to debug, clear data flow
- **Cons:** All items processed sequentially (not parallelized)

**Example:**
```typescript
// n8n workflow structure (conceptual)
Webhook Trigger
  → Set Node (extract { name, email, message })
  → OpenAI Node (analyze message)
  → Switch Node (route by classification)
    → Branch 1 (spam): Log only
    → Branch 2 (support/sales/feedback): Save + Notify
```

### Pattern 2: Set Node Before External APIs

**What:** Use Set/Edit Fields node to shape data before API calls

**When to use:** When APIs expect specific field names or formats

**Trade-offs:**
- **Pros:** Prevents API errors, makes debugging easier, documents data shape
- **Cons:** Adds extra node (minor overhead)

**Example:**
```typescript
// Before OpenAI node, normalize input
Set Node:
  - user_message: {{$json.message}}
  - context: "You are analyzing a contact form submission"
  - system_role: "classifier"
```

### Pattern 3: Switch Node for Multi-Route Logic

**What:** Use Switch node (not chained IF nodes) when routing to 3+ destinations

**When to use:** Spam detection, priority routing, category-based handling

**Trade-offs:**
- **Pros:** Cleaner than chained IF nodes, supports multiple outputs, easier to maintain
- **Cons:** More complex than IF for simple binary decisions

**Example:**
```typescript
// Switch node routing by OpenAI classification
Switch Node (Rules mode):
  - Output 1 (spam): classification = "spam"
  - Output 2 (support): classification = "support"
  - Output 3 (sales): classification = "sales"
  - Output 4 (feedback): classification = "feedback"
  - Fallback: route to support by default
```

### Pattern 4: Dedicated Error Workflow

**What:** Central error handler workflow triggered by any parent workflow failure

**When to use:** Always — for production workflows that need monitoring

**Trade-offs:**
- **Pros:** Unified error handling, prevents silent failures, easy to add new notifications
- **Cons:** Requires initial setup, must be assigned to each workflow

**Example:**
```typescript
// error-handler.json workflow
Error Trigger
  → Set Node (extract error context)
    - workflow_name: {{$json.workflow.name}}
    - failed_node: {{$json.execution.lastNodeExecuted}}
    - error_message: {{$json.execution.error}}
  → Slack Node (send alert to #incidents)
  → (Optional) Email Node (notify on-call)
```

## Data Flow

### Request Flow

```
[User submits form]
    ↓ POST /webhook
[Webhook Trigger] → captures raw payload
    ↓
[Set Node] → extracts { name, email, message }
    ↓
[OpenAI Node] → analyzes message
    ↓ returns { sentiment, category, summary, draft_reply }
[Switch Node] → routes by category
    ↓              ↓              ↓
[spam]       [support]      [sales/feedback]
  ↓              ↓              ↓
[Log]        [Save Sheet]   [Save Sheet]
[Stop]       [Send Slack]   [Send Slack]
             [Send Email]   [Send Email]
```

### State Management

n8n workflows are stateless within a single execution. Each execution:

1. **Receives trigger data** (webhook payload)
2. **Passes data forward** through nodes (each node outputs to next)
3. **Completes or errors** (no persistent state between executions)

For state persistence:
- Use Google Sheets or Supabase for data storage
- Use n8n's built-in execution history for debugging
- Use variables within an execution (not across executions)

### Key Data Flows

1. **Form submission → AI analysis:**
   - Input: `{ name, email, message }`
   - Output: `{ sentiment, category, summary, draft_reply }`
   - Data shape controlled by OpenAI prompt structure

2. **AI analysis → Storage:**
   - Input: OpenAI output + original form data
   - Output: Row appended to Google Sheet
   - Merge original fields with AI fields before saving

3. **Storage confirmation → Notifications:**
   - Input: Google Sheets success response
   - Output: Slack message with summary
   - Only notify after successful save (sequential, not parallel)

## OpenAI Node Configuration

### Prompt Structure for Multi-Task Analysis

**Best practice:** Single OpenAI call with structured JSON output (cheaper, faster than multiple calls)

```typescript
// OpenAI Node configuration
Model: gpt-4-turbo (or gpt-3.5-turbo for cost savings)
System Message:
  "You are a contact form analyzer. Return only valid JSON."

User Message:
  "Analyze this contact form submission and return JSON:

  {
    "sentiment": "positive|neutral|negative",
    "category": "support|sales|feedback|spam",
    "summary": "one-sentence summary",
    "draft_reply": "suggested response",
    "spam_confidence": 0.0-1.0
  }

  Message: {{$json.message}}
  Name: {{$json.name}}
  Email: {{$json.email}}"

Response Format: JSON (parse in next node with {{$json}})
Temperature: 0.3 (deterministic for classification)
Max Tokens: 300 (sufficient for structured output)
```

### Handling OpenAI Output

After OpenAI node, use Set node to parse JSON:

```typescript
Set Node:
  - sentiment: {{$json.choices[0].message.content.sentiment}}
  - category: {{$json.choices[0].message.content.category}}
  - summary: {{$json.choices[0].message.content.summary}}
  - draft_reply: {{$json.choices[0].message.content.draft_reply}}
  - spam_confidence: {{$json.choices[0].message.content.spam_confidence}}
```

**Important:** OpenAI node in n8n v1.117.0+ uses V2 API — verify response structure in n8n docs.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 submissions/day | Single workflow, monolithic design (as specified) |
| 100-1k submissions/day | Add retry logic on external API failures, monitor OpenAI rate limits |
| 1k-10k submissions/day | Split to sub-workflows (preprocessing → AI → notification), use queue node |
| 10k+ submissions/day | Consider n8n workers, distributed architecture, batch processing |

### Scaling Priorities

1. **First bottleneck: OpenAI API rate limits**
   - Fix: Add retry with exponential backoff (3-5 retries, 1s/2s/5s delays)
   - Fix: Implement circuit breaker if OpenAI is down
   - Fix: Queue submissions during high traffic

2. **Second bottleneck: Google Sheets write limits**
   - Fix: Batch writes (collect 10-50 items, append together)
   - Fix: Switch to Supabase/database for higher throughput
   - Fix: Use Google Sheets API v4 with proper quotas

**For this portfolio project:** No scaling needed — optimize for clarity and demo-ability.

## Anti-Patterns

### Anti-Pattern 1: Monolithic Workflows (10+ nodes)

**What people do:** Build 20-node workflows that do everything in one canvas

**Why it's wrong:** Impossible to debug, hard to reuse components, difficult to export cleanly

**Do this instead:** Break into sub-workflows if >10 nodes. For this project: stay under 10 nodes total.

### Anti-Pattern 2: Chained IF Nodes for Multi-Category Logic

**What people do:** IF (spam?) → IF (support?) → IF (sales?) → IF (feedback?)

**Why it's wrong:** Creates pyramid of nested branches, hard to read, error-prone

**Do this instead:** Use Switch node with multiple outputs — cleaner, easier to maintain.

### Anti-Pattern 3: Credentials in Workflow JSON

**What people do:** Hardcode API keys in Set nodes or expressions

**Why it's wrong:** Credentials leak when exporting workflow JSON

**Do this instead:** Always use n8n credential system (credentials not exported with workflow).

### Anti-Pattern 4: No Error Handling

**What people do:** Build workflow, assume it works forever

**Why it's wrong:** Silent failures — form submissions lost without notification

**Do this instead:** Always assign error workflow, test failure scenarios before deployment.

### Anti-Pattern 5: Processing Before Validation

**What people do:** Send to OpenAI immediately, then discover malformed input

**Why it's wrong:** Wastes API calls on invalid data, harder to debug

**Do this instead:** Use Set node to validate/normalize input before expensive operations.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenAI API | n8n OpenAI node with credentials | Use Text operations, not legacy Completion API |
| Google Sheets | n8n Google Sheets node with OAuth2 | Append mode (not Update), avoids race conditions |
| Slack | Slack Incoming Webhook (simpler) or Slack node | Webhook = no OAuth, easier for portfolio demo |
| Email | n8n Email node (SMTP) or SendGrid node | SMTP works but often flagged as spam |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Webhook → Set Node | Direct connection | n8n passes all data forward automatically |
| OpenAI → Switch Node | Parse JSON output first | Use Set node between if OpenAI returns string JSON |
| Switch → Multiple branches | Conditional routing | Each branch operates independently |
| Error → Error Workflow | Automatic trigger | Configured in workflow settings, not visual connection |

## Workflow JSON Export Best Practices

### Making Workflows Importable

1. **Remove credential IDs:**
   - n8n exports credential names, not values
   - Document required credentials in README
   - Provide .env.example with placeholder values

2. **Use generic webhook URLs:**
   - Use `/contact` not `/webhook-abc123`
   - Document URL in README for users to configure

3. **Add workflow metadata:**
   - Set clear workflow name: "Contact Form AI Automation"
   - Add description in workflow settings
   - Use sticky notes on canvas to explain sections

4. **Validate before export:**
   - Run workflow end-to-end with test data
   - Check execution history for errors
   - Export only after successful test

5. **Structure for readability:**
   - Arrange nodes left-to-right (n8n convention)
   - Keep branches at same vertical level (easier to read)
   - Use sticky notes to label sections (triggers, processing, actions)

### Build Order (Recommended Sequence)

Build the workflow in this order to minimize rework:

1. **Webhook Trigger + Set Node:** Establish input shape first
2. **Slack notification (test):** Verify Slack works before adding complexity
3. **OpenAI Node:** Configure prompt, test with hardcoded input
4. **Switch Node:** Add category routing logic
5. **Google Sheets Node:** Add storage after routing works
6. **Error Workflow:** Create separate workflow, assign to main
7. **Email Node (optional):** Add auto-reply last

**Why this order:**
- Test external integrations early (Slack, OpenAI) before complex logic
- Build incrementally — each step adds one new component
- Easy to debug — if step N fails, steps 1-(N-1) already work

## Sources

### High Confidence (Official Documentation)

- [n8n Error Handling](https://docs.n8n.io/flow-logic/error-handling/)
- [n8n OpenAI Node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/)
- [n8n Switch Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.switch/)
- [n8n Workflow Export/Import](https://docs.n8n.io/workflows/export-import/)
- [Creating Error Workflows in n8n](https://blog.n8n.io/creating-error-workflows-in-n8n/)

### Medium Confidence (Community Best Practices)

- [Seven n8n Workflow Best Practices for 2026](https://michaelitoback.com/n8n-workflow-best-practices/)
- [n8n Workflow Design Patterns: Error Handling & Production Setup](https://evalics.com/blog/n8n-workflow-design-patterns-error-handling-production-setup)
- [Advanced n8n Error Handling and Recovery Strategies](https://www.wednesday.is/writing-articles/advanced-n8n-error-handling-and-recovery-strategies)
- [n8n Guide 2026: Features & Workflow Automation Deep Dive](https://hatchworks.com/blog/ai-agents/n8n-guide/)

### Verified Information

- **Workflow structure:** Linear with conditional branching (HIGH confidence — n8n docs + multiple sources)
- **OpenAI prompt structure:** Single call with JSON output (MEDIUM confidence — best practice, not documented requirement)
- **Switch vs IF:** Use Switch for 3+ outcomes (HIGH confidence — n8n docs)
- **Error workflow pattern:** Central error handler (HIGH confidence — n8n blog + docs)
- **Build order:** Incremental testing approach (MEDIUM confidence — derived from best practices)

---
*Architecture research for: n8n AI workflow automation*
*Researched: 2026-02-08*
