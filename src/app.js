const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./docs/swagger');
const corredorRoutes = require('./routes/corredores');
const provaRoutes = require('./routes/provas');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Servir frontend estático
app.use(express.static(path.join(__dirname, '..', 'public')));

// Documentação Swagger / OpenAPI
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Corrida API - Swagger',
}));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/corredores', corredorRoutes);
app.use('/api/provas', provaRoutes);

// Healthcheck
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Tratamento global de erros
app.use(errorHandler);

module.exports = app;
