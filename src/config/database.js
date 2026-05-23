const mongoose = require('mongoose');

async function connectDatabase(uri) {
  if (!uri) {
    throw new Error('MONGO_URI não foi definida nas variáveis de ambiente.');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log(`[db] Conectado ao MongoDB em ${uri}`);
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase };
