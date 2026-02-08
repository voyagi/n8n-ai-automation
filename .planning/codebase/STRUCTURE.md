# Codebase Structure

**Analysis Date:** 2026-02-08

## Directory Layout

```
upwork-n8n-automation/
├── public/                  # Presentation layer — contact form UI
│   ├── index.html          # Form markup and layout
│   ├── script.js           # Form submission handler
│   └── styles.css          # Form styling
├── workflows/              # n8n workflow definitions
│   ├── README.md           # Workflow import and setup instructions
│   └── contact-form-ai.json # (To be created) Exportable n8n workflow
├── screenshots/            # Portfolio demo assets
│   ├── workflow-editor.png # n8n canvas screenshot
│   ├── form-demo.png       # Form UI screenshot
│   └── slack-notification.png # Example Slack output
├── .claude/                # Claude Code skills and context
│   └── skills/
├── .planning/              # GSD planning documents
│   └── codebase/           # (This directory)
├── package.json            # Dependencies and run scripts
├── package-lock.json       # Locked dependency versions
├── biome.json              # Formatter/linter configuration
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── CLAUDE.md               # Project-specific instructions
└── README.md               # (Expected) Project overview
```

## Directory Purposes

**public/**
- Purpose: Contact form user interface and client-side logic
- Contains: HTML markup, CSS styling, JavaScript form submission
- Key files: `index.html` (entry point), `script.js` (form handler), `styles.css` (UI styling)
- Served by: `npm run dev` via `serve` package at http://localhost:3000

**workflows/**
- Purpose: n8n workflow definitions and import instructions
- Contains: Workflow JSON and documentation
- Key files: `README.md` (setup guide), `contact-form-ai.json` (workflow definition, TBD)
- Imported into: n8n dashboard via Workflows > Import

**screenshots/**
- Purpose: Portfolio documentation and demo visual assets
- Contains: PNG screenshots showing the workflow and UI in action
- Used for: Upwork profile demonstration and portfolio repo

**.planning/codebase/**
- Purpose: Architecture and codebase analysis documents (GSD generated)
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, etc.
- Used by: GSD planning and execution agents

## Key File Locations

**Entry Points:**
- `public/index.html`: Form submission UI; initial user interaction point
- `public/script.js`: Client-side form handler; initiates webhook call to n8n

**Configuration:**
- `package.json`: npm scripts and dependency management
- `biome.json`: Code formatting and linting rules
- `.env.example`: Template for environment variables (n8n credentials, API keys)
- `CLAUDE.md`: Project-specific instructions and build strategy

**Core Logic:**
- `public/script.js`: Form data collection, validation, webhook invocation, error handling (26 lines)
- `workflows/contact-form-ai.json`: n8n workflow orchestration (TBD)

**Testing:**
- Not yet implemented; test directory does not exist

## Naming Conventions

**Files:**
- HTML: lowercase with `.html` extension (`index.html`)
- JavaScript: lowercase with `.js` extension (`script.js`)
- CSS: lowercase with `.css` extension (`styles.css`)
- JSON: lowercase with `.json` extension (`package.json`, `biome.json`)
- Documentation: UPPERCASE with `.md` extension (`README.md`, `CLAUDE.md`)

**Directories:**
- Lowercase plurals for collections (`public/`, `workflows/`, `screenshots/`)
- System directories prefixed with dot (`.claude/`, `.planning/`, `.git/`, `.gitignore`)

**HTML Elements:**
- kebab-case IDs and classes: `contact-form`, `form-group`, `submit-btn`, `status`
- Semantic element names: `header`, `footer`, `form`, `label`, `input`, `textarea`, `button`

**JavaScript Identifiers:**
- camelCase for variables and constants: `WEBHOOK_URL`, `statusEl`, `submitBtn`, `formData`
- UPPER_CASE for configuration constants: `WEBHOOK_URL`
- Descriptive names: `form`, `submitBtn`, `statusEl` (not `btn`, `el`, `f`)

**CSS Classes:**
- kebab-case: `.form-group`, `.status`, `.status.success`, `.status.error`
- Semantic naming: `.container`, `.header`, `.footer`
- State classes: `.hidden`, `.success`, `.error`

## Where to Add New Code

**New Feature (e.g., additional form fields):**
- Form markup: `public/index.html` (new `<div class="form-group">` with label and input)
- Form handler: `public/script.js` (extract new field into `data` object, line 11-17)
- Styling: `public/styles.css` (if custom styling needed for new elements)
- Workflow: `workflows/contact-form-ai.json` (pass new fields to OpenAI node)

**New Component/Module:**
- Client-side utilities: Create new `.js` file in `public/` and link in `index.html`
- n8n nodes: Add to workflow JSON in `workflows/contact-form-ai.json`
- Shared assets: Add to `public/` directory

**Utilities:**
- Shared helpers: Not yet applicable; form is simple enough for inline logic in `public/script.js`
- If refactoring form handler becomes necessary: Create `public/utils.js` for helper functions

**Environment Configuration:**
- Sensitive credentials: Add keys to `.env` (copy template from `.env.example`)
- n8n settings: Configure via n8n dashboard UI (Settings > Environment Variables)
- Form webhook URL: Update `WEBHOOK_URL` constant in `public/script.js` after workflow import

## Special Directories

**public/**
- Purpose: Served as static web root by `serve` package
- Generated: No
- Committed: Yes (source of truth)

**node_modules/**
- Purpose: Installed npm dependencies
- Generated: Yes (from package-lock.json)
- Committed: No (.gitignore excludes)

**screenshots/**
- Purpose: Portfolio documentation
- Generated: No (created manually or via screen recording)
- Committed: Yes

**.planning/**
- Purpose: GSD-generated planning and codebase analysis documents
- Generated: Yes (by GSD agents)
- Committed: No (excluded by .gitignore or local to project)

## Production Structure Notes

**For Upwork Portfolio:**
- Static assets (`public/`) deployable to any static host (Vercel, Netlify, GitHub Pages)
- n8n workflow exportable as JSON for client import
- Screenshots stored in repo for portfolio showcase
- No runtime server required for the form itself; n8n instance can be self-hosted or cloud-hosted

**Typical Deployment:**
- Form: Deploy `public/` as static site
- Workflow: Import `workflows/contact-form-ai.json` into client's n8n instance
- Configuration: Client provides `.env` values (OpenAI key, Slack webhook, etc.)

---

*Structure analysis: 2026-02-08*
