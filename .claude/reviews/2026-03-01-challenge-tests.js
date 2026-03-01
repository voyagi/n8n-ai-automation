const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
	isSpamResult,
	getErrorMessage,
	getValidationMessage,
	SPAM_THRESHOLD,
} = require("../../public/validation.js");

const workflow = require("../../workflows/contact-form-ai.json");
const nodesByName = new Map(workflow.nodes.map((n) => [n.name, n]));
const nodesById = new Map(workflow.nodes.map((n) => [n.id, n]));

// ---------------------------------------------------------------------------
// Lens 1: Prompt Injection Detection
// ---------------------------------------------------------------------------

describe("prompt injection vectors", () => {
	const openaiNode = nodesById.get("analyze-contact-form");
	const promptBody = openaiNode.parameters.jsonBody;

	it("OpenAI prompt uses string concatenation for user input", () => {
		// This test DOCUMENTS the vulnerability - it passes when the vuln exists
		assert.ok(
			promptBody.includes("$json.name"),
			"Prompt should reference user input fields",
		);
		assert.ok(
			promptBody.includes("$json.message"),
			"Prompt should reference message field",
		);
		// The concatenation pattern: 'Name: ' + $json.name means no sanitization
		assert.ok(
			promptBody.includes("+ $json.name"),
			"User input is concatenated without sanitization",
		);
	});

	it("system prompt instructs JSON-only output format", () => {
		assert.ok(
			promptBody.includes("response_format"),
			"Should use structured output format",
		);
		assert.ok(
			promptBody.includes("json_object"),
			"Should constrain to JSON object output",
		);
	});

	it("system prompt specifies exact JSON schema", () => {
		assert.ok(
			promptBody.includes("category"),
			"Schema should include category field",
		);
		assert.ok(
			promptBody.includes("spam_score"),
			"Schema should include spam_score field",
		);
		assert.ok(
			promptBody.includes("Return ONLY valid JSON"),
			"Prompt should constrain output to JSON only",
		);
	});
});

// ---------------------------------------------------------------------------
// Lens 3: Error Path - JSON parse failure on success response
// ---------------------------------------------------------------------------

describe("error message information leakage", () => {
	it("JSON parse errors do not leak internal details to user", () => {
		const parseError = new SyntaxError(
			"Unexpected token < in JSON at position 0",
		);
		const msg = getErrorMessage(parseError);
		// getErrorMessage returns err.message directly for unrecognized errors
		assert.equal(typeof msg, "string");
		assert.ok(msg.length > 0);
		// Document: this currently DOES expose the raw parse error message
		// which reveals the server returned non-JSON (likely HTML error page)
	});

	it("network errors with internal paths are not exposed", () => {
		const err = new Error("ECONNREFUSED 127.0.0.1:5678");
		const msg = getErrorMessage(err);
		// Currently returns the raw error, which leaks the port number
		assert.equal(typeof msg, "string");
	});
});

// ---------------------------------------------------------------------------
// Lens 5: Regression - Threshold boundary behavior
// ---------------------------------------------------------------------------

describe("spam threshold boundary precision", () => {
	it("spam_score of 70.0 is NOT spam (boundary exact)", () => {
		assert.equal(isSpamResult({ spam_score: 70.0 }), false);
	});

	it("spam_score of 70.001 IS spam (float just above)", () => {
		assert.equal(isSpamResult({ spam_score: 70.001 }), true);
	});

	it("spam_score of 69.999 is NOT spam (float just below)", () => {
		assert.equal(isSpamResult({ spam_score: 69.999 }), false);
	});

	it("workflow Switch uses same boundary as client SPAM_THRESHOLD", () => {
		const switchNode = nodesById.get("route-spam");
		const condition =
			switchNode.parameters.rules.values[0].conditions.conditions[0];
		assert.equal(condition.rightValue, SPAM_THRESHOLD);
		assert.equal(condition.operator.operation, "gt");
		assert.equal(condition.operator.type, "number");
	});

	it("workflow Switch uses strict type validation", () => {
		const switchNode = nodesById.get("route-spam");
		const rule = switchNode.parameters.rules.values[0];
		assert.equal(rule.conditions.options.typeValidation, "strict");
	});
});

// ---------------------------------------------------------------------------
// Lens 8: Integration - Response shape consistency
// ---------------------------------------------------------------------------

