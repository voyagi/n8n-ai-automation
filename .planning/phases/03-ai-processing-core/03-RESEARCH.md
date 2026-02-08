# Phase 3: AI Processing Core - Research

**Researched:** 2026-02-08
**Domain:** OpenAI API integration via n8n for text classification and generation
**Confidence:** MEDIUM

## Summary

The AI Processing Core phase integrates OpenAI's GPT models via n8n's OpenAI node to classify contact form submissions, generate summaries, and draft responses. Research reveals that n8n provides native OpenAI integration with multiple configuration options, but structured JSON output requires careful prompt engineering since n8n doesn't yet have full support for OpenAI's Structured Outputs feature (a community feature request exists).

The recommended approach uses OpenAI's JSON mode with explicit prompt instructions for schema adherence, combined with n8n's built-in retry logic for handling API failures. Classification tasks benefit from low temperature settings (0.0-0.3) for consistency, and spam detection should use conservative confidence thresholds (85%+) to minimize false positives.

**Primary recommendation:** Use a single OpenAI API call with a multi-task prompt that returns JSON containing all required fields (category, summary, spam score, draft response). Configure temperature at 0.2 for consistent classification while allowing slight variation in draft responses.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| OpenAI API | GPT-4o | Text classification and generation | Latest production model with best cost/performance for classification tasks |
| n8n OpenAI node | Latest | Integration layer | Native n8n integration with built-in credential management and error handling |
| JSON mode | N/A | Structured output | Ensures valid JSON responses (though schema enforcement requires prompt engineering) |

