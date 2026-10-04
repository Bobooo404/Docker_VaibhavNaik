const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || "http://backend:5000";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/health", async (req, res) => {
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        const data = await response.json();

        return res.json({
            status: "ok",
            service: "express-frontend",
            backend: data
        });
    } catch (error) {
        return res.status(502).json({
            status: "degraded",
            service: "express-frontend",
            error: `Backend unreachable at ${BACKEND_URL}: ${error.message}`
        });
    }
});

app.get("/submissions", async (req, res) => {
    try {
        const response = await fetch(`${BACKEND_URL}/submissions`);
        const data = await response.json();

        return res.json(data);
    } catch (error) {
        return res.status(502).json({
            status: "failed",
            error: `Backend unreachable at ${BACKEND_URL}: ${error.message}`
        });
    }
});

app.post("/submit", async (req, res) => {
    const { name, email, course } = req.body;

    const missing = [];

    if (!name || !name.trim()) missing.push("name");
    if (!email || !email.trim()) missing.push("email");
    if (!course || !course.trim()) missing.push("course");

    if (missing.length > 0) {
        return res.status(400).json({
            status: "failed",
            message: "Please fill in all the fields.",
            errors: missing.reduce((acc, field) => {
                acc[field] = "This field is required.";
                return acc;
            }, {})
        });
    }

    try {
        const response = await fetch(`${BACKEND_URL}/submissions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, course })
        });

        const data = await response.json();

        return res.status(response.status).json(data);
    } catch (error) {
        return res.status(502).json({
            status: "failed",
            message: `Could not reach the Flask backend at ${BACKEND_URL}.`,
            error: error.message
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Frontend listening on port ${PORT}`);
    console.log(`Forwarding submissions to ${BACKEND_URL}`);
});