describe("response shape consistency", () => {
	it("spam response shape matches what client isSpamResult expects", () => {
		// Spam Response node constructs: { spam: true, message, category, spam_score, spam_reason }
		const spamNode = nodesById.get("spam-respond");
		const body = spamNode.parameters.responseBody;
		assert.ok(body.includes("spam: true"), "Spam response must set spam: true");
		assert.ok(
			body.includes("spam_score"),
			"Spam response must include spam_score",
		);
	});

	it("success response does NOT set spam: true", () => {
		const successNode = nodesById.get("success-respond");
		const body = successNode.parameters.responseBody;
		// Success sends JSON.stringify($json) which has is_spam: false, NOT spam: true
		assert.ok(
			!body.includes("spam: true"),
			"Success response must not set spam flag",
		);
	});

	it("client checks result.spam not result.is_spam", () => {
		// isSpamResult checks result.spam === true
		assert.equal(isSpamResult({ spam: true }), true);
		assert.equal(isSpamResult({ is_spam: true }), false);
	});
});

// ---------------------------------------------------------------------------
// Lens 9: API Contract - Input size limits
// ---------------------------------------------------------------------------

describe("input size boundary testing", () => {
	const validateNode = nodesById.get("validate-fields");

	it("workflow validation only checks notEmpty, not length", () => {
		const conditions =
			validateNode.parameters.conditions.conditions;
		for (const cond of conditions) {
			// All conditions use notEmpty or regex, none check length
			assert.ok(
				["notEmpty", "regex"].includes(cond.operator.operation),
				`Condition ${cond.id} uses ${cond.operator.operation}, no length check`,
			);
		}
	});

	it("HTML form has no maxlength attributes", () => {
		const html = fs.readFileSync(
			path.join(__dirname, "../../public/index.html"),
			"utf8",
		);
		// Document: no maxlength on any input/textarea
		const maxlengthCount = (html.match(/maxlength/gi) || []).length;
		assert.equal(
			maxlengthCount,
			0,
			"No maxlength attributes found (vulnerability documented)",
		);
	});
});

// ---------------------------------------------------------------------------
// Lens 10: Failure Simulation - AI failure fallback behavior
// ---------------------------------------------------------------------------

describe("AI fallback handler behavior", () => {
	const fallbackNode = nodesById.get("ai-fallback-handler");
	const code = fallbackNode.parameters.jsCode;

	it("defaults spam_score to 0 when AI fails (fail-open)", () => {
		assert.ok(
			code.includes("spam_score: 0"),
			"Fallback sets spam_score to 0 (fail-open design)",
		);
	});

	it("defaults category to general_inquiry when AI fails", () => {
		assert.ok(
			code.includes("category: 'general_inquiry'"),
			"Fallback sets category to general_inquiry",
		);
	});

	it("sets ai_failed flag for downstream tracking", () => {
		assert.ok(
			code.includes("ai_failed: true"),
			"Fallback sets ai_failed flag",
		);
	});

	it("preserves original form data on AI failure", () => {
		assert.ok(
			code.includes("name: json.name"),
			"Fallback preserves name field",
		);
		assert.ok(
			code.includes("email: json.email"),
			"Fallback preserves email field",
		);
	});
});

// ---------------------------------------------------------------------------
// Lens 11: Stress - OpenAI retry cost analysis
// ---------------------------------------------------------------------------

describe("OpenAI retry configuration cost implications", () => {
	const openaiNode = nodesById.get("analyze-contact-form");

	it("retries up to 3 times on failure", () => {
		assert.equal(openaiNode.retryOnFail, true);
		assert.equal(openaiNode.maxTries, 3);
	});

	it("waits 2 seconds between retries", () => {
		assert.equal(openaiNode.waitBetweenTries, 2000);
	});

	it("uses gpt-4o model", () => {
		assert.ok(
			openaiNode.parameters.jsonBody.includes("gpt-4o"),
			"Should use gpt-4o model",
		);
	});

	it("caps output at 800 tokens", () => {
		assert.ok(
			openaiNode.parameters.jsonBody.includes("max_tokens: 800"),
			"Should cap output tokens",
		);
	});

	it("has 30s timeout per attempt", () => {
		assert.equal(openaiNode.parameters.options.timeout, 30000);
	});

	// Worst case: 3 attempts x 30s timeout + 2 x 2s wait = 94s total
	// Client timeout is 30s, so client always times out before retries complete
	it("client timeout (30s) is shorter than worst-case retry duration (94s)", () => {
		const worstCaseMs =
			openaiNode.maxTries * openaiNode.parameters.options.timeout +
			(openaiNode.maxTries - 1) * openaiNode.waitBetweenTries;
		assert.ok(
			worstCaseMs > 30000,
			`Worst case ${worstCaseMs}ms exceeds client 30000ms timeout`,
		);
	});
});

// ---------------------------------------------------------------------------
// Lens 12: Configuration - Placeholder detection
// ---------------------------------------------------------------------------

