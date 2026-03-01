const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const workflow = require("../workflows/contact-form-ai.json");

// Build lookup maps for assertions
const nodesByName = new Map(workflow.nodes.map((n) => [n.name, n]));
const nodesById = new Map(workflow.nodes.map((n) => [n.id, n]));

describe("workflow metadata", () => {
	it("has the expected name", () => {
		assert.equal(workflow.name, "Contact Form AI Automation");
	});

	it("uses v1 execution order", () => {
		assert.equal(workflow.settings.executionOrder, "v1");
	});

	it("has a workflow ID", () => {
		assert.ok(workflow.id);
	});
});

describe("node inventory", () => {
	const expectedNodeIds = [
		"webhook-trigger",
		"normalize-fields",
		"validate-fields",
		"error-response",
		"validation-error-respond",
		"success-respond",
		"route-spam",
		"spam-respond",
		"analyze-contact-form",
		"parse-ai-response",
		"ai-fallback-handler",
		"flag-as-spam",
		"flag-as-legitimate",
		"log-to-sheets",
		"slack-notification",
		"email-notification",
		"build-warnings",
	];

	for (const id of expectedNodeIds) {
		it(`contains node "${id}"`, () => {
			assert.ok(nodesById.has(id), `Missing node: ${id}`);
		});
	}

	it("has 5 sticky notes", () => {
		const stickyNotes = workflow.nodes.filter((n) =>
			n.type.includes("stickyNote"),
		);
		assert.equal(stickyNotes.length, 5);
	});

	it("has 22 total nodes (17 processing + 5 sticky)", () => {
		assert.equal(workflow.nodes.length, 22);
	});
});

describe("credential references", () => {
	it("Webhook has httpHeaderAuth credential", () => {
		const node = nodesByName.get("Webhook");
		assert.ok(node.credentials?.httpHeaderAuth);
	});

	it("Analyze Contact Form has openAiApi credential", () => {
		const node = nodesByName.get("Analyze Contact Form");
		assert.ok(node.credentials?.openAiApi);
	});

	it("Log to Google Sheets has googleSheetsOAuth2Api credential", () => {
		const node = nodesByName.get("Log to Google Sheets");
		assert.ok(node.credentials?.googleSheetsOAuth2Api);
	});

	it("Send Slack Notification has slackApi credential", () => {
		const node = nodesByName.get("Send Slack Notification");
		assert.ok(node.credentials?.slackApi);
	});

	it("Send Email Notification has smtp credential", () => {
		const node = nodesByName.get("Send Email Notification");
		assert.ok(node.credentials?.smtp);
	});
});

describe("connection integrity", () => {
	it("all connection targets reference existing nodes", () => {
		const missing = [];
		for (const [sourceName, outputs] of Object.entries(workflow.connections)) {
			assert.ok(
				nodesByName.has(sourceName),
				`Connection source "${sourceName}" not found in nodes`,
			);
			for (const outputGroup of outputs.main) {
				for (const conn of outputGroup) {
					if (!nodesByName.has(conn.node)) {
						missing.push(`${sourceName} -> ${conn.node}`);
					}
				}
			}
		}
		assert.equal(
			missing.length,
			0,
			`Broken connections: ${missing.join(", ")}`,
		);
	});

	it("Webhook connects to Normalize Fields", () => {
		const targets = workflow.connections.Webhook.main[0];
		assert.ok(targets.some((c) => c.node === "Normalize Fields"));
	});

	it("Validate Fields has two outputs (valid + invalid)", () => {
		const outputs = workflow.connections["Validate Fields"].main;
		assert.equal(outputs.length, 2);
	});

	it("Route by Spam Score has two outputs (spam + fallback)", () => {
		const outputs = workflow.connections["Route by Spam Score"].main;
		assert.equal(outputs.length, 2);
	});
});

describe("switch node structure", () => {
	const switchNode = nodesById.get("route-spam");

	it("uses rules.values as inner key (not rules.rules)", () => {
		assert.ok(switchNode.parameters.rules.values);
		assert.equal(switchNode.parameters.rules.rules, undefined);
	});

	it("has conditions.options object", () => {
		const rule = switchNode.parameters.rules.values[0];
		assert.ok(rule.conditions.options);
	});

	it("has conditions.combinator field", () => {
		const rule = switchNode.parameters.rules.values[0];
		assert.ok(rule.conditions.combinator);
	});

	it("checks spam_score > 70", () => {
		const condition =
			switchNode.parameters.rules.values[0].conditions.conditions[0];
		assert.equal(condition.rightValue, 70);
		assert.equal(condition.operator.operation, "gt");
	});
});

