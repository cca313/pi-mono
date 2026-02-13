const output = document.getElementById("output");
const form = document.getElementById("form") as HTMLFormElement | null;
const input = document.getElementById("prompt") as HTMLInputElement | null;

if (!output || !form || !input) {
	throw new Error("web-finance demo elements are missing");
}

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	const prompt = input.value.trim();
	if (!prompt) {
		return;
	}

	const response = await fetch("/api/finance/analyze", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ prompt }),
	});

	if (!response.ok) {
		output.textContent = `Request failed: ${response.status}`;
		return;
	}

	const data = (await response.json()) as { summary?: string };
	output.textContent = data.summary ?? "No summary returned.";
});
