# Pitfalls Research

**Domain:** n8n AI Automation with OpenAI, Google Sheets, Slack
**Researched:** 2026-02-08
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Credentials Not Included in Workflow Export

**What goes wrong:**
Exported workflow JSON files include credential names and IDs but **exclude the actual authentication data**. When you share your workflow for a portfolio demo or import it into a fresh n8n instance, all nodes show credential errors and nothing works. The workflow appears broken to anyone who imports it.

**Why it happens:**
n8n intentionally strips sensitive credential data from exports for security. Developers assume "export workflow" means "export everything," then share the JSON file expecting it to work for others. It doesn't.

**How to avoid:**
- Use environment variables for all credentials (OpenAI API key, Google Sheets auth, Slack webhook URL)
- Document credential setup in `workflows/README.md` with step-by-step instructions
- Include `.env.example` file showing which credentials are needed
- For portfolio demos: create a video showing the workflow working, don't rely on others importing it

**Warning signs:**
- You export the workflow and test the import — all nodes show "No credentials selected"
- Credential IDs in the JSON don't match anything in the target environment
- Google Sheets/Slack nodes show authentication errors immediately after import

**Phase to address:**
Phase 1 (Project Setup) — Configure credentials using environment variables from the start. Phase 6 (Documentation) — Create clear credential setup guide.

