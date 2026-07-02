const aiService = require("../services/ai.service");

module.exports.getReview = async (req, res) => {
    try {
        const code = typeof req.body.code === "string" ? req.body.code.trim() : "";
        const language = typeof req.body.language === "string" ? req.body.language.trim() : "";

        if (!code) {
            return res.status(400).send("Code is required");
        }

        if (code.length > 50000) {
            return res.status(413).send("Code is too large. Please keep reviews under 50,000 characters.");
        }

        const response = await aiService.generateContent(code, language);

        res.type("text/plain").send(response);
    } catch (err) {
        console.error(err);
        const status = err.statusCode || err.status || 500;
        res.status(status).send(err.message || "Unable to generate review");
    }
};
