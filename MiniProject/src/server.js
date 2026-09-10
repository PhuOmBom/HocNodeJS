require("dotenv").config();

const app = require("./app");

const connectDatabase = require("./config/db")

const port = process.env.PORT || 3000;

connectDatabase()
    .then(() => app.listen(port, () => console.log(`Server is running at http://localhost:${port}`)))
    .catch((error) => { console.error("Code ngu wa: ", error.message); process.exit(1); });