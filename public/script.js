// Update this URL after importing the workflow into n8n
const WEBHOOK_URL = "http://localhost:5678/webhook/contact";

const form = document.getElementById("contact-form");
const submitBtn = document.getElementById("submit-btn");
const errorBanner = document.getElementById("error-banner");
const successCard = document.getElementById("success-card");
const sendAnother = document.getElementById("send-another");
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
			timestamp: new Date().toISOString(),
		};

		const response = await fetch(WEBHOOK_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`Server responded with ${response.status}`);
		}

		// Success: hide form, show success card
		form.classList.add("hidden");
		errorBanner.classList.add("hidden");
		successCard.classList.remove("hidden");
	} catch (err) {
		// Error: show banner, keep form visible and filled
		errorBanner.textContent = `Failed to send: ${err.message}. Please check that n8n is running and try again.`;
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
sendAnother.addEventListener("click", (e) => {
	e.preventDefault();
	successCard.classList.add("hidden");
	form.classList.remove("hidden");
	form.reset();

	// Clear all validation states
	fields.forEach((field) => {
		field.classList.remove("has-blurred", "invalid");
		hasBlurred.delete(field);
		const errorSpan = form.querySelector(
			`.field-error[data-for="${field.name}"]`,
		);
		if (errorSpan) errorSpan.textContent = "";
	});
});
