const form = document.getElementById("debateForm");
const loading = document.getElementById("loading");
const results = document.getElementById("results");
const errorBox = document.getElementById("error");

const API_BASE_URL = "http://127.0.0.1:8001";

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const topic = document.getElementById("topic").value;
  const side = document.getElementById("side").value;
  const argument = document.getElementById("argument").value;

  loading.classList.remove("hidden");
  results.classList.add("hidden");
  errorBox.classList.add("hidden");
  errorBox.textContent = "";

  try {
    const response = await fetch(`${API_BASE_URL}/debate-coach`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        topic,
        side,
        argument
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Backend request failed.");
    }
    console.log(data);

    document.getElementById("counterargument").textContent = data.counterargument || "No response";
    document.getElementById("strengths").textContent = data.strengths || "No response";
    document.getElementById("weaknesses").textContent = data.weaknesses || "No response";
    document.getElementById("suggestions").textContent = data.suggestions || "No response";

    results.classList.remove("hidden");
  } catch (error) {
    errorBox.textContent = `Error: ${error.message}`;
    errorBox.classList.remove("hidden");
    console.error(error);
  } finally {
    loading.classList.add("hidden");
  }
});