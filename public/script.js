// Update this URL after importing the workflow into n8n
const WEBHOOK_URL = "http://localhost:5678/webhook/contact";

const form = document.getElementById("contact-form");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");

form.addEventListener("submit", async (e) => {
	e.preventDefault();

	const data = {
		name: form.name.value.trim(),
		email: form.email.value.trim(),
		subject: form.subject.value,
		message: form.message.value.trim(),
		timestamp: new Date().toISOString(),
	};

	submitBtn.disabled = true;
	submitBtn.textContent = "Sending...";
	statusEl.className = "status hidden";

	try {
		const response = await fetch(WEBHOOK_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`Server responded with ${response.status}`);
		}

		statusEl.textContent =
			"Message sent! Our AI is processing your request and you'll hear back shortly.";
		statusEl.className = "status success";
		form.reset();
	} catch (err) {
		statusEl.textContent = `Failed to send: ${err.message}. Check that n8n is running.`;
		statusEl.className = "status error";
	} finally {
		submitBtn.disabled = false;
		submitBtn.textContent = "Send Message";
	}
});
