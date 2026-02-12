const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
	getValidationMessage,
	isSpamResult,
	getErrorMessage,
} = require("../public/validation.js");

describe("getValidationMessage", () => {
	it("returns empty string for valid fields", () => {
		assert.equal(getValidationMessage("name", { valid: true }), "");
	});

	it("returns field-specific message for missing name", () => {
		assert.equal(
			getValidationMessage("name", { valid: false, valueMissing: true }),
			"Please enter your name",
		);
	});

	it("returns field-specific message for missing email", () => {
		assert.equal(
			getValidationMessage("email", { valid: false, valueMissing: true }),
			"Please enter your email address",
		);
	});

	it("returns field-specific message for missing subject", () => {
		assert.equal(
			getValidationMessage("subject", { valid: false, valueMissing: true }),
			"Please enter a subject",
		);
	});

	it("returns field-specific message for missing message", () => {
		assert.equal(
			getValidationMessage("message", { valid: false, valueMissing: true }),
			"Please enter your message",
		);
	});

	it("returns generic message for unknown field", () => {
		assert.equal(
			getValidationMessage("other", { valid: false, valueMissing: true }),
			"This field is required",
		);
	});

	it("returns email format error for type mismatch", () => {
		assert.equal(
			getValidationMessage("email", { valid: false, typeMismatch: true }),
			"Please enter a valid email address (e.g., name@example.com)",
		);
	});

	it("ignores type mismatch for non-email fields", () => {
		assert.equal(
			getValidationMessage("name", { valid: false, typeMismatch: true }),
			"",
		);
	});
});

describe("isSpamResult", () => {
	it("returns true when spam flag is true", () => {
		assert.equal(isSpamResult({ spam: true, spam_score: 10 }), true);
	});

	it("returns true when spam_score exceeds 70", () => {
		assert.equal(isSpamResult({ spam_score: 85 }), true);
	});

	it("returns false when spam_score is exactly 70", () => {
		assert.equal(isSpamResult({ spam_score: 70 }), false);
	});

	it("returns false for legitimate submission", () => {
		assert.equal(isSpamResult({ spam: false, spam_score: 15 }), false);
	});

	it("returns falsy when no spam fields present", () => {
		assert.ok(!isSpamResult({ category: "support" }));
	});

	it("returns falsy for zero spam_score", () => {
		assert.ok(!isSpamResult({ spam_score: 0 }));
	});
});

describe("getErrorMessage", () => {
	it("returns timeout message for TimeoutError", () => {
		const err = new Error("timeout");
		err.name = "TimeoutError";
		assert.match(getErrorMessage(err), /took too long/);
	});

	it("returns network error for Failed to fetch", () => {
		const err = new Error("Failed to fetch");
		assert.match(getErrorMessage(err), /Could not reach the server/);
	});

	it("returns server error message as-is", () => {
		const err = new Error("Server responded with 500");
		assert.equal(getErrorMessage(err), "Server responded with 500");
	});

	it("returns fallback for empty error", () => {
		assert.equal(
			getErrorMessage({}),
			"Something went wrong. Please try again.",
		);
	});
});
