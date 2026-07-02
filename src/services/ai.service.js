const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GEMINI_KEY,
});

function buildReviewPrompt(code, language) {
    const languageLine = language ? `Language or stack: ${language}` : "Language or stack: infer from the code.";

    return `
${languageLine}

Review this code:

\`\`\`
${code}
\`\`\`
`;
}

async function generateContent(code, language = "") {
    if (!process.env.GOOGLE_GEMINI_KEY) {
        const error = new Error("GOOGLE_GEMINI_KEY is not configured on the server.");
        error.statusCode = 500;
        throw error;
    }

    try {
        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",

            systemInstruction: `
You are an expert code reviewer.

Your task is to review the user's code, identify bugs, errors, bad practices,
performance issues, security issues, and suggest improvements.

Return a clear, practical review in Markdown with these sections:
1. Summary
2. Issues Found
3. Recommended Fix
4. Improved Code, when a concrete rewrite is useful

Prioritize correctness, security, performance, maintainability, and testability.
Be specific about line-level problems when the input code is small enough.
`,

            contents: buildReviewPrompt(code, language),
        });

        return response.text || "No review was generated. Please try again.";
    } catch (err) {
        if (err.status === 503 || err.statusCode === 503) {
            const error = new Error("The AI model is temporarily busy. Please try again in a moment.");
            error.statusCode = 503;
            throw error;
        }

        throw err;
    }
}

module.exports = {
    generateContent,
};
