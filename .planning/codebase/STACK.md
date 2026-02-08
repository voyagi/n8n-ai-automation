# Technology Stack

**Analysis Date:** 2026-02-08

## Languages

**Primary:**
- JavaScript (ES6+) - Used in form handler and client-side submission logic (`public/script.js`)
- HTML5 - Contact form markup (`public/index.html`)
- CSS3 - Form styling (`public/styles.css`)

**Secondary:**
- JSON - n8n workflow configuration and all build/config files

## Runtime

**Environment:**
- Node.js (version constraint inherited from n8n's requirements)

**Package Manager:**
- npm (lockfileVersion 3)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- **n8n** 1.82.0 - Workflow automation platform, self-hosted via npm. Serves webhook endpoints and orchestrates AI processing pipeline.

**Build/Development:**
- **Biome** 2.0.0 - Unified linter and formatter for JavaScript, JSON, and project files
- **serve** 14.2.4 - Static file server for local development of the HTML form

## Key Dependencies

**Critical:**
- **n8n** 1.82.0 - The entire automation system. Contains webhook server, workflow engine, and built-in integrations with OpenAI, Google Sheets, Slack, email.

**Infrastructure:**
- **@anthropic-ai/sdk** 0.71.2 - Claude SDK (included in n8n dependency tree, likely for future AI features or demonstrations)

## Configuration

**Environment:**
- Via `.env` file (not committed; template provided in `.env.example`)
- Build config: `biome.json` - Linting rules (recommended rules enabled), formatting (tab indentation), git-aware file handling

**Build:**
- **Biome configuration** (`biome.json`):
  - Formatter: enabled, tab indentation
  - Linter: recommended rules enabled
  - VCS: git integration enabled
  - File scope: `public/**/*.js`, `*.json`
  - Assist: organize imports on source actions

## Platform Requirements

**Development:**
- Node.js (version specified by n8n, typically 16+)
- npm
- .env file with API keys configured

**Production:**
- Node.js runtime for n8n self-hosted deployment
- Alternative: n8n Cloud hosting available

---

*Stack analysis: 2026-02-08*
