const { AppError } = require('../utils/errors');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err.name === 'ValidationError' && err.errors) {
    return res.status(400).json({
      error: 'Erro de validação',
      detalhes: Object.values(err.errors).map((e) => e.message),
    });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'ID inválido' });
  }
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Recurso já existe',
      detalhes: err.keyValue,
    });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error('[errorHandler]', err);
  return res.status(500).json({ error: 'Erro interno do servidor' });
}

module.exports = errorHandler;
