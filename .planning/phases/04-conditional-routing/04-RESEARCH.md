# Phase 4: Conditional Routing - Research

**Researched:** 2026-02-09
**Domain:** n8n workflow conditional routing with Switch node
**Confidence:** HIGH

## Summary

Phase 4 implements conditional routing to split spam submissions from legitimate ones using n8n's Switch node. The research confirms Switch node supports numeric threshold comparisons (spam_score > 70) with Rules mode, and reveals a critical architectural constraint: the current workflow uses webhook `responseMode: "responseNode"` which requires explicit Respond to Webhook nodes in each branch (spam and legitimate paths must both return responses synchronously).

The standard pattern for spam filtering uses threshold-based routing (>70% confidence = spam) with fallback handling to catch edge cases. Switch node is preferred over nested IF nodes when routing to 2+ distinct paths.

**Primary recommendation:** Use Switch node in Rules mode with numeric comparison (spam_score > 70), configure fallback to route low-confidence items to legitimate branch, and keep current responseNode mode (both branches will eventually need Respond to Webhook nodes, though Phase 4 only adds routing infrastructure).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| n8n Switch node | n8n-nodes-base.switch v2+ | Conditional workflow routing with multiple outputs | Official n8n core node, replaces nested IF nodes for cleaner multi-path logic |
| n8n Respond to Webhook | n8n-nodes-base.respondToWebhook v1.1+ | Synchronous webhook response with custom status/body | Required when webhook responseMode is "responseNode" - only first executed Respond node triggers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| n8n IF node | n8n-nodes-base.if v2+ | Simple binary (true/false) conditional routing | Use for 2-way splits; Switch better for 3+ paths or complex conditions |
| n8n Filter node | n8n-nodes-base.filter | Remove items not matching conditions | Use when you want to discard items entirely (spam logging/archiving in future phases) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Switch node | Nested IF nodes | IF works but creates messy canvas for 3+ conditions; Switch is cleaner and more maintainable |
| Rules mode | Expression mode | Expression mode requires writing custom JavaScript; Rules mode is declarative and easier to debug |
| Numeric comparison | String comparison with conversion | Switch node natively handles Number type - no manual conversion needed |

**Installation:**
No installation required - Switch and Respond to Webhook are n8n core nodes available in all n8n installations.

## Architecture Patterns

### Recommended Project Structure
```
Webhook (responseMode: "responseNode")
  → Normalize Fields
  → Validate Fields
    → [false] → Error Response → Validation Error (Respond to Webhook)
    → [true] → Analyze Contact Form → Parse AI Response
      → Switch Node (spam_score routing)
        → [Output 0: spam_score > 70] → (spam branch - future nodes)
        → [Output 1: fallback] → Success Response (Respond to Webhook)
```

### Pattern 1: Threshold-Based Spam Routing
**What:** Use Switch node with numeric comparison to route based on AI confidence score
**When to use:** Spam detection, quality scoring, priority routing, any threshold-based decision
**Example:**
```json
// Switch node configuration (Rules mode)
{
  "parameters": {
    "mode": "rules",
    "rules": {
      "rules": [
        {
          "output": 0,
          "conditions": {
            "conditions": [
              {
                "leftValue": "={{ $json.spam_score }}",
                "rightValue": 70,
                "operator": {
                  "type": "number",
                  "operation": "gt"
                }
              }
            ]
          }
        }
      ]
    },
    "options": {
      "fallbackOutput": "extra"
    }
  }
}
```
**Source:** [n8n Switch Node Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.switch/), [Spam Detection Pattern](https://prakhargurunani.com/blog/detecting-spam-emails-using-n8n/)

### Pattern 2: Dual-Condition Spam Gate (Alternative)
**What:** Use IF node with AND logic for spam flag + confidence threshold
**When to use:** When you have boolean spam flag AND numeric confidence (redundant in our case - we only have spam_score)
**Example:**
```javascript
// IF node expression (not recommended for this phase)
{{ $json.is_spam === true && $json.confidence > 70 }}
```
**Why NOT using this:** Our AI returns `spam_score` (0-100), not a boolean `is_spam` flag. Switch node with numeric comparison is cleaner.

### Pattern 3: Webhook Response Mode with Conditional Branches
**What:** Use "responseNode" mode with Respond to Webhook nodes in each conditional branch
**When to use:** When you need different HTTP responses per branch (400 for spam, 200 for legitimate)
**Critical constraint:** Only the FIRST Respond to Webhook node encountered during execution triggers. Design workflow so each branch has exactly one Respond node.
**Example workflow:**
```
Webhook (responseMode: "responseNode")
  → [processing nodes]
  → Switch Node
    → [spam branch] → [spam handling] → Spam Response (Respond to Webhook, 400)
    → [legit branch] → [legit handling] → Success Response (Respond to Webhook, 200)
```
**Source:** [n8n Respond to Webhook Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/), [Community discussion](https://community.n8n.io/t/multiple-webhooks-response-for-the-same-webhook-triger/82022)

### Anti-Patterns to Avoid
- **Multiple Respond to Webhook nodes in same branch:** Only first executes - others are ignored
- **Missing fallback on Switch node:** Items not matching any rule are lost (set fallbackOutput to "extra" or "output0")
- **Using "When Last Node Finishes" with conditional branches:** In multi-branch workflows, "last node" is ambiguous (which branch finishes last?) - use "responseNode" mode instead for predictable responses
- **Hardcoding threshold in multiple places:** Store threshold (70) in a variable/constant if used in multiple nodes

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Numeric threshold routing | Custom JavaScript IF logic | Switch node Rules mode with Number type | Built-in type validation, visual debugging, no code |
| Multi-path conditional logic | Nested IF nodes | Single Switch node | Cleaner canvas, easier to maintain, single source of truth |
| Webhook response handling | Manual HTTP response construction | Respond to Webhook node | Handles headers, status codes, content-type automatically |
| Spam confidence calculation | Custom scoring algorithm | OpenAI spam_score (already implemented) | AI model trained on millions of spam examples |

**Key insight:** n8n's visual workflow nodes are designed to replace custom scripting. Use Switch/IF/Respond nodes instead of Code nodes for routing and responses - they're easier to debug, maintain, and understand at a glance.

## Common Pitfalls

### Pitfall 1: Lost Items with Missing Fallback
**What goes wrong:** Items not matching any Switch rule disappear from workflow (no output, no error)
**Why it happens:** Default fallbackOutput is "none" - non-matching items are silently discarded
**How to avoid:** Always set `fallbackOutput` to either "extra" (separate output) or "output0" (route to first rule's output)
**Warning signs:** Workflow executions show fewer output items than input items, manual testing with edge cases produces no response
**Fix:**
```json
{
  "parameters": {
    "options": {
      "fallbackOutput": "extra"
    }
  }
}
```

### Pitfall 2: Switch Condition Type Mismatch
**What goes wrong:** Switch node always routes to fallback even when condition should match
**Why it happens:** spam_score is string "85" instead of number 85, and strict type validation fails
**How to avoid:** Ensure Parse AI Response node casts spam_score to Number: `Number(parsed.spam_score) || 0`
**Warning signs:** All items route to fallback, logs show "85" (string) vs 85 (number)
**Already handled:** Phase 3 Parse AI Response node already does `Number(parsed.spam_score) || 0`

### Pitfall 3: Ambiguous "When Last Node Finishes" with Branches
**What goes wrong:** Webhook returns unpredictable data when workflow has multiple terminal branches
**Why it happens:** "Last node" means "chronologically last executed node" not "last node in primary path" - race condition in parallel branches
**How to avoid:** Use `responseMode: "responseNode"` and explicit Respond to Webhook nodes in each branch
**Warning signs:** Sometimes webhook returns spam branch data, sometimes legitimate branch data
**Current state:** Workflow already uses `responseMode: "responseNode"` - no change needed

### Pitfall 4: Multiple Respond to Webhook Nodes in Sequential Path
**What goes wrong:** Second Respond to Webhook node never executes (webhook already responded)
**Why it happens:** n8n only executes the FIRST Respond to Webhook encountered during execution, all others are skipped
**How to avoid:** Each conditional branch should have exactly ONE Respond to Webhook as final node
**Warning signs:** Workflow executes successfully but logs show "Respond to Webhook skipped"
**Design rule:** Use Switch node outputs as mutually exclusive paths - each path gets one Respond node

### Pitfall 5: Forgetting to Test Edge Case (spam_score = 70)
**What goes wrong:** Unclear whether score of exactly 70 routes to spam or legitimate branch
**Why it happens:** Condition is `spam_score > 70` not `spam_score >= 70` - boundary case behavior depends on operator
**How to avoid:** Decide early: use `>` (70 not spam) or `>=` (70 is spam), document decision, add test case
**Recommendation:** Use `>` (strictly greater than) - score of exactly 70 is borderline, treat as legitimate (false negatives safer than false positives for user experience)

## Code Examples

Verified patterns from official sources:

### Switch Node Configuration (Spam Routing)
```json
// Full Switch node config for spam_score > 70
{
  "parameters": {
    "mode": "rules",
    "rules": {
      "rules": [
        {
          "output": 0,
          "conditions": {
            "options": {
              "caseSensitive": true,
              "leftValue": "",
              "typeValidation": "strict"
            },
            "conditions": [
              {
                "id": "spam-threshold",
                "leftValue": "={{ $json.spam_score }}",
                "rightValue": 70,
                "operator": {
                  "type": "number",
                  "operation": "gt"
                }
              }
            ],
            "combinator": "and"
          }
        }
      ]
    },
    "options": {
      "fallbackOutput": "extra"
    }
  },
  "id": "route-spam",
  "name": "Route by Spam Score",
  "type": "n8n-nodes-base.switch",
  "typeVersion": 2
}
```
**Source:** Synthesized from [n8n Switch docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.switch/) and [GitHub source](https://github.com/n8n-io/n8n-docs/blob/main/docs/integrations/builtin/core-nodes/n8n-nodes-base.switch.md)

### Connecting Switch to Existing Nodes
```json
// Parse AI Response → Switch Node connection
{
  "Parse AI Response": {
    "main": [
      [
        {
          "node": "Route by Spam Score",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}

// Switch Node → Success Response connection (legitimate branch)
{
  "Route by Spam Score": {
    "main": [
      [], // Output 0 (spam branch) - empty for now
      [  // Output 1 (fallback = legitimate branch)
        {
          "node": "Success Response",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}
```

### Accessing Previous Node Data in Switch Branches
```javascript
// In nodes after Switch, reference data from before Switch
// Example: Success Response still needs form fields + AI analysis

// Access Parse AI Response output (immediate parent)
{{ $json.name }}
{{ $json.email }}
{{ $json.spam_score }}

// Access earlier nodes by name
{{ $('Normalize Fields').first().json.name }}
{{ $('Parse AI Response').first().json.category }}
```
**Source:** Standard n8n expression syntax

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Nested IF nodes for multi-path logic | Switch node with Rules mode | n8n v0.180+ (2022) | Cleaner workflows, easier maintenance |
| "When Last Node Finishes" for all webhooks | "Using Respond to Webhook node" for conditional logic | Always available, best practice emerged 2023+ | Predictable responses in complex workflows |
| Manual spam scoring in Code nodes | OpenAI/Claude spam confidence scores | GPT-4 era (2023+) | Higher accuracy, less maintenance |
| String-based threshold checks | Typed Number comparisons | Switch node v2+ | Better type safety, fewer bugs |

**Deprecated/outdated:**
- **Return more than one data item from Respond to Webhook:** Deprecated - only first Respond node executes now
- **IF node for 3+ conditions:** Not deprecated but discouraged - Switch node is cleaner
- **Expression mode for simple threshold checks:** Not deprecated but Rules mode is more maintainable

## Open Questions

1. **Should spam branch return 400 or 200 status code?**
   - What we know: Spam detected, user submitted real form (not a bot attack)
   - What's unclear: Is spam submission a "client error" (400) or "successful processing" (200) with spam flag?
   - Recommendation: Return 200 with `{spam: true}` - form was valid and processed, AI determined it's spam. 400 implies form validation failure. Final decision in Phase 4 planning.

2. **Should spam_score boundary (exactly 70) route to spam or legitimate?**
   - What we know: Condition uses `>` operator (strictly greater than)
   - What's unclear: Is score=70 spam or legitimate by business logic?
   - Recommendation: Use `>` not `>=` - score of 70 is borderline, treat as legitimate (false negatives better than false positives). Document this decision.

3. **What happens to spam submissions after routing (Phase 4 scope)?**
   - What we know: Phase 4 only implements routing infrastructure, not spam handling
   - What's unclear: Should Phase 4 include placeholder response for spam branch or leave empty?
   - Recommendation: Add simple Respond to Webhook node with `{status: "spam_detected"}` message so both branches have responses (prevents webhook timeout). Full spam handling in Phase 5/6.

## Sources

### Primary (HIGH confidence)
- [n8n Switch Node Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.switch/) - Official docs, Rules vs Expression modes
- [n8n Switch Node GitHub Source](https://github.com/n8n-io/n8n-docs/blob/main/docs/integrations/builtin/core-nodes/n8n-nodes-base.switch.md) - Markdown source with configuration examples
- [n8n Respond to Webhook Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/) - Official docs, response modes
- [n8n Webhook Node Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) - responseMode parameter

### Secondary (MEDIUM confidence)
- [Prakhar Gurunani - Spam Detection with n8n](https://prakhargurunani.com/blog/detecting-spam-emails-using-n8n/) - Real-world spam routing pattern (IF node with dual condition: is_spam && confidence > 70)
- [n8n Community - Multiple Webhook Responses](https://community.n8n.io/t/multiple-webhooks-response-for-the-same-webhook-triger/82022) - Confirms only first Respond to Webhook executes
- [n8n Workflow Template - Error-proof Switch Fallbacks](https://n8n.io/workflows/9571-implement-error-proof-switch-node-fallbacks-for-reliable-workflow-control/) - Best practices for fallback handling
- [n8n Workflow Template - AI Email Classifier](https://n8n.io/workflows/4507-ai-email-classifier-and-auto-delete-for-gmail-spamoffer-cleaner/) - Spam filtering workflow example

### Tertiary (LOW confidence - flagged for validation)
- WebSearch results about "When Last Node Finishes" behavior with branches - described behavior as "chronologically last executed node" but not verified in official docs
- Community forum discussions about Switch node bugs (items not passing through, conditions not matching) - appear to be resolved or edge cases, but worth testing during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Switch and Respond to Webhook are core n8n nodes with stable APIs
- Architecture: HIGH - Multiple sources confirm Switch > IF for multi-path, responseNode mode for conditional responses
- Pitfalls: MEDIUM-HIGH - Fallback and type validation pitfalls documented in official sources; Respond to Webhook execution order confirmed by community; "When Last Node Finishes" ambiguity is logical inference (MEDIUM)

**Research date:** 2026-02-09
**Valid until:** 60 days (n8n core nodes are stable, minimal breaking changes)

**Additional notes:**
- Current workflow already in optimal configuration (responseNode mode) - no migration needed
- Parse AI Response node already handles type conversion (spam_score as Number) - no changes needed
- Phase 3 validated spam detection works (spam score >80 for obvious spam) - threshold of 70 is reasonable
