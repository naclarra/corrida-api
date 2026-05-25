class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ValidationError extends AppError {
  constructor(message = 'Dados inválidos') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Não autenticado') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflito') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
};
