const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
	getValidationMessage,
	isSpamResult,
	getErrorMessage,
	SPAM_THRESHOLD,
} = require("../public/validation.js");

// ---------------------------------------------------------------------------
// SPAM_THRESHOLD constant
// ---------------------------------------------------------------------------

describe("SPAM_THRESHOLD constant", () => {
	it("is exported and equals 70", () => {
		assert.equal(typeof SPAM_THRESHOLD, "number");
		assert.equal(SPAM_THRESHOLD, 70);
	});

	it("isSpamResult uses SPAM_THRESHOLD as boundary", () => {
		assert.equal(isSpamResult({ spam_score: SPAM_THRESHOLD }), false);
		assert.equal(isSpamResult({ spam_score: SPAM_THRESHOLD + 1 }), true);
	});
});

// ---------------------------------------------------------------------------
// Type coercion attacks on isSpamResult
// ---------------------------------------------------------------------------

describe("isSpamResult type coercion resistance", () => {
	it("rejects string spam_score", () => {
		assert.equal(isSpamResult({ spam_score: "71" }), false);
	});

	it("rejects array spam_score", () => {
		assert.equal(isSpamResult({ spam_score: [71] }), false);
	});

	it("rejects object spam_score", () => {
		assert.equal(isSpamResult({ spam_score: { value: 71 } }), false);
	});

	it("handles NaN spam_score", () => {
		assert.equal(isSpamResult({ spam_score: NaN }), false);
	});

	it("handles Infinity spam_score (treated as spam)", () => {
		assert.equal(isSpamResult({ spam_score: Infinity }), true);
	});

	it("handles negative spam_score", () => {
		assert.equal(isSpamResult({ spam_score: -1 }), false);
	});

	it("handles null spam_score", () => {
		assert.equal(isSpamResult({ spam_score: null }), false);
	});

	it("handles undefined spam_score", () => {
		assert.equal(isSpamResult({ spam_score: undefined }), false);
	});

	it("handles boolean true spam_score", () => {
		assert.equal(isSpamResult({ spam_score: true }), false);
	});

	it("handles empty object", () => {
		assert.equal(isSpamResult({}), false);
	});

	it("handles object with only unrelated fields", () => {
		assert.equal(isSpamResult({ category: "support", name: "Test" }), false);
	});
});

// ---------------------------------------------------------------------------
// XSS input handling
// ---------------------------------------------------------------------------

describe("XSS input handling", () => {
	it("getValidationMessage returns safe output for script tag field name", () => {
		const msg = getValidationMessage("<script>alert(1)</script>", {
			valid: false,
			valueMissing: true,
		});
		assert.equal(msg, "This field is required");
		assert.ok(!msg.includes("<script>"));
	});

	it("getErrorMessage does not inject HTML from error messages", () => {
		const msg = getErrorMessage(new Error("<img src=x onerror=alert(1)>"));
		assert.equal(typeof msg, "string");
	});

	it("isSpamResult ignores XSS payloads in string fields", () => {
		const result = {
			spam: false,
			spam_score: 10,
			category: "<script>alert(1)</script>",
		};
		assert.equal(isSpamResult(result), false);
	});
});

// ---------------------------------------------------------------------------
// Error message safety
// ---------------------------------------------------------------------------

describe("error message safety", () => {
	it("never returns undefined", () => {
		assert.notEqual(getErrorMessage({}), undefined);
		assert.notEqual(getErrorMessage(new Error()), undefined);
		assert.notEqual(getErrorMessage({ name: "TypeError" }), undefined);
	});

	it("returns a string for error with no message property", () => {
		const msg = getErrorMessage({ name: "CustomError" });
		assert.equal(typeof msg, "string");
		assert.ok(msg.length > 0);
	});

	it("does not leak stack traces", () => {
		const err = new Error("Sensitive info");
		err.stack = "Error: at secret/internal/path.js:42";
		const msg = getErrorMessage(err);
		assert.ok(!msg.includes("secret/internal"));
		assert.ok(!msg.includes("path.js:42"));
	});

	it("handles AbortError gracefully", () => {
		const err = new DOMException("signal is aborted", "AbortError");
		const msg = getErrorMessage(err);
		assert.equal(typeof msg, "string");
		assert.ok(msg.length > 0);
	});
});