### Configuration
| Parameter | Recommended Value | Purpose | Source |
|-----------|------------------|---------|--------|
| Model | gpt-4o | Balance of speed, cost, and capability | [GPT-4 Turbo in the OpenAI API](https://help.openai.com/en/articles/8555510-gpt-4-turbo-in-the-openai-api) |
| Temperature | 0.2 | Consistent classification with slight draft variation | [Using GPT-4 for classification](https://tylerburleigh.com/blog/2023/10/08/) |
| Response Format | JSON Object | Structured output | [OpenAI JSON mode guide](https://www.eesel.ai/blog/openai-json-mode) |
| Max Tokens | 500-800 | Sufficient for summary + category + draft (4-6 sentences) | [OpenAI Rate Limits](https://platform.openai.com/docs/guides/rate-limits) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single multi-task call | Multiple specialized calls | Multiple calls = more reliable but 3-5x higher cost and latency |
| JSON mode | Structured Outputs | n8n doesn't yet support OpenAI Structured Outputs natively; requires community node |
| gpt-4o | gpt-3.5-turbo | 50% cost savings but significantly lower classification accuracy for nuanced categories |

## Architecture Patterns

### Recommended Node Structure
```
Webhook (POST) → Set Node (extract fields) → OpenAI Node (classify & generate) → Set Node (parse JSON) → Webhook Response
```

### Pattern 1: Multi-Task Single-Call Prompt

**What:** Combine classification, summarization, spam detection, and draft generation in one OpenAI call

**When to use:** When tasks are related and share context (as in this project)

**Example:**
```javascript
// System prompt for OpenAI node
You are a contact form analyzer. Analyze the message and return a JSON object.

**Classification categories:**
- support: Technical issues, bugs, how-to questions
- sales: Pricing, demos, partnerships, purchasing inquiries
- feedback: Product suggestions, compliments, complaints
- general_inquiry: Questions about the company, ambiguous requests
- spam: Obvious spam (gibberish, link farms) or unsolicited marketing pitches

**Instructions:**
1. Classify the inquiry into ONE category
2. Generate a one-line summary (under 100 characters)
3. Calculate spam confidence (0-100) with brief reason
4. Draft a professional, warm response (4-6 sentences) that:
   - Acknowledges the sender's message
   - Echoes back specific details they mentioned
   - Suggests appropriate next steps
   - Matches the category tone (sales=enthusiastic, support=empathetic, feedback=grateful)
5. SKIP draft generation if spam score > 80

Return ONLY valid JSON in this exact structure:
{
  "category": "category_name",
  "category_confidence": 85,
  "summary": "One-line summary of the message",
  "spam_score": 15,
  "spam_reason": "Brief explanation of spam score",
  "draft_response": "The drafted response or empty string if spam"
}

**Message to analyze:**
Name: {{ $json.name }}
Email: {{ $json.email }}
Message: {{ $json.message }}
```

**Source:** Adapted from [n8n sentiment analysis blog](https://blog.n8n.io/ai-sentiment-analysis/)

### Pattern 2: Error-Safe JSON Parsing

**What:** Parse OpenAI's JSON response with fallback handling for malformed output

**When to use:** Always - OpenAI JSON mode guarantees valid JSON but not schema adherence

**Example:**
```javascript
// In Set node after OpenAI
// Input: {{ $json.output }} (the OpenAI response)

// Parse with fallback
try {
  const parsed = JSON.parse($json.output);

  // Validate required fields exist
  return {
    category: parsed.category || 'general_inquiry',
    category_confidence: parsed.category_confidence || 50,
    summary: parsed.summary || 'Unable to summarize',
    spam_score: parsed.spam_score || 0,
    spam_reason: parsed.spam_reason || 'No spam indicators detected',
    draft_response: parsed.draft_response || ''
  };
} catch (error) {
  // Fallback for malformed JSON
  return {
    category: 'general_inquiry',
    category_confidence: 0,
    summary: 'Error processing submission',
    spam_score: 0,
    spam_reason: 'Processing error',
    draft_response: '',
    error: error.message
  };
}
```

**Source:** Combined from [n8n error handling docs](https://docs.n8n.io/flow-logic/error-handling/) and [OpenAI JSON mode best practices](https://www.eesel.ai/blog/openai-json-mode)

### Pattern 3: Retry Configuration for API Resilience

**What:** Configure n8n's built-in retry logic to handle transient OpenAI API failures

**When to use:** On the OpenAI node - essential for production workflows

**Configuration:**
- Retry on Fail: Enabled
- Max Tries: 3
- Wait Between Tries: 2000ms (2 seconds)
- Continue on Fail: Disabled (we want to know if AI processing fails)

**Why:** OpenAI API can have transient 5xx errors or rate limit 429 responses. Short retries (1-2s) resolve most issues quickly.

**Source:** [n8n error handling guide](https://easify-ai.com/error-handling-in-n8n-monitor-workflow-failures/)

### Anti-Patterns to Avoid

- **Multiple OpenAI calls for related tasks:** Costs 3-5x more, adds latency, and risks inconsistency. Use multi-task prompts instead.
- **High temperature for classification:** Values above 0.5 introduce unwanted variability in category assignments. Keep it low (0.0-0.3).
- **Skipping retry configuration:** OpenAI API has transient failures. Always enable retries with 1-2s delays.
- **Assuming JSON schema adherence:** JSON mode guarantees valid JSON, not correct structure. Always validate and provide fallbacks.
- **Overly aggressive spam detection:** Low thresholds (< 80%) cause false positives. Be conservative - only flag obvious spam.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON validation | Custom regex/string parsing | Native JSON.parse() with try/catch | Edge cases like escaped quotes, nested objects break regex |
| API retry logic | setTimeout loops in Function nodes | n8n's built-in Retry on Fail | n8n handles exponential backoff, error types, max attempts automatically |
| Prompt version control | Hardcoded strings in nodes | n8n Workflow Variables or external config | Changing prompts requires re-testing entire workflow; externalize for A/B testing |
| Rate limit handling | Custom delay counters | n8n rate limit handling + OpenAI retry headers | OpenAI returns rate limit info in headers; n8n can respect these automatically |

**Key insight:** n8n provides robust primitives for error handling, retry logic, and JSON processing. Building custom solutions duplicates this functionality with more bugs and maintenance burden.

## Common Pitfalls

### Pitfall 1: Missing "JSON" Keyword in Prompt

**What goes wrong:** OpenAI generates "an endless stream of whitespace" until token limit when JSON mode is enabled but prompt doesn't mention "JSON"

**Why it happens:** JSON mode requires explicit prompt instruction as a safeguard against accidental mode activation

**How to avoid:** Always include "Return ONLY valid JSON" or similar in system prompt when using `response_format: json_object`

**Warning signs:** Token limit errors, extremely long execution times, empty responses

**Source:** [OpenAI JSON mode guide](https://www.eesel.ai/blog/openai-json-mode)

### Pitfall 2: Schema Drift Between Prompt and Parser

**What goes wrong:** OpenAI returns valid JSON but with different field names than parser expects (e.g., "spam_confidence" vs "spam_score")

**Why it happens:** JSON mode enforces syntax, not schema. Model can invent field names if prompt isn't explicit.

**How to avoid:**
- Show exact JSON structure with field names in prompt: `{ "category": "...", "spam_score": ... }`
- Use "ONLY this exact structure" language
- Test with edge cases (empty message, gibberish, very long text)

**Warning signs:** Parser returns fallback values frequently, fields missing in parsed output

**Source:** [OpenAI JSON mode limitations](https://www.eesel.ai/blog/openai-json-mode)

### Pitfall 3: Token Limit Exceeded on Long Messages

**What goes wrong:** Form submission with 2000+ word message exceeds context window or max_tokens setting, causing API error or truncated response

**Why it happens:** `max_completion_tokens` set too low, or input message is abnormally long (spam/abuse)

**How to avoid:**
- Set reasonable form field character limits (e.g., 2000 chars for message)
- Configure `max_completion_tokens` to 500-800 (sufficient for our output)
- Add truncation logic if needed: `{{ $json.message.substring(0, 2000) }}`

**Warning signs:** 400 errors mentioning tokens, rate limit errors when token capacity isn't exceeded

**Source:** [OpenAI rate limits best practices](https://help.openai.com/en/articles/6891753-what-are-the-best-practices-for-managing-my-rate-limits-in-the-api)

### Pitfall 4: Temperature Too High for Classification

**What goes wrong:** Same input message gets classified as "support" on one run, "general_inquiry" on another run

**Why it happens:** Temperature > 0.5 introduces randomness that affects classification decisions, not just creative phrasing

**How to avoid:** Set temperature to 0.0-0.3 for classification tasks. Value of 0.2 provides consistency while allowing minor variation in draft response wording.

**Warning signs:** Inconsistent category assignments when testing same message multiple times, category confidence scores that vary widely

**Source:** [GPT-4 temperature for classification](https://tylerburleigh.com/blog/2023/10/08/) and [Temperature parameter guide](https://www.quilyx.com/ai-temperature/)

### Pitfall 5: False Positive Spam Detection

**What goes wrong:** Legitimate sales inquiries or technical questions get flagged as spam (e.g., message about "increasing conversion rates" marked as SEO spam)

**Why it happens:** Overly aggressive spam detection keywords without context analysis

**How to avoid:**
- Use conservative spam threshold (85%+ score before flagging)
- Instruct model to require MULTIPLE spam indicators (not just one keyword)
- Emphasize "obvious spam" and "unsolicited marketing" in prompt definition
- Review false positives in Google Sheet (Phase 5) and refine prompt

**Warning signs:** Support requests stuck in spam, very high spam detection rate (> 10% of submissions)

**Source:** [AI spam classification best practices](https://proofademic.ai/blog/false-positives-ai-detection-guide/) and [False positive trade-offs](https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall)

## Code Examples

Verified patterns from official sources and community implementations:

### OpenAI Node Configuration (n8n)

```javascript
// Operation: Text → Message a Model
// Model: gpt-4o
// Response Format: JSON Object

// System Message (Options → Add Option → System Message)
You are a contact form analyzer. Analyze the message and return a JSON object.

Classification categories:
- support: Technical issues, bugs, how-to questions
- sales: Pricing, demos, partnerships, purchasing
- feedback: Product suggestions, compliments, complaints
- general_inquiry: Ambiguous or general questions
- spam: Obvious spam or unsolicited marketing

Return ONLY valid JSON with this exact structure:
{
  "category": "one of the 5 categories",
  "category_confidence": 85,
  "summary": "One-line summary under 100 chars",
  "spam_score": 0-100,
  "spam_reason": "Brief explanation",
  "draft_response": "4-6 sentence response or empty if spam > 80"
}

// User Message (Prompt)
Analyze this contact form submission:
Name: {{ $json.name }}
Email: {{ $json.email }}
Message: {{ $json.message }}

// Options
Temperature: 0.2
Max Tokens: 800
Response Format: JSON Object
```

**Source:** Adapted from [n8n OpenAI text operations](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/text-operations/)

### JSON Response Parser (Set Node)

```javascript
// Set node after OpenAI node
// Mode: Manual Mapping

// Extract and validate OpenAI response
const rawOutput = $('OpenAI').first().json.message.content;

let parsed;
try {
  parsed = JSON.parse(rawOutput);
} catch (e) {
  // Fallback for JSON parse errors
  return [{
    json: {
      category: 'general_inquiry',
      category_confidence: 0,
      summary: 'Unable to process submission',
      spam_score: 0,
      spam_reason: 'Processing error',
      draft_response: '',
      parse_error: true
    }
  }];
}

// Validate and normalize fields
return [{
  json: {
    category: parsed.category || 'general_inquiry',
    category_confidence: Number(parsed.category_confidence) || 50,
    summary: (parsed.summary || 'No summary available').substring(0, 100),
    spam_score: Number(parsed.spam_score) || 0,
    spam_reason: parsed.spam_reason || 'No spam indicators',
    draft_response: parsed.draft_response || '',
    // Pass through original form data
    name: $json.name,
    email: $json.email,
    message: $json.message,
    submitted_at: new Date().toISOString()
  }
}];
```

**Source:** Combined from [n8n Set node documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.set/) and [JSON mode error handling](https://www.eesel.ai/blog/openai-json-mode)

### Retry Configuration Pattern

```yaml
# In OpenAI node Settings tab
Settings:
  Retry On Fail: true
  Max Tries: 3
  Wait Between Tries (ms): 2000
  Continue On Fail: false

# Rationale:
# - 3 retries handles most transient 5xx errors
# - 2000ms (2 second) delay prevents rate limit issues
# - Continue On Fail = false ensures we catch OpenAI failures
#   (downstream nodes shouldn't execute with missing AI data)
```

**Source:** [n8n error handling documentation](https://docs.n8n.io/flow-logic/error-handling/)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JSON mode with prompt engineering | Structured Outputs with JSON Schema | August 2024 | 100% schema adherence vs ~95% with prompt engineering |
| Multiple specialized API calls | Multi-task single call | Ongoing | 3-5x cost/latency reduction for related tasks |
| Manual retry loops | Built-in retry with exponential backoff | n8n core feature | Simplified error handling, fewer custom nodes |
| gpt-3.5-turbo default | gpt-4o recommended | GPT-4o release 2024 | Better classification accuracy at competitive cost |
| Temperature 0.7+ default | Temperature 0.0-0.3 for classification | Best practice evolution | More consistent category assignments |

**Deprecated/outdated:**
- **text-davinci-003**: Legacy completion model replaced by chat models (gpt-3.5-turbo and above)
- **JSON mode without "JSON" in prompt**: Now enforced as requirement; previously worked inconsistently
- **n8n HTTP Request node for OpenAI**: Native OpenAI node handles auth, retries, and formatting better

**Current but not yet in n8n:**
- **OpenAI Structured Outputs**: Requires `strict: true` parameter in API calls; n8n doesn't expose this yet. Community node exists: [n8n-nodes-openai-structured-outputs](https://github.com/crucerlabs/n8n-nodes-openai-structured-outputs)

## Open Questions

Things that couldn't be fully resolved:

1. **n8n Structured Outputs support timeline**
   - What we know: Community feature request exists, community node available as workaround
   - What's unclear: When/if n8n will add native support for OpenAI's `strict: true` parameter
   - Recommendation: Use JSON mode with explicit prompt schemas for now; monitor n8n release notes for Structured Outputs support

2. **Optimal spam threshold for this use case**
   - What we know: Conservative thresholds (85%+) minimize false positives
   - What's unclear: Exact threshold that balances false positives vs false negatives for contact form spam
   - Recommendation: Start at 80% threshold (skip draft), A/B test 75% vs 85% after collecting real data in Phase 5

3. **Token usage optimization for draft responses**
   - What we know: 4-6 sentence responses typically use 100-200 tokens
   - What's unclear: Whether conditional draft generation (skip if spam) saves enough tokens to matter
   - Recommendation: Always skip draft for spam > 80; measure actual token usage in production to validate savings

## Sources

### Primary (HIGH confidence)

- [OpenAI JSON mode guide](https://www.eesel.ai/blog/openai-json-mode) - Practical implementation details
- [n8n error handling documentation](https://docs.n8n.io/flow-logic/error-handling/) - Official retry and error configuration
- [OpenAI rate limits guide](https://platform.openai.com/docs/guides/rate-limits) - Token limits and optimization
- [n8n AI sentiment analysis blog](https://blog.n8n.io/ai-sentiment-analysis/) - Official workflow patterns

### Secondary (MEDIUM confidence)

- [Using GPT-4 for classification](https://tylerburleigh.com/blog/2023/10/08/) - Temperature recommendations verified across multiple sources
- [n8n error handling guide](https://easify-ai.com/error-handling-in-n8n-monitor-workflow-failures/) - Community best practices consistent with official docs
- [AI spam classification guide](https://proofademic.ai/blog/false-positives-ai-detection-guide/) - False positive thresholds (85%+) confirmed by academic research
- [Prompt engineering guide 2026](https://www.lakera.ai/blog/prompt-engineering-guide) - Multi-task prompt patterns

### Tertiary (LOW confidence)

- [n8n OpenAI community workflows](https://n8n.io/integrations/openai/) - Examples exist but implementation details vary
- [OpenAI Structured Outputs feature request](https://community.n8n.io/t/please-implement-structured-outputs-for-openai-models/80507) - Feature status unclear, marked for validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - OpenAI + n8n is well-documented, widely used pattern with official support
- Architecture: MEDIUM - Multi-task prompts are recommended but schema validation patterns vary by implementation
- Pitfalls: HIGH - JSON mode quirks, temperature effects, and spam detection trade-offs are well-documented with consistent guidance across sources

**Research date:** 2026-02-08
**Valid until:** 60 days (March 2026) - OpenAI API is stable; n8n releases monthly but changes to OpenAI node are infrequent
