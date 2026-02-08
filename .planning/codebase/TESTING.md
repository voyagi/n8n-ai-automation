# Testing Patterns

**Analysis Date:** 2026-02-08

## Test Framework

**Runner:**
- Not detected

**Assertion Library:**
- Not detected

**Run Commands:**
- No test commands defined in `package.json`

## Test File Organization

**Location:**
- No test files present in project

**Naming:**
- Convention would be: `*.test.js` or `*.spec.js` (based on Biome glob patterns)

**Structure:**
- Not applicable (no tests implemented)

## Test Structure

**Suite Organization:**
- Not applicable

**Patterns:**
- Not applicable

## Mocking

**Framework:**
- Not applicable

**Patterns:**
- Not applicable

**What to Mock:**
- If tests were implemented:
  - HTTP fetch calls (use `fetch` mock library or Node.js built-in test utilities)
  - DOM elements (could use jsdom for testing browser APIs)
  - n8n webhook endpoint responses

**What NOT to Mock:**
- DOM manipulation logic (test actual behavior)
- Form validation (test actual input/output)

## Fixtures and Factories

**Test Data:**
- Not applicable

**Location:**
- No fixtures present

## Coverage

**Requirements:**
- Not enforced

**View Coverage:**
- Not configured

## Test Types

**Unit Tests:**
- Not implemented

**Integration Tests:**
- Not implemented

**E2E Tests:**
- Not implemented
- Note: Manual testing of form submission → n8n webhook is primary verification approach
- Portfolio demo relies on visual demonstration (screen recording) rather than automated tests

## Common Patterns

**Async Testing:**
- Not applicable

**Error Testing:**
- Current error handling (`public/script.js`) tested manually:
  - Form submission with n8n offline → error message displayed
  - Invalid HTTP response (non-2xx status) → error caught and shown

## Recommendations for Future Implementation

**When to Add Tests:**

If expanding this portfolio project with more features:

1. **Test fetch calls** - Mock `fetch` to verify:
   - Correct webhook URL and method (POST)
   - Correct headers: `Content-Type: application/json`
   - Correct payload structure: `{ name, email, subject, message, timestamp }`
   - Success vs. error paths

2. **Test form validation** - Verify:
   - HTML5 validation prevents empty fields
   - Form data is trimmed before sending
   - Timestamp is ISO format

3. **Test UI state transitions** - Verify:
   - Button disabled during submission
   - Button re-enabled on success/error
   - Status message displayed correctly
   - Form reset on success

**Suggested Framework:**

For a vanilla JS frontend, consider:
- **Vitest** - Fast, esbuild-based test runner (modern replacement for Jest)
- **Playwright** - E2E testing if integrating with actual n8n instance
- **fetch-mock** or **msw** - For mocking HTTP requests

**Example setup:**

```bash
npm install --save-dev vitest @vitest/ui
npm install --save-dev @testing-library/dom
npm install --save-dev msw  # Mock Service Worker for fetch mocking
```

Example test structure (if implemented):

```javascript
// public/script.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupFormHandlers } from './script.js';

describe('Contact Form', () => {
  let form, statusEl, submitBtn;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <form id="contact-form">
        <input type="text" name="name" />
        <input type="email" name="email" />
        <textarea name="message"></textarea>
        <button id="submit-btn" type="submit">Send</button>
      </form>
      <div id="status" class="status hidden"></div>
    `;
    form = document.getElementById('contact-form');
    statusEl = document.getElementById('status');
    submitBtn = document.getElementById('submit-btn');
  });

  it('sends form data to webhook on submit', async () => {
    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
      })
    );

    // Fill form
    form.name.value = 'John Doe';
    form.email.value = 'john@example.com';
    form.message.value = 'Test message';

    // Submit
    form.dispatchEvent(new SubmitEvent('submit'));

    // Assert fetch was called with correct data
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/webhook/contact'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('John Doe'),
      })
    );
  });

  it('disables button during submission and re-enables after', async () => {
    global.fetch = vi.fn(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({ ok: true }), 100)
      )
    );

    form.dispatchEvent(new SubmitEvent('submit'));
    expect(submitBtn.disabled).toBe(true);

    await vi.waitFor(() => expect(submitBtn.disabled).toBe(false));
  });

  it('shows error message when fetch fails', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Network error'))
    );

    form.dispatchEvent(new SubmitEvent('submit'));

    await vi.waitFor(() => {
      expect(statusEl.classList.contains('error')).toBe(true);
      expect(statusEl.textContent).toContain('Failed to send');
    });
  });
});
```

---

*Testing analysis: 2026-02-08*
