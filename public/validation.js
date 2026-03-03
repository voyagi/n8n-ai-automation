/**
 * Shared pure functions for contact form validation and error handling.
 * Loaded in browser via <script> tag (globals) and in Node.js via require().
 */

// Spam score threshold - submissions scoring above this are flagged as spam.
// Must match the Route by Spam Score switch node (rightValue) in the n8n workflow.
const SPAM_THRESHOLD = 70;

/**
 * Return a human-readable validation message for a form field.
 * @param {string} fieldName - The field's name attribute
 * @param {ValidityState} validity - The field's ValidityState object
 * @returns {string} Error message, or empty string if valid
 */
function getValidationMessage(fieldName, validity) {
	if (validity.valid) return "";
	if (validity.valueMissing) {
		switch (fieldName) {
			case "name":
				return "Please enter your name";
			case "email":
				return "Please enter your email address";
			case "subject":
				return "Please enter a subject";
			case "message":
				return "Please enter your message";
			default:
				return "This field is required";
		}
	}
	if (validity.typeMismatch && fieldName === "email") {
		return "Please enter a valid email address (e.g., name@example.com)";
	}
	return "";
}

/**
 * Map a fetch error to a user-friendly error message.
 * @param {Error} err - The error from the fetch call
 * @returns {string} Human-readable error message
 */
function getErrorMessage(err) {
	if (err.name === "TimeoutError") {
		return "The request took too long. The server may be busy - please try again.";
	}
	if (err.message?.includes("Failed to fetch")) {
		return "Could not reach the server. Please check that n8n is running and try again.";
	}
	if (err.name === "SyntaxError" || err.message?.includes("Unexpected token")) {
		return "The server returned an unexpected response. Please try again.";
	}
	return err.message || "Something went wrong. Please try again.";
}

// Node.js exports (no-op in browser where module is undefined)
if (typeof module !== "undefined" && module.exports) {
	module.exports = {
		getValidationMessage,
		getErrorMessage,
		SPAM_THRESHOLD,
	};
}