describe("webhook configuration", () => {
	const webhook = nodesById.get("webhook-trigger");

	it('path is "contact-form"', () => {
		assert.equal(webhook.parameters.path, "contact-form");
	});

	it('authentication is "headerAuth"', () => {
		assert.equal(webhook.parameters.authentication, "headerAuth");
	});

	it('response mode is "responseNode"', () => {
		assert.equal(webhook.parameters.responseMode, "responseNode");
	});

	it("HTTP method is POST", () => {
		assert.equal(webhook.parameters.httpMethod, "POST");
	});
});

describe("response status codes", () => {
	it("Success Response returns 200", () => {
		const node = nodesById.get("success-respond");
		assert.equal(node.parameters.options.responseCode, 200);
	});

	it("Spam Response returns 200", () => {
		const node = nodesById.get("spam-respond");
		assert.equal(node.parameters.options.responseCode, 200);
	});

	it("Validation Error returns 400", () => {
		const node = nodesById.get("validation-error-respond");
		assert.equal(node.parameters.options.responseCode, 400);
	});
});

describe("resilience configuration", () => {
	it("Analyze Contact Form has continueOnFail", () => {
		const node = nodesById.get("analyze-contact-form");
		assert.equal(node.continueOnFail, true);
	});

	it("Log to Google Sheets has continueOnFail", () => {
		const node = nodesById.get("log-to-sheets");
		assert.equal(node.continueOnFail, true);
	});

	it("Send Slack Notification has continueOnFail", () => {
		const node = nodesById.get("slack-notification");
		assert.equal(node.continueOnFail, true);
	});

	it("Send Email Notification has continueOnFail", () => {
		const node = nodesById.get("email-notification");
		assert.equal(node.continueOnFail, true);
	});

	it("Analyze Contact Form retries up to 2 times", () => {
		const node = nodesById.get("analyze-contact-form");
		assert.equal(node.retryOnFail, true);
		assert.equal(node.maxTries, 2);
	});
});

describe("normalize-fields resilience", () => {
	it("uses Code node (not Set) for explicit field handling", () => {
		const node = nodesById.get("normalize-fields");
		assert.equal(node.type, "n8n-nodes-base.code");
	});

	it("uses spread operator for forward compatibility", () => {
		const node = nodesById.get("normalize-fields");
		assert.ok(
			node.parameters.jsCode.includes("...body"),
			"Code should use spread to preserve upstream fields",
		);
	});
});

describe("threshold synchronization", () => {
	const { SPAM_THRESHOLD } = require("../public/validation.js");

	it("Switch node threshold matches client-side SPAM_THRESHOLD", () => {
		const switchNode = nodesById.get("route-spam");
		const condition =
			switchNode.parameters.rules.values[0].conditions.conditions[0];
		assert.equal(
			condition.rightValue,
			SPAM_THRESHOLD,
			`Workflow threshold (${condition.rightValue}) must match SPAM_THRESHOLD (${SPAM_THRESHOLD})`,
		);
	});

	it("Switch uses 'gt' operator matching isSpamResult '>' comparison", () => {
		const switchNode = nodesById.get("route-spam");
		const condition =
			switchNode.parameters.rules.values[0].conditions.conditions[0];
		assert.equal(condition.operator.operation, "gt");
	});
});

describe("code node references", () => {
	const codeNodes = workflow.nodes.filter(
		(n) => n.type === "n8n-nodes-base.code" && n.parameters.jsCode,
	);

	for (const node of codeNodes) {
		const refs = [...node.parameters.jsCode.matchAll(/\$\('([^']+)'\)/g)];
		for (const [, refName] of refs) {
			it(`"${node.name}" references existing node "${refName}"`, () => {
				assert.ok(
					nodesByName.has(refName),
					`Node "${node.name}" references "${refName}" which does not exist`,
				);
			});
		}
	}
});
