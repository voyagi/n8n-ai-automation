#!/usr/bin/env node

/**
 * Batch Contact Form Submission Script
 *
 * Usage:
 *   node tests/batch-submit.js              # Sequential mode (1s delay between submissions)
 *   node tests/batch-submit.js --rapid-fire # Concurrent mode (all at once)
 *
 * Environment Variables:
 *   WEBHOOK_URL  - n8n webhook endpoint (default: http://localhost:5678/webhook/contact-form)
 *   WEBHOOK_AUTH - Authentication token (default: demo-token-2026)
 */

const testData = require("./test-data.json");

const WEBHOOK_URL =
	process.env.WEBHOOK_URL || "http://localhost:5678/webhook/contact-form";
const WEBHOOK_AUTH = process.env.WEBHOOK_AUTH || "demo-token-2026";
const DELAY_MS = 1000;
const RAPID_FIRE = process.argv.includes("--rapid-fire");

/**
 * Submit a single form entry to the webhook
 * @param {Object} data - Form data with name, email, subject, message, expected_category, test_case
 * @returns {Promise<Object>} Result with success, duration, data, and response
 */
async function submitForm(data) {
	const startTime = Date.now();

	try {
		const response = await fetch(WEBHOOK_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Webhook-Auth": WEBHOOK_AUTH,
			},
			body: JSON.stringify({
				name: data.name,
				email: data.email,
				subject: data.subject,
				message: data.message,
			}),
		});

		const duration = Date.now() - startTime;

		if (!response.ok) {
			return {
				success: false,
				duration,
				data,
				error: `HTTP ${response.status}: ${response.statusText}`,
				statusCode: response.status,
			};
		}

		const result = await response.json();

		// Check category accuracy (informational only - AI may classify differently)
		const categoryMatch = result.category === data.expected_category;

		return {
			success: true,
			duration,
			data,
			result,
			categoryMatch,
		};
	} catch (error) {
		const duration = Date.now() - startTime;
		return {
			success: false,
			duration,
			data,
			error: error.message,
		};
	}
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms) {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Main execution function
 */
async function main() {
	console.log("=".repeat(80));
	console.log("Contact Form Batch Submission Script");
	console.log("=".repeat(80));
	console.log(
		`Mode: ${RAPID_FIRE ? "RAPID-FIRE (concurrent)" : "SEQUENTIAL (1s delays)"}`,
	);
	console.log(`Webhook: ${WEBHOOK_URL}`);
	console.log(`Test entries: ${testData.length}`);
	console.log("=".repeat(80));
	console.log();

	const results = [];
	const startTime = Date.now();

	if (RAPID_FIRE) {
		// Concurrent mode - fire all requests simultaneously
		console.log("🚀 Firing all requests concurrently...\n");
		const promises = testData.map((data) => submitForm(data));
		const concurrentResults = await Promise.all(promises);
		results.push(...concurrentResults);
	} else {
		// Sequential mode - one at a time with delays
		for (let i = 0; i < testData.length; i++) {
			const data = testData[i];
			console.log(
				`[${i + 1}/${testData.length}] Submitting: ${data.test_case}...`,
			);

			const result = await submitForm(data);
			results.push(result);

			if (result.success) {
				const categoryIcon = result.categoryMatch ? "✓" : "⚠";
				console.log(
					`  ${categoryIcon} Success (${formatDuration(result.duration)}) - Category: ${result.result.category} (expected: ${data.expected_category})`,
				);
			} else {
				console.log(
					`  ✗ Failed (${formatDuration(result.duration)}) - ${result.error}`,
				);
			}

			// Delay between requests (except after last one)
			if (i < testData.length - 1 && !RAPID_FIRE) {
				await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
			}
		}
	}

	const totalDuration = Date.now() - startTime;

	// Print summary
	console.log();
	console.log("=".repeat(80));
	console.log("SUMMARY");
	console.log("=".repeat(80));

	const successCount = results.filter((r) => r.success).length;
	const failCount = results.filter((r) => !r.success).length;
	const categoryMatchCount = results.filter(
		(r) => r.success && r.categoryMatch,
	).length;
	const avgDuration =
		results.reduce((sum, r) => sum + r.duration, 0) / results.length;

	console.log(`Total submissions: ${results.length}`);
	console.log(`✓ Successful: ${successCount}`);
	console.log(`✗ Failed: ${failCount}`);
	console.log(
		`Category accuracy: ${categoryMatchCount}/${successCount} (${successCount > 0 ? ((categoryMatchCount / successCount) * 100).toFixed(1) : "0.0"}%)`,
	);
	console.log(`Average duration: ${formatDuration(avgDuration)}`);
	console.log(`Total time: ${formatDuration(totalDuration)}`);
	console.log("=".repeat(80));

	// Print failures if any
	if (failCount > 0) {
		console.log();
		console.log("FAILURES:");
		results
			.filter((r) => !r.success)
			.forEach((r) => {
				console.log(`  • ${r.data.test_case}: ${r.error}`);
			});
		console.log();
	}

	// Print category mismatches (informational only)
	const mismatches = results.filter((r) => r.success && !r.categoryMatch);
	if (mismatches.length > 0) {
		console.log();
		console.log(
			"CATEGORY MISMATCHES (informational only - AI variation is acceptable):",
		);
		mismatches.forEach((r) => {
			console.log(
				`  • ${r.data.test_case}: expected "${r.data.expected_category}", got "${r.result.category}"`,
			);
		});
		console.log();
	}

	// Exit with error code if any HTTP failures occurred
	const httpFailures = results.filter((r) => !r.success);
	if (httpFailures.length > 0) {
		process.exitCode = 1;
	}
}

// Run main function
main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
