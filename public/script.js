// Configuration for webhook submission
// - webhookUrl: n8n webhook URL (update after workflow import)
// - webhookAuth: Must match n8n Header Auth credential value
//   NOTE: This is a demo placeholder. Replace with your own token
//   from the Header Auth credential you create in n8n.
// - timeout: Request timeout in milliseconds
const CONFIG = {
	webhookUrl: "http://localhost:5678/webhook/contact-form",
	webhookAuth: "demo-token-2026",
	timeout: 30000,
};

const form = document.getElementById("contact-form");
const submitBtn = document.getElementById("submit-btn");
const errorBanner = document.getElementById("error-banner");
const successCard = document.getElementById("success-card");
const spamDetected = document.getElementById("spam-detected");
const fields = form.querySelectorAll("input, textarea");
const views = [form, successCard, spamDetected];

// Cache result elements to avoid repeated getElementById calls
const resultEls = {
	category: document.getElementById("result-category"),
	summary: document.getElementById("result-summary"),
	spamScore: document.getElementById("spam-score"),
	spamReason: document.getElementById("spam-reason"),
	spamCategory: document.getElementById("spam-category"),
};
let isSubmitting = false;

/**
 * Switch to a specific view, hiding all others and the error banner.
 */
function showView(target) {
	errorBanner.classList.add("hidden");
	for (const view of views) {
		view.classList.toggle("hidden", view !== target);
	}
}

// Track which fields have been blurred (for "punish late" UX)
const hasBlurred = new WeakMap();

function markBlurred(field) {
	hasBlurred.set(field, true);
	field.classList.add("has-blurred");
	validateField(field);
}

/**
 * Validate a single field and display/clear error message
 */
function validateField(field) {
	const errorSpan = form.querySelector(
		`.field-error[data-for="${field.name}"]`,
	);
	if (!errorSpan) return;

	if (field.validity.valid) {
		errorSpan.textContent = "";
		field.classList.remove("invalid");
	} else {
		field.classList.add("invalid");
		errorSpan.textContent = getValidationMessage(field.name, field.validity);
	}
}

// Validation event handlers: "reward early, punish late"
fields.forEach((field) => {
	// On blur: mark as blurred and validate
	field.addEventListener("blur", () => markBlurred(field));

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
	if (isSubmitting) return;
	isSubmitting = true;

	// Validate all fields before submitting
	fields.forEach((field) => {
		markBlurred(field);
	});

	// If form invalid, focus first invalid field and stop
	if (!form.checkValidity()) {
		const firstInvalid = form.querySelector(":invalid");
		if (firstInvalid) firstInvalid.focus();
		isSubmitting = false;
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

		if (result.status !== "spam" && result.status !== "success") {
			throw new Error("Unexpected response format from server");
		}
		const isSpam = result.status === "spam";
		if (isSpam) {
			// Populate spam detection details
			resultEls.spamScore.textContent = result.spam_score || "—";
			resultEls.spamReason.textContent =
				result.spam_reason || "No reason provided";
			resultEls.spamCategory.textContent = result.category || "—";

			// Hide form, show spam detection message
			showView(spamDetected);
		} else {
			// Populate AI analysis results for legitimate submissions
			resultEls.category.textContent = result.category || "Processing";
			resultEls.summary.textContent =
				result.summary || "Your message is being processed";

			// Hide form, show success card
			showView(successCard);
		}
	} catch (err) {
		errorBanner.textContent = getErrorMessage(err);
		errorBanner.classList.remove("hidden");
	} finally {
		isSubmitting = false;
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
	showView(form);
	form.reset();

	// Reset all result display values
	for (const el of Object.values(resultEls)) {
		el.textContent = "—";
	}

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

// Delegated handler for all "send another" links
document.addEventListener("click", (e) => {
	if (e.target.closest(".send-another")) {
		e.preventDefault();
		resetForm();
	}
});
