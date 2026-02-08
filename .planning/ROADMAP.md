# Roadmap: n8n AI Contact Form Automation

## Overview

This roadmap transforms a basic contact form into a complete AI-powered automation portfolio piece through 8 phases. Starting with form polish and infrastructure setup, we build the n8n workflow incrementally: webhook integration, OpenAI classification, conditional routing, storage, and notifications. The journey concludes with comprehensive error handling, testing, and portfolio-ready documentation including workflow export, screenshots, and demo materials that prove automation capability to Upwork clients.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Form Polish** - Complete the UI and establish n8n infrastructure
- [ ] **Phase 2: Webhook Integration** - Connect form to n8n workflow
- [ ] **Phase 3: AI Processing Core** - Build OpenAI classification and analysis
- [ ] **Phase 4: Conditional Routing** - Add spam detection and branching logic
- [ ] **Phase 5: Storage Integration** - Implement Google Sheets logging
- [ ] **Phase 6: Notification System** - Add Slack and email notifications
- [ ] **Phase 7: Error Handling & Testing** - Comprehensive testing and failure scenarios
- [ ] **Phase 8: Documentation & Portfolio** - Export workflow and create demo materials

## Phase Details

### Phase 1: Foundation & Form Polish
**Goal**: Professional contact form UI and n8n infrastructure ready for workflow development
**Depends on**: Nothing (first phase, builds on existing scaffolding)
**Requirements**: FORM-01, FORM-02, FORM-03, FORM-04
**Success Criteria** (what must be TRUE):
  1. Contact form displays with professional styling (name, email, subject, message fields)
  2. Client-side validation prevents invalid submissions (empty fields, malformed emails)
  3. Form shows success message after valid submission
  4. Form shows error message when submission fails
  5. n8n instance runs locally at http://localhost:5678 with credentials configured
**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md -- Restructure HTML and rewrite CSS for floating labels, responsive layout, and success card
- [ ] 01-02-PLAN.md -- Rewrite JavaScript for validation, submission handling, and state management

### Phase 2: Webhook Integration
**Goal**: Form submissions flow into n8n workflow for processing
**Depends on**: Phase 1
**Requirements**: WKFL-01, WKFL-02
**Success Criteria** (what must be TRUE):
  1. Form POST request reaches n8n webhook endpoint successfully
  2. Webhook trigger node captures complete form payload (name, email, subject, message)
  3. Set node normalizes data into consistent structure for downstream processing
  4. Test submission appears in n8n execution history with parsed fields
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 3: AI Processing Core
**Goal**: OpenAI analyzes submissions and provides classification, summary, and draft response
**Depends on**: Phase 2
**Requirements**: WKFL-03, WKFL-04, WKFL-05, WKFL-06
**Success Criteria** (what must be TRUE):
  1. OpenAI node classifies inquiry type (support / sales / feedback / spam)
  2. OpenAI node generates accurate one-line message summary
  3. OpenAI node drafts contextually appropriate suggested response
  4. OpenAI returns spam confidence score (0-100%) for each submission
  5. Test submissions show consistent classification across similar content
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 4: Conditional Routing
**Goal**: Workflow routes spam vs legitimate submissions to different handling paths
**Depends on**: Phase 3
**Requirements**: WKFL-07
**Success Criteria** (what must be TRUE):
  1. Switch node correctly routes spam (>70% confidence) to spam branch
  2. Switch node routes legitimate submissions (<70% spam confidence) to processing branch
  3. Test spam submission triggers spam branch (visible in execution path)
  4. Test legitimate submission triggers processing branch (visible in execution path)
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 5: Storage Integration
**Goal**: All submissions logged to Google Sheets with AI analysis results
**Depends on**: Phase 4
**Requirements**: STOR-01, STOR-02
**Success Criteria** (what must be TRUE):
  1. Google Sheets contains row for every submission (spam and legitimate)
  2. Each row includes original data (name, email, subject, message, timestamp)
  3. Each row includes AI analysis (category, sentiment, summary, draft reply, spam score)
  4. Spam submissions clearly flagged in dedicated column
  5. Test submission appears in Google Sheet within 5 seconds of form submission
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 6: Notification System
**Goal**: Legitimate submissions trigger formatted Slack and email notifications
**Depends on**: Phase 5
**Requirements**: NOTF-01, NOTF-02, NOTF-03
**Success Criteria** (what must be TRUE):
  1. Legitimate submission sends Slack notification with rich formatting (Block Kit)
  2. Slack notification includes color-coded sentiment indicator
  3. Slack notification displays AI analysis (category, summary, draft reply)
  4. Legitimate submission sends email notification with AI analysis
  5. Spam submission skips all notifications (no Slack, no email)
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 7: Error Handling & Testing
**Goal**: Workflow handles failures gracefully and performs reliably under varied conditions
**Depends on**: Phase 6
**Requirements**: WKFL-08
**Success Criteria** (what must be TRUE):
  1. Workflow errors (API failures, rate limits) trigger error handling branch
  2. Error workflow logs failure details for debugging
  3. Test dataset (10+ realistic submissions) processes successfully with varied inputs
  4. Rapid submissions (5+ in 30 seconds) complete without failures
  5. Invalid API credentials produce clear error messages (not silent failures)
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 8: Documentation & Portfolio
**Goal**: Portfolio-ready package with exportable workflow, documentation, and demo materials
**Depends on**: Phase 7
**Requirements**: DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05, DOCS-06
**Success Criteria** (what must be TRUE):
  1. Exported workflow JSON imports cleanly into fresh n8n instance
  2. Architecture diagram visually explains how components connect
  3. Workflow canvas includes sticky notes explaining each section's purpose
  4. Test dataset (10 realistic submissions) demonstrates varied handling
  5. Before/after comparison document quantifies manual vs automated process
  6. README contains complete setup instructions with credential configuration
**Plans**: TBD

Plans:
- [ ] TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Form Polish | 0/2 | Planned | - |
| 2. Webhook Integration | 0/TBD | Not started | - |
| 3. AI Processing Core | 0/TBD | Not started | - |
| 4. Conditional Routing | 0/TBD | Not started | - |
| 5. Storage Integration | 0/TBD | Not started | - |
| 6. Notification System | 0/TBD | Not started | - |
| 7. Error Handling & Testing | 0/TBD | Not started | - |
| 8. Documentation & Portfolio | 0/TBD | Not started | - |
