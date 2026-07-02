const codeInput = document.querySelector("#codeInput");
const languageSelect = document.querySelector("#language");
const reviewButton = document.querySelector("#reviewButton");
const sampleButton = document.querySelector("#sampleButton");
const clearButton = document.querySelector("#clearButton");
const copyButton = document.querySelector("#copyButton");
const downloadButton = document.querySelector("#downloadButton");
const reviewOutput = document.querySelector("#reviewOutput");
const emptyState = document.querySelector("#emptyState");
const loadingState = document.querySelector("#loadingState");
const charCount = document.querySelector("#charCount");
const lineNumbers = document.querySelector("#lineNumbers");
const apiStatus = document.querySelector("#apiStatus");

const storageKey = "code-reviewer-draft";
let latestReview = "";

const sampleCode = `function sum(){
    return a+b;
}`;

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderMarkdown(markdown) {
    const escaped = escapeHtml(markdown);
    const withCodeBlocks = escaped.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

    return withCodeBlocks
        .split(/\n{2,}/)
        .map((block) => {
            if (block.startsWith("<pre>")) return block;
            if (/^###\s/.test(block)) return `<h3>${block.replace(/^###\s/, "")}</h3>`;
            if (/^##\s/.test(block)) return `<h2>${block.replace(/^##\s/, "")}</h2>`;
            if (/^#\s/.test(block)) return `<h1>${block.replace(/^#\s/, "")}</h1>`;
            if (/^[-*]\s/m.test(block)) {
                const items = block
                    .split("\n")
                    .filter(Boolean)
                    .map((line) => `<li>${line.replace(/^[-*]\s/, "")}</li>`)
                    .join("");
                return `<ul>${items}</ul>`;
            }
            return `<p>${block.replace(/\n/g, "<br>")}</p>`;
        })
        .join("");
}

function setStatus(label, mode = "ready") {
    apiStatus.textContent = label;
    apiStatus.style.background = mode === "error" ? "#fde8e4" : mode === "busy" ? "#fff4d7" : "#e8f4ee";
    apiStatus.style.color = mode === "error" ? "#b53d2d" : mode === "busy" ? "#946200" : "#2f855a";
}

function setLoading(isLoading) {
    reviewButton.disabled = isLoading;
    sampleButton.disabled = isLoading;
    clearButton.disabled = isLoading;
    loadingState.classList.toggle("hidden", !isLoading);
    emptyState.classList.add("hidden");
    reviewOutput.classList.toggle("hidden", isLoading || !latestReview);
    setStatus(isLoading ? "Reviewing" : "Ready", isLoading ? "busy" : "ready");
}

function updateEditorMeta() {
    const value = codeInput.value;
    const lines = Math.max(value.split("\n").length, 1);
    lineNumbers.textContent = Array.from({ length: lines }, (_, index) => index + 1).join("\n");
    charCount.textContent = `${value.length.toLocaleString()} character${value.length === 1 ? "" : "s"}`;
    localStorage.setItem(storageKey, value);
}

function showReview(markdown) {
    latestReview = markdown;
    reviewOutput.innerHTML = renderMarkdown(markdown);
    reviewOutput.classList.remove("hidden");
    emptyState.classList.add("hidden");
    loadingState.classList.add("hidden");
}

function showError(message) {
    latestReview = "";
    reviewOutput.innerHTML = `<h3>Review failed</h3><p>${escapeHtml(message)}</p>`;
    reviewOutput.classList.remove("hidden");
    emptyState.classList.add("hidden");
    loadingState.classList.add("hidden");
    setStatus("Error", "error");
}

async function requestReview() {
    const code = codeInput.value.trim();

    if (!code) {
        showError("Please paste code before requesting a review.");
        return;
    }

    setLoading(true);

    try {
        const response = await fetch("/ai/get-review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code,
                language: languageSelect.value,
            }),
        });

        const text = await response.text();

        if (!response.ok) {
            throw new Error(text || "The server could not complete the review.");
        }

        showReview(text);
        setStatus("Complete", "ready");
    } catch (error) {
        showError(error.message);
    } finally {
        reviewButton.disabled = false;
        sampleButton.disabled = false;
        clearButton.disabled = false;
    }
}

function clearWorkspace() {
    codeInput.value = "";
    latestReview = "";
    reviewOutput.innerHTML = "";
    reviewOutput.classList.add("hidden");
    loadingState.classList.add("hidden");
    emptyState.classList.remove("hidden");
    setStatus("Ready", "ready");
    updateEditorMeta();
    codeInput.focus();
}

async function copyReview() {
    if (!latestReview) return;
    await navigator.clipboard.writeText(latestReview);
    setStatus("Copied", "ready");
}

function downloadReview() {
    if (!latestReview) return;

    const blob = new Blob([latestReview], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "code-review.md";
    link.click();
    URL.revokeObjectURL(url);
}

codeInput.addEventListener("input", updateEditorMeta);
codeInput.addEventListener("scroll", () => {
    lineNumbers.scrollTop = codeInput.scrollTop;
});
reviewButton.addEventListener("click", requestReview);
sampleButton.addEventListener("click", () => {
    codeInput.value = sampleCode;
    updateEditorMeta();
    codeInput.focus();
});
clearButton.addEventListener("click", clearWorkspace);
copyButton.addEventListener("click", copyReview);
downloadButton.addEventListener("click", downloadReview);

codeInput.value = localStorage.getItem(storageKey) || "";
updateEditorMeta();
