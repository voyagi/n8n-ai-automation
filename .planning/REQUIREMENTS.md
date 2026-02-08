# Requirements: n8n AI Contact Form Automation

**Defined:** 2026-02-08
**Core Value:** A working end-to-end automation that proves to Upwork clients: "I can connect real business tools with AI in the middle."

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Form & Webhook

- [ ] **FORM-01**: Professional, clean contact form with name, email, subject, and message fields
- [ ] **FORM-02**: Client-side validation (required fields, email format) with user feedback
- [ ] **FORM-03**: Form POSTs JSON payload to n8n webhook endpoint
- [ ] **FORM-04**: Success/error states displayed to user after submission

### n8n Workflow Core

- [ ] **WKFL-01**: Webhook trigger node receives POST from contact form
- [ ] **WKFL-02**: Set node extracts and normalizes form fields for downstream processing
- [ ] **WKFL-03**: OpenAI node classifies inquiry type (support / sales / feedback / spam)
- [ ] **WKFL-04**: OpenAI node generates one-line message summary
- [ ] **WKFL-05**: OpenAI node drafts a suggested response to the inquiry
- [ ] **WKFL-06**: OpenAI returns confidence score (%) for spam classification
- [ ] **WKFL-07**: Switch node routes spam (>70% confidence) vs legitimate submissions
- [ ] **WKFL-08**: Error handling branch captures and logs workflow failures

### Storage

- [ ] **STOR-01**: Google Sheets node logs all submissions with original data + AI analysis
- [ ] **STOR-02**: Spam submissions flagged in Google Sheets but notifications skipped

### Notifications

- [ ] **NOTF-01**: Rich Slack notification (Block Kit) with color-coded formatting and AI analysis
- [ ] **NOTF-02**: Email notification with AI analysis sent for legitimate submissions
- [ ] **NOTF-03**: Notifications skipped when submission classified as spam

### Documentation & Portfolio

- [ ] **DOCS-01**: Exportable n8n workflow JSON that others can import
- [ ] **DOCS-02**: Architecture diagram showing how pieces connect
- [ ] **DOCS-03**: Workflow canvas sticky notes explaining each section
- [ ] **DOCS-04**: Test dataset with 10 realistic form submissions showing varied inputs
- [ ] **DOCS-05**: Before/after comparison documenting manual process vs automated
- [ ] **DOCS-06**: README with setup instructions and architecture overview

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### AI Enhancements

- **AI-01**: Sentiment analysis (positive/negative/neutral) on submissions
- **AI-02**: Human-in-the-loop flag for low-confidence classifications
- **AI-03**: Custom confidence thresholds per inquiry category

### Notifications

- **NOTF-04**: Auto-reply email sent to form submitter with draft response
- **NOTF-05**: Configurable notification preferences per category

### Storage

- **STOR-03**: Supabase as alternative storage backend
- **STOR-04**: Sentiment trend dashboard over time

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Live deployment/hosting | Local demo + screen recording is sufficient for portfolio |
| Real-time dashboard | Overkill for contact form volume; adds frontend complexity |
| Multi-language AI processing | Adds cost/latency without clear ROI for demo |
| Complex CRM integration | Introduces auth complexity, distracts from workflow demo |
| Custom trained model | This is workflow automation, not ML engineering |
| Multiple AI providers | Portfolio demos need focus, not breadth. Document as swappable |
| User authentication | Open form with spam detection shows the automation |
| Serverless deployment | Clients want to see workflow logic, not DevOps |
| Production-scale monitoring | Over-engineering for a demo |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FORM-01 | TBD | Pending |
| FORM-02 | TBD | Pending |
| FORM-03 | TBD | Pending |
| FORM-04 | TBD | Pending |
| WKFL-01 | TBD | Pending |
| WKFL-02 | TBD | Pending |
| WKFL-03 | TBD | Pending |
| WKFL-04 | TBD | Pending |
| WKFL-05 | TBD | Pending |
| WKFL-06 | TBD | Pending |
| WKFL-07 | TBD | Pending |
| WKFL-08 | TBD | Pending |
| STOR-01 | TBD | Pending |
| STOR-02 | TBD | Pending |
| NOTF-01 | TBD | Pending |
| NOTF-02 | TBD | Pending |
| NOTF-03 | TBD | Pending |
| DOCS-01 | TBD | Pending |
| DOCS-02 | TBD | Pending |
| DOCS-03 | TBD | Pending |
| DOCS-04 | TBD | Pending |
| DOCS-05 | TBD | Pending |
| DOCS-06 | TBD | Pending |

**Coverage:**

- v1 requirements: 23 total
- Mapped to phases: 0
- Unmapped: 23

---
*Requirements defined: 2026-02-08*
*Last updated: 2026-02-08 after initial definition*