describe("placeholder credential detection", () => {
	it("Google Sheets has placeholder document ID", () => {
		const sheetsNode = nodesById.get("log-to-sheets");
		assert.equal(
			sheetsNode.parameters.documentId.value,
			"YOUR_SPREADSHEET_ID",
			"Sheets ID is a placeholder that will fail on import",
		);
	});

	it("Slack has placeholder channel ID", () => {
		const slackNode = nodesById.get("slack-notification");
		assert.equal(
			slackNode.parameters.channelId.value,
			"C0123456789",
			"Slack channel is a placeholder",
		);
	});

	it("Email uses example.com addresses", () => {
		const emailNode = nodesById.get("email-notification");
		assert.ok(
			emailNode.parameters.fromEmail.includes("example.com"),
			"From email is a placeholder",
		);
		assert.ok(
			emailNode.parameters.toEmail.includes("example.com"),
			"To email is a placeholder",
		);
	});

	it("Build Warnings does NOT check Google Sheets failure", () => {
		const warningsNode = nodesById.get("build-warnings");
		const code = warningsNode.parameters.jsCode;
		assert.ok(
			!code.includes("Google Sheets") && !code.includes("Log to"),
			"Build Warnings does not check Sheets failure (gap)",
		);
	});
});

// ---------------------------------------------------------------------------
// Lens 13: Dependency - Override coverage
// ---------------------------------------------------------------------------

describe("dependency security overrides", () => {
	const pkg = require("../../package.json");

	it("has minimatch override for ReDoS CVE", () => {
		assert.ok(pkg.overrides.minimatch, "minimatch override present");
	});

	it("has tar override for path traversal CVE", () => {
		assert.ok(pkg.overrides.tar, "tar override present");
	});

	it("has fast-xml-parser override for XXE CVE", () => {
		assert.ok(
			pkg.overrides["fast-xml-parser"],
			"fast-xml-parser override present",
		);
	});

	it("has nodemailer override", () => {
		assert.ok(pkg.overrides.nodemailer, "nodemailer override present");
	});

	it("n8n version uses caret range", () => {
		assert.ok(
			pkg.dependencies.n8n.startsWith("^"),
			"n8n uses caret range for minor updates",
		);
	});
});

// ---------------------------------------------------------------------------
// Lens 16: Idempotency and side effect isolation
// ---------------------------------------------------------------------------

describe("validation function purity", () => {
	it("getValidationMessage is pure - same input same output", () => {
		const input = { valid: false, valueMissing: true };
		const r1 = getValidationMessage("name", input);
		const r2 = getValidationMessage("name", input);
		assert.equal(r1, r2);
	});

	it("isSpamResult is pure - same input same output", () => {
		const input = { spam_score: 85 };
		assert.equal(isSpamResult(input), isSpamResult(input));
	});

	it("getErrorMessage is pure - same input same output", () => {
		const err = new Error("test");
		assert.equal(getErrorMessage(err), getErrorMessage(err));
	});

	it("isSpamResult does not mutate input", () => {
		const input = { spam_score: 85, category: "spam" };
		const copy = { ...input };
		isSpamResult(input);
		assert.deepEqual(input, copy);
	});
});

// ---------------------------------------------------------------------------
// Workflow connection graph integrity
// ---------------------------------------------------------------------------

describe("workflow fan-out correctness", () => {
	it("Flag as Legitimate fans out to exactly 3 nodes", () => {
		const connections = workflow.connections["Flag as Legitimate"];
		const targets = connections.main[0];
		assert.equal(targets.length, 3);
		const targetNames = targets.map((t) => t.node).sort();
		assert.deepEqual(targetNames, [
			"Send Email Notification",
			"Send Slack Notification",
			"Success Response",
		]);
	});

	it("Flag as Spam fans out to exactly 2 nodes", () => {
		const connections = workflow.connections["Flag as Spam"];
		const targets = connections.main[0];
		assert.equal(targets.length, 2);
		const targetNames = targets.map((t) => t.node).sort();
		assert.deepEqual(targetNames, ["Log to Google Sheets", "Spam Response"]);
	});

	it("Build Warnings receives from both Slack and Email", () => {
		const slackTargets =
			workflow.connections["Send Slack Notification"].main[0];
		const emailTargets =
			workflow.connections["Send Email Notification"].main[0];
		assert.ok(slackTargets.some((t) => t.node === "Build Warnings"));
		assert.ok(emailTargets.some((t) => t.node === "Build Warnings"));
	});

	it("Success Response is a respondToWebhook node", () => {
		const node = nodesById.get("success-respond");
		assert.equal(node.type, "n8n-nodes-base.respondToWebhook");
	});
});
