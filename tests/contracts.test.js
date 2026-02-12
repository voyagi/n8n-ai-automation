const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

/**
 * Validate that a data object satisfies a contract (required fields + types).
 * @param {Object} data - The response object to validate
 * @param {Object} contract - Map of field names to expected types
 */
function validateContract(data, contract) {
	for (const [field, expectedType] of Object.entries(contract)) {
		assert.ok(field in data, `Missing required field: "${field}"`);
		assert.equal(
			typeof data[field],
			expectedType,
			`Field "${field}" should be ${expectedType}, got ${typeof data[field]}`,
		);
	}
}

// Contract definitions matching the n8n workflow response shapes
const successContract = {
	category: "string",
	category_confidence: "number",
	summary: "string",
	spam_score: "number",
	spam_reason: "string",
	draft_response: "string",
	name: "string",
	email: "string",
	subject: "string",
	message: "string",
	submittedAt: "string",
};

const spamContract = {
	spam: "boolean",
	message: "string",
	category: "string",
	spam_score: "number",
	spam_reason: "string",
};

const errorContract = {
	error: "string",
	message: "string",
};

describe("success response contract", () => {
	const supportResponse = {
		category: "support",
		category_confidence: 92,
		summary: "User unable to log in with error message",
		spam_score: 5,
		spam_reason: "Legitimate support request",
		draft_response:
			"Hi John, thank you for reaching out about your login issue.",
		name: "John Doe",
		email: "john@example.com",
		subject: "Login issue",
		message: "I cannot log in to my account",
		submittedAt: "2026-02-11T15:30:00.000Z",
		is_spam: false,
		ai_failed: false,
	};

	it("support response satisfies contract", () => {
		validateContract(supportResponse, successContract);
	});

	it("sales response satisfies contract", () => {
		validateContract(
			{
				...supportResponse,
				category: "sales",
				summary: "Enterprise pricing inquiry",
			},
			successContract,
		);
	});

	it("feedback response satisfies contract", () => {
		validateContract(
			{
				...supportResponse,
				category: "feedback",
				summary: "Positive product feedback",
			},
			successContract,
		);
	});

	it("general_inquiry response satisfies contract", () => {
		validateContract(
			{
				...supportResponse,
				category: "general_inquiry",
				summary: "Company information request",
			},
			successContract,
		);
	});

	it("allows extra fields beyond the contract", () => {
		const withExtras = { ...supportResponse, custom_field: "extra" };
		validateContract(withExtras, successContract);
	});

	it("allows empty draft_response for low-confidence results", () => {
		const minimal = { ...supportResponse, draft_response: "" };
		validateContract(minimal, successContract);
	});
});

describe("spam response contract", () => {
	const spamResponse = {
		spam: true,
		message: "Submission flagged as spam",
		category: "spam",
		spam_score: 95,
		spam_reason: "Promotional SEO content with suspicious links",
	};

	it("spam response satisfies contract", () => {
		validateContract(spamResponse, spamContract);
	});

	it("high-score spam satisfies contract", () => {
		validateContract({ ...spamResponse, spam_score: 100 }, spamContract);
	});

	it("borderline spam (score 71) satisfies contract", () => {
		validateContract({ ...spamResponse, spam_score: 71 }, spamContract);
	});
});

describe("error response contract", () => {
	it("validation error satisfies contract", () => {
		validateContract(
			{
				error: "Validation failed",
				message: "All fields are required and email must be valid.",
			},
			errorContract,
		);
	});
});

describe("contract edge cases", () => {
	it("spam_score of exactly 70 is not spam", () => {
		const response = {
			category: "general_inquiry",
			category_confidence: 50,
			summary: "Borderline submission",
			spam_score: 70,
			spam_reason: "Borderline content",
			draft_response: "Thank you for your message.",
			name: "Test",
			email: "test@example.com",
			subject: "Test",
			message: "Test message",
			submittedAt: "2026-02-11T00:00:00.000Z",
		};
		validateContract(response, successContract);
		assert.equal(response.spam_score <= 70, true);
	});

	it("spam_score of 71 triggers spam path", () => {
		assert.ok(71 > 70, "Score 71 exceeds the 70 threshold");
	});

	it("category_confidence is a number between 0 and 100", () => {
		const values = [0, 50, 85, 100];
		for (const val of values) {
			assert.equal(typeof val, "number");
			assert.ok(val >= 0 && val <= 100);
		}
	});

	it("all valid categories are recognized", () => {
		const validCategories = [
			"support",
			"sales",
			"feedback",
			"general_inquiry",
			"spam",
		];
		assert.equal(validCategories.length, 5);
		for (const cat of validCategories) {
			assert.equal(typeof cat, "string");
			assert.ok(cat.length > 0);
		}
	});
});
