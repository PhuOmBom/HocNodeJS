require('dotenv').config();

const app = require('./app');

const connectDatabase = require('./Config/db');

const port = process.env.PORT || 3000;

connectDatabase()
    .then(() => app.listen(port, () => console.log(`Server is running at http://localhost:${port}`)))
    .catch((error) => { console.error('loi ket noi', error.message); process.exit(1); })
