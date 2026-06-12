const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

/**
 * Middleware factory para autenticação JWT .
 */
function authMiddleware(jwtSecret) {
  return (req, _res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return next(new UnauthorizedError('Token não fornecido'));
    }
    try {
      req.user = jwt.verify(token, jwtSecret);
      return next();
    } catch {
      return next(new UnauthorizedError('Token inválido ou expirado'));
    }
  };
}

/**
 * Middleware factory para autorização por perfis .
 *
 * SOLID — Open/Closed:
 * Para adicionar um novo perfil basta passar mais um argumento; não há
 * necessidade de modificar o middleware.
 */
function requireRole(...perfisPermitidos) {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!perfisPermitidos.includes(req.user.perfil)) {
      return next(new ForbiddenError('Permissão insuficiente para esta operação'));
    }
    return next();
  };
}

module.exports = { authMiddleware, requireRole };
