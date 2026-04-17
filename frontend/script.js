const form = document.getElementById("debateForm");
const loading = document.getElementById("loading");
const results = document.getElementById("results");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const topic = document.getElementById("topic").value;
  const side = document.getElementById("side").value;
  const argument = document.getElementById("argument").value;

  loading.classList.remove("hidden");
  results.classList.add("hidden");

  try {
    const response = await fetch("http://127.0.0.1:8000/debate-coach", {
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
    console.log(data);

    document.getElementById("counterargument").textContent = data.counterargument || "No response";
    document.getElementById("strengths").textContent = data.strengths || "No response";
    document.getElementById("weaknesses").textContent = data.weaknesses || "No response";
    document.getElementById("suggestions").textContent = data.suggestions || "No response";

    results.classList.remove("hidden");
  } catch (error) {
    alert("Something went wrong. Check that your backend is running.");
    console.error(error);
  } finally {
    loading.classList.add("hidden");
  }
});