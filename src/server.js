require('dotenv').config();
const app = require('./app');
const { connectDatabase } = require('./config/database');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

(async () => {
  try {
    await connectDatabase(MONGO_URI);
    app.listen(PORT, () => {
      console.log(`[server] API rodando em http://localhost:${PORT}`);
      console.log(`[server] Swagger em http://localhost:${PORT}/swagger`);
      console.log(`[server] Frontend em http://localhost:${PORT}/`);
    });
  } catch (err) {
    console.error('[server] Falha ao iniciar:', err.message);
    process.exit(1);
  }
})();
