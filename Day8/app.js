require("dotenv").config();

const express = require("express");
const { connectDB } = require("./config/db.js");
const bookRoutes = require("./routes/bookRoutes.js");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Welcome to the Library API" });
});

app.use("/books", bookRoutes);

async function startServer() {
    try {
        await connectDB();

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error("Failed to start the server:", error);
        process.exit(1);
    }
}

startServer();