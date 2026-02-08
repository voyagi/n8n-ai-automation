# Coding Conventions

**Analysis Date:** 2026-02-08

## Naming Patterns

**Files:**
- Lowercase with hyphens for multi-word filenames: `public/script.js`, `styles.css`, `index.html`
- Descriptive names that indicate purpose: `contact-form-ai.json` (n8n workflow)

**Functions:**
- camelCase for all function declarations and arrow functions
- Example from `public/script.js`:
  - Form event listener: `form.addEventListener("submit", async (e) => { ... })`
  - No named function exports (single-file module pattern)

**Variables:**
- camelCase for all variable names: `WEBHOOK_URL`, `statusEl`, `submitBtn`, `form`, `data`, `response`
- Descriptive names that convey purpose: `statusEl` (not `s`), `submitBtn` (not `btn`)
- CONSTANT_CASE for config values: `WEBHOOK_URL` (immutable configuration)
- DOM element references suffixed with `El`: `statusEl`, `submitBtn` (clarifies it's a DOM node)

**Types:**
- No TypeScript in project; vanilla JavaScript only
- No type annotations used

## Code Style

**Formatting:**
- Tool: Biome 2.0.0
- Config: `biome.json`
- Indent: tab (4 spaces)
- Quote style: double quotes (`"`)

**Linter:**
- Tool: Biome (enabled with recommended rules)
- Config: `biome.json` with `"rules": { "recommended": true }`
- Covers: unused variables, unreachable code, style consistency

**Run formatting check:**
```bash
npm run check     # Check and write fixes
npm run lint      # Lint with write
npm run format    # Format with write
```

## Import Organization

**Order:**
- No formal import system used (vanilla JS for frontend)
- External scripts loaded via `<script>` tags in HTML: `<script src="script.js"></script>`
- Single global config at top of file: `const WEBHOOK_URL = "..."`

**Path Aliases:**
- Not applicable (single-file module, no complex paths)

## Error Handling

**Patterns:**
- Try-catch-finally for async operations
- Specific error messages that include context
- Example from `public/script.js`:

```javascript
try {
  const response = await fetch(WEBHOOK_URL, { ... });
  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}`);
  }
  // success path
} catch (err) {
  statusEl.textContent = `Failed to send: ${err.message}. Check that n8n is running.`;
  statusEl.className = "status error";
} finally {
  // cleanup: always re-enable button and reset text
  submitBtn.disabled = false;
  submitBtn.textContent = "Send Message";
}
```

**Key practices:**
- Always restore UI state in `finally` block (button enabled, text reset)
- Errors include actionable context: "Check that n8n is running"
- HTTP error handling: check `response.ok` before processing
- Error messages displayed to user in status element

## Logging

**Framework:** `console` (no structured logging framework)

**Patterns:**
- No logging in current implementation
- If logging needed: use `console.log()`, `console.error()`, `console.warn()`
- Consider logging around API calls for portfolio demo purposes

## Comments

**When to Comment:**
- Used sparingly; code is self-documenting
- No block comments in current code
- Config values may have inline comments explaining purpose

**JSDoc/TSDoc:**
- Not used (vanilla JS, single-file module, no exported functions)
- If needed for API documentation, use JSDoc format

## Function Design

**Size:** Compact, single responsibility

**Parameters:**
- Event handlers accept event object: `async (e) => { e.preventDefault(); ... }`
- Most logic is stateless (form input → fetch → UI update)

**Return Values:**
- Async functions return Promise (via `async` keyword)
- Form submission handler has no explicit return (void)
- No chained returns; early exit patterns not heavily used (code is already linear)

**Example structure from `public/script.js`:**
```javascript
form.addEventListener("submit", async (e) => {
  e.preventDefault();                    // Early guard: prevent default

  const data = { ... };                  // Prepare data
  submitBtn.disabled = true;             // Update UI

  try {
    const response = await fetch(...);   // Single async operation
    if (!response.ok) throw new Error(...); // Validate response
    // Success: update UI
  } catch (err) {
    // Error: show error state
  } finally {
    // Cleanup: restore UI
  }
});
```

## Module Design

**Exports:**
- Single-file module (no exports)
- All code executes on page load via event listeners
- No function exports; DOM mutation is primary side effect

**Barrel Files:**
- Not applicable (not modular structure)

---

*Convention analysis: 2026-02-08*
