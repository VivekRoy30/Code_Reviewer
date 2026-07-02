require("dotenv").config();

const app = require("./src/app");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";

const server = app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});

server.on("error", (err) => {
    console.error(`Unable to start server: ${err.message}`);
    process.exit(1);
});

module.exports = app;

