const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
	getValidationMessage,
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
