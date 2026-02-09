// Configuration for webhook submission
// - webhookUrl: n8n webhook URL (update after workflow import)
// - webhookAuth: Must match n8n Header Auth credential
// - timeout: Request timeout in milliseconds
const CONFIG = {
	webhookUrl: "http://localhost:5678/webhook/contact-form",
	webhookAuth: "demo-token-2026",
	timeout: 15000,
};

const form = document.getElementById("contact-form");
const submitBtn = document.getElementById("submit-btn");
const errorBanner = document.getElementById("error-banner");
const successCard = document.getElementById("success-card");
const spamDetected = document.getElementById("spam-detected");
const sendAnother = document.getElementById("send-another");
const spamSendAnother = document.getElementById("spam-send-another");
const fields = form.querySelectorAll("input, textarea");

// Track which fields have been blurred (for "punish late" UX)
const hasBlurred = new WeakMap();

/**
 * Validate a single field and display/clear error message
 */
function validateField(field) {
	const errorSpan = form.querySelector(
		`.field-error[data-for="${field.name}"]`,
	);
	if (!errorSpan) return;

	if (field.validity.valid) {
		// Valid: clear error, keep has-blurred for green border
		errorSpan.textContent = "";
		field.classList.remove("invalid");
	} else {
		// Invalid: show field-specific error
		field.classList.add("invalid");

		let message = "";
		if (field.validity.valueMissing) {
			// Field-specific required messages
			switch (field.name) {
				case "name":
					message = "Please enter your name";
					break;
				case "email":
					message = "Please enter your email address";
					break;
				case "subject":
					message = "Please enter a subject";
					break;
				case "message":
					message = "Please enter your message";
					break;
				default:
					message = "This field is required";
			}
		} else if (field.validity.typeMismatch && field.type === "email") {
			message = "Please enter a valid email address (e.g., name@example.com)";
		}

		errorSpan.textContent = message;
	}
}

// Validation event handlers: "reward early, punish late"
fields.forEach((field) => {
	// On blur: mark as blurred and validate
	field.addEventListener("blur", () => {
		hasBlurred.set(field, true);
		field.classList.add("has-blurred");
		validateField(field);
	});

	// On input: only validate if already blurred (clear errors as user types fix)
	field.addEventListener("input", () => {
		if (hasBlurred.get(field)) {
			validateField(field);
		}
	});
});

// Form submission handler
form.addEventListener("submit", async (e) => {
	e.preventDefault();

	// Validate all fields before submitting
	fields.forEach((field) => {
		hasBlurred.set(field, true);
		field.classList.add("has-blurred");
		validateField(field);
	});

	// If form invalid, focus first invalid field and stop
	if (!form.checkValidity()) {
		const firstInvalid = form.querySelector(":invalid");
		if (firstInvalid) firstInvalid.focus();
		return;
	}

	// Loading state: show spinner, disable fields
	const spinner = submitBtn.querySelector(".spinner");
	const btnText = submitBtn.querySelector(".btn-text");
	submitBtn.disabled = true;
	spinner.classList.remove("hidden");
	btnText.textContent = "Sending...";
	fields.forEach((f) => {
		f.disabled = true;
	});
	errorBanner.classList.add("hidden");

	try {
		const data = {
			name: form.name.value.trim(),
			email: form.email.value.trim(),
			subject: form.subject.value.trim(),
			message: form.message.value.trim(),
		};

		const response = await fetch(CONFIG.webhookUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Webhook-Auth": CONFIG.webhookAuth,
			},
			body: JSON.stringify(data),
			signal: AbortSignal.timeout(CONFIG.timeout),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `Server responded with ${response.status}`,
			);
		}

		// Success: parse response and populate results card
		const result = await response.json();

		// Check if submission was flagged as spam
		// Supports both explicit spam flag (Spam Response node) and score-based detection
		const isSpam = result.spam === true || (result.spam_score && result.spam_score > 70);
		if (isSpam) {
			// Populate spam detection details
			document.getElementById("spam-score").textContent = result.spam_score || "—";
			document.getElementById("spam-reason").textContent =
				result.spam_reason || "No reason provided";
			document.getElementById("spam-category").textContent =
				result.category || "—";

			// Hide form, show spam detection message
			form.classList.add("hidden");
			errorBanner.classList.add("hidden");
			successCard.classList.add("hidden");
			spamDetected.classList.remove("hidden");
		} else {
			// Populate AI analysis results for legitimate submissions
			document.getElementById("result-category").textContent =
				result.category || "Processing";
			document.getElementById("result-summary").textContent =
				result.summary || "Your message is being processed";

			// Hide form, show success card
			form.classList.add("hidden");
			errorBanner.classList.add("hidden");
			spamDetected.classList.add("hidden");
			successCard.classList.remove("hidden");
		}
	} catch (err) {
		// Differentiated error handling
		let errorMessage;

		if (err.name === "TimeoutError") {
			errorMessage =
				"The request took too long. The server may be busy — please try again.";
		} else if (err.message && err.message.includes("Failed to fetch")) {
			errorMessage =
				"Could not reach the server. Please check that n8n is running and try again.";
		} else {
			errorMessage = err.message || "Something went wrong. Please try again.";
		}

		errorBanner.textContent = errorMessage;
		errorBanner.classList.remove("hidden");
	} finally {
		// Re-enable fields and reset button
		fields.forEach((f) => {
			f.disabled = false;
		});
		spinner.classList.add("hidden");
		btnText.textContent = "Send Message";
		submitBtn.disabled = false;
	}
});

// "Send another" handler: reset form and clear validation states
function resetForm() {
	successCard.classList.add("hidden");
	spamDetected.classList.add("hidden");
	form.classList.remove("hidden");
	form.reset();

	// Reset result values
	document.getElementById("result-category").textContent = "—";
	document.getElementById("result-summary").textContent = "—";

	// Reset spam detection values
	document.getElementById("spam-score").textContent = "—";
	document.getElementById("spam-reason").textContent = "—";
	document.getElementById("spam-category").textContent = "—";

	// Clear all validation states
	fields.forEach((field) => {
		field.classList.remove("has-blurred", "invalid");
		hasBlurred.delete(field);
		const errorSpan = form.querySelector(
			`.field-error[data-for="${field.name}"]`,
		);
		if (errorSpan) errorSpan.textContent = "";
	});
}

sendAnother.addEventListener("click", (e) => {
	e.preventDefault();
	resetForm();
});

spamSendAnother.addEventListener("click", (e) => {
	e.preventDefault();
	resetForm();
});
