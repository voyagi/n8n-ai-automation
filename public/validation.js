/**
 * Shared pure functions for contact form validation and error handling.
 * Loaded in browser via <script> tag (globals) and in Node.js via require().
 */

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
 * Determine if a webhook response represents a spam detection.
 * @param {Object} result - The parsed webhook response
 * @returns {boolean} True if the result indicates spam
 */
function isSpamResult(result) {
	return result.spam === true || (result.spam_score && result.spam_score > 70);
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
	return err.message || "Something went wrong. Please try again.";
}

// Node.js exports (no-op in browser where module is undefined)
if (typeof module !== "undefined" && module.exports) {
	module.exports = { getValidationMessage, isSpamResult, getErrorMessage };
}
