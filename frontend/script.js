const form = document.getElementById("debateForm");
const loading = document.getElementById("loading");
const results = document.getElementById("results");
const errorBox = document.getElementById("error");
const submitBtn = document.getElementById("submitBtn");
const sideSelect = document.getElementById("side");
const topicInput = document.getElementById("topic");
const argumentInput = document.getElementById("argument");
const debaterTips = document.getElementById("debaterTips");
const wordCount = document.getElementById("wordCount");
const sentenceCount = document.getElementById("sentenceCount");
const confidencePulse = document.getElementById("confidencePulse");
const stanceLabel = document.getElementById("stanceLabel");
const stanceNeedle = document.getElementById("stanceNeedle");
const logicScore = document.getElementById("logicScore");
const emotionScore = document.getElementById("emotionScore");
const credibilityScore = document.getElementById("credibilityScore");

const API_BASE_URL = "http://127.0.0.1:8001";

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function countSentences(text) {
  const matches = text.trim().match(/[^.!?]+[.!?]*/g);
  return matches ? matches.filter((part) => part.trim().length > 0).length : 0;
}

function calculateConfidenceLevel(text) {
  const words = countWords(text);
  if (words >= 140) {
    return "High";
  }
  if (words >= 70) {
    return "Medium";
  }
  return "Low";
}

function updateArgumentMetrics() {
  const text = argumentInput.value;
  wordCount.textContent = String(countWords(text));
  sentenceCount.textContent = String(countSentences(text));
  confidencePulse.textContent = calculateConfidenceLevel(text);
  updateArgumentDna(text);
}

function scoreByKeywordDensity(text, keywords) {
  if (!text.trim()) {
    return 0;
  }

  const lower = text.toLowerCase();
  const matches = keywords.reduce((total, keyword) => {
    const pattern = new RegExp(`\\b${keyword}\\b`, "g");
    const count = lower.match(pattern)?.length || 0;
    return total + count;
  }, 0);

  const normalized = Math.min(100, Math.round((matches / 6) * 100));
  return normalized;
}

function updateArgumentDna(text) {
  const logicKeywords = ["because", "therefore", "evidence", "data", "study", "statistics", "research"];
  const emotionKeywords = ["justice", "harm", "fear", "hope", "freedom", "children", "future", "moral"];
  const credibilityKeywords = ["expert", "report", "source", "according", "policy", "law", "institution"];

  logicScore.textContent = `${scoreByKeywordDensity(text, logicKeywords)}%`;
  emotionScore.textContent = `${scoreByKeywordDensity(text, emotionKeywords)}%`;
  credibilityScore.textContent = `${scoreByKeywordDensity(text, credibilityKeywords)}%`;
}

function updateStanceBoard() {
  const side = sideSelect.value;

  if (side === "for") {
    stanceLabel.textContent = "Current Side: FOR";
  } else if (side === "against") {
    stanceLabel.textContent = "Current Side: AGAINST";
  } else {
    stanceLabel.textContent = "Choose a side to begin";
  }

  stanceNeedle.style.left = "0%";

  document.body.dataset.side = side || "neutral";
}

function buildDebaterTips(topic, side, argumentText) {
  const cleanTopic = topic.trim() || "this topic";
  const stance = side ? side.toUpperCase() : "EITHER SIDE";
  const words = countWords(argumentText);
  const hasEnoughLength = words >= 90;

  return [
    `Open with a clear ${stance} claim on "${cleanTopic}" before giving any supporting details.`,
    "Use a simple structure: claim -> evidence -> impact, so judges can follow your logic quickly.",
    hasEnoughLength
      ? "Your argument length is solid. Now tighten wording so every sentence adds strategic value."
      : "Expand your case with one statistic or real-world example to increase persuasive depth.",
    "Pre-answer one likely rebuttal in advance so you stay composed during crossfire."
  ];
}

function updateDebaterTips() {
  const tips = buildDebaterTips(topicInput.value, sideSelect.value, argumentInput.value);
  debaterTips.innerHTML = "";

  tips.forEach((tip) => {
    const li = document.createElement("li");
    li.textContent = tip;
    debaterTips.appendChild(li);
  });
}

argumentInput.addEventListener("input", () => {
  updateArgumentMetrics();
  updateDebaterTips();
});
sideSelect.addEventListener("change", () => {
  updateStanceBoard();
  updateDebaterTips();
});
topicInput.addEventListener("input", updateDebaterTips);

updateArgumentMetrics();
updateStanceBoard();
updateDebaterTips();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const topic = topicInput.value;
  const side = sideSelect.value;
  const argument = argumentInput.value;

  loading.classList.remove("hidden");
  results.classList.add("hidden");
  errorBox.classList.add("hidden");
  errorBox.textContent = "";
  submitBtn.disabled = true;

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
    submitBtn.disabled = false;
  }
});