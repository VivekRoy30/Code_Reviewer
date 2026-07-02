const path = require("path");
const express = require("express");
const aiRoutes = require("./routes/ai.route");

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "code-reviewer" });
});

app.use("/ai", aiRoutes);

app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
});

module.exports = app;