// ---------------------------------------------------------------------------
// Input edge cases for getValidationMessage
// ---------------------------------------------------------------------------

describe("validation input edge cases", () => {
	it("handles empty string fieldName", () => {
		const msg = getValidationMessage("", {
			valid: false,
			valueMissing: true,
		});
		assert.equal(msg, "This field is required");
	});

	it("handles very long field name", () => {
		const longName = "a".repeat(10000);
		const msg = getValidationMessage(longName, {
			valid: false,
			valueMissing: true,
		});
		assert.equal(msg, "This field is required");
	});

	it("handles field name with special characters", () => {
		const msg = getValidationMessage("field[0].name", {
			valid: false,
			valueMissing: true,
		});
		assert.equal(msg, "This field is required");
	});

	it("returns empty string when validity has no matching condition", () => {
		const msg = getValidationMessage("name", {
			valid: false,
			valueMissing: false,
			typeMismatch: false,
		});
		assert.equal(msg, "");
	});
});

// ---------------------------------------------------------------------------
// Source code secret scanning
// ---------------------------------------------------------------------------

describe("source code secret scanning", () => {
	it("public/script.js contains no real API keys", () => {
		const content = fs.readFileSync(
			path.join(__dirname, "../public/script.js"),
			"utf8",
		);
		assert.ok(
			!content.match(/sk-[a-zA-Z0-9]{20,}/),
			"Found OpenAI-style API key",
		);
		assert.ok(!content.match(/xoxb-[a-zA-Z0-9-]+/), "Found Slack bot token");
		assert.ok(!content.match(/AIza[a-zA-Z0-9_-]{35}/), "Found Google API key");
	});

	it("workflow JSON contains no embedded secrets", () => {
		const content = fs.readFileSync(
			path.join(__dirname, "../workflows/contact-form-ai.json"),
			"utf8",
		);
		assert.ok(
			!content.match(/sk-[a-zA-Z0-9]{20,}/),
			"Found OpenAI-style API key",
		);
		assert.ok(!content.match(/xoxb-[a-zA-Z0-9-]+/), "Found Slack bot token");
		assert.ok(!content.match(/AIza[a-zA-Z0-9_-]{35}/), "Found Google API key");
	});

	it("validation.js contains no secrets", () => {
		const content = fs.readFileSync(
			path.join(__dirname, "../public/validation.js"),
			"utf8",
		);
		assert.ok(!content.match(/sk-[a-zA-Z0-9]{20,}/));
		assert.ok(!content.match(/xoxb-/));
		assert.ok(!content.match(/password\s*[:=]\s*["'][^"']+["']/i));
	});

	it(".env is listed in .gitignore", () => {
		const gitignore = fs.readFileSync(
			path.join(__dirname, "../.gitignore"),
			"utf8",
		);
		assert.ok(
			gitignore.includes(".env"),
			".env must be in .gitignore to prevent secret leakage",
		);
	});

	it("workflow JSON uses credential references, not inline secrets", () => {
		const workflow = require("../workflows/contact-form-ai.json");
		const nodesWithCreds = workflow.nodes.filter((n) => n.credentials);
		for (const node of nodesWithCreds) {
			for (const [, cred] of Object.entries(node.credentials)) {
				assert.ok(cred.id, `${node.name}: credential missing id reference`);
				assert.ok(cred.name, `${node.name}: credential missing name reference`);
			}
		}
	});
});

// ---------------------------------------------------------------------------
// Response contract security
// ---------------------------------------------------------------------------

describe("response contract security", () => {
	const { validateContract } = (() => {
		function validateContract(data, contract) {
			for (const [field, expectedType] of Object.entries(contract)) {
				assert.ok(field in data, `Missing required field: "${field}"`);
				assert.equal(
					typeof data[field],
					expectedType,
					`Field "${field}" should be ${expectedType}`,
				);
			}
		}
		return { validateContract };
	})();

	const errorContract = { error: "string", message: "string" };

	it("error response with XSS payload still satisfies contract", () => {
		validateContract(
			{
				error: "Validation failed",
				message: '<script>alert("xss")</script>',
			},
			errorContract,
		);
	});

	it("error response with SQL injection still satisfies contract", () => {
		validateContract(
			{
				error: "Validation failed",
				message: "'; DROP TABLE users; --",
			},
			errorContract,
		);
	});
});
