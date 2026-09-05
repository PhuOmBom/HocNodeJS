const app = require('./app');
const connectDatabase = require('./config/db');

const port = process.env.PORT || 3000;

connectDatabase()
  .then(() => app.listen(port, () => console.log(`TestProject is running at http://localhost:${port}`)))
  .catch((error) => { console.error('MongoDB connection failed:', error.message); process.exit(1); });