**Sources:**
- [N8N Export/Import Workflows: Complete JSON Guide](https://latenode.com/blog/low-code-no-code-platforms/n8n-setup-workflows-self-hosting-templates/n8n-export-import-workflows-complete-json-guide-troubleshooting-common-failures-2025)
- [Export and import workflows | n8n Docs](https://docs.n8n.io/workflows/export-import/)

---

### Pitfall 2: Unprotected Webhook Allows Spam/Bot Flooding

**What goes wrong:**
Your contact form webhook accepts requests from **anyone, anywhere**. Bots, scrapers, and attackers discover your webhook URL and flood it with spam. Your n8n instance gets hammered, OpenAI costs skyrocket, your Google Sheets fills with garbage, and Slack is unusable from notification spam. For a demo, this makes the project look amateur.

**Why it happens:**
n8n webhooks default to no authentication. Developers focus on "making it work" and never add security. In January 2026, CVE-2026-21858 exposed nearly 60,000 vulnerable n8n instances, showing how common this is.

**How to avoid:**
- Enable "Ignore Bots" option in Webhook node settings (blocks link previewers and crawlers)
- Add IP whitelist if you know the source IPs (not practical for public demos)
- Implement a simple authentication token: webhook requires `?token=SECRET` in URL
- For portfolio demos: use basic webhook authentication or show it working in a controlled environment
- **Never** expose your n8n instance publicly without protection

**Warning signs:**
- Webhook URL is `http://your-server/webhook/contact-form` with no query params or auth
- You see "test" or gibberish entries appearing in your Google Sheet
- OpenAI API costs are higher than expected
- Slack notifications arrive when you didn't submit the form

**Phase to address:**
Phase 2 (Webhook & Form Setup) — Add webhook security before deploying the form publicly. Phase 5 (Testing) — Verify protection works against automated tools.

**Sources:**
- [7 common n8n workflow mistakes that can break your automations](https://medium.com/@juanm.acebal/7-common-n8n-workflow-mistakes-that-can-break-your-automations-9638903fb076)
- [Can a n8n form get spammed if posted publicly?](https://community.n8n.io/t/can-a-n8n-form-get-spammed-if-posted-publicly/190769)
- [CVE-2026-21858 (Ni8mare): Unauthenticated n8n RCE](https://www.indusface.com/blog/cve-2026-21858-ni8mare-n8n-remote-code-execution/)

---

### Pitfall 3: OpenAI Rate Limits Cause Silent Workflow Failures

**What goes wrong:**
You submit 10 test forms rapidly. The first few process fine, then workflows start failing with "rate limit exceeded" errors. Without proper error handling, the workflow just **stops silently** — no data saved, no notification sent, no indication to the user that their message failed. Your demo appears broken.

**Why it happens:**
OpenAI has strict rate limits (requests per minute/day based on your tier). During testing or demos, rapid submissions hit these limits. n8n workflows without error handling fail silently when external APIs return errors.

**How to avoid:**
- Enable "Retry On Fail" on the OpenAI node (Settings → Auto Retry: Yes, Max Retries: 3, Wait Between Tries: 5000ms)
- Add a Wait node before the OpenAI call if processing multiple items (delay 2-3 seconds between requests)
- Implement error handling: connect OpenAI's "Error" output to a separate branch that logs failures
- For demos: show error handling working by intentionally triggering a rate limit
- Start with OpenAI tier with sufficient quota for your demo needs

**Warning signs:**
- Workflow execution list shows "Error" status on some submissions
- OpenAI node shows "The service is receiving too many requests from you" error
- Some form submissions never appear in Google Sheets or trigger Slack notifications
- Testing 5+ submissions in quick succession causes failures

**Phase to address:**
Phase 3 (AI Processing Logic) — Configure retry logic and error handling on OpenAI node. Phase 5 (Testing) — Test rapid submissions to verify rate limit handling.

**Sources:**
- [OpenAI node common issues | n8n Docs](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/common-issues/)
- [Handling API rate limits | n8n Docs](https://docs.n8n.io/integrations/builtin/rate-limits/)
- [5 n8n Workflow Mistakes That Quietly Break Automation](https://medium.com/@connect.hashblock/5-n8n-workflow-mistakes-that-quietly-break-automation-f1a4cfdac8bc)

---

### Pitfall 4: Google Sheets API Quota Exhaustion from Batch Writes

**What goes wrong:**
You test the workflow 20 times. Everything works. You launch the demo and process 100+ submissions. Suddenly, Google Sheets writes start failing with "too many requests" errors. Your data pipeline breaks and demo fails mid-presentation.

**Why it happens:**
Google Sheets API has a **write limit of 1000 requests per minute per project**. Each workflow execution writes a row. If you process submissions rapidly (testing, batch imports, demo scenarios), you hit this quota fast. Unlike OpenAI's rate limits which are per-user, Google's quota is **per project** — all your workflows share it.

**How to avoid:**
- Batch Google Sheets writes: collect multiple entries in an array, then write once
- Add error handling to Sheets node: connect error output to a Wait node (30-60s delay) then retry
- Use Loop Over Items with batching (batch size: 10-50 items) instead of writing individual rows
- For demos: space out submissions by 2-3 seconds, or pre-record a demo showing the workflow
- Monitor quota usage in Google Cloud Console if doing high-volume testing

**Warning signs:**
- Google Sheets node shows "The service is receiving too many requests from you! Perhaps take a break?" error
- First 20-30 submissions work, then failures start occurring
- Workflow shows partial success: OpenAI processed data but Sheets write failed
- Error happens during batch testing but not single submissions

**Phase to address:**
Phase 4 (Integrations) — Implement batching and error handling for Google Sheets writes. Phase 5 (Testing) — Test high-volume scenarios (50+ submissions) to verify quota handling.

**Sources:**
- [Google sheet issue - The service is receiving too many requests](https://community.n8n.io/t/google-sheet-issue-the-service-is-receiving-too-many-requests-from-you-perhaps-take-a-break/16954)
- [Usage limits | Google Sheets | Google for Developers](https://developers.google.com/workspace/sheets/api/limits)
- [Preventing Google Sheets Quota Errors during Batch Processing](https://n8n.io/workflows/5911-preventing-google-sheets-quota-errors-during-batch-processing/)

---

### Pitfall 5: Vague AI Prompts Produce Inconsistent Classifications

**What goes wrong:**
Your OpenAI prompt says "classify this message" with no examples. OpenAI classifies support questions as "feedback," sales inquiries as "spam," and produces wildly inconsistent categories across similar messages. Your demo shows unreliable AI that makes you look incompetent.

**Why it happens:**
Without few-shot examples, LLMs guess based on vague instructions. The same message classified twice can produce different results. Developers write prompts conversationally ("figure out what category this is") instead of providing structured examples.

**How to avoid:**
- Use **few-shot prompting**: include 3-5 examples of each category in your prompt
- Specify exact output format: "Return ONLY one of these: support, sales, feedback, spam"
- Include edge cases in examples: "If message contains 'buy now' but also asks questions, classify as sales"
- Test with 20+ diverse examples, track classification accuracy
- Use n8n's AI Evaluations feature to test prompt changes systematically

**Warning signs:**
- Same message submitted twice gets different categories
- Obvious spam gets classified as "support" or "sales"
- Categories you didn't define appear in outputs (e.g., "inquiry" when you wanted "sales")
- Classification confidence seems random

**Phase to address:**
Phase 3 (AI Processing Logic) — Write structured prompts with examples before building the workflow. Phase 5 (Testing) — Run evaluation dataset through the workflow to verify consistency.

**Sources:**
- [n8n Guide 2026: Features & Workflow Automation](https://hatchworks.com/blog/ai-agents/n8n-guide/)
- [Introducing Evaluations for AI workflows – n8n Blog](https://blog.n8n.io/introducing-evaluations-for-ai-workflows/)

---

### Pitfall 6: Slack Webhook Token Rotation Breaks Notifications

**What goes wrong:**
Your Slack integration works perfectly for 12 hours, then suddenly stops sending notifications. No errors show in n8n, but Slack never receives messages. Your demo stops working overnight before a presentation.

**Why it happens:**
Slack offers **token rotation that makes every token expire after 12 hours**. If you enable this (it's off by default), n8n credentials using these tokens fail after expiry. There's no warning — the workflow runs successfully in n8n but Slack silently rejects the requests.

**How to avoid:**
- Use Slack **incoming webhooks** instead of OAuth tokens (webhooks don't rotate)
- If using OAuth: disable token rotation in Slack app settings
- For production: implement token refresh logic (not needed for portfolio demo)
- Test your demo the day before: ensure Slack integration still works 24hrs later
- Monitor Slack app status in n8n credential manager

**Warning signs:**
- Slack notifications work for hours/days then suddenly stop
- n8n workflow shows success but no Slack message appears
- Slack credentials show "expired" or "invalid" in n8n after 12+ hours
- Deleting and recreating Slack credentials "fixes" it temporarily

**Phase to address:**
Phase 4 (Integrations) — Use incoming webhooks, not OAuth tokens. Phase 5 (Testing) — Test notification delivery 24 hours after initial setup.

**Sources:**
- [Slack connections not working](https://community.n8n.io/t/slack-connections-not-working/46142)
- [Slack Trigger node not responding to events](https://community.n8n.io/t/slack-trigger-node-not-responding-to-events/80009)

---

### Pitfall 7: Missing Error Handling Causes Data Loss

**What goes wrong:**
A user submits the form. OpenAI processes it successfully. Then Google Sheets API has a hiccup (network timeout, quota hit, temporary outage). The workflow **stops silently**. No data saved, no notification sent, no error logged. The user thinks their message was received, but it's gone forever.

**Why it happens:**
External APIs fail. Networks hiccup. Without error handling, n8n workflows fail-fast and stop execution. Developers focus on the "happy path" (everything works) and never test failure scenarios.

**How to avoid:**
- Connect error outputs from every external API node (OpenAI, Google Sheets, Slack)
- Create error handling branches: log failures to a separate sheet or send error notifications
- Enable "Continue On Fail" for non-critical nodes (Slack notification can fail without breaking data logging)
- For critical operations (logging to Sheets): implement retry logic with exponential backoff
- Test failure scenarios: disconnect internet mid-workflow to see what breaks

**Warning signs:**
- Workflow execution list shows "Error" status with no recovery
- No error handling branches visible in workflow editor
- Testing with intentional failures (invalid credentials) causes workflow to stop completely
- Users report "I submitted the form but never got a response"

**Phase to address:**
Phase 3 (AI Processing Logic) & Phase 4 (Integrations) — Add error handling branches to every external API node. Phase 5 (Testing) — Test with intentional failures.

**Sources:**
- [5 n8n Workflow Mistakes That Quietly Break Automation](https://medium.com/@connect.hashblock/5-n8n-workflow-mistakes-that-quietly-break-automation-f1a4cfdac8bc)
- [7 common n8n workflow mistakes](https://medium.com/@juanm.acebal/7-common-n8n-workflow-mistakes-that-can-break-your-automations-9638903fb076)

---

## Moderate Pitfalls

### Pitfall 8: "Save Execution Progress" Debug Feature Kills Performance

**What goes wrong:**
You enable "Save Execution Progress" to debug your workflow. It works, but n8n becomes sluggish. For a 30-node workflow running 100 times daily, this creates **3,000 database writes per day**. Your n8n instance slows to a crawl, demos lag, and the experience looks unprofessional.

**Why it happens:**
This debug feature saves data after **every node executes**, not just at the end. It's meant for debugging complex workflows, not production use. Developers enable it, forget about it, and wonder why performance degrades.

**Prevention:**
- Only enable "Save Execution Progress" when actively debugging
- Disable it before demo/production use
- Use workflow settings → "Save Execution Progress" → OFF (default should be OFF)
- For demos: keep workflows under 20 nodes to minimize debug overhead if you forget to disable

**Sources:**
- [7 common n8n workflow mistakes](https://medium.com/@juanm.acebal/7-common-n8n-workflow-mistakes-that-can-break-your-automations-9638903fb076)

---

### Pitfall 9: Inefficient Loops Create Thousands of API Calls

**What goes wrong:**
You need to process 100 form submissions. You use a SplitInBatches loop with **batch size = 1**, making an OpenAI API call for each item individually. Instead of 10 batches of 10, you make 100 separate API calls. This is slow, expensive, and likely to hit rate limits.

**Why it happens:**
Developers don't understand batching. They loop over items individually because that's the first pattern they learn. For demos, this means slow processing times that make the automation look inefficient.

**Prevention:**
- Use SplitInBatches with appropriate batch size (10-50 items)
- For APIs that support batch operations: use batch endpoints instead of loops
- For OpenAI: consider whether you can process multiple messages in one prompt (if categorization logic is simple)
- Profile your workflow: check execution time and API call count before demo

**Sources:**
- [7 common n8n workflow mistakes](https://medium.com/@juanm.acebal/7-common-n8n-workflow-mistakes-that-can-break-your-automations-9638903fb076)

---

### Pitfall 10: Merge Node Hangs Indefinitely on Conditional Branches

**What goes wrong:**
Your workflow has a conditional branch: spam messages go one path, legitimate messages go another. Both paths feed into a Merge node set to "Wait for both inputs." You test with all spam messages. The legitimate path **never fires**, so the Merge node **hangs indefinitely**. Workflow never completes.

**Why it happens:**
Merge nodes set to "Wait for both inputs" assume both branches always execute. If a condition sends 100% of items down one path, the other path never sends data, and Merge waits forever.

**Prevention:**
- Use Merge node with "Combine All" or "Multiplex" mode instead of "Wait for both inputs"
- Understand conditional branching: if branches can be empty, don't use "Wait for both"
- For spam filtering: process spam differently or merge at the end with appropriate mode
- Test edge cases: what happens if all messages are spam? What if none are?

**Sources:**
- [5 n8n Workflow Mistakes That Quietly Break Automation](https://medium.com/@connect.hashblock/5-n8n-workflow-mistakes-that-quietly-break-automation-f1a4cfdac8bc)

---

## Minor Pitfalls

### Pitfall 11: Hardcoded API Keys Visible in Workflow JSON

**What goes wrong:**
You paste your OpenAI API key directly into an HTTP Request node or Code node instead of using n8n's credential store. When you export the workflow to share for your portfolio, your **API key is in plain text** in the JSON file. Anyone who downloads it can steal your key and rack up charges.

**Why it happens:**
Copying API keys into code is faster than setting up credentials. Developers do it "temporarily" and forget to fix it.

**Prevention:**
- **Always** use n8n's credential store for API keys, tokens, passwords
- Never hardcode credentials in Code nodes, HTTP Request nodes, or Set nodes
- Before exporting: search workflow JSON for "api", "key", "token", "password" to verify nothing leaked
- Use environment variables for all sensitive data

**Sources:**
- [7 common n8n workflow mistakes](https://medium.com/@juanm.acebal/7-common-n8n-workflow-mistakes-that-can-break-your-automations-9638903fb076)

---

### Pitfall 12: JSON Parsing Without Try/Catch Causes Silent Crashes

**What goes wrong:**
Your Code node does `JSON.parse()` on webhook data. A malformed request arrives (missing field, invalid JSON). The parse fails, workflow crashes silently, no error logged.

**Why it happens:**
Developers assume input is always well-formed. Real-world data is messy. One bad submission breaks the whole workflow.

**Prevention:**
- Wrap JSON.parse() in try/catch blocks
- Validate input data structure before processing
- Use n8n's "Validate" or "If" nodes to check data before Code nodes
- Test with intentionally malformed data to verify error handling

**Sources:**
- [5 n8n Workflow Mistakes That Quietly Break Automation](https://medium.com/@connect.hashblock/5-n8n-workflow-mistakes-that-quietly-break-automation-f1a4cfdac8bc)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip error handling on external API nodes | Faster development, simpler workflow | Silent failures, data loss, unreliable automation | **Never** — always add error handling |
| Use OAuth tokens instead of webhooks for Slack | More features available | Token rotation breaks notifications after 12hrs | Only if you implement token refresh logic |
| Hardcode credentials in nodes | Quicker setup, fewer steps | Security risk, can't share workflow safely | **Never** — use credential store |
| SplitInBatches with size=1 | Simpler logic, easier to debug | Slow, expensive, hits rate limits | Only for <10 items |
| Skip "Retry On Fail" configuration | Less configuration upfront | Transient failures kill workflows permanently | **Never** for external API calls |
| Single webhook for form without auth | Easiest initial setup | Spam floods, costs skyrocket, unusable in production | Only for localhost testing |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenAI API | No retry logic, hitting rate limits | Enable "Retry On Fail" + Wait node between requests |
| Google Sheets | Individual row writes in loops | Batch writes (10-50 rows at once) with error handling |
| Slack Webhooks | Using OAuth tokens that expire | Use incoming webhooks (don't expire) |
| Webhook Trigger | No authentication, accepts any request | Add "Ignore Bots" + IP whitelist or token auth |
| Credentials | Hardcoding in Code/HTTP nodes | Use n8n credential store + environment variables |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Save Execution Progress enabled | Sluggish n8n UI, slow workflow execution | Disable unless actively debugging | 100+ executions/day |
| Inefficient batching (size=1) | Slow processing, rate limit errors | Use appropriate batch sizes (10-50) | >50 items to process |
| No rate limit handling | Random failures during testing/demos | Add Wait nodes + Retry On Fail | 10+ rapid submissions |
| Individual API calls in loops | Slow, expensive, unreliable | Batch operations where possible | >20 loop iterations |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Public webhook without auth | Spam flooding, API cost explosion, DDoS | Enable "Ignore Bots" + IP whitelist or token param |
| API keys in workflow JSON | Credential theft, unauthorized API usage | Use n8n credential store exclusively |
| No HTTPS for webhook | Man-in-the-middle attacks, data interception | Use HTTPS for production webhooks |
| Exposing n8n instance publicly | RCE vulnerability (CVE-2026-21858) | Use VPN, firewall, or don't expose publicly |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No error feedback to user | User submits form, no idea if it worked | Add email confirmation or success webhook response |
| Vague AI classifications | Confusing, inconsistent results | Use few-shot prompts with clear examples |
| Slow processing (no batching) | User waits 30+ seconds for response | Optimize workflow, use async processing + email notification |
| Silent failures | User thinks message sent, but it's lost | Implement error handling + fallback notifications |

## "Looks Done But Isn't" Checklist

- [ ] **Webhook security:** Often missing authentication — verify "Ignore Bots" enabled or token auth added
- [ ] **Error handling:** Often missing error branches — verify OpenAI, Sheets, Slack nodes have error outputs connected
- [ ] **Rate limit handling:** Often missing retry logic — verify "Retry On Fail" enabled on external API nodes
- [ ] **Credential portability:** Often hardcoded — verify all credentials use n8n credential store or env vars
- [ ] **Batching:** Often inefficient loops — verify batch size >1 for SplitInBatches operations
- [ ] **AI prompt quality:** Often vague instructions — verify few-shot examples included in OpenAI prompt
- [ ] **Google Sheets quota:** Often no handling — verify error handling + batching for high-volume scenarios
- [ ] **Slack notification reliability:** Often using expiring tokens — verify using incoming webhooks not OAuth

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Leaked credentials in exported JSON | HIGH | Revoke compromised keys immediately, rotate all credentials, re-export clean workflow |
| Spam-flooded webhook | MEDIUM | Add authentication, clear spam data from Sheets, monitor for 24hrs |
| Google Sheets quota exhausted | LOW | Wait 1 minute for quota reset, add batching + error handling |
| OpenAI rate limit exceeded | LOW | Wait for quota reset, add retry logic + Wait nodes |
| Slack token expired | LOW | Use incoming webhooks instead, or rotate OAuth token |
| Missing error handling | MEDIUM | Add error branches to all external nodes, test with intentional failures |
| Vague AI classifications | MEDIUM | Rewrite prompts with few-shot examples, test with evaluation dataset |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Credentials not in export | Phase 1 (Setup) | Verify .env.example created, README documents credential setup |
| Unprotected webhook | Phase 2 (Webhook) | Verify "Ignore Bots" enabled or token auth required |
| OpenAI rate limits | Phase 3 (AI Logic) | Test 10+ rapid submissions, verify retry logic works |
| Google Sheets quota | Phase 4 (Integrations) | Test 50+ submissions, verify batching + error handling |
| Vague AI prompts | Phase 3 (AI Logic) | Run evaluation dataset, verify >90% classification accuracy |
| Slack token rotation | Phase 4 (Integrations) | Use webhooks not OAuth, test 24hrs after setup |
| Missing error handling | Phases 3-4 (All external APIs) | Intentionally trigger failures, verify graceful handling |
| Save Execution Progress | Phase 5 (Testing) | Verify disabled in workflow settings before demo |
| Inefficient loops | Phases 3-4 | Profile workflow, verify batch operations used |
| Merge node hangs | Phase 3 (Logic) | Test edge cases: all spam, no spam, mixed |

## Sources

**n8n Common Mistakes:**
- [7 common n8n workflow mistakes that can break your automations](https://medium.com/@juanm.acebal/7-common-n8n-workflow-mistakes-that-can-break-your-automations-9638903fb076)
- [5 n8n Workflow Mistakes That Quietly Break Automation](https://medium.com/@connect.hashblock/5-n8n-workflow-mistakes-that-quietly-break-automation-f1a4cfdac8bc)
- [N8N Troubleshooting: Common Issues and Solutions](https://www.wednesday.is/writing-articles/n8n-troubleshooting-common-issues-and-solutions)

**OpenAI Integration:**
- [OpenAI node common issues | n8n Docs](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/common-issues/)
- [OpenAI Chat Model node common issues | n8n Docs](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenai/common-issues/)

**Google Sheets API:**
- [Google sheet issue - The service is receiving too many requests](https://community.n8n.io/t/google-sheet-issue-the-service-is-receiving-too-many-requests-from-you-perhaps-take-a-break/16954)
- [Usage limits | Google Sheets | Google for Developers](https://developers.google.com/workspace/sheets/api/limits)
- [Preventing Google Sheets Quota Errors during Batch Processing](https://n8n.io/workflows/5911-preventing-google-sheets-quota-errors-during-batch-processing/)
- [Handling API rate limits | n8n Docs](https://docs.n8n.io/integrations/builtin/rate-limits/)

**Slack Integration:**
- [Slack connections not working](https://community.n8n.io/t/slack-connections-not-working/46142)
- [Slack Trigger node not responding to events](https://community.n8n.io/t/slack-trigger-node-not-responding-to-events/80009)

**Workflow Export/Import:**
- [N8N Export/Import Workflows: Complete JSON Guide](https://latenode.com/blog/low-code-no-code-platforms/n8n-setup-workflows-self-hosting-templates/n8n-export-import-workflows-complete-json-guide-troubleshooting-common-failures-2025)
- [Export and import workflows | n8n Docs](https://docs.n8n.io/workflows/export-import/)

**Security:**
- [Can a n8n form get spammed if posted publicly?](https://community.n8n.io/t/can-a-n8n-form-get-spammed-if-posted-publicly/190769)
- [CVE-2026-21858 (Ni8mare): Unauthenticated n8n RCE](https://www.indusface.com/blog/cve-2026-21858-ni8mare-n8n-remote-code-execution/)

**AI/Prompt Engineering:**
- [n8n Guide 2026: Features & Workflow Automation](https://hatchworks.com/blog/ai-agents/n8n-guide/)
- [Introducing Evaluations for AI workflows – n8n Blog](https://blog.n8n.io/introducing-evaluations-for-ai-workflows/)

---
*Pitfalls research for: n8n AI Automation Portfolio Project*
*Researched: 2026-02-08*
