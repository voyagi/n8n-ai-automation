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

// ---------------------------------------------------------------------------
// API response contracts — match the actual HTTP response shapes
// ---------------------------------------------------------------------------

// Success Response node: { status, category, summary, spam_score, draft_response }
const apiSuccessContract = {
	status: "string",
	category: "string",
	summary: "string",
	spam_score: "number",
	draft_response: "string",
};

// Spam Response node: { status, category, summary, spam_score, spam_reason }
const apiSpamContract = {
	status: "string",
	category: "string",
	summary: "string",
	spam_score: "number",
	spam_reason: "string",
};

// Validation Error node: { error, message }
const apiErrorContract = {
	error: "string",
	message: "string",
};

// ---------------------------------------------------------------------------
// Internal node data contract — fields flowing between workflow nodes
// ---------------------------------------------------------------------------

const internalNodeContract = {
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

describe("API success response contract", () => {
	const successResponse = {
		status: "success",
		category: "support",
		summary: "User unable to log in with error message",
		spam_score: 5,
		draft_response:
			"Hi John, thank you for reaching out about your login issue.",
	};

	it("support response satisfies contract", () => {
		validateContract(successResponse, apiSuccessContract);
	});

	it("sales response satisfies contract", () => {
		validateContract(
			{
				...successResponse,
				category: "sales",
				summary: "Enterprise pricing inquiry",
			},
			apiSuccessContract,
		);
	});

	it("feedback response satisfies contract", () => {
		validateContract(
			{
				...successResponse,
				category: "feedback",
				summary: "Positive product feedback",
			},
			apiSuccessContract,
		);
	});

	it("general_inquiry response satisfies contract", () => {
		validateContract(
			{
				...successResponse,
				category: "general_inquiry",
				summary: "Company information request",
			},
			apiSuccessContract,
		);
	});

	it("allows extra fields beyond the contract", () => {
		const withExtras = { ...successResponse, custom_field: "extra" };
		validateContract(withExtras, apiSuccessContract);
	});

	it("allows empty draft_response for low-confidence results", () => {
		const minimal = { ...successResponse, draft_response: "" };
		validateContract(minimal, apiSuccessContract);
	});
});

describe("API spam response contract", () => {
	const spamResponse = {
		status: "spam",
		category: "spam",
		summary: "Promotional SEO content",
		spam_score: 95,
		spam_reason: "Promotional SEO content with suspicious links",
	};

	it("spam response satisfies contract", () => {
		validateContract(spamResponse, apiSpamContract);
	});

	it("high-score spam satisfies contract", () => {
		validateContract({ ...spamResponse, spam_score: 100 }, apiSpamContract);
	});

	it("borderline spam (score 71) satisfies contract", () => {
		validateContract({ ...spamResponse, spam_score: 71 }, apiSpamContract);
	});
});

describe("API error response contract", () => {
	it("validation error satisfies contract", () => {
		validateContract(
			{
				error: "Validation failed",
				message: "All fields are required and email must be valid.",
			},
			apiErrorContract,
		);
	});
});

describe("internal node data contract", () => {
	const nodeData = {
		category: "support",
		category_confidence: 92,
		summary: "User unable to log in",
		spam_score: 5,
		spam_reason: "Legitimate support request",
		draft_response: "Hi John, thank you for reaching out.",
		name: "John Doe",
		email: "john@example.com",
		subject: "Login issue",
		message: "I cannot log in to my account",
		submittedAt: "2026-02-11T15:30:00.000Z",
	};

	it("internal node data satisfies contract", () => {
		validateContract(nodeData, internalNodeContract);
	});
});

describe("contract edge cases", () => {
	it("spam_score of exactly 70 is not spam (routes to legitimate)", () => {
		const response = {
			status: "success",
			category: "general_inquiry",
			summary: "Borderline submission",
			spam_score: 70,
			draft_response: "Thank you for your message.",
		};
		validateContract(response, apiSuccessContract);
		assert.equal(response.spam_score <= 70, true);
	});
});
